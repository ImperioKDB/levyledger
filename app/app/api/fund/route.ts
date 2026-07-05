import { NextRequest, NextResponse } from 'next/server'
import {
  Connection,
  Keypair,
  PublicKey,
  Transaction,
  sendAndConfirmTransaction,
} from '@solana/web3.js'
import {
  getAssociatedTokenAddress,
  createAssociatedTokenAccountInstruction,
  createTransferInstruction,
  getAccount,
} from '@solana/spl-token'

const connection = new Connection(
  process.env.NEXT_PUBLIC_RPC_URL || 'https://api.devnet.solana.com',
  'confirmed'
)

const MIN_FUNDING_WALLET_SOL = 0.01

function getFundingKeypair(): Keypair {
  const raw = process.env.FUNDING_WALLET_SECRET
  if (!raw) {
    throw new Error('FUNDING_WALLET_SECRET is not set in environment variables')
  }
  let parsed: number[]
  try {
    parsed = JSON.parse(raw)
  } catch (e: any) {
    throw new Error(
      'FUNDING_WALLET_SECRET is not valid JSON. Check for extra quotes, ' +
      'whitespace, or truncation when it was pasted into Vercel. ' +
      'Parse error: ' + e.message
    )
  }
  if (!Array.isArray(parsed) || parsed.length !== 64) {
    throw new Error(
      'FUNDING_WALLET_SECRET must be a JSON array of exactly 64 numbers. ' +
      'Got ' + (Array.isArray(parsed) ? parsed.length + ' items' : typeof parsed)
    )
  }
  return Keypair.fromSecretKey(Uint8Array.from(parsed))
}

function getUsdcMint(): PublicKey {
  const raw = process.env.NEXT_PUBLIC_USDC_MINT
  if (!raw) {
    throw new Error('NEXT_PUBLIC_USDC_MINT is not set in environment variables')
  }
  return new PublicKey(raw)
}

export async function POST(req: NextRequest) {
  try {
    const { walletAddress } = await req.json()

    if (!walletAddress) {
      return NextResponse.json({ error: 'Missing walletAddress' }, { status: 400 })
    }

    const FUNDING_KEYPAIR = getFundingKeypair()
    const USDC_MINT = getUsdcMint()

    const recipientPubkey = new PublicKey(walletAddress)

    const funderLamports = await connection.getBalance(FUNDING_KEYPAIR.publicKey)
    const funderSol = funderLamports / 1_000_000_000
    if (funderSol < MIN_FUNDING_WALLET_SOL) {
      console.error(`[faucet API] funding wallet low on SOL: ${funderSol} SOL remaining`)
      return NextResponse.json(
        { error: 'Faucet is temporarily out of SOL for transaction fees. Please try again shortly.' },
        { status: 503 }
      )
    }

    const sourceATA = await getAssociatedTokenAddress(USDC_MINT, FUNDING_KEYPAIR.publicKey)
    const destinationATA = await getAssociatedTokenAddress(USDC_MINT, recipientPubkey)

    try {
      const balanceObj = await connection.getTokenAccountBalance(destinationATA)
      const balance = balanceObj.value.uiAmount || 0
      if (balance >= 10.0) {
        return NextResponse.json(
          { error: 'Your wallet already has sufficient Devnet USDC.' },
          { status: 400 }
        )
      }
    } catch {
      // ATA doesn't exist yet, so balance is effectively 0. Proceed.
    }

    const tx = new Transaction()

    let destinationAccountExists = true
    try {
      await getAccount(connection, destinationATA)
    } catch {
      destinationAccountExists = false
    }

    if (!destinationAccountExists) {
      tx.add(
        createAssociatedTokenAccountInstruction(
          FUNDING_KEYPAIR.publicKey,
          destinationATA,
          recipientPubkey,
          USDC_MINT
        )
      )
    }

    tx.add(
      createTransferInstruction(
        sourceATA,
        destinationATA,
        FUNDING_KEYPAIR.publicKey,
        50_000_000
      )
    )

    tx.feePayer = FUNDING_KEYPAIR.publicKey

    const sig = await sendAndConfirmTransaction(
      connection,
      tx,
      [FUNDING_KEYPAIR],
      { commitment: 'confirmed' }
    )

    return NextResponse.json({ signature: sig })
  } catch (err: any) {
    console.error('[faucet API] error:', err)
    return NextResponse.json(
      { error: 'Faucet transaction failed: ' + (err.message || String(err)) },
      { status: 500 }
    )
  }
}
