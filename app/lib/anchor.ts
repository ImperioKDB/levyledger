import { Connection, PublicKey } from '@solana/web3.js'
import { Program, AnchorProvider, Idl } from '@coral-xyz/anchor'
import idl from './idl/levyledger.json'

const PROGRAM_ID = new PublicKey('DuUdUQKvHgjMpceHc3qPoG3C61DUSToZWPHkRLB3zrjW')
const RPC_URL = process.env.NEXT_PUBLIC_RPC_URL || 'https://api.devnet.solana.com'

export const connection = new Connection(RPC_URL, 'confirmed')

export function getReadonlyProgram() {
  const dummyWallet = {
    publicKey: new PublicKey('11111111111111111111111111111111'),
    signTransaction: async (tx: any) => tx,
    signAllTransactions: async (txs: any[]) => txs,
  }
  const provider = new AnchorProvider(connection, dummyWallet as any, { commitment: 'confirmed' })
  return new Program(idl as Idl, provider)
}

export function getProgram(provider: AnchorProvider) {
  return new Program(idl as Idl, provider)
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

export function getProposalPDA(treasuryPubkey: PublicKey, index: number): [PublicKey, number] {
  const buf = Buffer.alloc(8)
  buf.writeBigUInt64LE(BigInt(index))
  return PublicKey.findProgramAddressSync(
    [Buffer.from('proposal'), treasuryPubkey.toBuffer(), buf],
    PROGRAM_ID
  )
}

export function formatUSDC(amount: any): string {
  const val = typeof amount?.toNumber === 'function' ? amount.toNumber() : Number(amount)
  return (val / 1_000_000).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

export function abbreviate(pubkey: string): string {
  if (!pubkey) return ''
  return pubkey.slice(0, 4) + '...' + pubkey.slice(-4)
}
