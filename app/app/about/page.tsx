import Link from 'next/link'
import MobileHeader from '@/components/MobileHeader'

const STEPS = [
  { title: 'Exco collects levies', body: 'Students pay their dues as usual. Nothing changes for them.' },
  { title: 'Funds deposited on-chain', body: 'Collected naira is converted to USDC and deposited into the smart contract vault. Every deposit is permanent and public.' },
  { title: 'Spending requires 3-of-5 approval', body: 'Any exec can propose a payment. Three of the five registered executives must approve it before a single naira can move.' },
  { title: 'Payment executes automatically', body: 'The moment the third signature lands, the contract transfers funds to the recipient. No human releases it. The code runs.' },
  { title: 'Any student can verify', body: 'Every student opens this page — no wallet, no account — and sees the complete financial history of their union. Forever.' },
]

export default function AboutPage() {
  return (
    <main className="min-h-screen bg-ink pb-12 pt-16">
      <MobileHeader />
      <section className="px-4 py-8 md:px-16 md:py-16 max-w-3xl md:mx-auto border-b border-rule">
        <h1 className="font-display font-bold text-ledger text-2xl md:text-4xl mb-4">About LevyLedger</h1>
        <p className="text-body text-sm md:text-base leading-relaxed">
          Student union executives in Nigerian universities collect millions of naira every year with
          zero public accountability. LevyLedger makes that structurally impossible — every levy, every
          vote, on-chain and permanent.
        </p>
      </section>
      <section className="px-4 py-6 md:px-16 md:py-12 max-w-3xl md:mx-auto">
        <p className="font-data text-ghost text-xs tracking-widest uppercase mb-4">How It Works</p>
        <div className="space-y-0">
          {STEPS.map((s, i) => (
            <div key={i} className="border-b border-rule py-5 last:border-b-0">
              <p className="font-display font-semibold text-ledger text-base mb-1">{s.title}</p>
              <p className="text-body text-sm leading-relaxed">{s.body}</p>
            </div>
          ))}
        </div>
      </section>
      <section className="px-4 py-8 md:px-16 max-w-3xl md:mx-auto">
        <Link href="/universities" className="block w-full text-center font-data text-xs tracking-widest py-4 border border-uniben text-uniben hover:bg-uniben hover:text-ink transition-colors">
          VIEW ALL FACULTIES →
        </Link>
      </section>
    </main>
  )
}
