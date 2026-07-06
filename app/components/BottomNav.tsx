'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

type Tab = 'overview' | 'proposals' | 'deposit' | 'admin'

interface Props {
  university?: string
  activeTab?: Tab
  isAuthorized?: boolean
}

export default function BottomNav({ university, activeTab = 'overview', isAuthorized = false }: Props) {
  const pathname = usePathname()
  const isAdminPage = pathname.startsWith('/admin')

  const overviewActive  = !isAdminPage && activeTab === 'overview'
  const proposalsActive = !isAdminPage && activeTab === 'proposals'
  const depositActive   = !isAdminPage && activeTab === 'deposit'
  const adminActive     = isAdminPage

  const baseClass = (active: boolean) =>
    `flex-1 flex flex-col items-center py-3 transition-colors ${
      active ? 'text-uniben border-t border-uniben -mt-px' : 'text-ghost hover:text-body'
    }`

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 bg-ink border-t border-rule z-50"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <div className="flex">
        <Link href={university ? `/${university}` : '/universities'} className={baseClass(overviewActive)}>
          <span className="font-data text-xs tracking-widest">OVERVIEW</span>
        </Link>

        <Link href={university ? `/${university}/proposals` : '/universities'} className={baseClass(proposalsActive)}>
          <span className="font-data text-xs tracking-widest">PROPOSALS</span>
        </Link>

        <Link href={university ? `/${university}/deposit` : '/universities'} className={baseClass(depositActive)}>
          <span className="font-data text-xs tracking-widest">DEPOSIT</span>
        </Link>

        {isAuthorized && (
          <Link
            href={university ? `/admin?treasury=${university}` : '/admin'}
            className={baseClass(adminActive)}
          >
            <span className="font-data text-xs tracking-widest">ADMIN</span>
          </Link>
        )}
      </div>
    </nav>
  )
}
