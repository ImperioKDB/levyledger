'use client'
import StatusBadge from './StatusBadge'
import { formatUSDC } from '@/lib/anchor'

interface RealTx {
  id: string
  type: 'executed'
  amount: number
  description: string
  date: string
}

interface Props {
  transactions: RealTx[]
  loading?: boolean
}

export default function DesktopTransactionsList({ transactions, loading }: Props) {
  if (loading) {
    return <div className="p-8 font-data text-ghost text-xs">Loading transactions...</div>
  }

  return (
    <div className="p-8 max-w-6xl">
      <h1 className="font-display font-bold text-ledger text-3xl mb-1">Transactions</h1>
      <p className="text-body text-sm mb-8">Executed spending proposals for this treasury</p>
      {transactions.length === 0 ? (
        <p className="text-body text-sm py-8">No executed transactions yet. When proposals reach the 3-of-5 threshold and funds are released, they will appear here.</p>
      ) : (
        <div className="border border-rule bg-paper">
          <div className="grid grid-cols-[100px_1fr_140px_140px] px-5 py-3 border-b border-rule">
            {['Type', 'Description', 'Amount', 'Status'].map((h) => (
              <p key={h} className="font-data text-ghost text-[10px] tracking-widest uppercase">{h}</p>
            ))}
          </div>
          {transactions.map((tx) => (
            <div key={tx.id} className="grid grid-cols-[100px_1fr_140px_140px] px-5 py-4 border-b border-rule last:border-b-0 items-center">
              <span className="w-8 h-8 flex items-center justify-center border border-rule text-ledger">
                ↑
              </span>
              <div>
                <p className="text-body text-sm">{tx.description}</p>
                <p className="font-data text-ghost text-[10px] mt-0.5">{tx.date}</p>
              </div>
              <p className="font-data text-sm font-bold text-ledger">
                -${formatUSDC(tx.amount)}
              </p>
              <StatusBadge status="executed" />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
