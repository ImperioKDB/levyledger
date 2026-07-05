'use client'

import { useParams } from 'next/navigation'
import { useEffect, useState, useRef } from 'react'
import Link from 'next/link'
import { fetchTreasury, fetchAllProposals } from '@/lib/queries'
import { fetchFacultyBySlug } from '@/lib/supabase'
import ProposalCard from '@/components/ProposalCard'
import TreasuryStats from '@/components/TreasuryStats'
import MetricCard from '@/components/MetricCard'
import { formatUSDC } from '@/lib/anchor'
import BottomNav from '@/components/BottomNav'
import DesktopSidebar from '@/components/DesktopSidebar'
import DesktopTopBar from '@/components/DesktopTopBar'
import DesktopTreasuryOverview from '@/components/DesktopTreasuryOverview'

export default function TreasuryPage() {
  const { university } = useParams() as { university: string }
  const [treasury,    setTreasury]    = useState<any>(null)
  const [proposals,   setProposals]   = useState<any[]>([])
  const [facultyName, setFacultyName] = useState<string | null>(null)
  const [loading,     setLoading]     = useState(true)
  const [notFound,    setNotFound]    = useState(false)
  const [scrolled,    setScrolled]    = useState(false)

  const statsRef   = useRef<HTMLDivElement>(null)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    const el = statsRef.current
    if (!el) return
    const observer = new IntersectionObserver(
      ([entry]) => setScrolled(!entry.isIntersecting),
      { threshold: 0 }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [treasury])

  async function load() {
    const t = await fetchTreasury(university)
    if (!t) {
      setNotFound(true); setLoading(false)
      if (intervalRef.current) clearInterval(intervalRef.current)
      return
    }
    setTreasury(t)
    const count = typeof t.proposalCount?.toNumber === 'function'
      ? t.proposalCount.toNumber() : Number(t.proposalCount)
    const p = await fetchAllProposals(t.pda, count)
    setProposals(p)
    setLoading(false)

    // Real department name if this slug is in the directory; otherwise the
    // raw slug is shown as-is rather than a dead static lookup.
    const req = await fetchFacultyBySlug(university)
    setFacultyName(req?.department ?? null)
  }

  useEffect(() => {
    load()
    intervalRef.current = setInterval(load, 15000)
    return () => { if (intervalRef.current) clearInterval(intervalRef.current) }
  }, [university])

  if (loading) return (
    <main className="min-h-screen bg-ink">
      <header className="sticky top-0 z-40 bg-ink border-b border-rule px-6 py-4">
        <Link href="/" className="font-data text-ghost text-xs">← LEVYLEDGER</Link>
      </header>
      <div className="px-6 pt-8 space-y-6">
        {[1,2,3,4].map(i => (
          <div key={i} className="animate-pulse">
            <div className="h-3 bg-paper w-20 mb-2" />
            <div className="h-8 bg-paper w-36" />
          </div>
        ))}
      </div>
    </main>
  )

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
        <p className="text-body text-sm max-w-xs leading-relaxed">
          No on-chain treasury exists for "{university}" yet. Faculty unions
          are onboarded directly by LevyLedger admins — if this is your
          faculty, contact a LevyLedger admin to get registered.
        </p>
      </div>
    </main>
  )

  const displayName = facultyName || university
  const recentProposals = proposals.slice(0, 3)

  return (
    <>
      <div className="xl:hidden">
        <main className="min-h-screen bg-ink pb-16">
          <header className="sticky top-0 z-40 bg-ink border-b border-rule">
            <div className="px-6 py-4 flex items-center justify-between">
              <Link href="/" className="font-data text-ghost text-xs shrink-0">
                ← LEVYLEDGER
              </Link>
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

          <section className="px-6 pt-8 pb-6 border-b border-rule flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <p className="font-data text-ghost text-xs tracking-widest uppercase mb-2">
                UNIBEN Faculty Union
              </p>
              <h1 className="font-display text-2xl font-bold text-ledger">
                {displayName} Treasury
              </h1>
            </div>
            <div>
              <Link href={`/admin?treasury=${university}`} className="inline-block w-full md:w-auto text-center font-data text-xs tracking-widest py-3 px-6 bg-uniben text-ink hover:opacity-90 transition-all duration-150 active:scale-[0.98]">
                DEPOSIT DUES →
              </Link>
            </div>
          </section>

          <div ref={statsRef} className="px-6 py-6 grid grid-cols-2 gap-3 border-b border-rule">
            <MetricCard label="Available Balance" value={'$' + formatUSDC(treasury.availableBalance)} highlight />
            <MetricCard label="Reserved Balance"   value={'$' + formatUSDC(treasury.reservedBalance)} />
            <MetricCard label="Total Deposited"    value={'$' + formatUSDC(treasury.totalDeposited)} />
            <MetricCard label="Total Spent"        value={'$' + formatUSDC(treasury.totalSpent)} />
            <MetricCard label="Active Proposals"   value={treasury.activeProposalCount?.toString?.() ?? String(treasury.activeProposalCount)} />
            <MetricCard label="Total Proposals"    value={treasury.proposalCount?.toString?.() ?? String(treasury.proposalCount)} />
          </div>

          <section className="px-6 pt-6 pb-28">
            <div className="flex items-center justify-between mb-3">
              <p className="font-data text-ghost text-xs tracking-widest uppercase">
                Recent Proposals
              </p>
              <Link href={`/${university}/proposals`} className="font-data text-xs text-uniben hover:opacity-80 transition-opacity">
                View all →
              </Link>
            </div>
            {recentProposals.length === 0 ? (
              <p className="font-data text-ghost text-sm py-4">No proposals yet.</p>
            ) : (
              recentProposals.map(p => (
                <ProposalCard
                  key={p.index}
                  proposal={p}
                  university={university}
                  signers={treasury.signers}
                />
              ))
            )}
          </section>

          <BottomNav university={university} activeTab="overview" />
        </main>
      </div>

      <div className="hidden xl:flex min-h-screen bg-ink">
        <DesktopSidebar university={university} />
        <div className="flex-1 flex flex-col">
          <DesktopTopBar universityName={displayName} />
          <DesktopTreasuryOverview
            university={university}
            treasury={treasury}
            proposals={recentProposals}
            loading={false}
          />
        </div>
      </div>
    </>
  )
}
