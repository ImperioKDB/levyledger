'use client'

import { useParams, useSearchParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useWallet } from '@solana/wallet-adapter-react'
import RoleBadge from '@/components/RoleBadge'
import ConnectWallet from '@/components/ConnectWallet'
import { fetchTreasury, fetchAllProposals, getLastTreasuryFetchError } from '@/lib/queries'
import { fetchFacultyBySlug } from '@/lib/supabase'
import { ADMIN_KEY } from '@/lib/constants'
import ProposalCard from '@/components/ProposalCard'
import BottomNav from '@/components/BottomNav'
import EmptyState from '@/components/EmptyState'
import LoadingSkeleton from '@/components/LoadingSkeleton'
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
  const [loadError,   setLoadError]   = useState(false)
  const [filter,      setFilter]      = useState<Filter>(
    (FILTERS.find(f => f.toLowerCase() === initialFilter.toLowerCase()) || 'All')
  )

  async function load() {
    const t = await fetchTreasury(university)
    if (!t) {
      if (getLastTreasuryFetchError()) setLoadError(true)
      setLoading(false)
      return
    }
    setLoadError(false)
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

  if (loadError) return (
    <main className="min-h-[100dvh] bg-ink">
      <header className="border-b border-rule px-6 py-4">
        <Link href="/" className="font-data text-ghost text-xs hover:text-uniben transition-colors">← LEVYLEDGER</Link>
      </header>
      <div className="px-6 pt-12 max-w-md">
        <p className="font-data text-void text-xs tracking-widest uppercase mb-4">Connection failed</p>
        <h1 className="font-display text-2xl font-bold text-ledger tracking-tight mb-3">
          Could not reach the ledger
        </h1>
        <p className="text-body text-sm max-w-xs leading-relaxed mb-6">
          The Solana RPC did not respond. The record itself is safe on-chain.
          Retry in a moment.
        </p>
        <button
          onClick={() => { setLoading(true); setLoadError(false); load() }}
          className="font-data text-xs tracking-widest py-3 px-6 border border-uniben text-uniben hover:bg-uniben hover:text-ink active:scale-[0.98] transition-all"
        >
          TRY AGAIN
        </button>
      </div>
    </main>
  )

  return (
    <>
      <div className="xl:hidden">
        <main id="main-content" className="min-h-[100dvh] bg-ink pb-16">
          <header className="sticky top-0 z-40 bg-ink border-b border-rule px-6 py-4 flex items-center justify-between gap-2">
            <Link href={`/${university}`} className="font-data text-ghost text-xs shrink-0 hover:text-uniben transition-colors">
              ← {displayName.toUpperCase()}
            </Link>
            <div className="flex items-center gap-2 shrink-0">
              <RoleBadge connected={!!wallet.publicKey} isAdmin={isAdminWallet} isExec={!!isExec} />
              <ConnectWallet />
            </div>
          </header>

          <section className="px-6 pt-6 pb-4 border-b border-rule">
            <h1 className="font-display text-2xl font-bold text-ledger tracking-tight">Proposals</h1>
            <p className="text-body text-xs mt-1">All spending requests for {displayName}</p>
          </section>

          <section className="px-6 pt-4 pb-3 flex gap-2 overflow-x-auto border-b border-rule no-scrollbar">
            {FILTERS.map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`font-data text-xs px-4 min-h-[44px] border shrink-0 transition-colors active:scale-[0.98] ${
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
              <div className="py-8"><LoadingSkeleton lines={5} /></div>
            ) : filtered.length === 0 ? (
              <EmptyState filter={filter.toLowerCase()} university={university} />
            ) : (
              <div className="stagger">
                {filtered.map(p => (
                  <ProposalCard
                    key={p.index}
                    proposal={p}
                    university={university}
                    signers={treasury?.signers}
                    threshold={treasury?.threshold || 3}
                  />
                ))}
              </div>
            )}
          </section>

          <BottomNav university={university} activeTab="proposals" isAuthorized={isAuthorized} />
        </main>
      </div>

      <div className="hidden xl:flex min-h-[100dvh] bg-ink">
        <DesktopSidebar university={university} isAuthorized={isAuthorized} />
        <div className="flex-1 flex flex-col">
          <DesktopTopBar universityName={displayName} connected={!!wallet.publicKey} isAdmin={isAdminWallet} isExec={!!isExec} />
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
