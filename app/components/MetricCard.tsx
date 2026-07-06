interface Props {
  label: string
  value: string | number
  highlight?: boolean
}

export default function MetricCard({ label, value, highlight = false }: Props) {
  return (
    <div className="border border-rule p-4 bg-paper">
      <p className="font-data text-body text-xs mb-2">{label}</p>
      <p className={`font-data text-lg font-bold ${highlight ? "text-uniben" : "text-ledger"}`}>
        {value}
      </p>
    </div>
  )
}
