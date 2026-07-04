import { useMemo } from 'react'
import { useConnection, useWallet } from '@solana/wallet-adapter-react'
import { AnchorProvider, Program } from '@coral-xyz/anchor'
import type { Idl } from '@coral-xyz/anchor'
import idlRaw from '@/lib/idl/levyledger.json'

const PROGRAM_ID_STR = '4Av48RVmUb2U5V3jqkEC15C5cbjNRY2TqD64ebc1jn1M'
const IDL = { ...idlRaw, address: PROGRAM_ID_STR } as unknown as Idl

interface AnchorProgramResult {
  program: Program | null
  anchorError: string | null
}

export function useAnchorProgram(): AnchorProgramResult {
  const { connection } = useConnection()
  const wallet = useWallet()

  return useMemo<AnchorProgramResult>(() => {
    if (!wallet.publicKey) return { program: null, anchorError: null }
    try {
      const provider = new AnchorProvider(
        connection,
        wallet as any,
        { commitment: 'confirmed', preflightCommitment: 'confirmed' }
      )
      const program = new Program(IDL, provider)
      return { program, anchorError: null }
    } catch (err: any) {
      console.error('[useAnchorProgram] init failed:', err)
      return { program: null, anchorError: err?.message || String(err) }
    }
  }, [connection, wallet.publicKey, wallet.connected])
}
