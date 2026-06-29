import { useMemo } from 'react'
import { useConnection, useWallet } from '@solana/wallet-adapter-react'
import { AnchorProvider, Program } from '@coral-xyz/anchor'
import type { Idl } from '@coral-xyz/anchor'
import idlRaw from '@/lib/idl/levyledger.json'

const PROGRAM_ID_STR = 'DuUdUQKvHgjMpceHc3qPoG3C61DUSToZWPHkRLB3zrjW'

// FIX: inject address field — Anchor 0.30 reads idl.address in the constructor.
// Solana Playground IDL is older format without this field.
// Without injection: new PublicKey(undefined) throws → crashes the page.
const IDL = { ...idlRaw, address: PROGRAM_ID_STR } as unknown as Idl

export function useAnchorProgram() {
  const { connection } = useConnection()
  const wallet         = useWallet()

  return useMemo(() => {
    if (!wallet.publicKey || !wallet.signTransaction) return null
    try {
      const provider = new AnchorProvider(
        connection,
        wallet as any,
        { commitment: 'confirmed', preflightCommitment: 'confirmed' }
      )
      return new Program(IDL, provider)
    } catch (err) {
      // Defensive: log and return null rather than crashing the page
      console.error('[useAnchorProgram] Failed to initialize:', err)
      return null
    }
  }, [connection, wallet.publicKey, wallet.signTransaction])
}
