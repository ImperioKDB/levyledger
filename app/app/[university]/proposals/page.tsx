'use client'

import { useParams, useSearchParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useWallet } from '@solana/wallet-adapter-react'
import { fetchTreasury, fetchAllProposals } from '@/lib/queries'
import { fetchFacultyBySlug } from '@/lib/supabase'
import { ADMIN_KEY } from '@/lib/constants'
import ProposalCard from '@/components/ProposalCard'
import BottomNav from '@/components/BottomNav'
import EmptyState from '@/components/EmptyState'
import DesktopSidebar from '@/components/DesktopSidebar'
import DesktopTopBar from '@/components/DesktopTopBar'
import DesktopProposalsList from '@/components/DesktopProposalsList'

type Filter = 'All' | 'Active' | 'Executed' | 'Rejected' | 'Expired'
const FILTERS: Filter[] = ['All', 'Active', 'Executed', 'Rejected', 'Expired']

export default function FacultyProposalsPage() {
  const { university } = useParams() as { university: string }
  const wallet = useWallet()
  const searchParams = useSearchParams()
  const initialFilter = (searchParams.get('filter') || 'all')
  const [treasury,    setTreasury]    = useState<any>(null)
  const [proposals,   setProposals]   = useState<any[]>([])
  const [facultyName, setFacultyName] = useState<string | null>(null)
  const [loading,     setLoading]     = useState(true)
  const [filter,      setFilter]      = useState<Filter>(
    (FILTERS.find(f => f.toLowerCase() === initialFilter.toLowerCase()) || 'All')
  )

  async function load() {
    const t = await fetchTreasury(university)
    if (!t) { setLoading(false); return }
    setTreasury(t)
    const count = typeof t.proposalCount?.toNumber === 'function'
      ? t.proposalCount.toNumber() : Number(t.proposalCount)
    const p = await fetchAllProposals(t.pda, count)
    setProposals(p)
    setLoading(false)

    const req = await fetchFacultyBySlug(university)
    setFacultyName(req?.department ?? null)
  }

  useEffect(() => {
    load()
    const iv = setInterval(load, 15000)
    return () => clearInterval(iv)
  }, [university])

  const displayName = facultyName || university
  const isExec = treasury?.signers?.some((s: any) => s.toString() === wallet.publicKey?.toString())
  const isAdminWallet = wallet.publicKey?.toString() === ADMIN_KEY
  const isAuthorized = Boolean(wallet.publicKey && (isAdminWallet || isExec))

  const filtered = filter === 'All'
    ? proposals
    : proposals.filter(
        p => Object.keys(p.status)[0].toLowerCase() === filter.toLowerCase()
      )

  const desktopFilter = filter.toLowerCase() as 'all' | 'active' | 'executed' | 'rejected' | 'expired'

  return (
    <>
      <div className="xl:hidden">
        <main className="min-h-screen bg-ink pb-16">
          <header className="sticky top-0 z-40 bg-ink border-b border-rule px-6 py-4">
            <Link href={`/${university}`} className="font-data text-ghost text-xs">
              ← {displayName.toUpperCase()}
            </Link>
          </header>

          <section className="px-6 pt-6 pb-4 border-b border-rule">
            <h1 className="font-display text-2xl font-bold text-ledger">Proposals</h1>
            <p className="text-body text-xs mt-1">All spending requests for {displayName}</p>
          </section>

          <section className="px-6 pt-4 pb-3 flex gap-2 overflow-x-auto border-b border-rule no-scrollbar">
            {FILTERS.map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`font-data text-xs px-3 py-1.5 border shrink-0 transition-colors ${
                  filter === f
                    ? 'border-uniben text-uniben bg-ink'
                    : 'border-rule text-ghost hover:border-ghost'
                }`}
              >
                {f.toUpperCase()}
              </button>
            ))}
          </section>

          <section className="px-6 pt-2 pb-28">
            {loading ? (
              <p className="font-data text-ghost text-xs py-8">Loading proposals...</p>
            ) : filtered.length === 0 ? (
              <EmptyState filter={filter.toLowerCase()} university={university} />
            ) : (
              filtered.map(p => (
                <ProposalCard
                  key={p.index}
                  proposal={p}
                  university={university}
                  signers={treasury?.signers}
                />
              ))
            )}
          </section>

          <BottomNav university={university} activeTab="proposals" isAuthorized={isAuthorized} />
        </main>
      </div>

      <div className="hidden xl:flex min-h-screen bg-ink">
        <DesktopSidebar university={university} isAuthorized={isAuthorized} />
        <div className="flex-1 flex flex-col">
          <DesktopTopBar universityName={displayName} />
          <DesktopProposalsList
            university={university}
            proposals={filtered}
            loading={loading}
            filter={desktopFilter}
            onFilterChange={(f) => setFilter((FILTERS.find(x => x.toLowerCase() === f) || 'All'))}
            threshold={treasury?.threshold}
          />
        </div>
      </div>
    </>
  )
}
