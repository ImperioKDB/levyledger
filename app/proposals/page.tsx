'use client'

import { useSearchParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import MobileHeader from '@/components/MobileHeader'
import BottomNav from '@/components/BottomNav'
import StatusBadge from '@/components/StatusBadge'
import EmptyState from '@/components/EmptyState'
import LoadingSkeleton from '@/components/LoadingSkeleton'
import { fetchTreasury, fetchAllProposals } from '@/lib/queries'
import { formatUSDC } from '@/lib/anchor'

type Filter = 'all' | 'active' | 'executed' | 'rejected' | 'expired'
const FILTERS: Filter[] = ['all', 'active', 'executed', 'rejected', 'expired']

export default function ProposalsPage() {
  const searchParams = useSearchParams()
  const uniSlug = searchParams.get('treasury') || 'uniben'
  const [filter, setFilter] = useState<Filter>('all')
  const [proposals, setProposals] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const t = await fetchTreasury(uniSlug)
      if (!t) { setLoading(false); return }
      const count = typeof t.proposalCount?.toNumber === 'function'
        ? t.proposalCount.toNumber() : Number(t.proposalCount)
      const all = await fetchAllProposals(t.pda, count)
      setProposals(all)
      setLoading(false)
    }
    load()
  }, [uniSlug])

  const filtered = filter === 'all'
    ? proposals
    : proposals.filter(p => Object.keys(p.status)[0].toLowerCase() === filter)

  return (
    <main className="min-h-screen bg-ink pb-24 pt-16">
      <MobileHeader />

      <section className="px-4 py-6 border-b border-rule">
        <p className="font-data text-ghost text-xs tracking-widest uppercase mb-1">{uniSlug.toUpperCase()}</p>
        <h1 className="font-display font-bold text-ledger text-2xl">Proposals</h1>
      </section>

      {/* Filters */}
      <section className="px-4 py-3 border-b border-rule sticky top-16 bg-ink z-40 overflow-x-auto no-scrollbar">
        <div className="flex gap-2">
          {FILTERS.map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`font-data text-xs px-3 py-1.5 border shrink-0 transition-colors ${
                filter === f
                  ? 'border-uniben text-uniben'
                  : 'border-rule text-ghost hover:border-ghost'
              }`}
            >
              {f.toUpperCase()}
            </button>
          ))}
        </div>
      </section>

      <section className="px-4 pt-4">
        {loading ? (
          <LoadingSkeleton lines={8} />
        ) : filtered.length === 0 ? (
          <EmptyState
            title={`No ${filter} proposals`}
            body="Proposals matching this filter will appear here."
          />
        ) : (
          <div className="space-y-0">
            {filtered.map((p) => {
              const status = Object.keys(p.status)[0]
              return (
                <Link key={p.index} href={`/proposals/${p.index}?treasury=${uniSlug}`}>
                  <div className="border-b border-rule py-5 flex items-start justify-between gap-4 group cursor-pointer">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-2">
                        <StatusBadge status={status} />
                        <span className="font-data text-ghost text-[10px]">#{p.index}</span>
                      </div>
                      <p className="font-data text-lg font-bold text-ledger mb-1">
                        ${formatUSDC(p.amount)}
                        <span className="text-ghost text-xs ml-2 font-normal">USDC</span>
                      </p>
                      <p className="text-ghost text-xs truncate group-hover:text-body transition-colors">
                        {p.description}
                      </p>
                      <p className="font-data text-ghost text-[10px] mt-2">
                        {p.signaturesFor}/3 signatures
                      </p>
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </section>

      <BottomNav />
    </main>
  )
}
