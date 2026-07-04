'use client'

import Link from 'next/link'

export default function MobileHeader() {
  return (
    <header className="fixed top-0 left-0 right-0 z-40 bg-ink border-b border-rule px-6 py-4 flex items-center justify-between">
      <Link href="/" className="font-data text-ghost text-xs">← LEVYLEDGER</Link>
      <span className="font-data text-ghost text-xs px-2 py-1 border border-rule">DEVNET</span>
    </header>
  )
}
