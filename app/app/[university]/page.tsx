'use client'

import { useParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { fetchTreasury, fetchAllProposals } from '@/lib/queries'
import { formatUSDC } from '@/lib/anchor'
import { UNIVERSITIES } from '@/lib/constants'
import ProposalCard from '@/components/ProposalCard'

type Filter = 'All' | 'Active' | 'Executed' | 'Rejected' | 'Expired'
const FILTERS: Filter[] = ['All', 'Active', 'Executed', 'Rejected', 'Expired']

export default function TreasuryPage() {
  const { university } = useParams() as { university: string }
  const [treasury, setTreasury] = useState<any>(null)
  const [proposals, setProposals] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<Filter>('All')
  const [notFound, setNotFound] = useState(false)

  async function load() {
    const t = await fetchTreasury(university)
    if (!t) { setNotFound(true); setLoading(false); return }
    setTreasury(t)
    const count = typeof t.proposalCount?.toNumber === 'function'
      ? t.proposalCount.toNumber()
      : Number(t.proposalCount)
    const p = await fetchAllProposals(t.pda, count)
    setProposals(p)
    setLoading(false)
  }

  useEffect(() => {
    load()
    const iv = setInterval(load, 15000)
    return () => clearInterval(iv)
  }, [university])

  if (loading) return (
    <main className="min-h-screen bg-base px-6 pt-16">
      <div className="space-y-3">
        {[1,2,3].map(i => <div key={i} className="h-4 bg-surface rounded w-full animate-pulse" />)}
      </div>
    </main>
  )

  if (notFound) return (
    <main className="min-h-screen bg-base px-6 pt-12">
      <Link href="/" className="font-mono text-muted text-xs">← Back</Link>
      <h1 className="font-grotesk text-2xl font-bold text-primary mt-8 mb-2">No treasury found</h1>
      <p className="text-muted text-sm">"{university}" has not been initialized on-chain yet.</p>
    </main>
  )

  const filtered = filter === 'All'
    ? proposals
    : proposals.filter(p => Object.keys(p.status)[0].toLowerCase() === filter.toLowerCase())

  return (
    <main className="min-h-screen bg-base">
      <header className="border-b border-border px-6 py-4 flex items-center justify-between">
        <Link href="/" className="font-mono text-muted text-xs">← LEVYLEDGER</Link>
        <span className="font-mono text-muted text-xs">DEVNET</span>
      </header>

      <section className="px-6 pt-8 pb-6 border-b border-border">
        <p className="font-mono text-muted text-xs tracking-widest uppercase mb-2">
          {university.toUpperCase()} Student Union
        </p>
        <h1 className="font-grotesk text-2xl font-bold text-primary">
          {UNIVERSITIES[university] || university} Treasury
        </h1>
      </section>

      <section className="grid grid-cols-3 border-b border-border">
        {[
          { label: 'Balance', value: formatUSDC(treasury.availableBalance), highlight: true },
          { label: 'Total In', value: formatUSDC(treasury.totalDeposited), highlight: false },
          { label: 'Total Out', value: formatUSDC(treasury.totalSpent), highlight: false },
        ].map((s, i) => (
          <div key={i} className="px-4 py-6 border-r border-border last:border-r-0">
            <p className="font-mono text-muted text-xs mb-2">{s.label}</p>
            <p className={`font-mono text-lg font-bold ${s.highlight ? 'text-accent' : 'text-primary'}`}>
              ${s.value}
            </p>
            <p className="font-mono text-muted text-xs mt-1">USDC</p>
          </div>
        ))}
      </section>

      <section className="px-6 pt-5 pb-3 flex gap-2 overflow-x-auto border-b border-border">
        {FILTERS.map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={`font-mono text-xs px-3 py-1 border rounded-sm shrink-0 transition-colors ${
              filter === f ? 'border-accent text-accent' : 'border-border text-muted hover:border-muted'
            }`}
          >
            {f}
          </button>
        ))}
      </section>

      <section className="px-6 pt-2 pb-20">
        {filtered.length === 0 ? (
          <p className="font-mono text-muted text-sm text-center pt-12">No proposals yet.</p>
        ) : (
          filtered.map(p => (
            <ProposalCard key={p.index} proposal={p} university={university} signers={treasury.signers} />
          ))
        )}
      </section>

      <div className="fixed bottom-6 right-6">
        <Link href={`/admin?treasury=${university}`}
          className="font-mono text-xs border border-border text-muted px-4 py-2 bg-surface hover:border-accent hover:text-accent transition-colors block">
          Exec Panel →
        </Link>
      </div>
    </main>
  )
}
