import { useEffect, useState } from 'react'
import { useWallet } from '@solana/wallet-adapter-react'
import { ADMIN_KEY } from '@/lib/constants'
import { isPlatformAdminWallet } from '@/lib/supabase'

// Single source of truth for "can this wallet review/approve faculty
// requests." Replaces the `wallet.publicKey?.toString() === ADMIN_KEY`
// check that was duplicated in admin/page.tsx, [university]/page.tsx, and
// [university]/proposals/page.tsx -- that check only ever recognized the one
// hardcoded key, so a wallet added to platform_admins would still see an
// empty/unauthorized UI everywhere, even after the backend route accepted it.
//
// This hook does NOT affect init_treasury. That stays gated to the literal
// ADMIN_KEY inside the Anchor program itself
// (`constraint = authority.key() == ADMIN_KEY` in src/lib.rs) and is
// unrelated to this table -- see the Trust Boundary section of
// HANDOFF_NOTES.md before changing that constraint.
export function useIsAdmin() {
  const wallet = useWallet()
  const walletAddress = wallet.publicKey?.toString()

  const isRootAdmin = walletAddress === ADMIN_KEY

  const [isDelegatedAdmin, setIsDelegatedAdmin] = useState(false)
  const [checked, setChecked] = useState(false)

  useEffect(() => {
    let cancelled = false

    if (!walletAddress) {
      setIsDelegatedAdmin(false)
      setChecked(true)
      return
    }
    if (walletAddress === ADMIN_KEY) {
      // Skip the network round-trip for the one wallet we already know.
      setIsDelegatedAdmin(false)
      setChecked(true)
      return
    }

    setChecked(false)
    isPlatformAdminWallet(walletAddress)
      .then(result => { if (!cancelled) setIsDelegatedAdmin(result) })
      .catch(err => {
        console.error('[useIsAdmin] platform_admins lookup failed', err)
        if (!cancelled) setIsDelegatedAdmin(false)
      })
      .finally(() => { if (!cancelled) setChecked(true) })

    return () => { cancelled = true }
  }, [walletAddress])

  return {
    // Use this for anything review-related: loading the request queue,
    // showing the approve/reject UI, gating isAuthorized in nav/sidebar.
    isPlatformAdmin: isRootAdmin || isDelegatedAdmin,
    // Use this ONLY for UI that should stay exclusive to the hardcoded key --
    // e.g. the on-chain init form, and (once built) the manage-admins page.
    isRootAdmin,
    // True once the platform_admins lookup has resolved (or was skipped).
    // Useful to avoid a one-frame flash of "unauthorized" for a delegated
    // admin while the query is in flight.
    checked,
  }
}
