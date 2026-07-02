'use client'

import { useParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import MobileHeader from '@/components/MobileHeader'
import BottomNav from '@/components/BottomNav'
import TreasuryBalanceCard from '@/components/TreasuryBalanceCard'
import MetricCard from '@/components/MetricCard'
import StatusBadge from '@/components/StatusBadge'
import VerificationBadge from '@/components/VerificationBadge'
import EmptyState from '@/components/EmptyState'
import LoadingSkeleton from '@/components/LoadingSkeleton'
import { fetchTreasury, fetchAllProposals } from '@/lib/queries'
import { formatUSDC } from '@/lib/anchor'

function fmtDate(ts: any): string {
  const s = typeof ts?.toNumber === 'function' ? ts.toNumber() : Number(ts)
  if (isNaN(s)) return '—'
  return new Date(s * 1000).toLocaleDateString('en-NG', { day: 'numeric', month: 'short' })
}

export default function TreasuryPage() {
  const { university } = useParams() as { university: string }
  const [treasury, setTreasury] = useState<any>(null)
  const [proposals, setProposals] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const t = await fetchTreasury(university)
      if (!t) { setLoading(false); return }
      setTreasury(t)
      const count = typeof t.proposalCount?.toNumber === 'function'
        ? t.proposalCount.toNumber() : Number(t.proposalCount)
      const p = await fetchAllProposals(t.pda, Math.min(count, 5))
      setProposals(p)
      setLoading(false)
    }
    load()
  }, [university])

  return (
    <main className="min-h-screen bg-ink pb-24 pt-16">
      <MobileHeader />

      <section className="px-4 py-6 border-b border-rule">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="font-data text-ghost text-xs tracking-widest uppercase mb-1">
              {university.toUpperCase()}
            </p>
            <h1 className="font-display font-bold text-ledger text-2xl">
              Treasury
            </h1>
          </div>
          <VerificationBadge />
        </div>
      </section>

      {loading ? (
        <LoadingSkeleton lines={6} />
      ) : !treasury ? (
        <div className="px-4 py-8">
          <EmptyState
            title="Treasury Not Found"
            body="This treasury has not been initialized on-chain yet."
          />
        </div>
      ) : (
        <>
          <section className="px-4 py-4">
            <TreasuryBalanceCard
              balance={treasury.availableBalance}
              lastUpdated={new Date().toLocaleString('en-NG')}
            />
          </section>

          <section className="px-4 py-4 border-b border-rule">
            <div className="grid grid-cols-2 gap-3">
              <MetricCard label="Received" value={`$${formatUSDC(treasury.totalDeposited)}`} />
              <MetricCard label="Spent" value={`$${formatUSDC(treasury.totalSpent)}`} />
              <MetricCard label="Pending" value={String(proposals.filter(p => Object.keys(p.status)[0] === 'active').length)} highlight />
              <MetricCard label="Executed" value={String(proposals.filter(p => Object.keys(p.status)[0] === 'executed').length)} />
            </div>
          </section>

          <section className="px-4 py-6">
            <div className="flex items-center justify-between mb-4">
              <p className="font-data text-ghost text-xs tracking-widest uppercase">Recent Activity</p>
              <Link href={`/proposals?treasury=${university}`} className="font-data text-uniben text-xs hover:underline">
                View all →
              </Link>
            </div>
            {proposals.length === 0 ? (
              <EmptyState title="No Activity" body="No proposals have been created yet." />
            ) : (
              <div className="space-y-0">
                {proposals.map((p) => {
                  const status = Object.keys(p.status)[0]
                  return (
                    <Link key={p.index} href={`/proposals/${p.index}?treasury=${university}`}>
                      <div className="border-b border-rule py-4 flex items-center justify-between group">
                        <div className="min-w-0 flex-1">
                          <p className="font-data text-ledger font-bold text-sm">
                            ${formatUSDC(p.amount)}
                            <span className="text-ghost text-xs ml-2 font-normal">USDC</span>
                          </p>
                          <p className="text-ghost text-xs truncate mt-0.5 group-hover:text-body transition-colors">
                            {p.description}
                          </p>
                          <p className="font-data text-ghost text-[10px] mt-1">{fmtDate(p.createdAt)}</p>
                        </div>
                        <div className="shrink-0 ml-4">
                          <StatusBadge status={status} />
                        </div>
                      </div>
                    </Link>
                  )
                })}
              </div>
            )}
          </section>
        </>
      )}

      <BottomNav />
    </main>
  )
}
