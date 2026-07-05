import Link from 'next/link'
import LiveHero from '@/components/LiveHero'

export default function Home() {
  return (
    <main className="min-h-screen bg-ink">

      <header className="border-b border-rule px-6 py-4 flex items-center justify-between">
        <span className="font-data text-ledger text-sm tracking-widest">LEVYLEDGER</span>
        <div className="flex items-center gap-4">
          <Link href="/universities" className="font-data text-ghost text-xs hover:text-uniben transition-colors">
            FACULTIES
          </Link>
          <span className="font-data text-ghost text-xs px-2 py-1 border border-rule">
            DEVNET
          </span>
        </div>
      </header>

      <section className="px-6 pt-12 pb-10 border-b border-rule">
        <p className="font-data text-uniben text-xs tracking-widest uppercase mb-8">
          Not a bank statement. Not a spreadsheet. A public record.
        </p>
        <h1 className="font-display font-bold text-ledger leading-tight mb-8"
          style={{ fontSize: 'clamp(2rem, 8vw, 3rem)' }}>
          Every semester you pay levies.<br />
          Faculty dues. Union dues.<br />
          <span className="text-ghost">Where does it go?</span>
        </h1>
        <p className="text-body text-base leading-relaxed max-w-sm mb-6">
          Faculty student union executives in Nigerian universities collect
          millions of naira every year with zero public accountability.
          No receipts. No audit. No records. The money disappears between excos.
        </p>
        <p className="font-display font-bold text-ledger text-xl leading-snug">
          LevyLedger makes that structurally impossible.
        </p>
      </section>

      <section className="px-6 pt-10 pb-10 border-b border-rule">
        <LiveHero />
      </section>

      <section className="px-6 pt-10 pb-10 border-b border-rule">
        <p className="font-data text-ghost text-xs tracking-widest uppercase mb-8">
          How It Works
        </p>
        <div className="space-y-0">
          {[
            { action: 'Exco collects levies', detail: 'Students pay their dues as usual. Nothing changes for them.' },
            { action: 'Funds deposited on-chain', detail: 'Collected naira is converted to USDC and deposited into the smart contract vault — by the exco, or directly by any student with a wallet. Every deposit is permanent and public.' },
            { action: 'Spending requires 3-of-5 approval', detail: 'Any exec can propose a payment. Three of the five registered executives must approve it before a single naira can move.' },
            { action: 'Payment executes automatically', detail: 'The moment the third signature lands, the contract transfers funds to the recipient. No human releases it. The code runs.' },
            { action: 'Any student can verify', detail: 'Every student opens this page — no wallet, no account — and sees the complete financial history of their union. Forever.' },
          ].map((step, i) => (
            <div key={i} className="flex gap-0 border-b border-rule last:border-b-0">
              <div className="w-12 shrink-0 pt-5 pb-5 pr-4 border-r border-rule">
                <span className="font-data text-ghost text-xs">{String(i + 1).padStart(2, '0')}</span>
              </div>
              <div className="flex-1 pt-5 pb-5 pl-5">
                <p className="font-display font-semibold text-ledger mb-2 text-base">{step.action}</p>
                <p className="text-body text-sm leading-relaxed">{step.detail}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="px-6 pt-10 pb-10 border-b border-rule">
        <p className="font-display font-bold text-ledger leading-snug mb-4"
          style={{ fontSize: 'clamp(1.5rem, 6vw, 2rem)' }}>
          The first time in Nigerian university history that faculty union
          finances are permanently public.
        </p>
        <p className="text-body text-sm leading-relaxed max-w-sm">
          Built on Solana. No server to shut down. No admin to delete records.
          No university authority that can suppress the transaction history.
        </p>
      </section>

      <section className="px-6 pt-8 pb-24 space-y-3">
        <Link
          href="/universities"
          className="block w-full text-center font-data text-sm tracking-widest py-4 border border-uniben text-uniben hover:bg-uniben hover:text-ink transition-colors"
        >
          VIEW ALL FACULTIES →
        </Link>
        <Link
          href="/register"
          className="block w-full text-center font-data text-sm tracking-widest py-4 border border-rule text-ghost hover:border-ghost hover:text-body transition-colors"
        >
          REGISTER YOUR FACULTY
        </Link>
        <p className="font-data text-ghost text-xs text-center pt-2">
          No wallet required to view
        </p>
      </section>

    </main>
  )
}
