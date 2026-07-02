import Link from 'next/link'
import MobileHeader from '@/components/MobileHeader'
import BottomNav from '@/components/BottomNav'
import VerificationBadge from '@/components/VerificationBadge'

const UNIVERSITIES = [
  { name: 'University of Benin', slug: 'uniben', balance: 3248250000, proposals: 12, verified: true },
  { name: 'University of Lagos', slug: 'unilag', balance: 1850000000, proposals: 8, verified: true },
  { name: 'Ahmadu Bello University', slug: 'abu', balance: 920000000, proposals: 5, verified: true },
  { name: 'Obafemi Awolowo University', slug: 'oau', balance: 0, proposals: 0, verified: false },
]

function formatUSDC(micro: number): string {
  return (micro / 1_000_000).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

export default function UniversitiesPage() {
  return (
    <main className="min-h-screen bg-ink pb-24 pt-16">
      <MobileHeader />

      <section className="px-4 py-6 border-b border-rule">
        <h1 className="font-display font-bold text-ledger text-2xl">Universities</h1>
        <p className="text-body text-xs mt-1">Treasuries across Nigerian institutions</p>
      </section>

      <section className="px-4 py-4 space-y-3">
        {UNIVERSITIES.map((u) => (
          <Link key={u.slug} href={`/${u.slug}`}>
            <div className="border border-rule p-4 bg-paper flex items-center justify-between group">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <p className="font-display font-semibold text-ledger text-sm truncate">{u.name}</p>
                  {u.verified && <VerificationBadge />}
                </div>
                <p className="font-data text-ghost text-xs">{u.proposals} proposals</p>
              </div>
              <div className="text-right shrink-0 ml-4">
                <p className="font-data text-uniben text-sm font-bold">${formatUSDC(u.balance)}</p>
                <p className="font-data text-ghost text-[10px]">USDC</p>
              </div>
            </div>
          </Link>
        ))}
      </section>

      <BottomNav />
    </main>
  )
}
