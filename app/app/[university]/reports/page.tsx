'use client'

import { useParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { fetchTreasury, fetchAllProposals, getLastTreasuryFetchError } from '@/lib/queries'
import { fetchFacultyBySlug } from '@/lib/supabase'
import { CATEGORY_LABELS } from '@/lib/constants'
import { formatUSDC } from '@/lib/anchor'
import MobileHeader from '@/components/MobileHeader'
import BottomNav from '@/components/BottomNav'
import LoadingSkeleton from '@/components/LoadingSkeleton'
import EmptyState from '@/components/EmptyState'
import DesktopSidebar from '@/components/DesktopSidebar'
import DesktopTopBar from '@/components/DesktopTopBar'
import DesktopReportsList from '@/components/DesktopReportsList'
import { useIsDesktop } from '@/hooks/useIsDesktop'

interface Breakdown {
  category: string
  label: string
  total: number
  count: number
}

export default function ReportsPage() {
  const { university } = useParams() as { university: string }
  const [treasury, setTreasury] = useState<any>(null)
  const [breakdown, setBreakdown] = useState<Breakdown[]>([])
  const [totalSpent, setTotalSpent] = useState(0)
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
    const executed = proposals.filter((p: any) => Object.keys(p.status)[0] === 'executed')
    const totals: Record<string, { total: number; count: number }> = {}
    executed.forEach((p: any) => {
      const cat = Object.keys(p.category)[0]
      const amt = typeof p.amount?.toNumber === 'function' ? p.amount.toNumber() : Number(p.amount)
      if (!totals[cat]) totals[cat] = { total: 0, count: 0 }
      totals[cat].total += amt
      totals[cat].count += 1
    })
    const rows: Breakdown[] = Object.keys(CATEGORY_LABELS).map((cat) => ({
      category: cat,
      label: CATEGORY_LABELS[cat],
      total: totals[cat]?.total || 0,
      count: totals[cat]?.count || 0,
    }))
    setBreakdown(rows)
    setTotalSpent(rows.reduce((sum, r) => sum + r.total, 0))
    setLoading(false)
  }

  useEffect(() => {
    load()
    fetchFacultyBySlug(university)
      .then(r => setFacultyName(r?.department ?? null))
      .catch(() => setFacultyName(null))
  }, [university])

  const displayName = facultyName || university
  const allZero = breakdown.every(b => b.total === 0)

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
            <h1 className="font-display font-bold text-ledger text-2xl tracking-tight">Reports</h1>
            <p className="text-body text-xs mt-1">Executed spending by category</p>
          </section>
          <section className="px-4 pt-4">
            {loading ? (
              <LoadingSkeleton lines={5} />
            ) : !treasury ? (
              <p className="text-body text-sm py-8">This treasury has not been initialized on-chain yet.</p>
            ) : allZero ? (
              <EmptyState
                title="No spending reported yet"
                body="When proposals reach 3-of-5 approval and execute, the spending breakdown will appear here."
              />
            ) : (
              <div className="space-y-4 stagger">
                {breakdown.map((b) => (
                  <div key={b.category} className="border border-rule bg-paper p-4">
                    <p className="font-data text-ledger text-sm mb-1">{b.label}</p>
                    <p className="font-data text-uniben text-lg font-bold">${formatUSDC(b.total)}</p>
                    <p className="font-data text-ghost text-[10px] mt-1">{b.count} executed</p>
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
            <DesktopReportsList breakdown={breakdown} totalSpent={totalSpent} loading={loading} treasury={treasury} />
          </div>
        </div>
      )}
    </>
  )
}
