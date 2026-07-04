'use client'

import Link from 'next/link'

export default function DesktopSidebar({ university }: { university: string }) {
  return (
    <aside className="w-56 shrink-0 border-r border-rule bg-paper flex flex-col">
      <div className="px-5 py-5 border-b border-rule">
        <span className="font-data text-ledger text-sm tracking-widest">LEVYLEDGER</span>
      </div>
      <nav className="flex-1 py-4">
        {[
          { label: 'Overview',      href: `/${university}` },
          { label: 'Proposals',     href: `/${university}?filter=all` },
          { label: 'Admin',         href: `/admin?treasury=${university}` },
          { label: 'All Faculties', href: '/universities' },
        ].map(item => (
          <Link
            key={item.label}
            href={item.href}
            className="block px-5 py-3 font-data text-xs text-ghost hover:text-uniben hover:bg-lifted transition-colors"
          >
            {item.label.toUpperCase()}
          </Link>
        ))}
      </nav>
    </aside>
  )
}
