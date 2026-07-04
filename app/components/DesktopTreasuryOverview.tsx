import { formatUSDC } from '@/lib/anchor'
import ProposalCard from './ProposalCard'
import MetricCard from './MetricCard'

interface Props {
  university: string
  universityName: string
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
      <div className="grid grid-cols-4 gap-4 mb-8">
        <MetricCard label="Available Balance" value={"$" + formatUSDC(treasury.availableBalance)} highlight />
        <MetricCard label="Total Deposited"    value={"$" + formatUSDC(treasury.totalDeposited)} />
        <MetricCard label="Total Spent"        value={"$" + formatUSDC(treasury.totalSpent)} />
        <MetricCard label="Proposals"          value={proposals.length} />
      </div>
      <div className="max-w-2xl">
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
