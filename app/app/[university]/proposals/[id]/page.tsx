'use client'

import { useParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { fetchTreasury, fetchProposal } from '@/lib/queries'
import { formatUSDC, abbreviate } from '@/lib/anchor'
import { CATEGORY_LABELS } from '@/lib/constants'
import StatusBadge from '@/components/StatusBadge'

export default function ProposalPage() {
  const { university, id } = useParams() as { university: string; id: string }
  const [proposal, setProposal] = useState<any>(null)
  const [treasury, setTreasury] = useState<any>(null)
  const [loading, setLoading] = useState(true)

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
    <main className="min-h-screen bg-base px-6 pt-12">
      <p className="font-mono text-muted text-sm">Loading...</p>
    </main>
  )

  if (!proposal) return (
    <main className="min-h-screen bg-base px-6 pt-12">
      <Link href={`/${university}`} className="font-mono text-muted text-xs">← Back</Link>
      <p className="font-grotesk text-2xl font-bold text-primary mt-8">Proposal not found</p>
    </main>
  )

  const status = Object.keys(proposal.status)[0] as string
  const category = Object.keys(proposal.category)[0] as string
  const signers = treasury?.signers || []
  const fmt = (ts: any) => new Date(Number(ts) * 1000).toLocaleDateString('en-NG', {
    day: 'numeric', month: 'long', year: 'numeric'
  })

  return (
    <main className="min-h-screen bg-base">
      <header className="border-b border-border px-6 py-4">
        <Link href={`/${university}`} className="font-mono text-muted text-xs">
          ← {university.toUpperCase()} Treasury
        </Link>
      </header>

      <section className="px-6 pt-8 pb-6 border-b border-border">
        <p className="font-mono text-muted text-xs mb-4">Proposal #{id}</p>
        <p className="font-mono text-5xl font-bold text-primary mb-2">
          ${formatUSDC(proposal.amount)}
        </p>
        <p className="font-mono text-muted text-sm mb-5">USDC</p>
        <StatusBadge status={status} />
      </section>

      <section className="px-6 py-6 border-b border-border space-y-5">
        <div>
          <p className="font-mono text-muted text-xs mb-1">Description</p>
          <p className="text-primary text-sm leading-relaxed">{proposal.description}</p>
        </div>
        <div>
          <p className="font-mono text-muted text-xs mb-1">Category</p>
          <p className="font-mono text-primary text-sm">{CATEGORY_LABELS[category] || category}</p>
        </div>
        <div>
          <p className="font-mono text-muted text-xs mb-1">Recipient</p>
          <p className="font-mono text-primary text-xs break-all">{proposal.recipient?.toString()}</p>
        </div>
        <div>
          <p className="font-mono text-muted text-xs mb-1">Proposed by</p>
          <p className="font-mono text-primary text-sm">{abbreviate(proposal.proposer?.toString())}</p>
        </div>
      </section>

      <section className="px-6 py-6 border-b border-border">
        <p className="font-mono text-muted text-xs mb-5">
          Signatures — {proposal.signaturesFor}/{treasury?.threshold || 3} required to execute
        </p>
        <div className="space-y-4">
          {signers.map((signer: any, i: number) => {
            const votedFor = proposal.signedBy?.[i]
            const votedAgainst = proposal.votedAgainst?.[i]
            return (
              <div key={i} className="flex items-center gap-4">
                <span className={`font-mono text-sm w-4 ${votedFor ? 'text-accent' : votedAgainst ? 'text-danger' : 'text-border'}`}>
                  {votedFor ? '✓' : votedAgainst ? '✗' : '○'}
                </span>
                <span className="font-mono text-xs text-muted flex-1">{abbreviate(signer.toString())}</span>
                <span className={`font-mono text-xs ${votedFor ? 'text-accent' : votedAgainst ? 'text-danger' : 'text-muted'}`}>
                  {votedFor ? 'APPROVED' : votedAgainst ? 'REJECTED' : 'PENDING'}
                </span>
              </div>
            )
          })}
        </div>
      </section>

      <section className="px-6 py-6">
        <p className="font-mono text-muted text-xs mb-4">Timeline</p>
        <div className="space-y-3">
          <div className="flex justify-between">
            <span className="font-mono text-xs text-muted">Created</span>
            <span className="font-mono text-xs text-primary">{fmt(proposal.createdAt)}</span>
          </div>
          <div className="flex justify-between">
            <span className="font-mono text-xs text-muted">{status === 'expired' ? 'Expired' : 'Expires'}</span>
            <span className="font-mono text-xs text-primary">{fmt(proposal.expiresAt)}</span>
          </div>
        </div>
      </section>
    </main>
  )
}
