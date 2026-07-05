'use client'

import Link from 'next/link'
import StatusBadge from './StatusBadge'
import { formatUSDC } from '@/lib/anchor'
import { CATEGORY_LABELS } from '@/lib/constants'

type Filter = 'all' | 'active' | 'executed' | 'rejected' | 'expired'
const FILTERS: Filter[] = ['all', 'active', 'executed', 'rejected', 'expired']

interface Props {
  university: string
  proposals: any[]
  loading: boolean
  filter: Filter
  onFilterChange: (f: Filter) => void
  threshold?: number
}

export default function DesktopProposalsList({ university, proposals, loading, filter, onFilterChange, threshold }: Props) {
  const denom = threshold || 3

  return (
    <div className="p-8 max-w-6xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display font-bold text-ledger text-3xl mb-1">Proposals</h1>
          <p className="text-body text-sm">All spending requests for {university.toUpperCase()}</p>
        </div>
        <div className="flex gap-2">
          {FILTERS.map((f) => (
            <button
              key={f}
              onClick={() => onFilterChange(f)}
              className={
                'font-data text-xs px-3 py-1.5 border transition-colors ' +
                (filter === f ? 'border-uniben text-uniben' : 'border-rule text-ghost hover:border-ghost')
              }
            >
              {f.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <p className="font-data text-ghost text-xs">Loading proposals...</p>
      ) : proposals.length === 0 ? (
        <p className="text-body text-sm py-8">No proposals match this filter.</p>
      ) : (
        <div className="border border-rule bg-paper">
          <div className="grid grid-cols-[80px_1fr_140px_120px_120px_120px] px-5 py-3 border-b border-rule">
            {['ID', 'Description', 'Category', 'Amount', 'Signatures', 'Status'].map((h) => (
              <p key={h} className="font-data text-ghost text-[10px] tracking-widest uppercase">{h}</p>
            ))}
          </div>
          {proposals.map((p) => {
            const status = Object.keys(p.status)[0]
            const category = Object.keys(p.category)[0]
            return (
              <Link key={p.index} href={`/${university}/proposals/${p.index}`}>
                <div className="grid grid-cols-[80px_1fr_140px_120px_120px_120px] px-5 py-4 border-b border-rule last:border-b-0 items-center hover:bg-lifted transition-colors">
                  <p className="font-data text-ghost text-xs">#{p.index}</p>
                  <p className="text-body text-sm truncate pr-4">{p.description}</p>
                  <p className="font-data text-ghost text-xs">{CATEGORY_LABELS[category] || category}</p>
                  <p className="font-data text-ledger text-sm font-bold">${formatUSDC(p.amount)}</p>
                  <p className="font-data text-ghost text-xs">{p.signaturesFor}/{denom}</p>
                  <StatusBadge status={status} />
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
