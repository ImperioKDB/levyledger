'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useWallet } from '@solana/wallet-adapter-react'
import { submitDepartmentRequest, generateFacultySlug, UNIBEN_UNIVERSITY_NAME } from '@/lib/supabase'
import { ADMIN_KEY } from '@/lib/constants'
import ConnectWallet from '@/components/ConnectWallet'

export default function RegisterPage() {
  const wallet = useWallet()
  const isAdminWallet = wallet.publicKey?.toString() === ADMIN_KEY

  const [department, setDepartment]             = useState('')
  const [execs, setExecs]                       = useState<string[]>(['', '', '', '', ''])
  const [submitterName, setSubmitterName]       = useState('')
  const [submitterContact, setSubmitterContact] = useState('')
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [error, setError]   = useState('')

  const slug = department ? generateFacultySlug(department) : ''

  if (!isAdminWallet) return (
    <main className="min-h-screen bg-ink px-6 pt-16">
      <header className="pb-6 border-b border-rule mb-8">
        <Link href="/" className="font-data text-ghost text-xs">← LEVYLEDGER</Link>
      </header>
      <p className="font-data text-void text-xs tracking-widest uppercase mb-3">
        Admin Only
      </p>
      <h1 className="font-display text-xl font-bold text-ledger mb-3">
        Faculty registration is restricted
      </h1>
      <p className="text-body text-sm leading-relaxed max-w-xs mb-8">
        {wallet.publicKey
          ? "This wallet isn't a LevyLedger admin wallet. Connect the admin wallet to register a new faculty."
          : 'Connect the LevyLedger admin wallet to register a new faculty.'}
      </p>
      <ConnectWallet />
    </main>
  )

  async function handleSubmit() {
    setStatus('loading'); setError('')
    try {
      await submitDepartmentRequest({
        university: UNIBEN_UNIVERSITY_NAME, department, slug, execs, submitterName, submitterContact,
      })
      setStatus('success')
    } catch (e: any) {
      setError(e.message || 'Something went wrong. Please try again.')
      setStatus('error')
    }
  }

  const canSubmit =
    department.trim() && execs.every(e => e.trim().length > 20) // rough pubkey length check

  if (status === 'success') return (
    <main className="min-h-screen bg-ink px-6 pt-16">
      <div className="border border-nigerian p-6">
        <p className="font-data text-nigerian text-xs tracking-widest uppercase mb-3">
          Request Submitted
        </p>
        <p className="font-display text-xl font-bold text-ledger mb-3">
          {department} · {UNIBEN_UNIVERSITY_NAME}
        </p>
        <p className="text-body text-sm leading-relaxed mb-1">
          Your treasury slug will be:
        </p>
        <p className="font-data text-uniben text-sm mb-4">{slug}</p>
        <p className="text-body text-sm leading-relaxed">
          A LevyLedger admin will review this request and initialize your
          treasury on-chain. You'll be able to find it at{' '}
          <span className="font-data text-ledger">levyledger.vercel.app/{slug}</span>{' '}
          once approved.
        </p>
      </div>
      <Link href="/" className="font-data text-ghost text-xs block mt-6">
        ← Back to LevyLedger
      </Link>
    </main>
  )

  return (
    <main className="min-h-screen bg-ink">
      <header className="border-b border-rule px-6 py-4">
        <Link href="/" className="font-data text-ghost text-xs">← LEVYLEDGER</Link>
      </header>

      <div className="px-6 pt-8 pb-24">
        <p className="font-data text-ghost text-xs tracking-widest uppercase mb-1">
          Register Your Faculty
        </p>
        <h1 className="font-display text-2xl font-bold text-ledger mb-3">
          Bring transparency to your union
        </h1>
        <p className="text-body text-sm leading-relaxed mb-8">
          Collect the exec's 5 wallet addresses directly, then submit here.
          This form itself is not on-chain — the treasury and every naira in
          it will be, once you submit and initialize it.
        </p>

        <div className="space-y-5">
          <div>
            <label className="font-data text-ghost text-xs block mb-1">University</label>
            <div className="w-full bg-paper border border-rule text-ledger text-sm px-3 py-3">
              {UNIBEN_UNIVERSITY_NAME} (UNIBEN)
            </div>
            <p className="font-data text-ghost text-[10px] mt-1">
              LevyLedger's MVP is scoped to UNIBEN faculties only.
            </p>
          </div>
          <div>
            <label className="font-data text-ghost text-xs block mb-1">Faculty / Union Name</label>
            <input value={department} onChange={e => setDepartment(e.target.value)}
              placeholder="e.g. Faculty of Engineering Student Union"
              className="w-full bg-paper border border-rule text-ledger text-sm px-3 py-3 focus:border-uniben outline-none placeholder:text-ghost" />
          </div>

          {slug && (
            <div className="border border-rule p-3">
              <p className="font-data text-ghost text-xs mb-1">Treasury will be at</p>
              <p className="font-data text-uniben text-sm">levyledger.vercel.app/{slug}</p>
            </div>
          )}

          <div className="border-t border-rule pt-5">
            <p className="font-data text-ghost text-xs tracking-widest uppercase mb-4">
              5 Executive Wallet Addresses
            </p>
            <div className="space-y-3">
              {execs.map((val, i) => (
                <div key={i}>
                  <label className="font-data text-ghost text-xs block mb-1">
                    Exec {i + 1} Wallet Address
                  </label>
                  <input value={val}
                    onChange={e => {
                      const arr = [...execs]; arr[i] = e.target.value; setExecs(arr)
                    }}
                    placeholder="Solana public key..."
                    className="w-full bg-paper border border-rule text-ledger font-data text-xs px-3 py-3 focus:border-uniben outline-none placeholder:text-ghost" />
                </div>
              ))}
            </div>
          </div>

          <div className="border-t border-rule pt-5 space-y-3">
            <p className="font-data text-ghost text-xs tracking-widest uppercase">
              Your Info (optional, helps us reach you)
            </p>
            <input value={submitterName} onChange={e => setSubmitterName(e.target.value)}
              placeholder="Your name"
              className="w-full bg-paper border border-rule text-ledger text-sm px-3 py-3 focus:border-uniben outline-none placeholder:text-ghost" />
            <input value={submitterContact} onChange={e => setSubmitterContact(e.target.value)}
              placeholder="Email or phone"
              className="w-full bg-paper border border-rule text-ledger text-sm px-3 py-3 focus:border-uniben outline-none placeholder:text-ghost" />
          </div>

          <button onClick={handleSubmit}
            disabled={!canSubmit || status === 'loading'}
            className="w-full bg-uniben text-ink font-data text-xs py-4 tracking-widest hover:opacity-90 disabled:opacity-40 transition-opacity">
            {status === 'loading' ? 'SUBMITTING...' : 'SUBMIT REQUEST'}
          </button>

          {status === 'error' && (
            <div className="border border-void p-3">
              <p className="font-data text-void text-xs">{error}</p>
            </div>
          )}
        </div>
      </div>
    </main>
  )
}
