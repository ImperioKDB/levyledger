'use client'

const STATUS_STYLES: Record<string, string> = {
  active:   'text-pending border-pending',
  pending:  'text-pending border-pending',
  approved: 'text-nigerian border-nigerian',
  executed: 'text-nigerian border-nigerian',
  rejected: 'text-void border-void',
  expired:  'text-ghost border-ghost',
}

export default function StatusBadge({ status }: { status: string }) {
  const style = STATUS_STYLES[status.toLowerCase()] || 'text-ghost border-ghost'
  return (
    <span className={`font-data text-[10px] border px-2 py-1 tracking-widest ${style}`}>
      {status.toUpperCase()}
    </span>
  )
}
