import { Connection, PublicKey } from '@solana/web3.js'
import { AnchorProvider, Program } from '@coral-xyz/anchor'
import type { Idl } from '@coral-xyz/anchor'
import idlRaw from './idl/levyledger.json'
import { getTreasuryPDA, getProposalPDA } from './anchor'

const PROGRAM_ID_STR = '4Av48RVmUb2U5V3jqkEC15C5cbjNRY2TqD64ebc1jn1M'
const RPC_URL = process.env.NEXT_PUBLIC_RPC_URL || 'https://api.devnet.solana.com'
const IDL = { ...idlRaw, address: PROGRAM_ID_STR } as unknown as Idl

let lastTreasuryFetchError: string | null = null
let lastTreasuryFetchStack: string | null = null

export function getLastTreasuryFetchError(): string | null {
  return lastTreasuryFetchError
}
export function getLastTreasuryFetchStack(): string | null {
  return lastTreasuryFetchStack
}
export function getBundledIdlAccountNames(): string {
  try {
    const accounts = (idlRaw as any).accounts || []
    return accounts.map((a: any) => a.name).join(', ') || 'none'
  } catch {
    return 'error reading bundled IDL'
  }
}

function getReadonlyProgram() {
  const connection = new Connection(RPC_URL, 'confirmed')
  const dummyWallet = {
    publicKey: new PublicKey(PROGRAM_ID_STR),
    signTransaction: async (tx: any) => tx,
    signAllTransactions: async (txs: any[]) => txs,
  }
  const provider = new AnchorProvider(connection, dummyWallet as any, { commitment: 'confirmed' })
  return new Program(IDL, provider)
}

export async function fetchTreasury(slug: string) {
  try {
    const program = getReadonlyProgram()
    const accounts = program.account as any
    const [pda] = getTreasuryPDA(slug)
    const data = await accounts.treasuryAccount.fetch(pda)
    lastTreasuryFetchError = null
    lastTreasuryFetchStack = null
    return { pda, ...data }
  } catch (err: any) {
    lastTreasuryFetchError = err?.message || String(err)
    lastTreasuryFetchStack = err?.stack || null
    return null
  }
}

export async function fetchAllProposals(treasuryPubkey: PublicKey, count: number) {
  const program = getReadonlyProgram()
  const accounts = program.account as any
  const results: any[] = []
  for (let i = 0; i < count; i++) {
    try {
      const [pda] = getProposalPDA(treasuryPubkey, i)
      const data = await accounts.proposalAccount.fetch(pda)
      results.push({ pda, index: i, ...data })
    } catch {}
  }
  return results.reverse()
}

export async function fetchProposal(treasuryPubkey: PublicKey, index: number) {
  try {
    const program = getReadonlyProgram()
    const accounts = program.account as any
    const [pda] = getProposalPDA(treasuryPubkey, index)
    const data = await accounts.proposalAccount.fetch(pda)
    return { pda, index, ...data }
  } catch {
    return null
  }
}
