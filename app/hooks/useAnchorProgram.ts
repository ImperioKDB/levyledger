import { useMemo } from 'react'
import { useConnection, useWallet } from '@solana/wallet-adapter-react'
import { AnchorProvider, Program } from '@coral-xyz/anchor'
import type { Idl } from '@coral-xyz/anchor'
import idlRaw from '@/lib/idl/levyledger.json'

// FIX: corrected to match the actually-deployed program (was stale).
const PROGRAM_ID_STR = '4tsVfoyorSMTHG6iBG1kBtxsjTFWUfRNe1We26bfBFD9'

const IDL = { ...idlRaw, address: PROGRAM_ID_STR } as unknown as Idl

export function useAnchorProgram() {
  const { connection } = useConnection()
  const wallet = useWallet()

  return useMemo(() => {
    if (!wallet.publicKey) return null
    try {
      const provider = new AnchorProvider(
        connection,
        wallet as any,
        { commitment: 'confirmed', preflightCommitment: 'confirmed' }
      )
      return new Program(IDL, provider)
    } catch (err) {
      console.error('[useAnchorProgram] init failed:', err)
      return null
    }
  }, [connection, wallet.publicKey, wallet.connected])
}
