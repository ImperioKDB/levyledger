'use client'

import { Suspense, useState, useEffect, useRef, useCallback } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui'
import { useWallet, useConnection } from '@solana/wallet-adapter-react'
import { AnchorProvider } from '@coral-xyz/anchor'
import { PublicKey } from '@solana/web3.js'
import { fetchTreasury, fetchAllProposals } from '@/lib/queries'
import {
  formatUSDC, abbreviate,
  depositFunds, createProposalTx, signProposalTx,
} from '@/lib/anchor'
import { CATEGORY_LABELS } from '@/lib/constants'
import StatusBadge from '@/components/StatusBadge'

type Tab = 'sign' | 'propose' | 'deposit'
type TxState =
  | null
  | { status: 'pending' }
  | { status: 'ok';  sig: string }
  | { status: 'err'; msg: string }

// ── Hold-to-confirm button ────────────────────────────────────────────────────
// The exec must hold for 500 ms before the action fires.
// A fill animation shows progress. Releasing early cancels.
function HoldButton({
  label, onConfirm, variant, disabled,
}: {
  label: string
  onConfirm: () => void
  variant: 'approve' | 'reject'
  disabled?: boolean
}) {
  const [progress, setProgress] = useState(0)
  const rafRef   = useRef<number>(0)
  const startRef = useRef<number>(0)
  const HOLD_MS  = 500

  const begin = useCallback(() => {
    if (disabled) return
    startRef.current = Date.now()
    const tick = () => {
      const p = Math.min((Date.now() - startRef.current) / HOLD_MS, 1)
      setProgress(p)
      if (p < 1) {
        rafRef.current = requestAnimationFrame(tick)
      } else {
        setProgress(0)
        onConfirm()
      }
    }
    rafRef.current = requestAnimationFrame(tick)
  }, [disabled, onConfirm])

  const cancel = useCallback(() => {
    cancelAnimationFrame(rafRef.current)
    setProgress(0)
  }, [])

  const fillColor = variant === 'approve' ? 'var(--nigerian)' : 'var(--void)'
  const cls = variant === 'approve'
    ? 'border-nigerian text-nigerian'
    : 'border-void     text-void'

  return (
    <button
      onPointerDown={begin}
      onPointerUp={cancel}
      onPointerLeave={cancel}
      disabled={disabled}
      className={`relative overflow-hidden flex-1 h-14 border font-data text-xs
                  tracking-widest select-none touch-none
                  ${cls} ${disabled ? 'opacity-30 cursor-not-allowed' : 'cursor-pointer'}`}
    >
      {/* Progress fill */}
      <span
        aria-hidden
        style={{
          position: 'absolute', inset: 0,
          width: `${progress * 100}%`,
          background: fillColor,
          opacity: 0.18,
          transition: 'none',
        }}
      />
      <span className="relative z-10">
        {progress > 0 ? 'HOLD...' : label}
      </span>
    </button>
  )
}

// ── Tx status banner ──────────────────────────────────────────────────────────
function TxBanner({ tx, onDismiss }: { tx: TxState; onDismiss: () => void }) {
  if (!tx || tx.status === 'pending') return null
  const isOk = tx.status === 'ok'
  return (
    <div className={`border px-4 py-3 mb-6 flex justify-between items-start gap-4
                     ${isOk ? 'border-nigerian' : 'border-void'}`}>
      <div>
        <p className={`font-data text-xs mb-1 ${isOk ? 'text-nigerian' : 'text-void'}`}>
          {isOk ? 'TRANSACTION CONFIRMED' : 'TRANSACTION FAILED'}
        </p>
        {isOk && (
          <p className="font-data text-ghost text-xs break-all">
            {(tx as any).sig.slice(0, 24)}...
          </p>
        )}
        {!isOk && (
          <p className="text-ghost text-xs leading-relaxed max-w-xs">
            {(tx as any).msg}
          </p>
        )}
      </div>
      <button onClick={onDismiss} className="font-data text-ghost text-xs shrink-0">
        DISMISS
      </button>
    </div>
  )
}

