'use client'

import { useParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { fetchTreasury, fetchAllProposals } from '@/lib/queries'
import { UNIVERSITIES } from '@/lib/constants'
import { formatUSDC } from '@/lib/anchor'
import MobileHeader from '@/components/MobileHeader'
import BottomNav from '@/components/BottomNav'
import StatusBadge from '@/components/StatusBadge'
import DesktopSidebar from '@/components/DesktopSidebar'
import DesktopTopBar from '@/components/DesktopTopBar'
import { useIsDesktop } from '@/hooks/useIsDesktop'

export default function SignaturesPage() {
  const { university } = useParams() as { university: string }
  const [treasury, setTreasury] = useState<any>(null)
  const [active, setActive] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const isDesktop = useIsDesktop()

  useEffect(() => {
    async function load() {
      const t = await fetchTreasury(university)
      if (!t) { setLoading(false); return }
      setTreasury(t)
      const count = typeof t.proposalCount?.toNumber === 'function'
        ? t.proposalCount.toNumber() : Number(t.proposalCount)
      const proposals = await fetchAllProposals(t.pda, count)
      setActive(proposals.filter((p: any) => Object.keys(p.status)[0] === 'active'))
      setLoading(false)
    }
    load()
  }, [university])

  const list = (
    <>
      {loading ? (
        <p className="font-data text-ghost text-xs">Loading...</p>
      ) : !treasury ? (
        <p className="text-body text-sm py-8">This treasury has not been initialized on-chain yet.</p>
      ) : active.length === 0 ? (
        <p className="text-body text-sm py-8">No proposals currently need signatures.</p>
      ) : (
        active.map((p) => (
          <Link key={p.index} href={'/proposals/' + p.index + '?treasury=' + university}>
            <div className="border-b border-rule py-4 flex items-center justify-between group">
              <div className="min-w-0 flex-1">
                <p className="text-body text-sm truncate group-hover:text-ledger transition-colors">{p.description}</p>
                <p className="font-data text-ghost text-[10px] mt-1">{p.signaturesFor}/{treasury.threshold} signed</p>
              </div>
              <p className="font-data text-ledger text-sm font-bold ml-4">${formatUSDC(p.amount)}</p>
              <div className="ml-4 shrink-0"><StatusBadge status="active" /></div>
            </div>
          </Link>
        ))
      )}
    </>
  )

  return (
    <>
      {!isDesktop && (
      <main className="min-h-screen bg-ink pb-24 pt-16">
        <MobileHeader />
        <section className="px-4 py-6 border-b border-rule">
          <p className="font-data text-ghost text-xs tracking-widest uppercase mb-1">{university.toUpperCase()}</p>
          <h1 className="font-display font-bold text-ledger text-2xl">Signatures</h1>
          <p className="text-body text-xs mt-1">Proposals currently awaiting approval</p>
        </section>
        <section className="px-4 pt-2">{list}</section>
        <BottomNav university={university} />
      </main>
      )}

      {isDesktop && (
      <div className="flex min-h-screen bg-ink">
        <DesktopSidebar university={university} />
        <div className="flex-1 flex flex-col">
          <DesktopTopBar universityName={UNIVERSITIES[university] || university} />
          <div className="p-8 max-w-4xl">
            <h1 className="font-display font-bold text-ledger text-3xl mb-1">Signatures</h1>
            <p className="text-body text-sm mb-8">Proposals currently awaiting approval</p>
            <div className="border border-rule bg-paper px-5">{list}</div>
          </div>
        </div>
      </div>
      )}
    </>
  )
}
