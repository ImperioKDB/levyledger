'use client'

import { useParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import { fetchTreasury } from '@/lib/queries'
import { getVaultPDA } from '@/lib/anchor'
import { UNIVERSITIES, DEVNET_USDC_MINT } from '@/lib/constants'
import MobileHeader from '@/components/MobileHeader'
import BottomNav from '@/components/BottomNav'
import DesktopSidebar from '@/components/DesktopSidebar'
import DesktopTopBar from '@/components/DesktopTopBar'
import DesktopWalletsView from '@/components/DesktopWalletsView'
import { useIsDesktop } from '@/hooks/useIsDesktop'

interface WalletRow {
  label: string
  address: string
}

export default function WalletsPage() {
  const { university } = useParams() as { university: string }
  const [treasury, setTreasury] = useState<any>(null)
  const [wallets, setWallets] = useState<WalletRow[]>([])
  const [loading, setLoading] = useState(true)
  const isDesktop = useIsDesktop()

  useEffect(() => {
    async function load() {
      const t = await fetchTreasury(university)
      if (!t) { setLoading(false); return }
      setTreasury(t)
      const [vaultPDA] = getVaultPDA(t.pda)
      setWallets([
        { label: 'Treasury Account', address: t.pda.toString() },
        { label: 'Vault (holds funds)', address: vaultPDA.toString() },
        { label: 'USDC Mint (devnet)', address: DEVNET_USDC_MINT },
      ])
      setLoading(false)
    }
    load()
  }, [university])

  return (
    <>
      {!isDesktop && (
      <main className="min-h-screen bg-ink pb-24 pt-16">
        <MobileHeader />
        <section className="px-4 py-6 border-b border-rule">
          <p className="font-data text-ghost text-xs tracking-widest uppercase mb-1">{university.toUpperCase()}</p>
          <h1 className="font-display font-bold text-ledger text-2xl">Wallets</h1>
        </section>
        <section className="px-4 pt-4">
          {loading ? (
            <p className="font-data text-ghost text-xs">Loading...</p>
          ) : !treasury ? (
            <p className="text-body text-sm py-8">This treasury has not been initialized on-chain yet.</p>
          ) : (
            <div className="space-y-3">
              {wallets.map((w) => (
                <div key={w.label} className="border border-rule bg-paper p-4">
                  <p className="font-data text-ghost text-[10px] tracking-widest uppercase mb-1">{w.label}</p>
                  <p className="font-data text-ledger text-xs break-all">{w.address}</p>
                </div>
              ))}
            </div>
          )}
        </section>
        <BottomNav university={university} />
      </main>
      )}

      {isDesktop && (
      <div className="flex min-h-screen bg-ink">
        <DesktopSidebar university={university} />
        <div className="flex-1 flex flex-col">
          <DesktopTopBar universityName={UNIVERSITIES[university] || university} />
          <DesktopWalletsView wallets={wallets} loading={loading} treasury={treasury} />
        </div>
      </div>
      )}
    </>
  )
}
