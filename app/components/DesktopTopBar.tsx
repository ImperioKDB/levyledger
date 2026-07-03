'use client'

import { WalletMultiButton } from '@solana/wallet-adapter-react-ui'

interface Props {
  universityName: string
}

export default function DesktopTopBar({ universityName }: Props) {
  return (
    <header className="h-16 border-b border-rule flex items-center justify-between px-8 bg-ink">
      <div className="flex items-center gap-2 font-data text-xs tracking-widest uppercase">
        <span className="text-ghost">University</span>
        <span className="text-ghost">/</span>
        <span className="text-ledger">{universityName}</span>
      </div>
      <WalletMultiButton />
    </header>
  )
}
