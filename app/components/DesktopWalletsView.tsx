'use client'

interface WalletRow {
  label: string
  address: string
}

interface Props {
  wallets: WalletRow[]
  loading: boolean
  treasury: any
}

const EXPLORER = 'https://explorer.solana.com/address'

export default function DesktopWalletsView({ wallets, loading, treasury }: Props) {
  if (loading) {
    return <div className="p-8 font-data text-ghost text-xs">Loading wallets...</div>
  }
  if (!treasury) {
    return (
      <div className="p-8">
        <p className="font-display text-xl text-ledger mb-2">Treasury Not Found</p>
        <p className="text-body text-sm">This treasury has not been initialized on-chain yet.</p>
      </div>
    )
  }

  return (
    <div className="p-8 max-w-3xl">
      <h1 className="font-display font-bold text-ledger text-3xl mb-1">Wallets</h1>
      <p className="text-body text-sm mb-8">On-chain accounts that hold or control this treasury's funds.</p>
      <div className="space-y-3">
        {wallets.map((w) => (
          <div key={w.label} className="border border-rule bg-paper p-5 flex items-center justify-between">
            <div className="min-w-0 flex-1">
              <p className="font-data text-ghost text-[10px] tracking-widest uppercase mb-1">{w.label}</p>
              <p className="font-data text-ledger text-sm break-all">{w.address}</p>
            </div>
            <a href={EXPLORER + '/' + w.address + '?cluster=devnet'} target="_blank" rel="noopener noreferrer"
              className="font-data text-uniben text-xs ml-6 shrink-0 hover:underline">
              View →
            </a>
          </div>
        ))}
      </div>
    </div>
  )
}
