import Link from 'next/link'
import MobileHeader from '@/components/MobileHeader'
import BottomNav from '@/components/BottomNav'

const LINKS = [
  { label: 'About LevyLedger', href: '/about' },
  { label: 'Documentation', href: 'https://docs.levyledger.vercel.app', external: true },
  { label: 'Network Status', href: '#', disabled: true },
  { label: 'Terms of Use', href: '/terms' },
  { label: 'Privacy Policy', href: '/privacy' },
  { label: 'Contact', href: '/contact' },
]

export default function MorePage() {
  return (
    <main className="min-h-screen bg-ink pb-24 pt-16">
      <MobileHeader />

      <section className="px-4 py-6 border-b border-rule">
        <h1 className="font-display font-bold text-ledger text-2xl">More</h1>
      </section>

      <section className="px-4 py-4 space-y-0">
        {LINKS.map((link, i) => (
          link.external ? (
            <a
              key={i}
              href={link.href}
              target="_blank"
              rel="noopener noreferrer"
              className="block border-b border-rule py-4 font-data text-ledger text-sm hover:text-uniben transition-colors"
            >
              {link.label} →
            </a>
          ) : link.disabled ? (
            <span key={i} className="block border-b border-rule py-4 font-data text-ghost text-sm cursor-not-allowed">
              {link.label}
            </span>
          ) : (
            <Link
              key={i}
              href={link.href}
              className="block border-b border-rule py-4 font-data text-ledger text-sm hover:text-uniben transition-colors"
            >
              {link.label} →
            </Link>
          )
        ))}
      </section>

      <section className="px-4 py-8">
        <div className="border border-rule p-4 bg-paper">
          <p className="font-data text-ghost text-[10px] tracking-widest uppercase mb-2">Network</p>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2 h-2 bg-nigerian" />
            <span className="font-data text-nigerian text-xs">Solana Devnet</span>
          </div>
          <p className="font-data text-ghost text-[10px]">All transactions are test tokens with no real value.</p>
        </div>
      </section>

      <BottomNav />
    </main>
  )
}
