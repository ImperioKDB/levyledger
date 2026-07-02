'use client'

interface Props {
  title: string
  body: string
}

export default function EmptyState({ title, body }: Props) {
  return (
    <div className="py-16 px-6 text-center border border-rule bg-paper">
      <p className="font-data text-ghost text-xs tracking-widest uppercase mb-3">
        NO DATA
      </p>
      <p className="font-display font-semibold text-ledger text-lg mb-2">
        {title}
      </p>
      <p className="text-body text-sm leading-relaxed max-w-xs mx-auto">
        {body}
      </p>
    </div>
  )
}
