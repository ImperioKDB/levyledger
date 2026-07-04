'use client'
import { useSearchParams } from 'next/navigation'
import { Suspense, useEffect, useState } from 'react'
import MobileHeader from '@/components/MobileHeader'
import BottomNav from '@/components/BottomNav'
import StatusBadge from '@/components/StatusBadge'
import EmptyState from '@/components/EmptyState'
import DesktopSidebar from '@/components/DesktopSidebar'
import DesktopTopBar from '@/components/DesktopTopBar'
import DesktopTransactionsList from '@/components/DesktopTransactionsList'
import { fetchTreasury, fetchAllProposals } from '@/lib/queries'
import { formatUSDC } from '@/lib/anchor'
import { UNIVERSITIES } from '@/lib/constants'

interface RealTx {
  id: string
  type: 'executed'
  amount: number
  description: string
  date: string
}

function TransactionsContent() {
  const searchParams = useSearchParams()
  const uniSlug = searchParams.get('treasury') || 'uniben'
  
  const [transactions, setTransactions] = useState<RealTx[]>([])
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState<string | null>(null)

  useEffect(() => {
    async function load() {
      const t = await fetchTreasury(uniSlug)
      if (!t) { setLoading(false); return }
      
      const count = typeof t.proposalCount?.toNumber === 'function'
        ? t.proposalCount.toNumber() : Number(t.proposalCount)
      const proposals = await fetchAllProposals(t.pda, count)
      
      // Derive real transactions from executed proposals
      const executed = proposals
        .filter((p: any) => Object.keys(p.status)[0] === 'executed')
        .map((p: any) => {
          const created = typeof p.createdAt?.toNumber === 'function' ? p.createdAt.toNumber() : Number(p.createdAt)
          const date = new Date(created * 1000).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
          const amt = typeof p.amount?.toNumber === 'function' ? p.amount.toNumber() : Number(p.amount)
          return {
            id: 'prop-' + p.index,
            type: 'executed' as const,
            amount: amt,
            description: p.description || 'Proposal #' + p.index,
            date: date,
          }
        })
        .sort((a: any, b: any) => parseInt(b.id.split('-')[1]) - parseInt(a.id.split('-')[1]))
        
      setTransactions(executed)
      setLoading(false)
    }
    load()
  }, [uniSlug])

  const universityName = UNIVERSITIES[uniSlug] || uniSlug.toUpperCase()

  return (
    <>
      <div className="xl:hidden">
        <main className="min-h-screen bg-ink pb-24 pt-16">
          <MobileHeader />
          <section className="px-4 py-6 border-b border-rule">
            <p className="font-data text-ghost text-xs tracking-widest uppercase mb-1">{uniSlug.toUpperCase()}</p>
            <h1 className="font-display font-bold text-ledger text-2xl">Transactions</h1>
            <p className="text-body text-xs mt-1">Executed spending proposals for this treasury</p>
          </section>
          <section className="px-4 pt-4">
            {loading ? (
              <p className="font-data text-ghost text-xs">Loading transactions...</p>
            ) : transactions.length === 0 ? (
              <EmptyState 
                title="No Transactions Yet" 
                body="Executed spending proposals will appear here as on-chain records." 
              />
            ) : (
              <div className="space-y-3">
                {transactions.map((tx) => (
                  <div key={tx.id} className="border border-rule bg-paper">
                    <button
                      onClick={() => setExpanded(expanded === tx.id ? null : tx.id)}
                      className="w-full p-4 flex items-center justify-between text-left"
                    >
                      <div className="flex items-center gap-3">
                        <span className="w-8 h-8 flex items-center justify-center border border-rule text-ledger">
                          ↑
                        </span>
                        <div>
                          <p className="font-data text-ledger text-sm font-bold">{tx.description}</p>
                          <p className="font-data text-ghost text-[10px]">{tx.date}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-data text-sm font-bold text-ledger">
                          -${formatUSDC(tx.amount)}
                        </p>
                      </div>
                    </button>
                    {expanded === tx.id && (
                      <div className="px-4 pb-4 border-t border-rule pt-3">
                        <p className="font-data text-ghost text-[10px] tracking-widest uppercase mb-1">Status</p>
                        <StatusBadge status="executed" />
                        <p className="font-data text-ghost text-[10px] tracking-widest uppercase mt-3 mb-1">Type</p>
                        <p className="font-data text-ledger text-xs">Executed Proposal</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </section>
          <BottomNav university={uniSlug} />
        </main>
      </div>
      <div className="hidden xl:flex min-h-screen bg-ink">
        <DesktopSidebar university={uniSlug} />
        <div className="flex-1 flex flex-col">
          <DesktopTopBar universityName={universityName} />
          <DesktopTransactionsList transactions={transactions} loading={loading} />
        </div>
      </div>
    </>
  )
}

export default function TransactionsPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-ink" />}>
      <TransactionsContent />
    </Suspense>
  )
}
