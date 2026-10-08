'use client'

import { useParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import { fetchTreasury } from '@/lib/queries'
import { fetchFacultyBySlug } from '@/lib/supabase'
import MobileHeader from '@/components/MobileHeader'
import BottomNav from '@/components/BottomNav'
import LoadingSkeleton from '@/components/LoadingSkeleton'
import CopyButton from '@/components/CopyButton'
import DesktopSidebar from '@/components/DesktopSidebar'
import DesktopTopBar from '@/components/DesktopTopBar'
import DesktopSettingsView from '@/components/DesktopSettingsView'
import { useIsDesktop } from '@/hooks/useIsDesktop'

export default function SettingsPage() {
  const { university } = useParams() as { university: string }
  const [treasury, setTreasury] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [facultyName, setFacultyName] = useState<string | null>(null)
  const isDesktop = useIsDesktop()

  useEffect(() => {
    async function load() {
      const t = await fetchTreasury(university)
      setTreasury(t)
      setLoading(false)
    }
    load()
    fetchFacultyBySlug(university)
      .then(r => setFacultyName(r?.department ?? null))
      .catch(() => setFacultyName(null))
  }, [university])

  const displayName = facultyName || university

  return (
    <>
      {!isDesktop && (
        <main id="main-content" className="min-h-[100dvh] bg-ink pb-24 pt-[calc(4rem+env(safe-area-inset-top))]">
          <MobileHeader />
          <section className="px-4 py-6 border-b border-rule">
            <p className="font-data text-ghost text-xs tracking-widest uppercase mb-1">{displayName.toUpperCase()}</p>
            <h1 className="font-display font-bold text-ledger text-2xl tracking-tight">Settings</h1>
            <p className="text-body text-xs mt-2 leading-relaxed">
              Configured at initialization. Cannot be changed here. The contract has no update instruction.
            </p>
          </section>
          <section className="px-4 pt-4">
            {loading ? (
              <LoadingSkeleton lines={3} />
            ) : !treasury ? (
              <p className="text-body text-sm py-8">This treasury has not been initialized on-chain yet.</p>
            ) : (
              <div className="space-y-3 stagger">
                <div className="border border-rule bg-paper p-4">
                  <p className="font-data text-ghost text-[10px] tracking-widest uppercase mb-1">Threshold</p>
                  <p className="font-data text-ledger text-sm">{treasury.threshold} of {treasury.signers.length}</p>
                </div>
                <div className="border border-rule bg-paper p-4">
                  <p className="font-data text-ghost text-[10px] tracking-widest uppercase mb-1">Treasury Address</p>
                  <p className="font-data text-ledger text-xs break-all mb-3">{treasury.pda.toString()}</p>
                  <CopyButton value={treasury.pda.toString()} />
                </div>
              </div>
            )}
          </section>
          <BottomNav university={university} activeTab="more" />
        </main>
      )}

      {isDesktop && (
        <div className="flex min-h-[100dvh] bg-ink">
          <DesktopSidebar university={university} />
          <div className="flex-1 flex flex-col">
            <DesktopTopBar universityName={displayName} />
            <DesktopSettingsView university={university} treasury={treasury} loading={loading} />
          </div>
        </div>
      )}
    </>
  )
}
