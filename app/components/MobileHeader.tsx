'use client'

import Link from 'next/link'
import { useWallet } from '@solana/wallet-adapter-react'
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui'
import { ADMIN_KEY } from '@/lib/constants'
import RoleBadge from './RoleBadge'

export default function MobileHeader() {
  const wallet = useWallet()
  const isAdmin = wallet.publicKey?.toString() === ADMIN_KEY

  return (
    <header className="fixed top-0 left-0 right-0 z-40 bg-ink border-b border-rule px-4 py-3 flex items-center justify-between gap-2">
      <Link href="/" className="font-data text-ghost text-xs shrink-0">← LEVYLEDGER</Link>
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
        <RoleBadge connected={!!wallet.publicKey} isAdmin={isAdmin} isExec={false} />
        <span className="font-data text-ghost text-xs px-2 py-1 border border-rule shrink-0">DEVNET</span>
        <div className="shrink-0">
          <WalletMultiButton />
        </div>
      </div>
    </header>
  )
}
