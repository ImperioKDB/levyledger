import Link from 'next/link'
import { formatUSDC } from '@/lib/anchor'
import { CATEGORY_LABELS } from '@/lib/constants'
import StatusBadge from './StatusBadge'

interface Props {
  proposal: any
  university: string
  signers: any[]
}

export default function ProposalCard({ proposal, university, signers }: Props) {
  const status = Object.keys(proposal.status)[0] as string
  const category = Object.keys(proposal.category)[0] as string
  const isExecuted = status === 'executed'

  return (
    <Link href={`/${university}/proposals/${proposal.index}`}>
      <div className={`border-b border-border py-5 group cursor-pointer ${
        isExecuted ? 'border-l-2 border-l-accent pl-4' : ''
      }`}>
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <p className="font-mono text-2xl font-bold text-primary mb-1">
              ${formatUSDC(proposal.amount)}
              <span className="text-muted text-sm ml-2">USDC</span>
            </p>
            <p className="text-muted text-sm truncate mb-3 group-hover:text-primary transition-colors">
              {proposal.description}
            </p>
            <div className="flex items-center gap-4 flex-wrap">
              <span className="font-mono text-xs text-muted border border-border px-2 py-0.5">
                {CATEGORY_LABELS[category] || category}
              </span>
              <span className="font-mono text-xs text-muted">
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
