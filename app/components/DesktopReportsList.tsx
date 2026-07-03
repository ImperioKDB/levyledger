'use client'

interface Breakdown {
  category: string
  label: string
  total: number
  count: number
}

interface Props {
  breakdown: Breakdown[]
  totalSpent: number
  loading: boolean
  treasury: any
}

function formatUSDC(micro: number): string {
  return (micro / 1_000_000).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

export default function DesktopReportsList({ breakdown, totalSpent, loading, treasury }: Props) {
  if (loading) {
    return <div className="p-8 font-data text-ghost text-xs">Loading reports...</div>
  }
  if (!treasury) {
    return (
      <div className="p-8">
        <p className="font-display text-xl text-ledger mb-2">Treasury Not Found</p>
        <p className="text-body text-sm">This treasury has not been initialized on-chain yet.</p>
      </div>
    )
  }

  const max = Math.max(...breakdown.map((b) => b.total), 1)

  return (
    <div className="p-8 max-w-4xl">
      <h1 className="font-display font-bold text-ledger text-3xl mb-1">Reports</h1>
      <p className="text-body text-sm mb-8">
        Spend by category, computed from executed proposals only — ${formatUSDC(totalSpent)} USDC total
      </p>

      {breakdown.every((b) => b.total === 0) ? (
        <p className="text-body text-sm py-8">No executed proposals yet — nothing to report on.</p>
      ) : (
        <div className="space-y-5">
          {breakdown.map((b) => (
            <div key={b.category}>
              <div className="flex items-center justify-between mb-2">
                <p className="font-data text-ledger text-sm">{b.label}</p>
                <p className="font-data text-ghost text-xs">${formatUSDC(b.total)} · {b.count} proposal{b.count === 1 ? '' : 's'}</p>
              </div>
              <div className="h-2 bg-lifted border border-rule">
                <div className="h-full bg-uniben" style={{ width: ((b.total / max) * 100) + '%' }} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
