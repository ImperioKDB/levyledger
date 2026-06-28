'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { formatUSDC } from '@/lib/anchor'
import { CATEGORY_LABELS } from '@/lib/constants'
import StatusBadge from './StatusBadge'

interface Props {
  proposal:   any
  university: string
  signers:    any[]
}

// Maps each status to its token color value.
// When polling delivers a status change, the card border briefly
// becomes this color then fades back to var(--rule).
const STATUS_FLASH: Record<string, string> = {
  executed: 'var(--nigerian)',
  rejected: 'var(--void)',
  expired:  'var(--ghost)',
  active:   'var(--pending)',
}

export default function ProposalCard({ proposal, university, signers }: Props) {
  const status     = Object.keys(proposal.status)[0] as string
  const category   = Object.keys(proposal.category)[0] as string
  const isExecuted = status === 'executed'

  // ── Status change flash ──────────────────────────────────────────────────
  // prevStatusRef holds the status from the previous render.
  // When status changes (i.e., a poll returned a new state), we:
  //   1. Set flashColor immediately — border jumps to status color (no transition)
  //   2. Clear it after 300ms     — border fades back to default (200ms transition)
  // This gives a crisp flash-then-settle without any motion.
  const prevStatusRef = useRef<string>(status)
  const [flashColor, setFlashColor] = useState<string | null>(null)

  useEffect(() => {
    const prev = prevStatusRef.current
    if (prev && prev !== status) {
      setFlashColor(STATUS_FLASH[status] ?? null)
      const t = setTimeout(() => setFlashColor(null), 300)
      prevStatusRef.current = status
      return () => clearTimeout(t)
    }
    prevStatusRef.current = status
  }, [status])

  return (
    <Link href={`/${university}/proposals/${proposal.index}`}>
      <div
        className={`border-b py-5 group cursor-pointer ${
          isExecuted ? 'border-l-2 border-l-nigerian pl-4' : ''
        }`}
        style={{
          // Flash: instant color change, then slow fade back via transition
          borderColor: flashColor ?? undefined,
          transition:  flashColor ? 'none' : 'border-color 200ms ease-out',
        }}
      >
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            {/* Amount — largest element in the row */}
            <p className="font-data text-2xl font-bold text-ledger mb-1">
              ${formatUSDC(proposal.amount)}
              <span className="text-ghost text-sm ml-2 font-normal">USDC</span>
            </p>
            {/* Description — one line, truncated */}
            <p className="text-ghost text-sm truncate mb-3 group-hover:text-ledger transition-colors">
              {proposal.description}
            </p>
            {/* Category + signature count */}
            <div className="flex items-center gap-4 flex-wrap">
              <span className="font-data text-xs text-ghost border border-rule px-2 py-0.5">
                {CATEGORY_LABELS[category] || category}
              </span>
              <span className="font-data text-xs text-ghost">
                {proposal.signaturesFor}/{signers.length} signed
              </span>
            </div>
          </div>
          {/* Status stamp — right-aligned */}
          <div className="shrink-0">
            <StatusBadge status={status} />
          </div>
        </div>
      </div>
    </Link>
  )
}
