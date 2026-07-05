'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import MobileHeader from '@/components/MobileHeader'
import VerificationBadge from '@/components/VerificationBadge'
import LoadingSkeleton from '@/components/LoadingSkeleton'
import EmptyState from '@/components/EmptyState'
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

export default function FacultiesPage() {
  const [rows, setRows]       = useState<FacultyRow[]>([])
  const [loading, setLoading] = useState(true)

  async function load() {
    const requests = await fetchApprovedUnibenFaculties()

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

  useEffect(() => { load() }, [])

  return (
    <main className="min-h-screen bg-ink pb-12 pt-16">
      <MobileHeader />

      <section className="px-4 py-6 border-b border-rule">
        <h1 className="font-display font-bold text-ledger text-2xl">Faculties</h1>
        <p className="text-body text-xs mt-1">Every registered UNIBEN faculty union, live on-chain</p>
      </section>

      <section className="px-4 py-4">
        {loading ? (
          <LoadingSkeleton lines={6} />
        ) : rows.length === 0 ? (
          <EmptyState
            title="No faculties registered yet"
            body="Once a faculty union is registered and approved, it will appear here with a live on-chain balance."
          />
        ) : (
          <div className="space-y-3">
            {rows.map((r) => (
              <Link key={r.slug} href={`/${r.slug}`}>
                <div className={`border border-rule p-4 bg-paper flex items-center justify-between group ${r.live ? '' : 'opacity-50'}`}>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-display font-semibold text-ledger text-sm truncate">{r.department}</p>
                      <VerificationBadge verified={r.live} />
                    </div>
                    <p className="font-data text-ghost text-xs">
                      {r.live ? `${r.proposals} proposals` : 'Pending on-chain initialization'}
                    </p>
                  </div>
                  <div className="text-right shrink-0 ml-4">
                    <p className="font-data text-uniben text-sm font-bold">${formatUSDC(r.balance)}</p>
                    <p className="font-data text-ghost text-[10px]">USDC</p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </main>
  )
}
