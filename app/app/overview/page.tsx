'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { fetchApprovedUnibenFaculties, DepartmentRequest } from '@/lib/supabase'
import { fetchTreasury } from '@/lib/queries'
import { formatUSDC } from '@/lib/anchor'
import MetricCard from '@/components/MetricCard'

interface FacultyRow extends DepartmentRequest {
  availableBalance: number
  totalDeposited: number
  totalSpent: number
  proposalCount: number
  loadFailed: boolean
}

export default function OverviewPage() {
  const [rows, setRows] = useState<FacultyRow[]>([])
  const [loading, setLoading] = useState(true)
  const [anyFailed, setAnyFailed] = useState(false)

  useEffect(() => {
    let cancelled = false

    async function load() {
      const faculties = await fetchApprovedUnibenFaculties()

      const results = await Promise.all(
        faculties.map(async (f) => {
          const t = await fetchTreasury(f.slug)
          if (!t) {
            return {
              ...f,
              availableBalance: 0,
              totalDeposited: 0,
              totalSpent: 0,
              proposalCount: 0,
              loadFailed: true,
            }
          }
          return {
            ...f,
            availableBalance: t.availableBalance?.toNumber?.() ?? Number(t.availableBalance ?? 0),
            totalDeposited: t.totalDeposited?.toNumber?.() ?? Number(t.totalDeposited ?? 0),
            totalSpent: t.totalSpent?.toNumber?.() ?? Number(t.totalSpent ?? 0),
            proposalCount: t.proposalCount?.toNumber?.() ?? Number(t.proposalCount ?? 0),
            loadFailed: false,
          }
        })
      )

      if (cancelled) return
      setRows(results)
      setAnyFailed(results.some((r) => r.loadFailed))
      setLoading(false)
    }

    load()
    return () => { cancelled = true }
  }, [])

  const totals = rows.reduce(
    (acc, r) => ({
      availableBalance: acc.availableBalance + r.availableBalance,
      totalDeposited: acc.totalDeposited + r.totalDeposited,
      totalSpent: acc.totalSpent + r.totalSpent,
      proposalCount: acc.proposalCount + r.proposalCount,
    }),
    { availableBalance: 0, totalDeposited: 0, totalSpent: 0, proposalCount: 0 }
  )

  return (
    <main className="min-h-screen bg-ink bg-dot-matrix px-6 py-10">
      <Link href="/" className="font-data text-ghost text-xs tracking-widest mb-8 inline-block">
        &larr; LEVYLEDGER
      </Link>

      <p className="font-data text-ghost text-xs tracking-widest uppercase mb-2">
        Aggregate — every approved faculty
      </p>
      <h1 className="font-display font-bold text-ledger text-3xl mb-8">
        UNIBEN Faculties Treasury
      </h1>

      {anyFailed && !loading && (
        <div className="border border-yellow-600/40 bg-yellow-950/20 text-yellow-400 text-xs font-data px-4 py-3 mb-6">
          One or more faculty treasuries failed to load — totals below may be
          understated. Not a confirmation that any faculty has zero balance.
        </div>
      )}

      {loading ? (
        <p className="text-ghost text-sm">Loading aggregate treasury data…</p>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-4 mb-10">
            <MetricCard label="Available Balance" value={formatUSDC(totals.availableBalance)} highlight />
            <MetricCard label="Total Deposited" value={formatUSDC(totals.totalDeposited)} />
            <MetricCard label="Total Spent" value={formatUSDC(totals.totalSpent)} />
            <MetricCard label="Total Proposals" value={String(totals.proposalCount)} />
          </div>

          <p className="font-data text-ghost text-xs tracking-widest uppercase mb-4">
            By faculty ({rows.length})
          </p>
          <div className="flex flex-col gap-2">
            {rows.map((r) => (
              <Link
                key={r.slug}
                href={`/${r.slug}`}
                className="flex justify-between items-center border border-rule bg-paper/40 px-4 py-3 hover:border-ghost transition-colors"
              >
                <span className="text-body text-sm">
                  {r.department}
                  {r.loadFailed && (
                    <span className="text-yellow-500 text-xs ml-2">(failed to load)</span>
                  )}
                </span>
                <span className="font-data text-uniben text-sm">
                  {formatUSDC(r.availableBalance)}
                </span>
              </Link>
            ))}
            {rows.length === 0 && (
              <p className="text-ghost text-sm">No approved faculties yet.</p>
            )}
          </div>
        </>
      )}
    </main>
  )
}
