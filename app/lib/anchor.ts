import { Connection, PublicKey } from '@solana/web3.js'
import { Program, AnchorProvider } from '@coral-xyz/anchor'
import type { Idl } from '@coral-xyz/anchor'
import idlRaw from './idl/levyledger.json'

// FIX: corrected to the actually-deployed program ID. Was previously
// pointing to a stale ID from an earlier Playground re-import, which
// caused every PDA + RPC call to target the wrong (or nonexistent) program.
const PROGRAM_ID_STR = '4tsVfoyorSMTHG6iBG1kBtxsjTFWUfRNe1We26bfBFD9'
const PROGRAM_ID     = new PublicKey(PROGRAM_ID_STR)
const RPC_URL        = process.env.NEXT_PUBLIC_RPC_URL || 'https://api.devnet.solana.com'

export const connection = new Connection(RPC_URL, 'confirmed')

const IDL = { ...idlRaw, address: PROGRAM_ID_STR } as unknown as Idl

export function getReadonlyProgram() {
  const dummyWallet = {
    publicKey:           PROGRAM_ID,
    signTransaction:     async (tx: any) => tx,
    signAllTransactions: async (txs: any[]) => txs,
  }
  const provider = new AnchorProvider(
    connection, dummyWallet as any, { commitment: 'confirmed' }
  )
  return new Program(IDL, provider)
}

export function getProgram(provider: AnchorProvider) {
  return new Program(IDL, provider)
}

export function getTreasuryPDA(slug: string): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from('treasury'), Buffer.from(slug)],
    PROGRAM_ID
  )
}

export function getVaultPDA(treasuryPubkey: PublicKey): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from('vault'), treasuryPubkey.toBuffer()],
    PROGRAM_ID
  )
}

export function getProposalPDA(
  treasuryPubkey: PublicKey,
  index: number
): [PublicKey, number] {
  const buf = Buffer.alloc(8)
  buf.writeBigUInt64LE(BigInt(index))
  return PublicKey.findProgramAddressSync(
    [Buffer.from('proposal'), treasuryPubkey.toBuffer(), buf],
    PROGRAM_ID
  )
}

export function formatUSDC(amount: any): string {
  const val = typeof amount?.toNumber === 'function'
    ? amount.toNumber()
    : Number(amount)
  return (val / 1_000_000).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
}

export function abbreviate(pubkey: string): string {
  if (!pubkey) return ''
  return pubkey.slice(0, 4) + '...' + pubkey.slice(-4)
}
