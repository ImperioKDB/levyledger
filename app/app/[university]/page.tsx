'use client'

import { useParams } from 'next/navigation'
import { useEffect, useState, useRef } from 'react'
import Link from 'next/link'
import { fetchTreasury, fetchAllProposals } from '@/lib/queries'
import { UNIVERSITIES } from '@/lib/constants'
import ProposalCard from '@/components/ProposalCard'
import TreasuryStats from '@/components/TreasuryStats'
import BottomNav from '@/components/BottomNav'
import EmptyState from '@/components/EmptyState'

type Filter = 'All' | 'Active' | 'Executed' | 'Rejected' | 'Expired'
const FILTERS: Filter[] = ['All', 'Active', 'Executed', 'Rejected', 'Expired']

export default function TreasuryPage() {
  const { university } = useParams() as { university: string }

  const [treasury,   setTreasury]   = useState<any>(null)
  const [proposals,  setProposals]  = useState<any[]>([])
  const [loading,    setLoading]    = useState(true)
  const [filter,     setFilter]     = useState<Filter>('All')
  const [notFound,   setNotFound]   = useState(false)
  const [scrolled,   setScrolled]   = useState(false)

  const statsRef  = useRef<HTMLDivElement>(null)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // ── Sticky header: watch when stats section leaves viewport ──────────────
  useEffect(() => {
    const el = statsRef.current
    if (!el) return
    const observer = new IntersectionObserver(
      ([entry]) => setScrolled(!entry.isIntersecting),
      { threshold: 0 }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [treasury]) // re-attach once treasury loads and statsRef populates

  // ── Data loading + polling ────────────────────────────────────────────────
  async function load() {
    const t = await fetchTreasury(university)
    if (!t) {
      setNotFound(true)
      setLoading(false)
      if (intervalRef.current) clearInterval(intervalRef.current)
      return
    }
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
    intervalRef.current = setInterval(load, 15000)
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [university])

  // ── Loading state ─────────────────────────────────────────────────────────
  if (loading) return (
    <main className="min-h-screen bg-ink">
      <header className="sticky top-0 z-40 bg-ink border-b border-rule px-6 py-4">
        <Link href="/" className="font-data text-ghost text-xs">← LEVYLEDGER</Link>
      </header>
      <div className="px-6 pt-8 space-y-4">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="animate-pulse">
            <div className="h-3 bg-paper w-20 mb-2" />
            <div className="h-8 bg-paper w-36" />
          </div>
        ))}
      </div>
    </main>
  )

  // ── Not found state ───────────────────────────────────────────────────────
  if (notFound) return (
    <main className="min-h-screen bg-ink">
      <header className="sticky top-0 z-40 bg-ink border-b border-rule px-6 py-4">
        <Link href="/" className="font-data text-ghost text-xs">← LEVYLEDGER</Link>
      </header>
      <div className="px-6 pt-12">
        <p className="font-data text-ghost text-xs tracking-widest uppercase mb-4">
          {university.toUpperCase()}
        </p>
        <h1 className="font-display text-2xl font-bold text-ledger mb-3">
          Treasury not found
        </h1>
        <p className="text-ghost text-sm max-w-xs leading-relaxed">
          No on-chain treasury exists for "{university}" yet.
          Once initialized, the full ledger will appear here.
        </p>
      </div>
    </main>
  )

  // ── Filter proposals ──────────────────────────────────────────────────────
  const filtered = filter === 'All'
    ? proposals
    : proposals.filter(
        p => Object.keys(p.status)[0].toLowerCase() === filter.toLowerCase()
      )

  const uniName = UNIVERSITIES[university] || university

  return (
    <main className="min-h-screen bg-ink">

      {/* ── Sticky header ───────────────────────────────────────────────── */}
      <header className="sticky top-0 z-40 bg-ink border-b border-rule">
        <div className="px-6 py-4 flex items-center justify-between">
          <Link href="/" className="font-data text-ghost text-xs shrink-0">
            ← LEVYLEDGER
          </Link>
          {/* Compact balance — fades in once stats section scrolls out of view */}
          <div className={`transition-opacity duration-200 ${
            scrolled ? 'opacity-100' : 'opacity-0 pointer-events-none'
          }`}>
            <TreasuryStats
              availableBalance={treasury.availableBalance}
              totalDeposited={treasury.totalDeposited}
              totalSpent={treasury.totalSpent}
              compact
            />
          </div>
        </div>
      </header>

      {/* ── Treasury name ───────────────────────────────────────────────── */}
      <section className="px-6 pt-8 pb-6 border-b border-rule">
        <p className="font-data text-ghost text-xs tracking-widest uppercase mb-2">
          {university.toUpperCase()} Student Union
        </p>
        <h1 className="font-display text-2xl font-bold text-ledger">
          {uniName} Treasury
        </h1>
      </section>

      {/* ── Stats — IntersectionObserver watches this ────────────────────── */}
      <div ref={statsRef}>
        <TreasuryStats
          availableBalance={treasury.availableBalance}
          totalDeposited={treasury.totalDeposited}
          totalSpent={treasury.totalSpent}
        />
      </div>

      {/* ── Filter tabs ─────────────────────────────────────────────────── */}
      <section className="px-6 pt-4 pb-3 flex gap-2 overflow-x-auto border-b border-rule no-scrollbar">
        {FILTERS.map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`font-data text-xs px-3 py-1.5 border shrink-0 transition-colors ${
              filter === f
                ? 'border-nigerian text-nigerian bg-ink'
                : 'border-rule text-ghost hover:border-ghost'
            }`}
          >
            {f.toUpperCase()}
          </button>
        ))}
      </section>

      {/* ── Proposal list ───────────────────────────────────────────────── */}
      <section className="px-6 pt-2 pb-28">
        {filtered.length === 0 ? (
          <EmptyState filter={filter} university={university} />
        ) : (
          filtered.map(p => (
            <ProposalCard
              key={p.index}
              proposal={p}
              university={university}
              signers={treasury.signers}
            />
          ))
        )}
      </section>

      {/* ── Bottom nav ──────────────────────────────────────────────────── */}
      <BottomNav university={university} />

    </main>
  )
}
