'use client'

import StatusBadge from './StatusBadge'
import { formatUSDC, abbreviate } from '@/lib/anchor'
import { CATEGORY_LABELS } from '@/lib/constants'

function fmtTimestamp(ts: any): string {
  const s = typeof ts?.toNumber === 'function' ? ts.toNumber() : Number(ts)
  if (isNaN(s)) return '—'
  return new Date(s * 1000).toLocaleDateString('en-NG', {
    day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit',
  })
}

interface Props {
  id: string
  proposal: any
  treasury: any
  loading: boolean
}

export default function DesktopProposalDetail({ id, proposal, treasury, loading }: Props) {
  if (loading) {
    return <div className="p-8 font-data text-ghost text-xs">Loading proposal...</div>
  }
  if (!proposal) {
    return (
      <div className="p-8">
        <p className="font-display text-xl text-ledger mb-2">Proposal Not Found</p>
        <p className="text-body text-sm">This proposal does not exist or has been removed.</p>
      </div>
    )
  }

  const status = Object.keys(proposal.status)[0]
  const category = Object.keys(proposal.category)[0]

  return (
    <div className="p-8 max-w-5xl">
      <div className="flex items-start justify-between mb-8">
        <div>
          <p className="font-data text-ghost text-[10px] tracking-widest uppercase mb-2">
            Proposal #{id} · {CATEGORY_LABELS[category] || category}
          </p>
          <h1 className="font-display font-bold text-ledger text-3xl mb-2">{proposal.description}</h1>
        </div>
        <StatusBadge status={status} />
      </div>

      <div className="grid grid-cols-3 gap-6 mb-10 border border-rule bg-paper p-6">
        <div>
          <p className="font-data text-ghost text-[10px] tracking-widest uppercase mb-1">Amount</p>
          <p className="font-data text-ledger text-xl font-bold">${formatUSDC(proposal.amount)} USDC</p>
        </div>
        <div>
          <p className="font-data text-ghost text-[10px] tracking-widest uppercase mb-1">Requester</p>
          <p className="font-data text-ledger text-sm">{abbreviate(proposal.proposer?.toString())}</p>
        </div>
        <div>
          <p className="font-data text-ghost text-[10px] tracking-widest uppercase mb-1">Payee</p>
          <p className="font-data text-ledger text-sm">{abbreviate(proposal.recipient?.toString())}</p>
        </div>
      </div>

      <div className="mb-10">
        <p className="font-data text-ghost text-xs tracking-widest uppercase mb-4">
          Signatures ({proposal.signaturesFor} / 5)
        </p>
        <div className="grid grid-cols-5 gap-3">
          {treasury?.signers?.map((signer: any, i: number) => {
            const votedFor = proposal.signedBy?.[i]
            const votedAgainst = proposal.votedAgainst?.[i]
            const title = 'Signer ' + (i + 1)
            return (
              <div
                key={i}
                className={
                  'border p-4 flex flex-col items-center text-center gap-2 ' +
                  (votedFor ? 'border-nigerian' : 'border-rule')
                }
              >
                <span className={
                  'w-9 h-9 flex items-center justify-center border rounded-full ' +
                  (votedFor ? 'border-nigerian text-nigerian' : votedAgainst ? 'border-void text-void' : 'border-rule text-ghost')
                }>
                  {votedFor ? '✓' : votedAgainst ? '✗' : '○'}
                </span>
                <p className="font-data text-ledger text-xs">{title}</p>
                <p className={
                  'font-data text-[10px] ' +
                  (votedFor ? 'text-nigerian' : votedAgainst ? 'text-void' : 'text-ghost')
                }>
                  {votedFor ? 'SIGNED' : votedAgainst ? 'REJECTED' : 'PENDING'}
                </p>
              </div>
            )
          })}
        </div>
      </div>

      <div>
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
              <p className="font-data text-nigerian text-xs">
                {proposal.signaturesFor} Signature{proposal.signaturesFor > 1 ? 's' : ''} Received
              </p>
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
      </div>
    </div>
  )
}
