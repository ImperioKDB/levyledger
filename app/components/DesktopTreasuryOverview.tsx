import Link from 'next/link'
import { formatUSDC } from '@/lib/anchor'
import ProposalCard from './ProposalCard'
import MetricCard from './MetricCard'

interface Props {
  university: string
  treasury: any
  proposals: any[]
  loading: boolean
}

export default function DesktopTreasuryOverview({
  university, treasury, proposals, loading,
}: Props) {
  if (loading || !treasury) {
    return <div className="p-8 font-data text-ghost text-xs animate-pulse">Loading treasury...</div>
  }

  return (
    <div className="flex-1 overflow-y-auto p-8">
      <div className="grid grid-cols-3 gap-4 mb-8">
        <MetricCard label="Available Balance" value={"$" + formatUSDC(treasury.availableBalance)} highlight />
        <MetricCard label="Reserved Balance"  value={"$" + formatUSDC(treasury.reservedBalance)} />
        <MetricCard label="Total Deposited"   value={"$" + formatUSDC(treasury.totalDeposited)} />
        <MetricCard label="Total Spent"       value={"$" + formatUSDC(treasury.totalSpent)} />
        <MetricCard label="Active Proposals"  value={treasury.activeProposalCount?.toString?.() ?? String(treasury.activeProposalCount)} />
        <MetricCard label="Total Proposals"   value={treasury.proposalCount?.toString?.() ?? String(treasury.proposalCount)} />
      </div>
      <div className="max-w-2xl">
        <div className="flex items-center justify-between mb-4">
          <p className="font-data text-ghost text-xs tracking-widest uppercase">Recent Proposals</p>
          <Link href={`/${university}/proposals`} className="font-data text-xs text-uniben hover:opacity-80 transition-opacity">
            View all →
          </Link>
        </div>
        {proposals.length === 0 ? (
          <p className="font-data text-ghost text-sm">No proposals yet.</p>
        ) : (
          proposals.map((p: any) => (
            <ProposalCard key={p.index} proposal={p} university={university} signers={treasury.signers} />
          ))
        )}
      </div>
    </div>
  )
}
