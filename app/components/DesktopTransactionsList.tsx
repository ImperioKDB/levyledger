'use client'

import StatusBadge from './StatusBadge'

type TxType = 'received' | 'executed' | 'rejected'

interface MockTx {
  id: string
  type: TxType
  amount: number
  description: string
  date: string
  hash: string
}

function formatUSDC(micro: number): string {
  return (micro / 1_000_000).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

interface Props {
  transactions: MockTx[]
}

export default function DesktopTransactionsList({ transactions }: Props) {
  return (
    <div className="p-8 max-w-6xl">
      <h1 className="font-display font-bold text-ledger text-3xl mb-1">Transactions</h1>
      <p className="text-body text-sm mb-8">All on-chain activity for this treasury</p>

      {transactions.length === 0 ? (
        <p className="text-body text-sm py-8">No transactions yet.</p>
      ) : (
        <div className="border border-rule bg-paper">
          <div className="grid grid-cols-[100px_1fr_140px_160px_140px] px-5 py-3 border-b border-rule">
            {['Type', 'Description', 'Amount', 'Hash', 'Status'].map((h) => (
              <p key={h} className="font-data text-ghost text-[10px] tracking-widest uppercase">{h}</p>
            ))}
          </div>
          {transactions.map((tx) => (
            <div key={tx.id} className="grid grid-cols-[100px_1fr_140px_160px_140px] px-5 py-4 border-b border-rule last:border-b-0 items-center">
              <span className={
                'w-8 h-8 flex items-center justify-center border ' +
                (tx.type === 'received' ? 'border-nigerian text-nigerian' : 'text-ledger border-rule')
              }>
                {tx.type === 'received' ? '↓' : '↑'}
              </span>
              <div>
                <p className="text-body text-sm">{tx.description}</p>
                <p className="font-data text-ghost text-[10px] mt-0.5">{tx.date}</p>
              </div>
              <p className={
                'font-data text-sm font-bold ' +
                (tx.type === 'received' ? 'text-nigerian' : 'text-ledger')
              }>
                {tx.type === 'received' ? '+' : '-'}${formatUSDC(tx.amount)}
              </p>
              <p className="font-data text-ghost text-xs break-all">{tx.hash}</p>
              <StatusBadge status={tx.type === 'received' ? 'confirmed' : tx.type} />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
