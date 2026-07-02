'use client'

import { Suspense, useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui'
import { useWallet } from '@solana/wallet-adapter-react'
import MobileHeader from '@/components/MobileHeader'
import BottomNav from '@/components/BottomNav'
import { ADMIN_KEY } from '@/lib/constants'

function AdminContent() {
  const params = useSearchParams()
  const uniSlug = params.get('treasury') || 'uniben'
  const wallet = useWallet()
  const isAdmin = wallet.publicKey?.toString() === ADMIN_KEY

  return (
    <main className="min-h-screen bg-ink pb-24 pt-16">
      <MobileHeader />

      <section className="px-4 py-6 border-b border-rule">
        <h1 className="font-display font-bold text-ledger text-2xl">Admin Panel</h1>
        <p className="text-body text-xs mt-1">{uniSlug.toUpperCase()} Treasury</p>
      </section>

      {!wallet.publicKey ? (
        <section className="px-4 py-8 space-y-4">
          <p className="text-body text-sm">Connect your wallet to access admin controls.</p>
          <WalletMultiButton />
        </section>
      ) : !isAdmin ? (
        <section className="px-4 py-8 border border-void p-4">
          <p className="font-data text-void text-xs tracking-widest uppercase mb-2">Not Authorized</p>
          <p className="text-body text-sm">This wallet is not the registered admin.</p>
          <p className="font-data text-ghost text-xs mt-2 break-all">{wallet.publicKey.toString()}</p>
        </section>
      ) : (
        <section className="px-4 py-6 space-y-4">
          <div className="border border-nigerian p-4 bg-paper">
            <p className="font-data text-nigerian text-xs tracking-widest uppercase mb-2">Admin Connected</p>
            <p className="font-data text-ledger text-xs break-all">{wallet.publicKey.toString()}</p>
          </div>

          <div className="space-y-3">
            <Link href={`/${uniSlug}`} className="block w-full text-center font-data text-xs tracking-widest py-4 border border-rule text-ledger hover:border-uniben hover:text-uniben transition-colors">
              VIEW TREASURY →
            </Link>
            <Link href={`/proposals?treasury=${uniSlug}`} className="block w-full text-center font-data text-xs tracking-widest py-4 border border-rule text-ledger hover:border-uniben hover:text-uniben transition-colors">
              MANAGE PROPOSALS →
            </Link>
            <button className="w-full font-data text-xs tracking-widest py-4 bg-uniben text-ink hover:opacity-90 transition-opacity disabled:opacity-40" disabled>
              INITIALIZE TREASURY (COMING SOON)
            </button>
          </div>
        </section>
      )}

      <BottomNav />
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
