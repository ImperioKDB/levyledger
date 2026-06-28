import { STATUS_COLORS } from '@/lib/constants'

export default function StatusBadge({ status }: { status: string }) {
  const colorClass = STATUS_COLORS[status.toLowerCase()] || 'text-ghost border-ghost'
  return (
    <span className={`font-data text-xs border px-2 py-1 tracking-widest ${colorClass}`}>
      {status.toUpperCase()}
    </span>
  )
}
