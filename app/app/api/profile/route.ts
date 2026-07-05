import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { PublicKey } from '@solana/web3.js'
import nacl from 'tweetnacl'

// Same project URL as the anon client in lib/supabase.ts — the anon key
// there is intentionally public (protected by RLS). This route uses the
// SERVICE ROLE key instead, which bypasses RLS entirely, which is exactly
// why every write here is gated behind a verified wallet signature first.
const SUPABASE_URL = 'https://fibolqhqrettfzasdeyn.supabase.co'

const MAX_NAME_LEN = 100
const MAX_MATRIC_LEN = 30
const MAX_FACULTY_LEN = 60

function getServiceClient() {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!key) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY is not set in environment variables')
  }
  return createClient(SUPABASE_URL, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()

    const walletAddress = typeof body.walletAddress === 'string' ? body.walletAddress.trim() : ''
    const fullName       = typeof body.fullName === 'string' ? body.fullName.trim() : ''
    const matricNumber   = typeof body.matricNumber === 'string' ? body.matricNumber.trim() : ''
    const facultySlug    = typeof body.facultySlug === 'string' ? body.facultySlug.trim() : ''
    const signatureHex   = typeof body.signature === 'string' ? body.signature.trim() : ''
    const message        = typeof body.message === 'string' ? body.message : ''

    if (!walletAddress || !fullName || !matricNumber || !facultySlug || !signatureHex || !message) {
      return NextResponse.json({ error: 'Missing required field.' }, { status: 400 })
    }
    if (
      fullName.length > MAX_NAME_LEN ||
      matricNumber.length > MAX_MATRIC_LEN ||
      facultySlug.length > MAX_FACULTY_LEN
    ) {
      return NextResponse.json({ error: 'One or more fields exceed the allowed length.' }, { status: 400 })
    }

    let walletPubkey: PublicKey
    try {
      walletPubkey = new PublicKey(walletAddress)
    } catch {
      return NextResponse.json({ error: 'Invalid wallet address.' }, { status: 400 })
    }

    // Rebuild the message server-side from the submitted fields rather than
    // trusting the client's copy verbatim. This ties the signature to this
    // exact fullName + matricNumber pair — you can't sign one profile and
    // submit different data alongside a copied signature.
    const expectedMessage = `Registering LevyLedger profile: ${fullName} (${matricNumber})`
    if (message !== expectedMessage) {
      return NextResponse.json(
        { error: 'Signed message does not match submitted profile data.' },
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
        { error: 'Signature verification failed. This wallet did not sign this data.' },
        { status: 401 }
      )
    }

    const supabase = getServiceClient()
    const { error } = await supabase
      .from('student_profiles')
      .upsert(
        {
          wallet_address: walletAddress,
          full_name: fullName,
          matric_number: matricNumber,
          faculty_slug: facultySlug,
        },
        { onConflict: 'wallet_address' }
      )

    if (error) {
      console.error('[profile API] supabase upsert error:', error)
      return NextResponse.json({ error: 'Failed to save profile: ' + error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (err: any) {
    console.error('[profile API] unexpected error:', err)
    return NextResponse.json(
      { error: 'Unexpected server error: ' + (err.message || String(err)) },
      { status: 500 }
    )
  }
}
