'use client'

import Link from 'next/link'
import LiveHero from './LiveHero'

const STEPS = [
  { title: 'Exco collects levies', body: 'Students pay their dues as usual. Nothing changes for them.' },
  { title: 'Funds deposited on-chain', body: 'Collected naira is converted to USDC and deposited into the smart contract vault.' },
  { title: 'Spending requires 3-of-5 approval', body: 'Three of five registered executives must approve before a naira moves.' },
  { title: 'Payment executes automatically', body: 'The moment the third signature lands, the contract transfers funds. No human releases it.' },
  { title: 'Any student can verify', body: 'No wallet, no account — anyone sees the complete financial history. Forever.' },
]

export default function DesktopLanding() {
  return (
    <div className="max-w-6xl mx-auto px-12 py-12">
      <header className="flex items-center justify-between pb-8 mb-12 border-b border-rule">
        <span className="font-data text-ledger text-sm tracking-widest">LEVYLEDGER</span>
        <span className="font-data text-ghost text-xs px-2 py-1 border border-rule">DEVNET</span>
      </header>

      <div className="grid grid-cols-2 gap-16 mb-16">
        <div>
          <p className="font-data text-uniben text-xs tracking-widest uppercase mb-6">For Nigerian University Students</p>
          <h1 className="font-display font-bold text-ledger text-4xl leading-tight mb-6">
            Every semester you pay levies.<br />Where does it go?
          </h1>
          <p className="text-body text-base leading-relaxed mb-6">
            Student union executives collect millions of naira every year with zero public
            accountability. LevyLedger makes that structurally impossible.
          </p>
          <Link href="/uniben" className="inline-block font-data text-sm tracking-widest py-4 px-8 border border-uniben text-uniben hover:bg-uniben hover:text-ink transition-colors">
            VIEW UNIBEN TREASURY →
          </Link>
        </div>
        <div className="border border-rule bg-paper p-6">
          <LiveHero />
        </div>
      </div>

      <div>
        <p className="font-data text-ghost text-xs tracking-widest uppercase mb-6">How It Works</p>
        <div className="grid grid-cols-5 gap-6">
          {STEPS.map((s, i) => (
            <div key={i} className="border-t border-rule pt-4">
              <span className="font-data text-ghost text-xs">{String(i + 1).padStart(2, '0')}</span>
              <p className="font-display font-semibold text-ledger text-sm mt-2 mb-2">{s.title}</p>
              <p className="text-body text-xs leading-relaxed">{s.body}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
