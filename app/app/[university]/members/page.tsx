'use client'

import { useParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { fetchTreasury, fetchAllProposals, getLastTreasuryFetchError } from '@/lib/queries'
import { fetchFacultyBySlug, fetchProfilesByWallets } from '@/lib/supabase'
import MobileHeader from '@/components/MobileHeader'
import BottomNav from '@/components/BottomNav'
import LoadingSkeleton from '@/components/LoadingSkeleton'
import DesktopSidebar from '@/components/DesktopSidebar'
import DesktopTopBar from '@/components/DesktopTopBar'
import DesktopMembersList from '@/components/DesktopMembersList'

interface Member {
  address: string
  title: string
  signed: number
  rejected: number
}

export default function MembersPage() {
  const { university } = useParams() as { university: string }
  const [treasury, setTreasury] = useState<any>(null)
  const [members, setMembers] = useState<Member[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState(false)
  const [facultyName, setFacultyName] = useState<string | null>(null)

  async function load() {
    const t = await fetchTreasury(university)
    if (!t) {
      if (getLastTreasuryFetchError()) setLoadError(true)
      setLoading(false)
      return
    }
    setLoadError(false)
    setTreasury(t)
    const count = typeof t.proposalCount?.toNumber === 'function'
      ? t.proposalCount.toNumber() : Number(t.proposalCount)
    const proposals = await fetchAllProposals(t.pda, count)
    let tally: Member[] = t.signers.map((signer: any, i: number) => {
      let signed = 0
      let rejected = 0
      proposals.forEach((p: any) => {
        if (p.signedBy?.[i]) signed++
        if (p.votedAgainst?.[i]) rejected++
      })
      return {
        address: signer.toString(),
        title: 'Signer ' + (i + 1),
        signed,
        rejected,
      }
    })
    // Real names from the public profile directory when an exec registered
    // one. Wallet address stays the source of truth; the name is a label.
    try {
      const profiles = await fetchProfilesByWallets(tally.map(m => m.address))
      const byWallet: Record<string, string> = {}
      profiles.forEach(p => { byWallet[p.wallet_address] = p.full_name })
      tally = tally.map(m => ({ ...m, title: byWallet[m.address] || m.title }))
    } catch (e) {
      console.error('[members] profile lookup failed:', e)
    }
    setMembers(tally)
    setLoading(false)
  }

  useEffect(() => {
    load()
    fetchFacultyBySlug(university)
      .then(r => setFacultyName(r?.department ?? null))
      .catch(() => setFacultyName(null))
  }, [university])

  const displayName = facultyName || university

  if (loadError) return (
    <main className="min-h-[100dvh] bg-ink px-6 pt-12">
      <Link href="/" className="font-data text-ghost text-xs hover:text-uniben transition-colors">← LEVYLEDGER</Link>
      <p className="font-data text-void text-xs tracking-widest uppercase mt-8 mb-3">Connection failed</p>
      <p className="text-body text-sm max-w-xs leading-relaxed mb-6">
        The Solana RPC did not respond. Retry in a moment.
      </p>
      <button
        onClick={() => { setLoading(true); setLoadError(false); load() }}
        className="font-data text-xs tracking-widest py-3 px-5 border border-uniben text-uniben hover:bg-uniben hover:text-ink active:scale-[0.98] transition-all"
      >
        TRY AGAIN
      </button>
    </main>
  )

  return (
    <>
      <div className="xl:hidden">
        <main id="main-content" className="min-h-[100dvh] bg-ink pb-24 pt-[calc(4rem+env(safe-area-inset-top))]">
          <MobileHeader />
          <section className="px-4 py-6 border-b border-rule">
            <p className="font-data text-ghost text-xs tracking-widest uppercase mb-1">{displayName.toUpperCase()}</p>
            <h1 className="font-display font-bold text-ledger text-2xl tracking-tight">Members</h1>
            <p className="text-body text-xs mt-1">The 5 registered exec signers for this treasury</p>
          </section>
          <section className="px-4 pt-4">
            {loading ? (
              <LoadingSkeleton lines={5} />
            ) : !treasury ? (
              <p className="text-body text-sm py-8">This treasury has not been initialized on-chain yet.</p>
            ) : (
              <div className="space-y-3 stagger">
                {members.map((m, i) => (
                  <div key={i} className="border border-rule bg-paper p-4">
                    <p className="font-display font-semibold text-ledger text-sm mb-1">{m.title}</p>
                    <p className="font-data text-ghost text-xs break-all mb-3">{m.address}</p>
                    {m.signed === 0 && m.rejected === 0 ? (
                      <p className="font-data text-ghost text-xs">No activity yet</p>
                    ) : (
                      <div className="flex gap-4">
                        <span className="font-data text-nigerian text-xs">{m.signed} signed</span>
                        <span className="font-data text-void text-xs">{m.rejected} rejected</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </section>
          <BottomNav university={university} activeTab="more" />
        </main>
      </div>

      <div className="hidden xl:flex min-h-[100dvh] bg-ink">
        <DesktopSidebar university={university} />
        <div className="flex-1 flex flex-col">
          <DesktopTopBar universityName={displayName} />
          <DesktopMembersList members={members} loading={loading} treasury={treasury} />
        </div>
      </div>
    </>
  )
}
