import Link from 'next/link'
import LiveHero from '@/components/LiveHero'

export default function Home() {
  return (
    <main className="min-h-screen bg-ink">

      {/* ── Header ────────────────────────────────────────────────────── */}
      <header className="border-b border-rule px-6 py-4 flex items-center justify-between">
        <span className="font-data text-ledger text-sm tracking-widest">LEVYLEDGER</span>
        <span className="font-data text-ghost text-xs px-2 py-1 border border-rule">
          DEVNET
        </span>
      </header>

      {/* ── Live hero — the product explains itself ──────────────────── */}
      <section className="px-6 pt-10 pb-10 border-b border-rule">
        <LiveHero />
      </section>

      {/* ── What this is — one sentence, below the fold ──────────────── */}
      <section className="px-6 pt-8 pb-6 border-b border-rule">
        <p className="font-data text-nigerian text-xs tracking-widest uppercase mb-4">
          On-Chain Treasury Protocol · Solana
        </p>
        <h1 className="font-display text-3xl font-bold text-ledger leading-snug mb-4">
          Student union funds.<br />
          Permanent. Public.<br />
          Uncensorable.
        </h1>
        <p className="text-ghost text-sm max-w-sm leading-relaxed">
          Every levy collected, every proposal approved, every payment made —
          permanently recorded on Solana. No hiding. No deleting. No excuses.
        </p>
      </section>

      {/* ── How it works ─────────────────────────────────────────────── */}
      <section className="px-6 pt-10 pb-24">
        <p className="font-data text-ghost text-xs tracking-widest uppercase mb-10">
          How It Works
        </p>
        <div className="space-y-10">
          {([
            {
              n: '01',
              title: 'Exco deposits levy funds',
              body:  'Executives deposit collected USDC into an on-chain vault. Every deposit is permanent and publicly visible.',
            },
            {
              n: '02',
              title: 'Proposals require 3-of-5 approval',
              body:  'Any expenditure must be proposed on-chain. Three of the five executives must approve before a single naira moves.',
            },
            {
              n: '03',
              title: 'Payments execute automatically',
              body:  'The moment the third signature lands, the smart contract transfers USDC to the recipient. No human middleman.',
            },
            {
              n: '04',
              title: 'Students verify everything',
              body:  'Any student opens this dashboard without a wallet and sees the complete financial history of their union.',
            },
          ] as const).map((step) => (
            <div key={step.n} className="flex gap-6">
              <span className="font-data text-rule text-3xl font-bold shrink-0 leading-none">
                {step.n}
              </span>
              <div>
                <p className="font-display font-semibold text-ledger mb-2">
                  {step.title}
                </p>
                <p className="text-ghost text-sm leading-relaxed">{step.body}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

    </main>
  )
}
