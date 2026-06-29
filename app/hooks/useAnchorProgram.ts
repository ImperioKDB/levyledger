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
      // AnchorProvider requires signTransaction/signAllTransactions to exist
      // on the wallet object at construction time — even on Phantom mobile
      // where they may be undefined mid-cycle. Provide no-op fallbacks so
      // the Program object is always created. Real signing goes through
      // Phantom's own flow at transaction submission time.
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
      return new Program(IDL, provider)
    } catch (err: any) {
      console.error('[useAnchorProgram] init failed:', err?.message ?? err)
      return null
    }
  }, [connection, wallet.publicKey, wallet.connected])
}
