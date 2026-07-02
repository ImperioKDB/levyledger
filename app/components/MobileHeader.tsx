'use client'

import Link from 'next/link'

export default function MobileHeader() {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-ink border-b border-rule h-16 flex items-center justify-between px-4">
      <Link href="/" className="font-display font-semibold text-ledger text-lg tracking-tight">
        LevyLedger
      </Link>
      <button
        aria-label="Menu"
        className="w-10 h-10 flex items-center justify-center text-ghost hover:text-ledger transition-colors"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <line x1="3" y1="6" x2="21" y2="6" />
          <line x1="3" y1="12" x2="21" y2="12" />
          <line x1="3" y1="18" x2="21" y2="18" />
        </svg>
      </button>
    </header>
  )
}
