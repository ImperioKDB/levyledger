'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

interface Props {
  university: string
}

export default function BottomNav({ university }: Props) {
  const pathname = usePathname()

  // A proposal detail page lives at /${university}/proposals/${id}
  // The treasury overview lives at /${university}
  // The admin panel lives at /admin
  const isOnTreasury = pathname === `/${university}`
  const isOnProposal = pathname.startsWith(`/${university}/proposals/`)
  const isAdmin      = pathname.startsWith('/admin')

  const tabs = [
    {
      label:  'OVERVIEW',
      href:   `/${university}`,
      active: isOnTreasury && !isOnProposal,
    },
    {
      label:  'PROPOSALS',
      // Scrolls to the proposals section — handled client-side via
      // the filter strip on the treasury page
      href:   `/${university}#proposals`,
      active: isOnProposal,
    },
    {
      label:  'ADMIN',
      href:   `/admin?treasury=${university}`,
      active: isAdmin,
    },
  ]

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 bg-ink border-t border-rule z-50"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <div className="flex">
        {tabs.map(tab => (
          <Link
            key={tab.label}
            href={tab.href}
            className={`flex-1 flex flex-col items-center py-3 transition-colors ${
              tab.active
                ? 'text-nigerian border-t-2 border-nigerian -mt-px'
                : 'text-ghost hover:text-body'
            }`}
          >
            <span className="font-data text-xs tracking-widest">
              {tab.label}
            </span>
          </Link>
        ))}
      </div>
    </nav>
  )
}
