'use client'

import { useParams, useSearchParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import MobileHeader from '@/components/MobileHeader'
import BottomNav from '@/components/BottomNav'
import StatusBadge from '@/components/StatusBadge'
import VerificationBadge from '@/components/VerificationBadge'
import EmptyState from '@/components/EmptyState'
import LoadingSkeleton from '@/components/LoadingSkeleton'
import { fetchTreasury, fetchProposal } from '@/lib/queries'
import { formatUSDC, abbreviate } from '@/lib/anchor'
import { CATEGORY_LABELS } from '@/lib/constants'

function fmtTimestamp(ts: any): string {
  const s = typeof ts?.toNumber === 'function' ? ts.toNumber() : Number(ts)
  if (isNaN(s)) return '—'
  return new Date(s * 1000).toLocaleDateString('en-NG', {
    day: 'numeric', month: 'long', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

const EXEC_TITLES = ['President', 'Treasurer', 'Financial Secretary', 'General Secretary', 'Auditor']

export default function ProposalDetailPage() {
  const { id } = useParams() as { id: string }
  const searchParams = useSearchParams()
  const uniSlug = searchParams.get('treasury') || 'uniben'
  const [proposal, setProposal] = useState<any>(null)
  const [treasury, setTreasury] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const t = await fetchTreasury(uniSlug)
      if (!t) { setLoading(false); return }
      setTreasury(t)
      const p = await fetchProposal(t.pda, parseInt(id))
      setProposal(p)
      setLoading(false)
    }
    load()
  }, [uniSlug, id])

  const status = proposal ? Object.keys(proposal.status)[0] : ''
  const category = proposal ? Object.keys(proposal.category)[0] : ''

  return (
    <main className="min-h-screen bg-ink pb-24 pt-16">
      <MobileHeader />

      <section className="px-4 py-4 border-b border-rule">
        <Link href={`/proposals?treasury=${uniSlug}`} className="font-data text-ghost text-xs hover:text-ledger transition-colors">
          ← Back to Proposals
        </Link>
      </section>

      {loading ? (
        <LoadingSkeleton lines={10} />
      ) : !proposal ? (
        <div className="px-4 py-8">
          <EmptyState title="Proposal Not Found" body="This proposal does not exist or has been removed." />
        </div>
      ) : (
        <>
          {/* Header */}
          <section className="px-4 py-6 border-b border-rule">
            <div className="flex items-center justify-between mb-4">
              <StatusBadge status={status} />
              <VerificationBadge />
            </div>
            <p className="font-data text-ghost text-[10px] tracking-widest uppercase mb-2">
              Proposal #{id} · {CATEGORY_LABELS[category] || category}
            </p>
            <h1 className="font-display font-bold text-ledger text-2xl mb-4 leading-tight">
              {proposal.description}
            </h1>
            <p className="font-data text-4xl font-bold text-ledger leading-none mb-2">
              ${formatUSDC(proposal.amount)}
            </p>
            <p className="font-data text-ghost text-sm">USDC</p>
          </section>

          {/* Metadata */}
          <section className="px-4 py-6 border-b border-rule space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="font-data text-ghost text-[10px] tracking-widest uppercase mb-1">Requester</p>
                <p className="font-data text-ledger text-xs break-all">{abbreviate(proposal.proposer?.toString())}</p>
              </div>
              <div>
                <p className="font-data text-ghost text-[10px] tracking-widest uppercase mb-1">Payee</p>
                <p className="font-data text-ledger text-xs break-all">{abbreviate(proposal.recipient?.toString())}</p>
              </div>
            </div>
            <div>
              <p className="font-data text-ghost text-[10px] tracking-widest uppercase mb-1">Created</p>
              <p className="font-data text-ledger text-xs">{fmtTimestamp(proposal.createdAt)}</p>
            </div>
            <div>
              <p className="font-data text-ghost text-[10px] tracking-widest uppercase mb-1">Expires</p>
              <p className="font-data text-ledger text-xs">{fmtTimestamp(proposal.expiresAt)}</p>
            </div>
          </section>

          {/* Signature Tracker */}
          <section className="px-4 py-6 border-b border-rule">
            <p className="font-data text-ghost text-xs tracking-widest uppercase mb-4">
              Signatures — {proposal.signaturesFor}/3 required
            </p>
            <div className="space-y-3">
              {treasury?.signers?.map((signer: any, i: number) => {
                const votedFor = proposal.signedBy?.[i]
                const votedAgainst = proposal.votedAgainst?.[i]
                const title = EXEC_TITLES[i] || `Exec ${i + 1}`
                return (
                  <div key={i} className="flex items-center gap-3 border border-rule p-3 bg-paper">
                    <span className={`w-8 h-8 flex items-center justify-center border ${
                      votedFor ? 'border-nigerian text-nigerian' :
                      votedAgainst ? 'border-void text-void' :
                      'border-rule text-ghost'
                    }`}>
                      {votedFor ? '✓' : votedAgainst ? '✗' : '○'}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className={`font-data text-xs ${votedFor ? 'text-nigerian' : 'text-ledger'}`}>
                        {title}
                      </p>
                      <p className="font-data text-ghost text-[10px] truncate">
                        {abbreviate(signer.toString())}
                      </p>
                    </div>
                    <span className={`font-data text-[10px] ${
                      votedFor ? 'text-nigerian' : votedAgainst ? 'text-void' : 'text-ghost'
                    }`}>
                      {votedFor ? 'SIGNED' : votedAgainst ? 'REJECTED' : 'PENDING'}
                    </span>
                  </div>
                )
              })}
            </div>
          </section>

          {/* Audit Timeline */}
          <section className="px-4 py-6">
            <p className="font-data text-ghost text-xs tracking-widest uppercase mb-4">Audit Timeline</p>
            <div className="space-y-0 border-l border-rule ml-2 pl-6">
              <div className="relative pb-6">
                <span className="absolute -left-[25px] w-3 h-3 bg-nigerian border border-ink" />
                <p className="font-data text-nigerian text-xs">Proposal Created</p>
                <p className="font-data text-ghost text-[10px]">{fmtTimestamp(proposal.createdAt)}</p>
              </div>
              {proposal.signaturesFor > 0 && (
                <div className="relative pb-6">
                  <span className="absolute -left-[25px] w-3 h-3 bg-nigerian border border-ink" />
                  <p className="font-data text-nigerian text-xs">{proposal.signaturesFor} Signature{proposal.signaturesFor > 1 ? 's' : ''} Received</p>
                </div>
              )}
              {status === 'executed' && (
                <div className="relative pb-6">
                  <span className="absolute -left-[25px] w-3 h-3 bg-nigerian border border-ink" />
                  <p className="font-data text-nigerian text-xs">Executed — Funds Transferred</p>
                </div>
              )}
              {status === 'rejected' && (
                <div className="relative pb-6">
                  <span className="absolute -left-[25px] w-3 h-3 bg-void border border-ink" />
                  <p className="font-data text-void text-xs">Rejected — Funds Returned</p>
                </div>
              )}
              {status === 'expired' && (
                <div className="relative pb-6">
                  <span className="absolute -left-[25px] w-3 h-3 bg-ghost border border-ink" />
                  <p className="font-data text-ghost text-xs">Expired — Funds Returned</p>
                </div>
              )}
            </div>
          </section>
        </>
      )}

      <BottomNav />
    </main>
  )
}
