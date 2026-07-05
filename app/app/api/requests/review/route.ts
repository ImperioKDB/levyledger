import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { PublicKey } from '@solana/web3.js'
import nacl from 'tweetnacl'
import { ADMIN_KEY } from '@/lib/constants'

// Same project URL as the anon client in lib/supabase.ts. This route uses
// the SERVICE ROLE key instead, which bypasses RLS entirely -- exactly why
// every write here is gated behind a verified admin wallet signature first.
// This route exists because department_requests had a permissive anon
// UPDATE policy: any client holding the public anon key could call
// supabase.from('department_requests').update(...) directly and self-
// approve a fake faculty, regardless of what the admin-only UI showed.
const SUPABASE_URL = 'https://fibolqhqrettfzasdeyn.supabase.co'

function getServiceClient() {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!key) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY is not set in environment variables')
  }
  return createClient(SUPABASE_URL, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
}

// Delegated review admins (rows in platform_admins) can approve/reject
// requests through this route. This is deliberately a *separate, weaker*
// power than init_treasury on-chain, which stays gated to the literal
// ADMIN_KEY inside the Anchor program itself and is untouched by this
// change -- see the Trust Boundary section of HANDOFF_NOTES.md before ever
// widening that on-chain constraint.
async function isAuthorizedReviewer(walletAddress: string): Promise<boolean> {
  if (walletAddress === ADMIN_KEY) return true
  const supabase = getServiceClient()
  const { data, error } = await supabase
    .from('platform_admins')
    .select('wallet_address')
    .eq('wallet_address', walletAddress)
    .maybeSingle()
  if (error) {
    console.error('[requests/review] platform_admins lookup failed', error)
    return false
  }
  return Boolean(data)
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()

    const walletAddress = typeof body.walletAddress === 'string' ? body.walletAddress.trim() : ''
    const requestId      = typeof body.requestId === 'string' ? body.requestId.trim() : ''
    const action         = body.action === 'approve' || body.action === 'reject' ? body.action : ''
    const signatureHex   = typeof body.signature === 'string' ? body.signature.trim() : ''
    const message        = typeof body.message === 'string' ? body.message : ''

    if (!walletAddress || !requestId || !action || !signatureHex || !message) {
      return NextResponse.json({ error: 'Missing required field.' }, { status: 400 })
    }

    // Reject non-admin wallets before even checking the signature -- a
    // perfectly valid signature from the wrong wallet is still a no.
    // Checks both the hardcoded ADMIN_KEY and delegated platform_admins
    // membership -- see isAuthorizedReviewer above.
    if (!(await isAuthorizedReviewer(walletAddress))) {
      return NextResponse.json(
        { error: 'This wallet is not authorized to review requests.' },
        { status: 403 }
      )
    }

    let walletPubkey: PublicKey
    try {
      walletPubkey = new PublicKey(walletAddress)
    } catch {
      return NextResponse.json({ error: 'Invalid wallet address.' }, { status: 400 })
    }

    // Rebuild the message server-side rather than trusting the client's
    // copy verbatim. This ties the signature to this exact request id and
    // action -- a signature for "approve X" can't be replayed to reject X
    // or to approve a different request Y.
    const expectedMessage = `LevyLedger admin review: ${action} request ${requestId}`
    if (message !== expectedMessage) {
      return NextResponse.json(
        { error: 'Signed message does not match the requested action.' },
        { status: 400 }
      )
    }

    if (!/^[0-9a-fA-F]+$/.test(signatureHex) || signatureHex.length !== 128) {
      return NextResponse.json({ error: 'Malformed signature.' }, { status: 400 })
    }
    const signatureBytes = Uint8Array.from(Buffer.from(signatureHex, 'hex'))

    const messageBytes = new TextEncoder().encode(expectedMessage)
    const verified = nacl.sign.detached.verify(
      messageBytes,
      signatureBytes,
      walletPubkey.toBytes()
    )
    if (!verified) {
      return NextResponse.json(
        { error: 'Signature verification failed. This wallet did not sign this action.' },
        { status: 401 }
      )
    }

    const supabase = getServiceClient()
    const { error } = await supabase
      .from('department_requests')
      .update({
        status: action === 'approve' ? 'approved' : 'rejected',
        reviewed_at: new Date().toISOString(),
      })
      .eq('id', requestId)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ ok: true })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Unexpected error.' }, { status: 500 })
  }
}
