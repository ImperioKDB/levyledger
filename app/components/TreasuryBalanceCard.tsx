'use client'

import { formatUSDC } from '@/lib/anchor'

interface Props {
  balance: number | bigint
  lastUpdated?: string
}

export default function TreasuryBalanceCard({ balance, lastUpdated }: Props) {
  return (
    <div className="bg-paper border border-rule p-6">
      <p className="font-data text-ghost text-xs tracking-widest uppercase mb-3">
        Total Treasury Balance
      </p>
      <p className="font-data text-4xl font-bold text-ledger leading-none mb-2">
        {formatUSDC(balance)} <span className="text-2xl text-ghost">USDC</span>
      </p>
      <p className="font-data text-ghost text-xs mb-4">
        ≈ ${formatUSDC(balance)} USD
      </p>
      <div className="flex items-center gap-2">
        <span className="w-2 h-2 bg-nigerian" />
        <span className="font-data text-nigerian text-xs tracking-wider">ON-CHAIN VERIFIED</span>
      </div>
      {lastUpdated && (
        <p className="font-data text-ghost text-xs mt-3">
          Last updated: {lastUpdated}
        </p>
      )}
    </div>
  )
}
