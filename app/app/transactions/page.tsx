'use client'

import { useState } from 'react'
import MobileHeader from '@/components/MobileHeader'
import BottomNav from '@/components/BottomNav'
import StatusBadge from '@/components/StatusBadge'
import EmptyState from '@/components/EmptyState'
import DesktopSidebar from '@/components/DesktopSidebar'
import DesktopTopBar from '@/components/DesktopTopBar'
import DesktopTransactionsList from '@/components/DesktopTransactionsList'

type TxType = 'received' | 'executed' | 'rejected'

interface MockTx {
  id: string
  type: TxType
  amount: number
  description: string
  date: string
  hash: string
}

const MOCK_TRANSACTIONS: MockTx[] = [
  { id: '1', type: 'received', amount: 1200000000, description: 'Levy Collection — May', date: 'Jul 02, 2025', hash: '8kLm...3hJ9' },
  { id: '2', type: 'executed', amount: 250000000, description: 'Infrastructure Committee', date: 'Jul 03, 2025', hash: '9xQe...7aK2' },
  { id: '3', type: 'received', amount: 950000000, description: 'Levy Collection — Apr', date: 'Jun 30, 2025', hash: '5mKd...8pQ1' },
  { id: '4', type: 'executed', amount: 180000000, description: 'Welfare Committee', date: 'Jul 01, 2025', hash: '7uPp...1dZx' },
]

function formatUSDC(micro: number): string {
  return (micro / 1_000_000).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

export default function TransactionsPage() {
  const [expanded, setExpanded] = useState<string | null>(null)

  return (
    <>
      <div className="xl:hidden">
        <main className="min-h-screen bg-ink pb-24 pt-16">
          <MobileHeader />

          <section className="px-4 py-6 border-b border-rule">
            <h1 className="font-display font-bold text-ledger text-2xl">Transactions</h1>
            <p className="text-body text-xs mt-1">All on-chain activity for this treasury</p>
          </section>

          <section className="px-4 pt-4">
            {MOCK_TRANSACTIONS.length === 0 ? (
              <EmptyState title="No Transactions" body="Transaction history will appear here once activity begins." />
            ) : (
              <div className="space-y-3">
                {MOCK_TRANSACTIONS.map((tx) => (
                  <div key={tx.id} className="border border-rule bg-paper">
                    <button
                      onClick={() => setExpanded(expanded === tx.id ? null : tx.id)}
                      className="w-full p-4 flex items-center justify-between text-left"
                    >
                      <div className="flex items-center gap-3">
                        <span className={`w-8 h-8 flex items-center justify-center border ${
                          tx.type === 'received' ? 'border-nigerian text-nigerian' : 'text-ledger border-rule'
                        }`}>
                          {tx.type === 'received' ? '↓' : '↑'}
                        </span>
                        <div>
                          <p className="font-data text-ledger text-sm font-bold">{tx.description}</p>
                          <p className="font-data text-ghost text-[10px]">{tx.date}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={`font-data text-sm font-bold ${tx.type === 'received' ? 'text-nigerian' : 'text-ledger'}`}>
                          {tx.type === 'received' ? '+' : '-'}${formatUSDC(tx.amount)}
                        </p>
                      </div>
                    </button>
                    {expanded === tx.id && (
                      <div className="px-4 pb-4 border-t border-rule pt-3">
                        <p className="font-data text-ghost text-[10px] tracking-widest uppercase mb-1">Transaction Hash</p>
                        <p className="font-data text-ledger text-xs break-all">{tx.hash}</p>
                        <p className="font-data text-ghost text-[10px] tracking-widest uppercase mt-3 mb-1">Status</p>
                        <StatusBadge status={tx.type === 'received' ? 'confirmed' : tx.type} />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </section>

          <BottomNav />
        </main>
      </div>

      <div className="hidden xl:flex min-h-screen bg-ink">
        <DesktopSidebar university="uniben" />
        <div className="flex-1 flex flex-col">
          <DesktopTopBar universityName="UNIBEN" />
          <DesktopTransactionsList transactions={MOCK_TRANSACTIONS} />
        </div>
      </div>
    </>
  )
}
