'use client'

import Link from 'next/link'
import { useWallet } from '@solana/wallet-adapter-react'
import { ADMIN_KEY } from '@/lib/constants'
import LiveHero from './LiveHero'
import RoleBadge from './RoleBadge'
import ConnectWallet from './ConnectWallet'
import WordRotator from './WordRotator'

const STEPS = [
  { title: 'Exco collects levies', body: 'Students pay their dues as usual. Nothing changes for them.' },
  { title: 'Funds deposited on-chain', body: 'Collected naira is converted to USDC and deposited into the smart contract vault.' },
  { title: 'Spending requires 3-of-5 approval', body: 'Three of five registered executives must approve before a naira moves.' },
  { title: 'Payment executes automatically', body: 'The moment the third signature lands, the contract transfers funds. No human releases it.' },
  { title: 'Any student can verify', body: 'No wallet, no account. Anyone sees the complete financial history. Forever.' },
]

export default function DesktopLanding() {
  const wallet = useWallet()
  const isAdmin = wallet.publicKey?.toString() === ADMIN_KEY

  return (
    <main id="main-content" className="min-h-[100dvh] bg-ink">
      <div className="max-w-6xl mx-auto px-12 py-10">
        <header className="flex items-center justify-between pb-6 mb-12 border-b border-rule">
          <span className="font-data text-ledger text-sm tracking-widest">LEVYLEDGER</span>
          <div className="flex items-center gap-4">
            <Link href="/universities" className="font-data text-ghost text-xs hover:text-uniben transition-colors">
              FACULTIES
            </Link>
            <Link href="/about" className="font-data text-ghost text-xs hover:text-uniben transition-colors">
              ABOUT
            </Link>
            <RoleBadge connected={!!wallet.publicKey} isAdmin={isAdmin} isExec={false} />
            <span className="font-data text-ghost text-xs px-2 py-1 border border-rule">DEVNET</span>
            <ConnectWallet />
          </div>
        </header>

        <div className="grid grid-cols-2 gap-16 mb-20 items-start">
          <div>
            <p className="font-data text-uniben text-xs tracking-widest uppercase mb-6">
              A public record, not a bank statement
            </p>
            <h1 className="font-display font-bold text-ledger text-5xl leading-[1.08] tracking-tight mb-6">
              Every semester you pay levies.<br />
              <WordRotator /><br />
              <span className="text-ghost">Where does it go?</span>
            </h1>
            <p className="text-body text-base leading-relaxed mb-8 max-w-md">
              Student union executives collect millions of naira every year with zero public
              accountability. LevyLedger makes that structurally impossible.
            </p>
            <Link
              href="/universities"
              className="inline-block font-data text-sm tracking-widest py-4 px-8 border border-uniben text-uniben hover:bg-uniben hover:text-ink active:scale-[0.98] transition-all"
            >
              VIEW ALL FACULTIES →
            </Link>
          </div>
          <div className="border border-rule bg-paper p-6">
            <LiveHero />
          </div>
        </div>

        <div>
          <p className="font-data text-ghost text-xs tracking-widest uppercase mb-6">How It Works</p>
          <div className="grid grid-cols-5 gap-6 stagger">
            {STEPS.map((s, i) => (
              <div key={i} className="border-t border-rule pt-4">
                <span className="font-data text-ghost text-xs">{String(i + 1).padStart(2, '0')}</span>
                <p className="font-display font-semibold text-ledger text-sm mt-2 mb-2">{s.title}</p>
                <p className="text-body text-xs leading-relaxed">{s.body}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="border-t border-rule mt-16 pt-8 flex items-center justify-between">
          <p className="font-data text-ghost text-xs">
            Built at UNIBEN, for UNIBEN. One naira at a time, on the record.
          </p>
          <Link href="/about" className="font-data text-xs text-uniben hover:opacity-80 transition-opacity">
            About LevyLedger →
          </Link>
        </div>
      </div>
    </main>
  )
}
