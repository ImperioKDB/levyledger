import { useMemo } from 'react'
import { useConnection, useWallet } from '@solana/wallet-adapter-react'
import { AnchorProvider, Program } from '@coral-xyz/anchor'
import type { Idl } from '@coral-xyz/anchor'
import idlRaw from '@/lib/idl/levyledger.json'

const PROGRAM_ID_STR = '4tsVfoyorSMTHG6iBG1kBtxsjTFWUfRNe1We26bfBFD9'

const IDL = { ...idlRaw, address: PROGRAM_ID_STR } as unknown as Idl

export function useAnchorProgram() {
  const { connection } = useConnection()
  const wallet         = useWallet()

  return useMemo(() => {
    if (!wallet.publicKey) return null
    try {
      const provider = new AnchorProvider(
        connection,
        wallet as any,
        { commitment: 'confirmed', preflightCommitment: 'confirmed' }
      )
      return new Program(IDL, provider)
    } catch (err: any) {
      console.error('[useAnchorProgram] init failed:', err)
      // Surface error to window so we can see it on mobile
      if (typeof window !== 'undefined') {
        (window as any).__anchorError = err?.message || String(err)
      }
      return null
    }
  // wallet.connected included so hook re-runs when connection state changes
  }, [connection, wallet.publicKey, wallet.connected, wallet.signTransaction])
}
