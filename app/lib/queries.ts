import { PublicKey } from '@solana/web3.js'
import { getReadonlyProgram, getTreasuryPDA, getProposalPDA } from './anchor'

let lastTreasuryFetchError: string | null = null
let lastTreasuryFetchStack: string | null = null

export function getLastTreasuryFetchError() {
  return lastTreasuryFetchError
}

export function getLastTreasuryFetchStack() {
  return lastTreasuryFetchStack
}

export function getBundledIdlAccountNames(): string {
  try {
    const idl = require('./idl/levyledger.json')
    return (idl.accounts || []).map((a: any) => a.name).join(', ')
  } catch (e) {
    return 'IDL_IMPORT_FAILED: ' + String(e)
  }
}

export async function fetchTreasury(slug: string) {
  try {
    const program = getReadonlyProgram()
    if (!program) {
      lastTreasuryFetchError = 'program is null/undefined'
      lastTreasuryFetchStack = null
      return null
    }
    const accounts = (program.account as any)
    const [pda] = getTreasuryPDA(slug)
    const data = await accounts.treasuryAccount.fetch(pda)
    lastTreasuryFetchError = null
    lastTreasuryFetchStack = null
    return { pda, ...data }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    const stack = err instanceof Error ? (err.stack || 'no stack') : 'not an Error instance'
    console.error('[fetchTreasury] failed for slug=' + slug + ':', err)
    lastTreasuryFetchError = msg
    lastTreasuryFetchStack = stack
    return null
  }
}

/**
 * SCRIPT 2 FIX: Fetches ALL proposals for a given treasury in a SINGLE RPC call.
 * This completely eliminates the N+1 query disaster that was freezing the browser.
 */
export async function fetchAllProposals(treasuryPubkey: PublicKey, _count?: number) {
  const program = getReadonlyProgram()
  const accounts = (program.account as any)

  try {
    // Anchor's .all() method allows filtering by memcmp.
    // The 'treasury' field is the first field in ProposalAccount.
    // Offset 8 skips the 8-byte Anchor discriminator.
    const proposals = await accounts.proposalAccount.all([
      {
        memcmp: {
          offset: 8,
          bytes: treasuryPubkey.toBase58(),
        },
      },
    ])

    // Map the results to include the index and PDA, then sort by index descending (newest first)
    return proposals
      .map((p: any) => {
        const index = typeof p.account.proposalIndex?.toNumber === 'function' 
          ? p.account.proposalIndex.toNumber() 
          : Number(p.account.proposalIndex)
        return { 
          pda: p.publicKey, 
          index, 
          ...p.account 
        }
      })
      .sort((a: any, b: any) => b.index - a.index)
  } catch (err) {
    console.error('[fetchAllProposals] memcmp fetch failed:', err)
    return []
  }
}

export async function fetchProposal(treasuryPubkey: PublicKey, index: number) {
  try {
    const program = getReadonlyProgram()
    const accounts = (program.account as any)
    const [pda] = getProposalPDA(treasuryPubkey, index)
    const data = await accounts.proposalAccount.fetch(pda)
    return { pda, index, ...data }
  } catch {
    return null
  }
}
