'use client'

import { useParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import { fetchTreasury, fetchAllProposals } from '@/lib/queries'
import { UNIVERSITIES } from '@/lib/constants'
import MobileHeader from '@/components/MobileHeader'
import BottomNav from '@/components/BottomNav'
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

  useEffect(() => {
    async function load() {
      const t = await fetchTreasury(university)
      if (!t) { setLoading(false); return }
      setTreasury(t)
      const count = typeof t.proposalCount?.toNumber === 'function'
        ? t.proposalCount.toNumber() : Number(t.proposalCount)
      const proposals = await fetchAllProposals(t.pda, count)
      const tally: Member[] = t.signers.map((signer: any, i: number) => {
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
      setMembers(tally)
      setLoading(false)
    }
    load()
  }, [university])

  return (
    <>
      <div className="xl:hidden">
        <main className="min-h-screen bg-ink pb-24 pt-16">
          <MobileHeader />

          <section className="px-4 py-6 border-b border-rule">
            <p className="font-data text-ghost text-xs tracking-widest uppercase mb-1">{university.toUpperCase()}</p>
            <h1 className="font-display font-bold text-ledger text-2xl">Members</h1>
          </section>

          <section className="px-4 pt-4">
            {loading ? (
              <p className="font-data text-ghost text-xs">Loading members...</p>
            ) : !treasury ? (
              <p className="text-body text-sm py-8">This treasury has not been initialized on-chain yet.</p>
            ) : (
              <div className="space-y-3">
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

          <BottomNav university={university} />
        </main>
      </div>

      <div className="hidden xl:flex min-h-screen bg-ink">
        <DesktopSidebar university={university} />
        <div className="flex-1 flex flex-col">
          <DesktopTopBar universityName={UNIVERSITIES[university] || university} />
          <DesktopMembersList members={members} loading={loading} treasury={treasury} />
        </div>
      </div>
    </>
  )
}
