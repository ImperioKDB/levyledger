import Link from 'next/link'
import LiveHero from '@/components/LiveHero'
import TextScrambler from '@/components/TextScrambler'

export default function Home() {
  return (
    <main className="min-h-screen bg-ink bg-dot-matrix">

      <header className="border-b border-rule px-6 py-4 flex items-center justify-between bg-ink/90 backdrop-blur-sm sticky top-0 z-50">
        <span className="font-data text-ledger text-sm tracking-widest font-bold">LEVYLEDGER</span>
        <div className="flex items-center gap-4">
          <Link href="/universities" className="font-data text-ghost text-xs hover:text-uniben transition-colors tracking-wider">
            FACULTIES
          </Link>
          <span className="font-data text-ghost text-xs px-2 py-1 border border-rule bg-paper">
            DEVNET
          </span>
        </div>
      </header>

      {/* Hero blueprint zone */}
      <section className="px-6 pt-16 pb-12 border-b border-rule bg-blueprint relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-t from-ink via-transparent to-transparent pointer-events-none" />
        <div className="relative z-10 max-w-4xl">
          <p className="font-data text-uniben text-xs tracking-widest uppercase mb-6 font-bold bg-uniben/10 inline-block px-3 py-1.5 border border-uniben/20">
            For campus financial transparency
          </p>
          <h1 className="font-display font-bold text-ledger leading-tight mb-8"
            style={{ fontSize: 'clamp(2.2rem, 7vw, 3.8rem)' }}>
            Every semester you pay <TextScrambler />.<br />
            Faculty dues. Student dues.<br />
            <span className="text-ghost">Where does it go?</span>
          </h1>
          <p className="text-body text-sm md:text-base leading-relaxed max-w-xl mb-8">
            Faculty student union executives in Nigerian universities collect
            millions of naira every year with zero public accountability.
            No receipts. No audits. No traceable ledgers.
            LevyLedger makes that structurally impossible by securing every dues payment on Solana.
          </p>
          <div className="flex flex-col sm:flex-row gap-3">
            <Link href="/uniben" className="inline-block text-center font-data text-xs tracking-widest py-4 px-8 bg-uniben text-ink hover:opacity-90 transition-all duration-150 active:scale-[0.98]">
              VIEW UNIBEN TREASURY →
            </Link>
            <Link href="/register" className="inline-block text-center font-data text-xs tracking-widest py-4 px-8 border border-rule text-ghost hover:border-ghost hover:text-body bg-paper/50 transition-all duration-150 active:scale-[0.98]">
              REGISTER YOUR FACULTY
            </Link>
          </div>
        </div>
      </section>

      {/* Spotlight Ledger Stream */}
      <section className="px-6 py-12 border-b border-rule bg-paper/40">
        <div className="max-w-4xl">
          <p className="font-data text-ghost text-xs tracking-widest uppercase mb-6">Live Public Ledger Stream</p>
          <LiveHero />
        </div>
      </section>

      {/* Sequential On-Chain Pipeline */}
      <section className="px-6 py-12 border-b border-rule bg-ink">
        <div className="max-w-4xl">
          <p className="font-data text-ghost text-xs tracking-widest uppercase mb-8">The Protocol Engine</p>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-0">
            {[
              { action: 'Exco collects levies', detail: 'Students pay their dues as usual. Zero friction at entry.' },
              { action: 'Funds deposited on-chain', detail: 'Naira is converted to USDC and settled into the smart contract vault PDA dynamically.' },
              { action: 'Requires 3-of-5 approval', detail: 'Three of five registered executives must sign before any funds can move.' },
              { action: 'Payment executes natively', detail: 'The moment the third signature lands, the contract transfers funds automatically.' },
              { action: 'Any student can verify', detail: 'No wallet or account required to audit. Every ledger is public, immutable, and permanent.' },
            ].map((step, i) => (
              <div key={i} className="border-t border-b md:border-b-0 border-rule md:border-r md:border-t-0 p-5 md:first:pl-0 md:last:border-r-0 md:last:pr-0">
                <span className="font-data text-ghost text-xs">{String(i + 1).padStart(2, '0')}</span>
                <p className="font-display font-semibold text-ledger text-sm mt-3 mb-2">{step.action}</p>
                <p className="text-body text-xs leading-relaxed">{step.detail}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Technical Philosophy Footer */}
      <section className="px-6 py-12 bg-paper/20">
        <div className="max-w-4xl flex flex-col md:flex-row md:items-center justify-between gap-8">
          <div className="max-w-md">
            <p className="font-display font-bold text-ledger text-xl md:text-2xl leading-snug mb-3">
              Uncensorable Public Auditing
            </p>
            <p className="text-body text-xs leading-relaxed">
              LevyLedger is built directly on Solana. No university management can edit, suppress, or delete the ledger records. The transparency is architectural, not optional.
            </p>
          </div>
          <p className="font-data text-ghost text-xs tracking-wide shrink-0">
            SOLANA DEVNET · 100% CRYPTOGRAPHIC PROOF
          </p>
        </div>
      </section>

    </main>
  )
}