// ── Sign tab ──────────────────────────────────────────────────────────────────
function SignTab({
  university, treasury, proposals, provider, onTx,
}: {
  university: string
  treasury: any
  proposals: any[]
  provider: AnchorProvider
  onTx: (t: TxState) => void
}) {
  const active = proposals.filter(p => Object.keys(p.status)[0] === 'active')

  async function sign(p: any, approve: boolean) {
    onTx({ status: 'pending' })
    try {
      const sig = await signProposalTx(
        provider, university, p.index,
        new PublicKey(p.recipient.toString()), approve
      )
      onTx({ status: 'ok', sig })
    } catch (e: any) {
      onTx({ status: 'err', msg: e?.message || 'Unknown error' })
    }
  }

  if (active.length === 0) return (
    <div className="py-16">
      <p className="font-data text-ghost text-xs tracking-widest uppercase mb-3">
        Sign
      </p>
      <p className="font-display text-xl font-semibold text-ledger mb-2">
        No active proposals
      </p>
      <p className="text-ghost text-sm">
        All proposals have been resolved. New ones will appear here.
      </p>
    </div>
  )

  return (
    <div className="space-y-0">
      {active.map(p => {
        const myIdx     = treasury.signers.findIndex(
          (s: any) => s.toString() === provider.wallet.publicKey.toString()
        )
        const alreadyFor     = myIdx >= 0 && p.signedBy?.[myIdx]
        const alreadyAgainst = myIdx >= 0 && p.votedAgainst?.[myIdx]
        const voted          = alreadyFor || alreadyAgainst

        return (
          <div key={p.index} className="border-b border-rule py-6">
            {/* Amount */}
            <p className="font-data text-2xl font-bold text-ledger mb-1">
              ${formatUSDC(p.amount)}
              <span className="text-ghost text-sm ml-2 font-normal">USDC</span>
            </p>
            {/* Description */}
            <p className="text-ghost text-sm mb-2 leading-relaxed">
              {p.description}
            </p>
            {/* Recipient */}
            <p className="font-data text-ghost text-xs mb-1">To</p>
            <p className="font-data text-ledger text-xs mb-4 break-all">
              {p.recipient?.toString()}
            </p>
            {/* Signature count */}
            <p className="font-data text-ghost text-xs mb-5">
              {p.signaturesFor}/{treasury.threshold || 3} signed ·{' '}
              {p.signaturesAgainst} against
            </p>

            {voted ? (
              <p className={`font-data text-xs tracking-widest ${
                alreadyFor ? 'text-nigerian' : 'text-void'
              }`}>
                {alreadyFor ? 'YOU APPROVED THIS' : 'YOU REJECTED THIS'}
              </p>
            ) : (
              /* Hold buttons — 500 ms press required */
              <div className="flex gap-3">
                <HoldButton
                  label="HOLD TO APPROVE"
                  variant="approve"
                  onConfirm={() => sign(p, true)}
                />
                <HoldButton
                  label="HOLD TO REJECT"
                  variant="reject"
                  onConfirm={() => sign(p, false)}
                />
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

// ── Propose tab ───────────────────────────────────────────────────────────────
function ProposeTab({
  university, provider, onTx,
}: {
  university: string
  provider: AnchorProvider
  onTx: (t: TxState) => void
}) {
  const [amount,      setAmount]      = useState('')
  const [recipient,   setRecipient]   = useState('')
  const [category,    setCategory]    = useState('welfare')
  const [description, setDescription] = useState('')

  const valid = amount && recipient && description.length >= 3 && description.length <= 200

  async function submit() {
    if (!valid) return
    onTx({ status: 'pending' })
    try {
      const sig = await createProposalTx(
        provider, university, parseFloat(amount), recipient, category, description
      )
      onTx({ status: 'ok', sig })
      setAmount(''); setRecipient(''); setDescription('')
    } catch (e: any) {
      onTx({ status: 'err', msg: e?.message || 'Unknown error' })
    }
  }

  return (
    <div className="space-y-6 py-2">
      <div>
        <label className="font-data text-ghost text-xs block mb-2">
          Amount (USDC)
        </label>
        <input
          type="number"
          min="0"
          step="0.01"
          value={amount}
          onChange={e => setAmount(e.target.value)}
          placeholder="0.00"
          className="w-full bg-paper border border-rule px-4 py-3 font-data
                     text-ledger text-sm placeholder:text-ghost
                     focus:outline-none focus:border-nigerian"
        />
      </div>

      <div>
        <label className="font-data text-ghost text-xs block mb-2">
          Recipient wallet address
        </label>
        <input
          type="text"
          value={recipient}
          onChange={e => setRecipient(e.target.value)}
          placeholder="Solana public key"
          className="w-full bg-paper border border-rule px-4 py-3 font-data
                     text-ledger text-xs placeholder:text-ghost break-all
                     focus:outline-none focus:border-nigerian"
        />
      </div>

      <div>
        <label className="font-data text-ghost text-xs block mb-2">
          Category
        </label>
        <select
          value={category}
          onChange={e => setCategory(e.target.value)}
          className="w-full bg-paper border border-rule px-4 py-3 font-data
                     text-ledger text-sm focus:outline-none focus:border-nigerian
                     appearance-none"
        >
          {Object.entries(CATEGORY_LABELS).map(([key, label]) => (
            <option key={key} value={key}>{label}</option>
          ))}
        </select>
      </div>

      <div>
        <label className="font-data text-ghost text-xs block mb-2">
          Description
          <span className="ml-2 text-rule">{description.length}/200</span>
        </label>
        <textarea
          value={description}
          onChange={e => setDescription(e.target.value)}
          maxLength={200}
          rows={4}
          placeholder="What is this payment for?"
          className="w-full bg-paper border border-rule px-4 py-3
                     text-ledger text-sm placeholder:text-ghost resize-none
                     focus:outline-none focus:border-nigerian"
        />
      </div>

      <button
        onClick={submit}
        disabled={!valid}
        className={`w-full h-14 font-data text-xs tracking-widest border
                    transition-colors
                    ${valid
                      ? 'border-nigerian text-nigerian hover:bg-nigerian hover:text-ink'
                      : 'border-rule text-ghost cursor-not-allowed'}`}
      >
        SUBMIT PROPOSAL
      </button>
    </div>
  )
}

// ── Deposit tab ───────────────────────────────────────────────────────────────
function DepositTab({
  university, provider, onTx,
}: {
  university: string
  provider: AnchorProvider
  onTx: (t: TxState) => void
}) {
  const [amount, setAmount] = useState('')
  const valid = parseFloat(amount) > 0

  async function submit() {
    if (!valid) return
    onTx({ status: 'pending' })
    try {
      const sig = await depositFunds(provider, university, parseFloat(amount))
      onTx({ status: 'ok', sig })
      setAmount('')
    } catch (e: any) {
      onTx({ status: 'err', msg: e?.message || 'Unknown error' })
    }
  }

  return (
    <div className="space-y-6 py-2">
      <p className="text-ghost text-sm leading-relaxed">
        Deposit USDC from your wallet into the treasury vault.
        Ensure your wallet holds devnet USDC before proceeding.
      </p>

      <div>
        <label className="font-data text-ghost text-xs block mb-2">
          Amount (USDC)
        </label>
        <input
          type="number"
          min="0"
          step="0.01"
          value={amount}
          onChange={e => setAmount(e.target.value)}
          placeholder="0.00"
          className="w-full bg-paper border border-rule px-4 py-3 font-data
                     text-ledger text-sm placeholder:text-ghost
                     focus:outline-none focus:border-nigerian"
        />
      </div>

      <button
        onClick={submit}
        disabled={!valid}
        className={`w-full h-14 font-data text-xs tracking-widest border
                    transition-colors
                    ${valid
                      ? 'border-nigerian text-nigerian hover:bg-nigerian hover:text-ink'
                      : 'border-rule text-ghost cursor-not-allowed'}`}
      >
        DEPOSIT USDC
      </button>
    </div>
  )
}

// ── Root admin content ────────────────────────────────────────────────────────
function AdminContent() {
  const params   = useSearchParams()
  const university = params.get('treasury') || 'uniben'

  const { publicKey, signTransaction, signAllTransactions, connected } = useWallet()
  const { connection } = useConnection()

  const [tab,       setTab]       = useState<Tab>('sign')
  const [treasury,  setTreasury]  = useState<any>(null)
  const [proposals, setProposals] = useState<any[]>([])
  const [loading,   setLoading]   = useState(true)
  const [tx,        setTx]        = useState<TxState>(null)

  useEffect(() => {
    async function load() {
      setLoading(true)
      const t = await fetchTreasury(university)
      if (!t) { setLoading(false); return }
      setTreasury(t)
      const count = typeof t.proposalCount?.toNumber === 'function'
        ? t.proposalCount.toNumber()
        : Number(t.proposalCount)
      const p = await fetchAllProposals(t.pda, count)
      setProposals(p)
      setLoading(false)
    }
    load()
  }, [university])

  // Build AnchorProvider from connected wallet
  const provider = connected && publicKey && signTransaction && signAllTransactions
    ? new AnchorProvider(
        connection,
        { publicKey, signTransaction, signAllTransactions } as any,
        { commitment: 'confirmed' }
      )
    : null

  // Check if connected wallet is a registered exec
  const isExec = treasury && publicKey
    ? treasury.signers.some((s: any) => s.toString() === publicKey.toString())
    : false

  const TABS: { key: Tab; label: string }[] = [
    { key: 'sign',    label: 'SIGN'    },
    { key: 'propose', label: 'PROPOSE' },
    { key: 'deposit', label: 'DEPOSIT' },
  ]

  return (
    <main className="min-h-screen bg-ink">

      {/* ── Header ──────────────────────────────────────────────────────── */}
      <header className="border-b border-rule px-6 py-4 flex items-center justify-between">
        <Link
          href={`/${university}`}
          className="font-data text-ghost text-xs"
        >
          ← {university.toUpperCase()}
        </Link>
        <WalletMultiButton />
      </header>

      <div className="px-6 pt-8 pb-28">

        <p className="font-data text-ghost text-xs tracking-widest uppercase mb-2">
          Exec Panel
        </p>
        <h1 className="font-display text-2xl font-bold text-ledger mb-8">
          {university.toUpperCase()} Admin
        </h1>

        {/* ── Tx status banner ──────────────────────────────────────────── */}
        <TxBanner tx={tx} onDismiss={() => setTx(null)} />

        {/* ── Pending tx overlay ────────────────────────────────────────── */}
        {tx?.status === 'pending' && (
          <div className="border border-rule px-4 py-3 mb-6">
            <p className="font-data text-ghost text-xs animate-pulse">
              BROADCASTING TRANSACTION...
            </p>
          </div>
        )}

        {/* ── Not connected ─────────────────────────────────────────────── */}
        {!connected && (
          <div className="border border-rule p-6">
            <p className="font-data text-ghost text-xs tracking-widest uppercase mb-4">
              Connect wallet to continue
            </p>
            <p className="text-ghost text-sm mb-6 leading-relaxed max-w-xs">
              Connect your registered exec wallet to sign proposals,
              create new proposals, or deposit USDC.
            </p>
            <WalletMultiButton />
          </div>
        )}

        {/* ── Connected but loading ─────────────────────────────────────── */}
        {connected && loading && (
          <div className="space-y-3 animate-pulse">
            <div className="h-4 bg-paper w-32" />
            <div className="h-4 bg-paper w-48" />
            <div className="h-4 bg-paper w-24" />
          </div>
        )}

        {/* ── Connected, treasury not found ─────────────────────────────── */}
        {connected && !loading && !treasury && (
          <div className="border border-void px-4 py-4">
            <p className="font-data text-void text-xs tracking-widest uppercase mb-2">
              Treasury not found
            </p>
            <p className="text-ghost text-sm">
              No on-chain treasury exists for "{university}".
            </p>
          </div>
        )}

        {/* ── Connected, not an exec ────────────────────────────────────── */}
        {connected && !loading && treasury && !isExec && (
          <div className="border border-void px-4 py-4">
            <p className="font-data text-void text-xs tracking-widest uppercase mb-2">
              Wallet not authorized
            </p>
            <p className="font-data text-ghost text-xs break-all mb-2">
              {publicKey?.toString()}
            </p>
            <p className="text-ghost text-sm">
              This wallet is not registered as an exec signer for this treasury.
            </p>
          </div>
        )}

        {/* ── Connected and authorized ──────────────────────────────────── */}
        {connected && !loading && treasury && isExec && provider && (
          <>
            {/* Exec identity */}
            <div className="border border-rule px-4 py-3 mb-6 flex items-center justify-between">
              <p className="font-data text-ghost text-xs">Signed in as</p>
              <p className="font-data text-nigerian text-xs">
                {abbreviate(publicKey!.toString())}
              </p>
            </div>

            {/* Tab strip */}
            <div className="flex border-b border-rule mb-6">
              {TABS.map(t => (
                <button
                  key={t.key}
                  onClick={() => { setTab(t.key); setTx(null) }}
                  className={`flex-1 font-data text-xs tracking-widest py-3
                              border-b-2 transition-colors ${
                    tab === t.key
                      ? 'text-ledger border-nigerian'
                      : 'text-ghost border-transparent'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>

            {/* Tab content */}
            {tab === 'sign' && (
              <SignTab
                university={university}
                treasury={treasury}
                proposals={proposals}
                provider={provider}
                onTx={setTx}
              />
            )}
            {tab === 'propose' && (
              <ProposeTab
                university={university}
                provider={provider}
                onTx={setTx}
              />
            )}
            {tab === 'deposit' && (
              <DepositTab
                university={university}
                provider={provider}
                onTx={setTx}
              />
            )}
          </>
        )}

      </div>
    </main>
  )
}

export default function AdminPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-ink" />}>
      <AdminContent />
    </Suspense>
  )
}
