'use client'

interface Props {
  university: string
  treasury: any
  loading: boolean
}

export default function DesktopSettingsView({ university, treasury, loading }: Props) {
  if (loading) {
    return <div className="p-8 font-data text-ghost text-xs">Loading settings...</div>
  }
  if (!treasury) {
    return (
      <div className="p-8">
        <p className="font-display text-xl text-ledger mb-2">Treasury Not Found</p>
        <p className="text-body text-sm">This treasury has not been initialized on-chain yet.</p>
      </div>
    )
  }

  const rows = [
    { label: 'University Slug', value: university },
    { label: 'Signature Threshold', value: treasury.threshold + ' of ' + treasury.signers.length },
    { label: 'Treasury Address', value: treasury.pda.toString() },
    { label: 'Registered Signers', value: treasury.signers.length + ' wallets' },
  ]

  return (
    <div className="p-8 max-w-3xl">
      <h1 className="font-display font-bold text-ledger text-3xl mb-1">Settings</h1>
      <p className="text-body text-sm mb-8">
        Configured when the treasury was initialized on-chain. This interface has no way to change
        these values — the smart contract has no update instruction for them.
      </p>
      <div className="border border-rule bg-paper">
        {rows.map((r) => (
          <div key={r.label} className="flex items-center justify-between px-5 py-4 border-b border-rule last:border-b-0">
            <p className="font-data text-ghost text-xs tracking-widest uppercase">{r.label}</p>
            <p className="font-data text-ledger text-sm break-all text-right ml-6">{r.value}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
