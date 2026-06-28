import { formatUSDC } from '@/lib/anchor'

interface Props {
  availableBalance: any
  totalDeposited:   any
  totalSpent:       any
  compact?:         boolean
}

export default function TreasuryStats({
  availableBalance, totalDeposited, totalSpent, compact = false,
}: Props) {
  if (compact) {
    return (
      <div className="flex items-center gap-5">
        <div>
          <span className="font-data text-ghost text-xs mr-1">Bal</span>
          <span className="font-data text-uniben text-sm font-bold">
            ${formatUSDC(availableBalance)}
          </span>
        </div>
        <div>
          <span className="font-data text-ghost text-xs mr-1">In</span>
          <span className="font-data text-ledger text-sm">${formatUSDC(totalDeposited)}</span>
        </div>
        <div>
          <span className="font-data text-ghost text-xs mr-1">Out</span>
          <span className="font-data text-ledger text-sm">${formatUSDC(totalSpent)}</span>
        </div>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-3 border-b border-rule">
      {[
        { label: 'Balance',   value: formatUSDC(availableBalance), highlight: true  },
        { label: 'Total In',  value: formatUSDC(totalDeposited),   highlight: false },
        { label: 'Total Out', value: formatUSDC(totalSpent),       highlight: false },
      ].map((s, i) => (
        <div key={i} className="px-4 py-6 border-r border-rule last:border-r-0">
          <p className="font-data text-ghost text-xs mb-2">{s.label}</p>
          <p className={`font-data text-xl font-bold leading-none mb-1 ${
            s.highlight ? 'text-uniben' : 'text-ledger'
          }`}>
            ${s.value}
          </p>
          <p className="font-data text-ghost text-xs">USDC</p>
        </div>
      ))}
    </div>
  )
}
