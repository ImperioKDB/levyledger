interface Props {
  filter:     string
  university: string
}

const MESSAGES: Record<string, { title: string; body: string }> = {
  all: {
    title: 'No proposals yet',
    body:  'When an exec creates a spending proposal, it will appear here.',
  },
  active: {
    title: 'No active proposals',
    body:  'All proposals have been resolved. New proposals will appear here.',
  },
  executed: {
    title: 'No executed proposals',
    body:  'Proposals that reached 3-of-5 approval and transferred USDC will appear here.',
  },
  rejected: {
    title: 'No rejected proposals',
    body:  'Proposals that were voted down by 3 or more execs will appear here.',
  },
  expired: {
    title: 'No expired proposals',
    body:  'Proposals that went 7 days without reaching threshold will appear here.',
  },
}

export default function EmptyState({ filter }: Props) {
  const msg = MESSAGES[filter.toLowerCase()] || MESSAGES.all
  return (
    <div className="py-16 px-2">
      <p className="font-data text-ghost text-xs tracking-widest uppercase mb-3">
        {filter.toUpperCase()}
      </p>
      <p className="font-display text-xl font-semibold text-ledger mb-2">
        {msg.title}
      </p>
      <p className="text-ghost text-sm leading-relaxed max-w-xs">
        {msg.body}
      </p>
    </div>
  )
}
