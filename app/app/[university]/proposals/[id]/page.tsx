'use client'

import { useParams } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { fetchTreasury, fetchProposal } from '@/lib/queries'
import { formatUSDC, abbreviate } from '@/lib/anchor'
import { CATEGORY_LABELS } from '@/lib/constants'
import StatusBadge from '@/components/StatusBadge'

// BN timestamps from Anchor need .toNumber() before Date conversion
function fmtTimestamp(ts: any): string {
  const s = typeof ts?.toNumber === 'function' ? ts.toNumber() : Number(ts)
  if (isNaN(s)) return '—'
  return new Date(s * 1000).toLocaleDateString('en-NG', {
    day: 'numeric', month: 'long', year: 'numeric',
  })
}

export default function ProposalPage() {
  const { university, id } = useParams() as { university: string; id: string }

  const [proposal,  setProposal]  = useState<any>(null)
  const [treasury,  setTreasury]  = useState<any>(null)
  const [loading,   setLoading]   = useState(true)

  // ── Slot animation tracking ────────────────────────────────────────────────
  // prevSignedRef: the signedBy array from the previous fetch.
  // Starts as null so the first fetch doesn't trigger animations for
  // already-signed slots (we don't want to animate history, only live changes).
  const prevSignedRef    = useRef<boolean[] | null>(null)
  const [newlySignedSlots, setNewlySignedSlots] = useState<Set<number>>(new Set())

  // ── Load + poll ───────────────────────────────────────────────────────────
  useEffect(() => {
    let cancelled = false

    async function load() {
      const t = await fetchTreasury(university)
      if (!t || cancelled) return
      setTreasury(t)
      const p = await fetchProposal(t.pda, parseInt(id))
      if (!p || cancelled) { setLoading(false); return }
      setProposal(p)
      setLoading(false)
    }

    load()
    const iv = setInterval(load, 15000)
    return () => {
      cancelled = true
      clearInterval(iv)
    }
  }, [university, id])

  // ── Detect newly signed slots ──────────────────────────────────────────────
  // Runs whenever proposal data updates. Compares new signedBy against the
  // previous snapshot. Slots that flipped true get the slot-signed animation.
  useEffect(() => {
    if (!proposal?.signedBy) return

    const prev = prevSignedRef.current

    if (prev !== null) {
      const newly = new Set<number>()
      ;(proposal.signedBy as boolean[]).forEach((signed, i) => {
        if (signed && !prev[i]) newly.add(i)
      })
      if (newly.size > 0) {
        setNewlySignedSlots(newly)
        // Clear after animation completes (slot-sign keyframe is 300ms)
        const t = setTimeout(() => setNewlySignedSlots(new Set()), 350)
        return () => clearTimeout(t)
      }
    }

    // Always advance the ref to the current state
    prevSignedRef.current = [...(proposal.signedBy as boolean[])]
  }, [proposal])

  // ── Render states ──────────────────────────────────────────────────────────
  if (loading) return (
    <main className="min-h-screen bg-ink px-6 pt-12">
      <p className="font-data text-ghost text-sm animate-pulse">Loading...</p>
    </main>
  )

  if (!proposal) return (
    <main className="min-h-screen bg-ink px-6 pt-12">
      <Link href={`/${university}`} className="font-data text-ghost text-xs">
        ← Back
      </Link>
      <p className="font-display text-2xl font-bold text-ledger mt-8">
        Proposal not found
      </p>
    </main>
  )

  const status   = Object.keys(proposal.status)[0]   as string
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
          <p className="text-ledger text-sm leading-relaxed">
            {proposal.description}
          </p>
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
          Signatures — {proposal.signaturesFor}/{treasury?.threshold || 3} required
        </p>
        <div className="space-y-4">
          {signers.map((signer: any, i: number) => {
            const votedFor     = proposal.signedBy?.[i]     as boolean
            const votedAgainst = proposal.votedAgainst?.[i] as boolean
            // slot-signed animation fires only if this slot JUST became signed
            const isNew        = newlySignedSlots.has(i)

            return (
              <div key={i} className="flex items-center gap-4">
                {/* Slot indicator */}
                <span className={`font-data text-base w-4 leading-none ${
                  votedFor
                    ? 'text-nigerian'
                    : votedAgainst ? 'text-void' : 'text-ghost'
                }`}>
                  {votedFor ? '●' : votedAgainst ? '✗' : '○'}
                </span>

                {/* Wallet address — lights up and animates only when newly signed */}
                <span className={`font-data text-xs flex-1 ${
                  votedFor
                    ? `text-nigerian${isNew ? ' slot-signed' : ''}`
                    : 'text-ghost'
                }`}>
                  {abbreviate(signer.toString())}
                </span>

                {/* Status label */}
                <span className={`font-data text-xs ${
                  votedFor
                    ? 'text-nigerian'
                    : votedAgainst ? 'text-void' : 'text-ghost'
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
