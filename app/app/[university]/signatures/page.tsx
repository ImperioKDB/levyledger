'use client'

import { useParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { fetchTreasury, fetchAllProposals, getLastTreasuryFetchError } from '@/lib/queries'
import { fetchFacultyBySlug } from '@/lib/supabase'
import { formatUSDC } from '@/lib/anchor'
import MobileHeader from '@/components/MobileHeader'
import BottomNav from '@/components/BottomNav'
import StatusBadge from '@/components/StatusBadge'
import LoadingSkeleton from '@/components/LoadingSkeleton'
import EmptyState from '@/components/EmptyState'
import DesktopSidebar from '@/components/DesktopSidebar'
import DesktopTopBar from '@/components/DesktopTopBar'
import { useIsDesktop } from '@/hooks/useIsDesktop'

export default function SignaturesPage() {
  const { university } = useParams() as { university: string }
  const [treasury, setTreasury] = useState<any>(null)
  const [active, setActive] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState(false)
  const [facultyName, setFacultyName] = useState<string | null>(null)
  const isDesktop = useIsDesktop()

  async function load() {
    const t = await fetchTreasury(university)
    if (!t) {
      if (getLastTreasuryFetchError()) setLoadError(true)
      setLoading(false)
      return
    }
    setLoadError(false)
    setTreasury(t)
    const count = typeof t.proposalCount?.toNumber === 'function'
      ? t.proposalCount.toNumber() : Number(t.proposalCount)
    const proposals = await fetchAllProposals(t.pda, count)
    setActive(proposals.filter((p: any) => Object.keys(p.status)[0] === 'active'))
    setLoading(false)
  }

  useEffect(() => {
    load()
    fetchFacultyBySlug(university)
      .then(r => setFacultyName(r?.department ?? null))
      .catch(() => setFacultyName(null))
  }, [university])

  const displayName = facultyName || university

  const list = (
    <>
      {loading ? (
        <LoadingSkeleton lines={4} />
      ) : !treasury ? (
        <p className="text-body text-sm py-8">This treasury has not been initialized on-chain yet.</p>
      ) : active.length === 0 ? (
        <EmptyState
          title="No signatures needed"
          body="Active proposals waiting for approval will appear here with their current signature count."
        />
      ) : (
        <div className="stagger">
          {active.map((p) => (
            <Link key={p.index} href={`/${university}/proposals/${p.index}`}>
              <div className="border-b border-rule py-4 flex items-center justify-between group">
                <div className="min-w-0 flex-1">
                  <p className="text-body text-sm truncate group-hover:text-ledger transition-colors">{p.description}</p>
                  <p className="font-data text-ghost text-[10px] mt-1">{p.signaturesFor}/{treasury.threshold} signed</p>
                </div>
                <p className="font-data text-ledger text-sm font-bold ml-4">${formatUSDC(p.amount)}</p>
                <div className="ml-4 shrink-0"><StatusBadge status="active" /></div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </>
  )

  if (loadError) return (
    <main className="min-h-[100dvh] bg-ink px-6 pt-12">
      <Link href="/" className="font-data text-ghost text-xs hover:text-uniben transition-colors">← LEVYLEDGER</Link>
      <p className="font-data text-void text-xs tracking-widest uppercase mt-8 mb-3">Connection failed</p>
      <p className="text-body text-sm max-w-xs leading-relaxed mb-6">
        The Solana RPC did not respond. Retry in a moment.
      </p>
      <button
        onClick={() => { setLoading(true); setLoadError(false); load() }}
        className="font-data text-xs tracking-widest py-3 px-5 border border-uniben text-uniben hover:bg-uniben hover:text-ink active:scale-[0.98] transition-all"
      >
        TRY AGAIN
      </button>
    </main>
  )

  return (
    <>
      {!isDesktop && (
        <main id="main-content" className="min-h-[100dvh] bg-ink pb-24 pt-[calc(4rem+env(safe-area-inset-top))]">
          <MobileHeader />
          <section className="px-4 py-6 border-b border-rule">
            <p className="font-data text-ghost text-xs tracking-widest uppercase mb-1">{displayName.toUpperCase()}</p>
            <h1 className="font-display font-bold text-ledger text-2xl tracking-tight">Signatures</h1>
            <p className="text-body text-xs mt-1">Proposals currently awaiting approval</p>
          </section>
          <section className="px-4 pt-2">{list}</section>
          <BottomNav university={university} activeTab="more" />
        </main>
      )}

      {isDesktop && (
        <div className="flex min-h-[100dvh] bg-ink">
          <DesktopSidebar university={university} />
          <div className="flex-1 flex flex-col">
            <DesktopTopBar universityName={displayName} />
            <div className="p-8 max-w-4xl">
              <h1 className="font-display font-bold text-ledger text-3xl tracking-tight mb-1">Signatures</h1>
              <p className="text-body text-sm mb-8">Proposals currently awaiting approval</p>
              <div className="border border-rule bg-paper px-5">{list}</div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
