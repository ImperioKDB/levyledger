'use client'

import { useParams } from 'next/navigation'
import Link from 'next/link'
import MobileHeader from '@/components/MobileHeader'
import BottomNav from '@/components/BottomNav'

export default function FacultyMorePage() {
  const { university } = useParams() as { university: string }

  const links = [
    { label: 'Transactions', desc: 'Executed spending, one record per payment', href: `/transactions?treasury=${university}` },
    { label: 'Reports',      desc: 'Spending grouped by category',              href: `/${university}/reports` },
    { label: 'Signatures',   desc: 'Proposals waiting for exec approval',       href: `/${university}/signatures` },
    { label: 'Wallets',      desc: 'On-chain accounts that hold the funds',     href: `/${university}/wallets` },
    { label: 'Members',      desc: 'The 5 registered exec signers',             href: `/${university}/members` },
    { label: 'Settings',     desc: 'Treasury rules, set at initialization',     href: `/${university}/settings` },
    { label: 'All faculties',    desc: null, href: '/universities' },
    { label: 'About LevyLedger', desc: null, href: '/about' },
  ]

  return (
    <main id="main-content" className="min-h-[100dvh] bg-ink pb-24 pt-[calc(4rem+env(safe-area-inset-top))]">
      <MobileHeader />
      <section className="px-4 py-6 border-b border-rule">
        <p className="font-data text-ghost text-xs tracking-widest uppercase mb-1">{university.toUpperCase()}</p>
        <h1 className="font-display font-bold text-ledger text-2xl tracking-tight">More</h1>
      </section>
      <nav className="px-4 py-2 stagger">
        {links.map((l) => (
          <Link
            key={l.href}
            href={l.href}
            className="block border-b border-rule py-4 hover:bg-lifted active:bg-lifted transition-colors"
          >
            <p className="font-data text-ledger text-sm">{l.label} →</p>
            {l.desc && <p className="text-body text-xs mt-0.5">{l.desc}</p>}
          </Link>
        ))}
      </nav>
      <BottomNav university={university} activeTab="more" />
    </main>
  )
}
