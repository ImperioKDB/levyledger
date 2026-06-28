'use client'

import { useParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { fetchTreasury, fetchProposal } from '@/lib/queries'
import { formatUSDC, abbreviate } from '@/lib/anchor'
import { CATEGORY_LABELS } from '@/lib/constants'
import StatusBadge from '@/components/StatusBadge'

// FIX: handle Anchor BN objects — same pattern as formatUSDC in anchor.ts.
// BN objects have a .toNumber() method; plain numbers do not.
function fmtTimestamp(ts: any): string {
  const seconds = typeof ts?.toNumber === 'function' ? ts.toNumber() : Number(ts)
  if (isNaN(seconds)) return '—'
  return new Date(seconds * 1000).toLocaleDateString('en-NG', {
    day: 'numeric', month: 'long', year: 'numeric',
  })
}

export default function ProposalPage() {
  const { university, id } = useParams() as { university: string; id: string }
  const [proposal, setProposal] = useState<any>(null)
  const [treasury, setTreasury] = useState<any>(null)
  const [loading, setLoading]   = useState(true)

  useEffect(() => {
    async function load() {
      const t = await fetchTreasury(university)
      if (!t) { setLoading(false); return }
      setTreasury(t)
      const p = await fetchProposal(t.pda, parseInt(id))
      setProposal(p)
      setLoading(false)
    }
    load()
  }, [university, id])

  if (loading) return (
    <main className="min-h-screen bg-ink px-6 pt-12">
      <p className="font-data text-ghost text-sm">Loading...</p>
    </main>
  )

  if (!proposal) return (
    <main className="min-h-screen bg-ink px-6 pt-12">
      <Link href={`/${university}`} className="font-data text-ghost text-xs">← Back</Link>
      <p className="font-display text-2xl font-bold text-ledger mt-8">
        Proposal not found
      </p>
    </main>
  )

  const status   = Object.keys(proposal.status)[0] as string
  const category = Object.keys(proposal.category)[0] as string
  const signers  = treasury?.signers || []

  return (
    <main className="min-h-screen bg-ink">
      <header className="border-b border-rule px-6 py-4">
        <Link href={`/${university}`} className="font-data text-ghost text-xs">
          ← {university.toUpperCase()} Treasury
        </Link>
      </header>

      {/* ── Amount hero ─────────────────────────────────────────────────── */}
      <section className="px-6 pt-8 pb-6 border-b border-rule">
        <p className="font-data text-ghost text-xs mb-4">Proposal #{id}</p>
        <p className="font-data text-5xl font-bold text-ledger mb-2">
          ${formatUSDC(proposal.amount)}
        </p>
        <p className="font-data text-ghost text-sm mb-5">USDC</p>
        <StatusBadge status={status} />
      </section>

      {/* ── Metadata ────────────────────────────────────────────────────── */}
      <section className="px-6 py-6 border-b border-rule space-y-5">
        <div>
          <p className="font-data text-ghost text-xs mb-1">Description</p>
          <p className="text-ledger text-sm leading-relaxed">{proposal.description}</p>
        </div>
        <div>
          <p className="font-data text-ghost text-xs mb-1">Category</p>
          <p className="font-data text-ledger text-sm">
            {CATEGORY_LABELS[category] || category}
          </p>
        </div>
        <div>
          <p className="font-data text-ghost text-xs mb-1">Recipient</p>
          <p className="font-data text-ledger text-xs break-all">
            {proposal.recipient?.toString()}
          </p>
        </div>
        <div>
          <p className="font-data text-ghost text-xs mb-1">Proposed by</p>
          <p className="font-data text-ledger text-sm">
            {abbreviate(proposal.proposer?.toString())}
          </p>
        </div>
      </section>

      {/* ── Signature tracker ───────────────────────────────────────────── */}
      <section className="px-6 py-6 border-b border-rule">
        <p className="font-data text-ghost text-xs mb-5">
          Signatures — {proposal.signaturesFor}/{treasury?.threshold || 3} required to execute
        </p>
        <div className="space-y-4">
          {signers.map((signer: any, i: number) => {
            const votedFor     = proposal.signedBy?.[i]
            const votedAgainst = proposal.votedAgainst?.[i]
            return (
              <div key={i} className="flex items-center gap-4">
                <span className={`font-data text-base w-4 leading-none ${
                  votedFor ? 'text-nigerian' : votedAgainst ? 'text-void' : 'text-ghost'
                }`}>
                  {votedFor ? '●' : votedAgainst ? '✗' : '○'}
                </span>
                <span className={`font-data text-xs flex-1 ${
                  votedFor ? 'text-nigerian slot-signed' : 'text-ghost'
                }`}>
                  {abbreviate(signer.toString())}
                </span>
                <span className={`font-data text-xs ${
                  votedFor ? 'text-nigerian' : votedAgainst ? 'text-void' : 'text-ghost'
                }`}>
                  {votedFor ? 'SIGNED' : votedAgainst ? 'REJECTED' : 'PENDING'}
                </span>
              </div>
            )
          })}
        </div>
      </section>

      {/* ── Timeline ────────────────────────────────────────────────────── */}
      <section className="px-6 py-6">
        <p className="font-data text-ghost text-xs mb-4">Timeline</p>
        <div className="space-y-3">
          <div className="flex justify-between">
            <span className="font-data text-xs text-ghost">Created</span>
            <span className="font-data text-xs text-ledger">
              {fmtTimestamp(proposal.createdAt)}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="font-data text-xs text-ghost">
              {status === 'expired' ? 'Expired' : 'Expires'}
            </span>
            <span className="font-data text-xs text-ledger">
              {fmtTimestamp(proposal.expiresAt)}
            </span>
          </div>
        </div>
      </section>
    </main>
  )
}
