'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

interface Props { university: string }

export default function BottomNav({ university }: Props) {
  const pathname = usePathname()
  const isOverview  = pathname === `/${university}`
  const isProposals = pathname.includes('/proposals')
  const isAdmin     = pathname.startsWith('/admin')

  const tabs = [
    { label: 'Overview',  href: `/${university}`,              active: isOverview  },
    { label: 'Proposals', href: `/${university}?filter=all`,   active: isProposals },
    { label: 'Admin',     href: `/admin?treasury=${university}`, active: isAdmin   },
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
                ? 'text-uniben border-t border-uniben -mt-px'
                : 'text-ghost hover:text-body'
            }`}
          >
            <span className="font-data text-xs tracking-widest">
              {tab.label.toUpperCase()}
            </span>
          </Link>
        ))}
      </div>
    </nav>
  )
}
