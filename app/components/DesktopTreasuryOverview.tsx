'use client'

import Link from 'next/link'
import BalanceChart from './BalanceChart'
import StatusBadge from './StatusBadge'
import { formatUSDC } from '@/lib/anchor'

interface Props {
  university: string
  universityName: string
  treasury: any
  proposals: any[]
  loading: boolean
}

function fmtDate(ts: any): string {
  const s = typeof ts?.toNumber === 'function' ? ts.toNumber() : Number(ts)
  if (isNaN(s)) return '—'
  return new Date(s * 1000).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' })
}

export default function DesktopTreasuryOverview({ university, treasury, proposals, loading }: Props) {
  if (loading) {
    return <div className="p-8 font-data text-ghost text-xs">Loading treasury...</div>
  }

  if (!treasury) {
    return (
      <div className="p-8">
        <p className="font-display text-xl text-ledger mb-2">Treasury Not Found</p>
        <p className="text-body text-sm">This treasury has not been initialized on-chain yet.</p>
      </div>
    )
  }

  const deposited = typeof treasury.totalDeposited?.toNumber === 'function'
    ? treasury.totalDeposited.toNumber() : Number(treasury.totalDeposited)
  const available = typeof treasury.availableBalance?.toNumber === 'function'
    ? treasury.availableBalance.toNumber() : Number(treasury.availableBalance)

  const recent = proposals.slice(0, 5)

  return (
    <div className="p-8 max-w-6xl">
      <h1 className="font-display font-bold text-ledger text-3xl mb-2">Treasury Overview</h1>
      <p className="text-body text-sm mb-8">All records are on-chain and cannot be altered.</p>

      <div className="grid grid-cols-2 gap-6 mb-10">
        <div className="border border-rule bg-paper p-6">
          <p className="font-data text-ghost text-xs tracking-widest uppercase mb-3">Total Treasury Balance</p>
          <p className="font-data text-4xl font-bold text-ledger mb-1">
            {formatUSDC(available)} <span className="text-lg text-ghost">USDC</span>
          </p>
          <p className="font-data text-ghost text-xs mb-4">${formatUSDC(available)}</p>
          <span className="inline-flex items-center gap-2 border border-nigerian px-3 py-1.5">
            <span className="w-1.5 h-1.5 bg-nigerian" />
            <span className="font-data text-nigerian text-[10px] tracking-widest uppercase">On-chain</span>
          </span>
        </div>

        <div className="border border-rule bg-paper p-6">
          <p className="font-data text-ghost text-xs tracking-widest uppercase mb-3">Balance Trend</p>
          <BalanceChart
            points={[0, deposited, available]}
            labels={['Inception', 'Total Received', 'Available Now']}
          />
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-4">
          <p className="font-data text-ghost text-xs tracking-widest uppercase">Recent Activity</p>
          <Link href={'/proposals?treasury=' + university} className="font-data text-uniben text-xs hover:underline">
            View all →
          </Link>
        </div>

        {recent.length === 0 ? (
          <p className="text-body text-sm py-8">No activity recorded yet.</p>
        ) : (
          <div className="border border-rule bg-paper">
            {recent.map((p) => {
              const status = Object.keys(p.status)[0]
              return (
                <Link key={p.index} href={'/proposals/' + p.index + '?treasury=' + university}>
                  <div className="flex items-center justify-between px-5 py-4 border-b border-rule last:border-b-0 hover:bg-lifted transition-colors">
                    <div className="min-w-0 flex-1">
                      <p className="text-body text-sm truncate">{p.description}</p>
                      <p className="font-data text-ghost text-[10px] mt-1">{fmtDate(p.createdAt)}</p>
                    </div>
                    <p className="font-data text-ledger text-sm font-bold w-32 text-right">
                      ${formatUSDC(p.amount)}
                    </p>
                    <div className="w-24 flex justify-end">
                      <StatusBadge status={status} />
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
