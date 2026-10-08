'use client'

import { useSearchParams } from 'next/navigation'
import { Suspense, useEffect, useState } from 'react'
import { PublicKey } from '@solana/web3.js'
import MobileHeader from '@/components/MobileHeader'
import BottomNav from '@/components/BottomNav'
import StatusBadge from '@/components/StatusBadge'
import EmptyState from '@/components/EmptyState'
import LoadingSkeleton from '@/components/LoadingSkeleton'
import DesktopSidebar from '@/components/DesktopSidebar'
import DesktopTopBar from '@/components/DesktopTopBar'
import DesktopTransactionsList from '@/components/DesktopTransactionsList'
import { fetchTreasury, fetchAllProposals } from '@/lib/queries'
import { fetchFacultyBySlug } from '@/lib/supabase'
import { formatUSDC, getProposalPDA } from '@/lib/anchor'

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
  const [facultyName, setFacultyName] = useState<string | null>(null)
  const [treasuryPda, setTreasuryPda] = useState<string | null>(null)

  useEffect(() => {
    async function load() {
      const t = await fetchTreasury(uniSlug)
      if (!t) { setTreasuryPda(null); setLoading(false); return }
      setTreasuryPda(t.pda.toString())
      const count = typeof t.proposalCount?.toNumber === 'function'
        ? t.proposalCount.toNumber() : Number(t.proposalCount)
      const proposals = await fetchAllProposals(t.pda, count)
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
    fetchFacultyBySlug(uniSlug)
      .then(r => setFacultyName(r?.department ?? null))
      .catch(() => setFacultyName(null))
  }, [uniSlug])

  const displayName = facultyName || uniSlug.toUpperCase()

  return (
    <>
      <div className="xl:hidden">
        <main id="main-content" className="min-h-[100dvh] bg-ink pb-24 pt-[calc(4rem+env(safe-area-inset-top))]">
          <MobileHeader />
          <section className="px-4 py-6 border-b border-rule">
            <p className="font-data text-ghost text-xs tracking-widest uppercase mb-1">{displayName.toUpperCase()}</p>
            <h1 className="font-display font-bold text-ledger text-2xl tracking-tight">Transactions</h1>
            <p className="text-body text-xs mt-1">Executed spending proposals for this treasury</p>
          </section>
          <section className="px-4 pt-4">
            {loading ? (
              <LoadingSkeleton lines={5} />
            ) : transactions.length === 0 ? (
              <EmptyState
                title="No transactions yet"
                body="Executed spending proposals will appear here as on-chain records."
              />
            ) : (
              <div className="space-y-3 stagger">
                {transactions.map((tx) => {
                  const propIndex = parseInt(tx.id.split('-')[1])
                  const propPda = treasuryPda
                    ? getProposalPDA(new PublicKey(treasuryPda), propIndex)[0]
                    : null
                  return (
                    <div key={tx.id} className="border border-rule bg-paper">
                      <button
                        onClick={() => setExpanded(expanded === tx.id ? null : tx.id)}
                        className="w-full p-4 flex items-center justify-between text-left hover:bg-lifted active:bg-lifted transition-colors"
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
                          {propPda && (
                            <>
                              <p className="font-data text-ghost text-[10px] tracking-widest uppercase mt-3 mb-1">Verify</p>
                              <a
                                href={`https://explorer.solana.com/address/${propPda.toString()}?cluster=devnet`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="font-data text-uniben text-xs hover:opacity-80 transition-opacity"
                              >
                                Proposal account on explorer ↗
                              </a>
                            </>
                          )}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </section>
          <BottomNav university={uniSlug} activeTab="more" />
        </main>
      </div>

      <div className="hidden xl:flex min-h-[100dvh] bg-ink">
        <DesktopSidebar university={uniSlug} />
        <div className="flex-1 flex flex-col">
          <DesktopTopBar universityName={displayName} />
          <DesktopTransactionsList transactions={transactions} loading={loading} />
        </div>
      </div>
    </>
  )
}

export default function TransactionsPage() {
  return (
    <Suspense fallback={<div className="min-h-[100dvh] bg-ink" />}>
      <TransactionsContent />
    </Suspense>
  )
}
