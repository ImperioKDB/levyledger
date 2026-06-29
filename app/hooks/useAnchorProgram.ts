import { useMemo } from 'react'
import { useConnection, useWallet } from '@solana/wallet-adapter-react'
import { AnchorProvider, Program } from '@coral-xyz/anchor'
import type { Idl } from '@coral-xyz/anchor'
import idlRaw from '@/lib/idl/levyledger.json'

const PROGRAM_ID_STR = '4tsVfoyorSMTHG6iBG1kBtxsjTFWUfRNe1We26bfBFD9'
const IDL = { ...idlRaw, address: PROGRAM_ID_STR } as unknown as Idl

export type AnchorProgramResult = {
  program: Program<Idl> | null
  anchorError: string
}

export function useAnchorProgram(): AnchorProgramResult {
  const { connection } = useConnection()
  const wallet         = useWallet()

  return useMemo(() => {
    if (!wallet.publicKey) return { program: null, anchorError: '' }
    try {
      const walletAdapter = {
        publicKey:           wallet.publicKey,
        signTransaction:     wallet.signTransaction     ?? (async (tx: any) => tx),
        signAllTransactions: wallet.signAllTransactions ?? (async (txs: any[]) => txs),
      }
      const provider = new AnchorProvider(
        connection,
        walletAdapter as any,
        { commitment: 'confirmed', preflightCommitment: 'confirmed' }
      )
      return { program: new Program(IDL, provider), anchorError: '' }
    } catch (err: any) {
      const msg = err?.message ?? String(err)
      console.error('[useAnchorProgram]', msg)
      return { program: null, anchorError: msg }
    }
  }, [connection, wallet.publicKey, wallet.connected])
}
