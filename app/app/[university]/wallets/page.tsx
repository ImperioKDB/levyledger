'use client'

import { useParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import { fetchTreasury } from '@/lib/queries'
import { getVaultPDA } from '@/lib/anchor'
import { fetchFacultyBySlug } from '@/lib/supabase'
import { DEVNET_USDC_MINT } from '@/lib/constants'
import MobileHeader from '@/components/MobileHeader'
import BottomNav from '@/components/BottomNav'
import LoadingSkeleton from '@/components/LoadingSkeleton'
import CopyButton from '@/components/CopyButton'
import DesktopSidebar from '@/components/DesktopSidebar'
import DesktopTopBar from '@/components/DesktopTopBar'
import DesktopWalletsView from '@/components/DesktopWalletsView'
import { useIsDesktop } from '@/hooks/useIsDesktop'

interface WalletRow {
  label: string
  address: string
}

const EXPLORER = 'https://explorer.solana.com/address'

export default function WalletsPage() {
  const { university } = useParams() as { university: string }
  const [treasury, setTreasury] = useState<any>(null)
  const [wallets, setWallets] = useState<WalletRow[]>([])
  const [loading, setLoading] = useState(true)
  const [facultyName, setFacultyName] = useState<string | null>(null)
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
    fetchFacultyBySlug(university)
      .then(r => setFacultyName(r?.department ?? null))
      .catch(() => setFacultyName(null))
  }, [university])

  const displayName = facultyName || university

  return (
    <>
      {!isDesktop && (
        <main id="main-content" className="min-h-[100dvh] bg-ink pb-24 pt-[calc(4rem+env(safe-area-inset-top))]">
          <MobileHeader />
          <section className="px-4 py-6 border-b border-rule">
            <p className="font-data text-ghost text-xs tracking-widest uppercase mb-1">{displayName.toUpperCase()}</p>
            <h1 className="font-display font-bold text-ledger text-2xl tracking-tight">Wallets</h1>
            <p className="text-body text-xs mt-1">On-chain accounts that hold or control these funds</p>
          </section>
          <section className="px-4 pt-4">
            {loading ? (
              <LoadingSkeleton lines={3} />
            ) : !treasury ? (
              <p className="text-body text-sm py-8">This treasury has not been initialized on-chain yet.</p>
            ) : (
              <div className="space-y-3 stagger">
                {wallets.map((w) => (
                  <div key={w.label} className="border border-rule bg-paper p-4">
                    <p className="font-data text-ghost text-[10px] tracking-widest uppercase mb-1">{w.label}</p>
                    <p className="font-data text-ledger text-xs break-all mb-3">{w.address}</p>
                    <div className="flex items-center justify-between gap-3">
                      <CopyButton value={w.address} />
                      <a
                        href={EXPLORER + '/' + w.address + '?cluster=devnet'}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-data text-uniben text-xs hover:opacity-80 transition-opacity"
                      >
                        View on explorer ↗
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
          <BottomNav university={university} activeTab="more" />
        </main>
      )}

      {isDesktop && (
        <div className="flex min-h-[100dvh] bg-ink">
          <DesktopSidebar university={university} />
          <div className="flex-1 flex flex-col">
            <DesktopTopBar universityName={displayName} />
            <DesktopWalletsView wallets={wallets} loading={loading} treasury={treasury} />
          </div>
        </div>
      )}
    </>
  )
}
