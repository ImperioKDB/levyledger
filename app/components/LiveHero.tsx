'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { fetchApprovedUnibenFaculties } from '@/lib/supabase'
import { fetchTreasury } from '@/lib/queries'
import { formatUSDC } from '@/lib/anchor'

interface FacultyRow {
  slug: string
  department: string
  balance: number
  proposals: number
  live: boolean
}

export default function LiveHero() {
  const [rows, setRows]                   = useState<FacultyRow[]>([])
  const [approvedCount, setApprovedCount] = useState(0)
  const [loading, setLoading]             = useState(true)

  async function load() {
    const requests = await fetchApprovedUnibenFaculties()
    setApprovedCount(requests.length)

    const results = await Promise.all(
      requests.map(async (req) => {
        const t = await fetchTreasury(req.slug)
        if (!t) return { slug: req.slug, department: req.department, balance: 0, proposals: 0, live: false }
        const balance = typeof t.availableBalance?.toNumber === 'function'
          ? t.availableBalance.toNumber() : Number(t.availableBalance)
        const proposals = typeof t.proposalCount?.toNumber === 'function'
          ? t.proposalCount.toNumber() : Number(t.proposalCount)
        return { slug: req.slug, department: req.department, balance, proposals, live: true }
      })
    )

    results.sort((a, b) => (b.live ? b.balance : -1) - (a.live ? a.balance : -1))
    setRows(results)
    setLoading(false)
  }

  useEffect(() => {
    load()
    const iv = setInterval(load, 15000)
    return () => clearInterval(iv)
  }, [])

  const liveRows       = rows.filter(r => r.live)
  const liveCount      = liveRows.length
  const totalBalance   = liveRows.reduce((sum, r) => sum + r.balance, 0)
  const totalProposals = liveRows.reduce((sum, r) => sum + r.proposals, 0)

  // ── Loading ──────────────────────────────────────────────────────────────
  if (loading) return (
    <div className="space-y-4 animate-pulse">
      <div className="h-3 bg-paper w-32" />
      <div className="h-12 bg-paper w-48" />
      <div className="h-3 bg-paper w-24" />
    </div>
  )

  // ── No faculties live yet — designed, not an error ───────────────────────
  if (liveCount === 0) return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <p className="font-data text-ghost text-xs tracking-widest uppercase">
          UNIBEN Faculty Treasuries
        </p>
        <span className="font-data text-xs text-ghost border border-rule px-2 py-0.5">
          NOT LIVE
        </span>
      </div>

      <p className="font-data font-bold text-rule leading-none mb-3"
        style={{ fontSize: 'clamp(3rem, 14vw, 5rem)' }}>
        $0.00
      </p>
      <p className="text-ghost text-sm mb-6">
        {approvedCount === 0
          ? 'The combined balance across all UNIBEN faculties will appear here once faculties are registered and initialized.'
          : `${approvedCount} ${approvedCount === 1 ? 'faculty has' : 'faculties have'} been approved and are awaiting on-chain initialization.`}
      </p>

      <p className="font-data text-ghost text-xs tracking-widest uppercase mb-3">
        Preview
      </p>
      {[
        { label: 'Welfare payment', amount: '$500.00', status: 'EXECUTED' },
        { label: 'Event logistics', amount: '$120.00', status: 'ACTIVE'   },
        { label: 'Equipment',       amount: '$800.00', status: 'REJECTED' },
      ].map((row, i) => (
        <div key={i} className="border-t border-rule py-3 flex items-center justify-between opacity-30">
          <div>
            <p className="font-data text-ledger text-sm font-bold">{row.amount} USDC</p>
            <p className="text-ghost text-xs">{row.label}</p>
          </div>
          <span className={`font-data text-xs ${
            row.status === 'EXECUTED' ? 'text-nigerian' :
            row.status === 'ACTIVE'   ? 'text-uniben'   : 'text-void'
          }`}>
            {row.status}
          </span>
        </div>
      ))}
      <Link
        href="/register"
        className="font-data text-xs text-ghost border-t border-rule pt-4 mt-1 block hover:text-uniben transition-colors"
      >
        Register your faculty →
      </Link>
    </div>
  )

  // ── Aggregate live ───────────────────────────────────────────────────────
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <p className="font-data text-ghost text-xs tracking-widest uppercase">
          UNIBEN Faculties · Live
        </p>
        <span className="font-data text-xs text-nigerian border border-nigerian px-2 py-0.5">
          ON-CHAIN
        </span>
      </div>

      <p className="font-data font-bold text-uniben leading-none mb-2"
        style={{ fontSize: 'clamp(3rem, 14vw, 5rem)' }}>
        ${formatUSDC(totalBalance)}
      </p>
      <p className="font-data text-ghost text-sm mb-6">
        USDC · Across {liveCount} of {approvedCount} faculties
      </p>

      <div className="flex gap-6 mb-8 border-b border-rule pb-6">
        <div>
          <p className="font-data text-ghost text-xs mb-1">Faculties Live</p>
          <p className="font-data text-body text-sm font-bold">{liveCount}</p>
        </div>
        <div>
          <p className="font-data text-ghost text-xs mb-1">Total Balance</p>
          <p className="font-data text-body text-sm font-bold">${formatUSDC(totalBalance)}</p>
        </div>
        <div>
          <p className="font-data text-ghost text-xs mb-1">Proposals</p>
          <p className="font-data text-body text-sm font-bold">{totalProposals}</p>
        </div>
      </div>

      <p className="font-data text-ghost text-xs tracking-widest uppercase mb-3">
        Top Faculties
      </p>
      {liveRows.slice(0, 3).map(r => (
        <Link key={r.slug} href={`/${r.slug}`}>
          <div className="border-t border-rule py-4 flex items-center justify-between group">
            <div className="min-w-0 flex-1">
              <p className="text-ledger text-sm font-semibold truncate group-hover:text-uniben transition-colors">
                {r.department}
              </p>
              <p className="text-ghost text-xs truncate mt-0.5">{r.proposals} proposals</p>
            </div>
            <p className="font-data text-ledger font-bold ml-4 shrink-0">
              ${formatUSDC(r.balance)}
            </p>
          </div>
        </Link>
      ))}

      <Link
        href="/universities"
        className="font-data text-xs text-ghost border-t border-rule pt-4 mt-1 block hover:text-uniben transition-colors"
      >
        View all faculties →
      </Link>
    </div>
  )
}
