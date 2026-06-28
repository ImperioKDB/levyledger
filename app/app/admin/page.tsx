'use client'

import { Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui'

function AdminContent() {
  const params   = useSearchParams()
  const treasury = params.get('treasury') || ''

  return (
    <main className="min-h-screen bg-ink">
      <header className="border-b border-rule px-6 py-4 flex items-center justify-between">
        <Link href={treasury ? `/${treasury}` : '/'} className="font-data text-ghost text-xs">
          ← {treasury.toUpperCase() || 'Back'}
        </Link>
        <WalletMultiButton />
      </header>
      <section className="px-6 pt-12">
        <p className="font-data text-ghost text-xs tracking-widest uppercase mb-2">
          Exec Panel
        </p>
        <h1 className="font-display text-2xl font-bold text-ledger mb-4">
          {treasury.toUpperCase()} Admin
        </h1>
        <p className="text-body text-sm leading-relaxed max-w-sm">
          Connect your registered exec wallet to create proposals,
          sign pending proposals, and deposit USDC into the vault.
        </p>
        <div className="mt-8 border border-rule p-6">
          <p className="font-data text-ghost text-xs mb-4">
            Connect your wallet to continue
          </p>
          <WalletMultiButton />
        </div>
      </section>
    </main>
  )
}

export default function AdminPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-ink" />}>
      <AdminContent />
    </Suspense>
  )
}
