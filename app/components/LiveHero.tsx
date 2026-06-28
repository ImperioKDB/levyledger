'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { fetchTreasury, fetchAllProposals } from '@/lib/queries'
import { formatUSDC } from '@/lib/anchor'
import { STATUS_COLORS } from '@/lib/constants'

const SLUG = 'uniben'

function BalanceSkeleton() {
  return (
    <div className="animate-pulse space-y-3">
      <div className="h-16 bg-paper w-48" />
      <div className="h-4 bg-paper w-24" />
    </div>
  )
}

function ProposalRowSkeleton() {
  return (
    <div className="border-b border-rule py-4 animate-pulse flex justify-between items-center">
      <div className="space-y-2">
        <div className="h-4 bg-paper w-24" />
        <div className="h-3 bg-paper w-40" />
      </div>
      <div className="h-5 bg-paper w-16" />
    </div>
  )
}

export default function LiveHero() {
  const [treasury,  setTreasury]  = useState<any>(null)
  const [proposals, setProposals] = useState<any[]>([])
  const [loading,   setLoading]   = useState(true)
  const [noTreasury, setNoTreasury] = useState(false)

  async function load() {
    const t = await fetchTreasury(SLUG)
    if (!t) { setNoTreasury(true); setLoading(false); return }
    setTreasury(t)
    const count = typeof t.proposalCount?.toNumber === 'function'
      ? t.proposalCount.toNumber()
      : Number(t.proposalCount)
    const all = await fetchAllProposals(t.pda, count)
    setProposals(all.slice(0, 3))
    setLoading(false)
  }

  useEffect(() => {
    load()
    const iv = setInterval(load, 15000)
    return () => clearInterval(iv)
  }, [])

  // Treasury not yet initialized — show a coming soon state
  if (noTreasury) return (
    <div className="border border-rule p-6">
      <p className="font-data text-ghost text-xs tracking-widest uppercase mb-3">
        UNIBEN Student Union Treasury
      </p>
      <p className="font-data text-4xl font-bold text-ledger mb-2">
        Not yet initialized
      </p>
      <p className="text-ghost text-sm">
        The UNIBEN treasury has not been deployed on-chain yet.
      </p>
    </div>
  )

  return (
    <div>
      {/* ── Live balance ────────────────────────────────────────────────── */}
      <div className="mb-8">
        <p className="font-data text-ghost text-xs tracking-widest uppercase mb-4">
          UNIBEN Student Union · Live Balance
        </p>
        {loading ? (
          <BalanceSkeleton />
        ) : (
          <>
            <p className="font-data text-6xl font-bold text-ledger leading-none mb-2">
              ${formatUSDC(treasury.availableBalance)}
            </p>
            <p className="font-data text-ghost text-sm">
              USDC · Available in vault
            </p>
            <div className="flex gap-6 mt-4">
              <div>
                <p className="font-data text-ghost text-xs mb-1">Total In</p>
                <p className="font-data text-body text-sm">
                  ${formatUSDC(treasury.totalDeposited)}
                </p>
              </div>
              <div>
                <p className="font-data text-ghost text-xs mb-1">Total Out</p>
                <p className="font-data text-body text-sm">
                  ${formatUSDC(treasury.totalSpent)}
                </p>
              </div>
              <div>
                <p className="font-data text-ghost text-xs mb-1">Proposals</p>
                <p className="font-data text-body text-sm">
                  {typeof treasury.proposalCount?.toNumber === 'function'
                    ? treasury.proposalCount.toNumber()
                    : Number(treasury.proposalCount)}
                </p>
              </div>
            </div>
          </>
        )}
      </div>

      {/* ── Recent activity ─────────────────────────────────────────────── */}
      <div>
        <p className="font-data text-ghost text-xs tracking-widest uppercase mb-3">
          Recent Activity
        </p>
        {loading ? (
          <>
            <ProposalRowSkeleton />
            <ProposalRowSkeleton />
            <ProposalRowSkeleton />
          </>
        ) : proposals.length === 0 ? (
          <p className="font-data text-ghost text-sm py-4 border-t border-rule">
            No proposals yet.
          </p>
        ) : (
          proposals.map(p => {
            const status = Object.keys(p.status)[0] as string
            const colorClass = STATUS_COLORS[status.toLowerCase()] || 'text-ghost'
            // Only take the text color from the pair
            const textColor = colorClass.split(' ')[0]
            return (
              <Link key={p.index} href={`/uniben/proposals/${p.index}`}>
                <div className="border-t border-rule py-4 flex items-center justify-between group">
                  <div className="min-w-0 flex-1">
                    <p className="font-data text-ledger text-base font-bold">
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
          className="font-data text-xs text-ghost border-t border-rule pt-4 mt-1 block hover:text-nigerian transition-colors"
        >
          View full treasury →
        </Link>
      </div>
    </div>
  )
}
