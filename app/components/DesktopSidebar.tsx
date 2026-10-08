'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

interface NavItem {
  label: string
  href: string
  exact?: boolean
}

export default function DesktopSidebar({ university, isAuthorized = false }: { university: string; isAuthorized?: boolean }) {
  const pathname = usePathname()

  const groups: { title: string | null; desc: string | null; items: NavItem[] }[] = [
    {
      title: null,
      desc: null,
      items: [
        { label: 'Overview',  href: `/${university}`, exact: true },
        { label: 'Proposals', href: `/${university}/proposals` },
        { label: 'Deposit',   href: `/${university}/deposit` },
      ],
    },
    {
      title: 'Records',
      desc: 'Money moving in and out',
      items: [
        { label: 'Transactions', href: `/transactions?treasury=${university}`, exact: true },
        { label: 'Reports',      href: `/${university}/reports` },
        { label: 'Signatures',   href: `/${university}/signatures` },
      ],
    },
    {
      title: 'Registry',
      desc: 'People and accounts behind this treasury',
      items: [
        { label: 'Wallets',  href: `/${university}/wallets` },
        { label: 'Members',  href: `/${university}/members` },
        { label: 'Settings', href: `/${university}/settings` },
      ],
    },
  ]

  function isActive(item: NavItem): boolean {
    const base = item.href.split('?')[0]
    return item.exact
      ? pathname === base
      : pathname === base || pathname.startsWith(base + '/')
  }

  const linkClass = (active: boolean) =>
    `block px-5 py-3 font-data text-xs border-l-2 transition-colors ${
      active
        ? 'border-uniben bg-lifted text-ledger'
        : 'border-transparent text-ghost hover:text-uniben hover:bg-lifted'
    }`

  return (
    <aside className="w-56 shrink-0 border-r border-rule bg-paper flex flex-col">
      <div className="px-5 py-5 border-b border-rule">
        <Link href="/" className="font-data text-ledger text-sm tracking-widest">LEVYLEDGER</Link>
      </div>
      <nav className="flex-1 py-3 overflow-y-auto">
        {groups.map((group, gi) => (
          <div key={gi} className="mb-2">
            {group.title && (
              <div className="px-5 pt-4 pb-1">
                <p className="font-data text-ghost text-[10px] tracking-widest uppercase">{group.title}</p>
                {group.desc && (
                  <p className="text-ghost text-[10px] mt-0.5 leading-relaxed">{group.desc}</p>
                )}
              </div>
            )}
            {group.items.map(item => (
              <Link key={item.label} href={item.href} className={linkClass(isActive(item))}>
                {item.label.toUpperCase()}
              </Link>
            ))}
          </div>
        ))}
      </nav>
      <div className="border-t border-rule py-3">
        {isAuthorized && (
          <Link href={`/admin?treasury=${university}`} className={linkClass(pathname.startsWith('/admin'))}>
            ADMIN
          </Link>
        )}
        <Link href="/universities" className={linkClass(pathname === '/universities')}>
          ALL FACULTIES
        </Link>
      </div>
    </aside>
  )
}
