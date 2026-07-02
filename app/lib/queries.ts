import { PublicKey } from '@solana/web3.js'
import { getReadonlyProgram, getTreasuryPDA, getProposalPDA } from './anchor'

let lastTreasuryFetchError: string | null = null

export function getLastTreasuryFetchError() {
  return lastTreasuryFetchError
}

export async function fetchTreasury(slug: string) {
  try {
    const program = getReadonlyProgram()
    const accounts = (program.account as any)
    const [pda] = getTreasuryPDA(slug)
    const data = await accounts.treasuryAccount.fetch(pda)
    lastTreasuryFetchError = null
    return { pda, ...data }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error('[fetchTreasury] failed for slug=' + slug + ':', err)
    lastTreasuryFetchError = msg
    return null
  }
}

export async function fetchAllProposals(treasuryPubkey: PublicKey, count: number) {
  const program = getReadonlyProgram()
  const accounts = (program.account as any)
  const results = []
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
    const accounts = (program.account as any)
    const [pda] = getProposalPDA(treasuryPubkey, index)
    const data = await accounts.proposalAccount.fetch(pda)
    return { pda, index, ...data }
  } catch {
    return null
  }
}
