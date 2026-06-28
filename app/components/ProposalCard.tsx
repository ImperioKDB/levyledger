import Link from 'next/link'
import { formatUSDC } from '@/lib/anchor'
import { CATEGORY_LABELS } from '@/lib/constants'
import StatusBadge from './StatusBadge'

interface Props {
  proposal:   any
  university: string
  signers:    any[]
}

export default function ProposalCard({ proposal, university, signers }: Props) {
  const status     = Object.keys(proposal.status)[0] as string
  const category   = Object.keys(proposal.category)[0] as string
  const isExecuted = status === 'executed'

  return (
    <Link href={`/${university}/proposals/${proposal.index}`}>
      <div className={`border-b border-rule py-5 group cursor-pointer ${
        isExecuted ? 'border-l-2 border-l-nigerian pl-4' : ''
      }`}>
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <p className="font-data text-2xl font-bold text-ledger mb-1">
              ${formatUSDC(proposal.amount)}
              <span className="text-ghost text-sm ml-2">USDC</span>
            </p>
            <p className="text-ghost text-sm truncate mb-3 group-hover:text-ledger transition-colors">
              {proposal.description}
            </p>
            <div className="flex items-center gap-4 flex-wrap">
              <span className="font-data text-xs text-ghost border border-rule px-2 py-0.5">
                {CATEGORY_LABELS[category] || category}
              </span>
              <span className="font-data text-xs text-ghost">
                {proposal.signaturesFor}/{signers.length} signed
              </span>
            </div>
          </div>
          <div className="shrink-0">
            <StatusBadge status={status} />
          </div>
        </div>
      </div>
    </Link>
  )
}
