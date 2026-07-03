'use client'

import { useParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import { fetchTreasury, fetchAllProposals } from '@/lib/queries'
import { UNIVERSITIES, CATEGORY_LABELS } from '@/lib/constants'
import { formatUSDC } from '@/lib/anchor'
import MobileHeader from '@/components/MobileHeader'
import BottomNav from '@/components/BottomNav'
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
  const isDesktop = useIsDesktop()

  useEffect(() => {
    async function load() {
      const t = await fetchTreasury(university)
      if (!t) { setLoading(false); return }
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
    load()
  }, [university])

  return (
    <>
      {!isDesktop && (
      <main className="min-h-screen bg-ink pb-24 pt-16">
        <MobileHeader />
        <section className="px-4 py-6 border-b border-rule">
          <p className="font-data text-ghost text-xs tracking-widest uppercase mb-1">{university.toUpperCase()}</p>
          <h1 className="font-display font-bold text-ledger text-2xl">Reports</h1>
        </section>
        <section className="px-4 pt-4">
          {loading ? (
            <p className="font-data text-ghost text-xs">Loading reports...</p>
          ) : !treasury ? (
            <p className="text-body text-sm py-8">This treasury has not been initialized on-chain yet.</p>
          ) : (
            <div className="space-y-4">
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
        <BottomNav university={university} />
      </main>
      )}

      {isDesktop && (
      <div className="flex min-h-screen bg-ink">
        <DesktopSidebar university={university} />
        <div className="flex-1 flex flex-col">
          <DesktopTopBar universityName={UNIVERSITIES[university] || university} />
          <DesktopReportsList breakdown={breakdown} totalSpent={totalSpent} loading={loading} treasury={treasury} />
        </div>
      </div>
      )}
    </>
  )
}
