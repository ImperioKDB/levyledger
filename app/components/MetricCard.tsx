'use client'

interface Props {
  label: string
  value: string | number
  highlight?: boolean
}

export default function MetricCard({ label, value, highlight = false }: Props) {
  return (
    <div className="bg-paper border border-rule p-4 flex flex-col justify-between h-24">
      <p className="font-data text-ghost text-[10px] tracking-widest uppercase">
        {label}
      </p>
      <p className={`font-data text-xl font-bold leading-none ${highlight ? 'text-uniben' : 'text-ledger'}`}>
        {value}
      </p>
    </div>
  )
}
