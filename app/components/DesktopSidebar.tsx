'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

interface Props {
  university: string
}

const ICONS: Record<string, string> = {
  overview:     'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6',
  transactions: 'M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4',
  proposals:    'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01',
  signatures:   'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z',
  reports:      'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z',
  wallets:      'M21 12a2 2 0 00-2-2H5a2 2 0 00-2 2m18 0v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6m18 0V9a2 2 0 00-2-2H5a2 2 0 00-2 2v3m18 0h-5.5a1.5 1.5 0 000 3H21',
  about:        'M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
  members:      'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z',
}

export default function DesktopSidebar({ university }: Props) {
  const pathname = usePathname()
  const base = '/' + university

  const items = [
    { key: 'overview',     label: 'Overview',     href: base },
    { key: 'transactions', label: 'Transactions', href: '/transactions' },
    { key: 'proposals',    label: 'Proposals',    href: '/proposals?treasury=' + university },
    { key: 'members',      label: 'Members',      href: base + '/members' },
    { key: 'signatures',   label: 'Signatures',   href: null as string | null },
    { key: 'reports',      label: 'Reports',      href: null as string | null },
    { key: 'wallets',      label: 'Wallets',      href: null as string | null },
    { key: 'about',        label: 'About',        href: null as string | null },
  ]

  return (
    <aside className="w-56 shrink-0 border-r border-rule flex flex-col h-screen sticky top-0 bg-ink">
      <div className="h-16 flex items-center gap-2 px-5 border-b border-rule">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-uniben">
          <path d="M4 19.5A2.5 2.5 0 016.5 17H20M4 19.5A2.5 2.5 0 006.5 22H20V2H6.5A2.5 2.5 0 004 4.5v15z" />
        </svg>
        <span className="font-display font-semibold text-ledger text-sm">LevyLedger</span>
      </div>

      <nav className="flex-1 py-4">
        {items.map((item) => {
          const isActive = item.href
            ? (item.href === base ? pathname === base : pathname.startsWith(item.href.split('?')[0]))
            : false

          const icon = (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d={ICONS[item.key]} />
            </svg>
          )

          if (!item.href) {
            return (
              <span
                key={item.key}
                title="Coming soon"
                className="flex items-center gap-3 px-5 py-2.5 text-ghost opacity-40 cursor-not-allowed border-l-2 border-l-transparent"
              >
                {icon}
                <span className="font-data text-xs tracking-wide">{item.label}</span>
              </span>
            )
          }

          return (
            <Link
              key={item.key}
              href={item.href}
              className={
                'flex items-center gap-3 px-5 py-2.5 border-l-2 transition-colors ' +
                (isActive
                  ? 'border-l-uniben text-uniben bg-paper'
                  : 'border-l-transparent text-ghost hover:text-ledger hover:bg-paper')
              }
            >
              {icon}
              <span className="font-data text-xs tracking-wide">{item.label}</span>
            </Link>
          )
        })}
      </nav>

      <div className="p-5 border-t border-rule">
        <div className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 bg-nigerian" />
          <span className="font-data text-ghost text-[10px] tracking-widest uppercase">Solana Devnet</span>
        </div>
      </div>
    </aside>
  )
}
