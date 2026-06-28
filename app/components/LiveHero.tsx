'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { fetchTreasury, fetchAllProposals } from '@/lib/queries'
import { formatUSDC } from '@/lib/anchor'
import { STATUS_COLORS } from '@/lib/constants'

const SLUG = 'uniben'

export default function LiveHero() {
  const [treasury,   setTreasury]   = useState<any>(null)
  const [proposals,  setProposals]  = useState<any[]>([])
  const [loading,    setLoading]    = useState(true)
  const [noTreasury, setNoTreasury] = useState(false)

  async function load() {
    const t = await fetchTreasury(SLUG)
    if (!t) { setNoTreasury(true); setLoading(false); return }
    setTreasury(t)
    const count = typeof t.proposalCount?.toNumber === 'function'
      ? t.proposalCount.toNumber() : Number(t.proposalCount)
    const all = await fetchAllProposals(t.pda, count)
    setProposals(all.slice(0, 3))
    setLoading(false)
  }

  useEffect(() => {
    load()
    const iv = setInterval(load, 15000)
    return () => clearInterval(iv)
  }, [])

  // ── Loading ──────────────────────────────────────────────────────────────
  if (loading) return (
    <div className="space-y-4 animate-pulse">
      <div className="h-3 bg-paper w-32" />
      <div className="h-12 bg-paper w-48" />
      <div className="h-3 bg-paper w-24" />
    </div>
  )

  // ── Not initialized — designed, not an error ─────────────────────────────
  if (noTreasury) return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <p className="font-data text-ghost text-xs tracking-widest uppercase">
          UNIBEN Student Union Treasury
        </p>
        <span className="font-data text-xs text-ghost border border-rule px-2 py-0.5">
          NOT LIVE
        </span>
      </div>

      {/* Ghosted balance — shows what will appear once live */}
      <p className="font-data font-bold text-rule leading-none mb-3"
        style={{ fontSize: 'clamp(3rem, 14vw, 5rem)' }}>
        $0.00
      </p>
      <p className="text-ghost text-sm mb-6">
        This treasury will show the real-time USDC vault balance once initialized.
      </p>

      {/* Preview of what recent activity looks like */}
      <p className="font-data text-ghost text-xs tracking-widest uppercase mb-3">
        Recent Activity
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
      <p className="font-data text-ghost text-xs mt-4 border-t border-rule pt-4">
        Preview only — data above is illustrative
      </p>
    </div>
  )

  // ── Treasury live ────────────────────────────────────────────────────────
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <p className="font-data text-ghost text-xs tracking-widest uppercase">
          UNIBEN Student Union · Live
        </p>
        <span className="font-data text-xs text-nigerian border border-nigerian px-2 py-0.5">
          ON-CHAIN
        </span>
      </div>

      {/* Balance — centerpiece */}
      <p className="font-data font-bold text-uniben leading-none mb-2"
        style={{ fontSize: 'clamp(3rem, 14vw, 5rem)' }}>
        ${formatUSDC(treasury.availableBalance)}
      </p>
      <p className="font-data text-ghost text-sm mb-6">USDC · Available in vault</p>

      {/* Secondary stats */}
      <div className="flex gap-6 mb-8 border-b border-rule pb-6">
        <div>
          <p className="font-data text-ghost text-xs mb-1">Total Deposited</p>
          <p className="font-data text-body text-sm font-bold">
            ${formatUSDC(treasury.totalDeposited)}
          </p>
        </div>
        <div>
          <p className="font-data text-ghost text-xs mb-1">Total Spent</p>
          <p className="font-data text-body text-sm font-bold">
            ${formatUSDC(treasury.totalSpent)}
          </p>
        </div>
        <div>
          <p className="font-data text-ghost text-xs mb-1">Proposals</p>
          <p className="font-data text-body text-sm font-bold">
            {typeof treasury.proposalCount?.toNumber === 'function'
              ? treasury.proposalCount.toNumber()
              : Number(treasury.proposalCount)}
          </p>
        </div>
      </div>

      {/* Recent activity */}
      <p className="font-data text-ghost text-xs tracking-widest uppercase mb-3">
        Recent Activity
      </p>
      {proposals.length === 0 ? (
        <p className="font-data text-ghost text-sm border-t border-rule pt-4">
          No proposals yet.
        </p>
      ) : (
        proposals.map(p => {
          const status = Object.keys(p.status)[0] as string
          const textColor = (STATUS_COLORS[status.toLowerCase()] || 'text-ghost').split(' ')[0]
          return (
            <Link key={p.index} href={`/uniben/proposals/${p.index}`}>
              <div className="border-t border-rule py-4 flex items-center justify-between group">
                <div className="min-w-0 flex-1">
                  <p className="font-data text-ledger font-bold">
                    ${formatUSDC(p.amount)}
                    <span className="text-ghost text-xs ml-2 font-normal">USDC</span>
                  </p>
                  <p className="text-ghost text-xs truncate mt-0.5 group-hover:text-body transition-colors">
                    {p.description}
                  </p>
                </div>
                <span className={`font-data text-xs ml-4 shrink-0 ${textColor}`}>
                  {status.toUpperCase()}
                </span>
              </div>
            </Link>
          )
        })
      )}
      <Link
        href="/uniben"
        className="font-data text-xs text-ghost border-t border-rule pt-4 mt-1 block hover:text-uniben transition-colors"
      >
        View full treasury →
      </Link>
    </div>
  )
}
