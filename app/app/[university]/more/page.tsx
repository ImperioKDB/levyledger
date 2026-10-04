'use client'

import { useParams } from 'next/navigation'
import Link from 'next/link'
import MobileHeader from '@/components/MobileHeader'
import BottomNav from '@/components/BottomNav'

export default function FacultyMorePage() {
  const { university } = useParams() as { university: string }

  const links = [
    { label: 'Transactions', href: `/transactions?treasury=${university}` },
    { label: 'Reports',      href: `/${university}/reports` },
    { label: 'Signatures',   href: `/${university}/signatures` },
    { label: 'Wallets',      href: `/${university}/wallets` },
    { label: 'Members',      href: `/${university}/members` },
    { label: 'Settings',     href: `/${university}/settings` },
    { label: 'All faculties',    href: '/universities' },
    { label: 'About LevyLedger', href: '/about' },
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
            className="block border-b border-rule py-4 font-data text-ledger text-sm hover:text-uniben active:text-uniben transition-colors"
          >
            {l.label} →
          </Link>
        ))}
      </nav>
      <BottomNav university={university} activeTab="more" />
    </main>
  )
}
