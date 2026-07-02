import Link from 'next/link'
import MobileHeader from '@/components/MobileHeader'
import BottomNav from '@/components/BottomNav'
import TreasuryBalanceCard from '@/components/TreasuryBalanceCard'
import MetricCard from '@/components/MetricCard'

const TRUST_FEATURES = [
  {
    title: 'Tamper Proof',
    body: 'All records are on-chain forever. No one can alter or delete transaction history.',
  },
  {
    title: '3-of-5 Multisig',
    body: 'No single person can move funds. Three executives must approve every spending proposal.',
  },
  {
    title: 'Public Verification',
    body: 'Anyone can verify any transaction. No wallet, no account, no permission required.',
  },
  {
    title: 'Immutable Records',
    body: 'Every deposit, proposal, and execution is permanently recorded on Solana devnet.',
  },
]

const UNIVERSITIES = [
  { name: 'University of Benin', slug: 'uniben', balance: 3248250000, proposals: 12 },
  { name: 'University of Lagos', slug: 'unilag', balance: 1850000000, proposals: 8 },
  { name: 'Ahmadu Bello University', slug: 'abu', balance: 920000000, proposals: 5 },
]

function formatUSDC(micro: number): string {
  return (micro / 1_000_000).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

export default function Home() {
  return (
    <main className="min-h-screen bg-ink pb-24 pt-16">
      <MobileHeader />

      {/* Hero */}
      <section className="px-4 py-8 border-b border-rule">
        <h1 className="font-display font-bold text-ledger text-3xl leading-tight mb-3">
          Student funds.<br />
          On-chain.<br />
          <span className="text-uniben">Always accountable.</span>
        </h1>
        <p className="text-body text-sm leading-relaxed mb-6 max-w-sm">
          Transparent treasury records for Nigerian student unions. Every naira. Every vote. Verified.
        </p>
        <Link
          href="/uniben"
          className="block w-full text-center font-data text-xs tracking-widest py-4 bg-uniben text-ink hover:opacity-90 transition-opacity mb-3"
        >
          VIEW TREASURY →
        </Link>
        <Link
          href="/proposals"
          className="block w-full text-center font-data text-xs tracking-widest py-4 border border-rule text-ghost hover:border-ghost hover:text-ledger transition-colors"
        >
          BROWSE PROPOSALS
        </Link>
      </section>

      {/* Stats */}
      <section className="px-4 py-6 border-b border-rule">
        <p className="font-data text-ghost text-xs tracking-widest uppercase mb-4">Network Overview</p>
        <div className="grid grid-cols-2 gap-3">
          <MetricCard label="Universities" value="3" />
          <MetricCard label="Total Managed" value={`$${formatUSDC(6018250000)}`} highlight />
          <MetricCard label="Proposals Executed" value="25" />
          <MetricCard label="Transparency Score" value="100%" />
        </div>
      </section>

      {/* Trust Features */}
      <section className="px-4 py-6 border-b border-rule">
        <p className="font-data text-ghost text-xs tracking-widest uppercase mb-4">How It Works</p>
        <div className="space-y-4">
          {TRUST_FEATURES.map((f, i) => (
            <div key={i} className="border border-rule p-4 bg-paper">
              <p className="font-display font-semibold text-ledger text-sm mb-1">{f.title}</p>
              <p className="text-body text-xs leading-relaxed">{f.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* University Directory */}
      <section className="px-4 py-6">
        <p className="font-data text-ghost text-xs tracking-widest uppercase mb-4">Treasuries</p>
        <div className="space-y-3">
          {UNIVERSITIES.map((u) => (
            <Link key={u.slug} href={`/${u.slug}`}>
              <div className="border border-rule p-4 bg-paper flex items-center justify-between group">
                <div>
                  <p className="font-display font-semibold text-ledger text-sm">{u.name}</p>
                  <p className="font-data text-ghost text-xs mt-1">{u.proposals} proposals</p>
                </div>
                <div className="text-right">
                  <p className="font-data text-uniben text-sm font-bold">${formatUSDC(u.balance)}</p>
                  <p className="font-data text-ghost text-[10px]">USDC</p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <BottomNav />
    </main>
  )
}
