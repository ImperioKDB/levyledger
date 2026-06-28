'use client'

import { Suspense, useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { PublicKey, SystemProgram } from '@solana/web3.js'
import { getAssociatedTokenAddress, TOKEN_PROGRAM_ID } from '@solana/spl-token'
import { BN } from '@coral-xyz/anchor'
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui'
import { useWallet } from '@solana/wallet-adapter-react'
import { useAnchorProgram } from '@/hooks/useAnchorProgram'
import { fetchTreasury, fetchAllProposals } from '@/lib/queries'
import { getTreasuryPDA, getVaultPDA, getProposalPDA, formatUSDC } from '@/lib/anchor'
import { DEVNET_USDC_MINT, CATEGORY_LABELS } from '@/lib/constants'
import { parseAnchorError } from '@/lib/errors'

const USDC_MINT = new PublicKey(DEVNET_USDC_MINT)
const EXPLORER  = 'https://explorer.solana.com/tx'

type Tab = 'sign' | 'propose' | 'deposit'
type TxState = 'idle' | 'loading' | 'success' | 'error'

function TxResult({ state, sig, error }: { state: TxState; sig: string; error: string }) {
  if (state === 'loading') return (
    <p className="font-data text-ghost text-xs mt-3 animate-pulse">Awaiting confirmation...</p>
  )
  if (state === 'success') return (
    <div className="mt-3 border border-nigerian p-3">
      <p className="font-data text-nigerian text-xs mb-1">CONFIRMED</p>
      <a
        href={`${EXPLORER}/${sig}?cluster=devnet`}
        target="_blank"
        rel="noopener noreferrer"
        className="font-data text-xs text-ghost hover:text-uniben break-all"
      >
        {sig.slice(0, 20)}...{sig.slice(-8)} →
      </a>
    </div>
  )
  if (state === 'error') return (
    <div className="mt-3 border border-void p-3">
      <p className="font-data text-void text-xs">{error}</p>
    </div>
  )
  return null
}

function AdminContent() {
  const params     = useSearchParams()
  const uniSlug    = params.get('treasury') || 'uniben'
  const wallet     = useWallet()
  const program    = useAnchorProgram()

  const [treasury,  setTreasury]  = useState<any>(null)
  const [proposals, setProposals] = useState<any[]>([])
  const [loading,   setLoading]   = useState(true)
  const [tab,       setTab]       = useState<Tab>('sign')
  const [confirm,   setConfirm]   = useState<string | null>(null)

  // Form state — deposit
  const [depositAmt,  setDepositAmt]  = useState('')
  const [depositTx,   setDepositTx]   = useState<TxState>('idle')
  const [depositSig,  setDepositSig]  = useState('')
  const [depositErr,  setDepositErr]  = useState('')

  // Form state — propose
  const [propAmt,     setPropAmt]     = useState('')
  const [propRecip,   setPropRecip]   = useState('')
  const [propCat,     setPropCat]     = useState('welfare')
  const [propDesc,    setPropDesc]    = useState('')
  const [proposeTx,   setProposeTx]   = useState<TxState>('idle')
  const [proposeSig,  setProposeSig]  = useState('')
  const [proposeErr,  setProposeErr]  = useState('')

  // Form state — init treasury
  const [initSigners, setInitSigners] = useState<string[]>(['','','','',''])
  const [initTx,      setInitTx]      = useState<TxState>('idle')
  const [initSig,     setInitSig]     = useState('')
  const [initErr,     setInitErr]     = useState('')

  // Sign tx state map: proposalIndex → TxState
  const [signTx,      setSignTx]      = useState<Record<number, TxState>>({})
  const [signSig,     setSignSig]     = useState<Record<number, string>>({})
  const [signErr,     setSignErr]     = useState<Record<number, string>>({})

  async function loadTreasury() {
    const t = await fetchTreasury(uniSlug)
    if (!t) { setTreasury(null); setLoading(false); return }
    setTreasury(t)
    const count = typeof t.proposalCount?.toNumber === 'function'
      ? t.proposalCount.toNumber() : Number(t.proposalCount)
    const p = await fetchAllProposals(t.pda, count)
    setProposals(p)
    setLoading(false)
  }

  useEffect(() => { loadTreasury() }, [uniSlug])

  const execIndex = treasury
    ? treasury.signers.findIndex((s: any) => s.toString() === wallet.publicKey?.toString())
    : -1
  const isExec = execIndex >= 0

  const pendingProposals = proposals.filter(p => {
    const status = Object.keys(p.status)[0]
    return status === 'active' &&
      !p.signedBy?.[execIndex] &&
      !p.votedAgainst?.[execIndex]
  })

  // ── Initialize treasury ────────────────────────────────────────────────────
  async function handleInit() {
    if (!program || !wallet.publicKey) return
    setInitTx('loading'); setInitErr('')
    try {
      const signerPubkeys = initSigners.map(s => new PublicKey(s.trim()))
      const [treasuryPDA] = getTreasuryPDA(uniSlug)
      const [vaultPDA]    = getVaultPDA(treasuryPDA)
      const sig = await (program.methods as any)
        .initTreasury(uniSlug, signerPubkeys)
        .accounts({
          authority:    wallet.publicKey,
          treasury:     treasuryPDA,
          vault:        vaultPDA,
          usdcMint:     USDC_MINT,
          tokenProgram: TOKEN_PROGRAM_ID,
          systemProgram: SystemProgram.programId,
        })
        .rpc()
      setInitSig(sig); setInitTx('success')
      await loadTreasury()
    } catch (e: any) {
      setInitErr(parseAnchorError(e)); setInitTx('error')
    }
  }

  // ── Deposit ────────────────────────────────────────────────────────────────
  async function handleDeposit() {
    if (!program || !wallet.publicKey || !treasury) return
    setDepositTx('loading'); setDepositErr('')
    try {
      const amount = new BN(Math.floor(parseFloat(depositAmt) * 1_000_000))
      const [treasuryPDA] = getTreasuryPDA(uniSlug)
      const [vaultPDA]    = getVaultPDA(treasuryPDA)
      const depositorATA  = await getAssociatedTokenAddress(USDC_MINT, wallet.publicKey)
      const sig = await (program.methods as any)
        .deposit(amount)
        .accounts({
          depositor:             wallet.publicKey,
          treasury:              treasuryPDA,
          depositorTokenAccount: depositorATA,
          vault:                 vaultPDA,
          tokenProgram:          TOKEN_PROGRAM_ID,
        })
        .rpc()
      setDepositSig(sig); setDepositTx('success')
      setDepositAmt(''); await loadTreasury()
    } catch (e: any) {
      setDepositErr(parseAnchorError(e)); setDepositTx('error')
    }
  }

  // ── Create proposal ────────────────────────────────────────────────────────
  async function handlePropose() {
    if (!program || !wallet.publicKey || !treasury) return
    setProposeTx('loading'); setProposeErr('')
    try {
      const amount = new BN(Math.floor(parseFloat(propAmt) * 1_000_000))
      const recipientKey  = new PublicKey(propRecip.trim())
      const categoryEnum  = { [propCat]: {} }
      const count         = typeof treasury.proposalCount?.toNumber === 'function'
        ? treasury.proposalCount.toNumber() : Number(treasury.proposalCount)
      const [treasuryPDA] = getTreasuryPDA(uniSlug)
      const [proposalPDA] = getProposalPDA(treasuryPDA, count)
      const sig = await (program.methods as any)
        .createProposal(amount, recipientKey, categoryEnum, propDesc)
        .accounts({
          proposer:      wallet.publicKey,
          treasury:      treasuryPDA,
          proposal:      proposalPDA,
          systemProgram: SystemProgram.programId,
        })
        .rpc()
      setProposeSig(sig); setProposeTx('success')
      setPropAmt(''); setPropRecip(''); setPropDesc('')
      await loadTreasury()
    } catch (e: any) {
      setProposeErr(parseAnchorError(e)); setProposeTx('error')
    }
  }

  // ── Sign proposal ──────────────────────────────────────────────────────────
  async function handleSign(p: any, approve: boolean) {
    if (!program || !wallet.publicKey || !treasury) return
    const key = `${p.index}-${approve ? 'a' : 'r'}`
    if (confirm === key) {
      setConfirm(null)
      setSignTx(prev => ({ ...prev, [p.index]: 'loading' }))
      setSignErr(prev => ({ ...prev, [p.index]: '' }))
      try {
        const [treasuryPDA] = getTreasuryPDA(uniSlug)
        const [proposalPDA] = getProposalPDA(treasuryPDA, p.index)
        const [vaultPDA]    = getVaultPDA(treasuryPDA)
        const recipientATA  = await getAssociatedTokenAddress(
          USDC_MINT, new PublicKey(p.recipient.toString())
        )
        const sig = await (program.methods as any)
          .signProposal(approve)
          .accounts({
            signer:                 wallet.publicKey,
            treasury:               treasuryPDA,
            proposal:               proposalPDA,
            vault:                  vaultPDA,
            recipientTokenAccount:  recipientATA,
            tokenProgram:           TOKEN_PROGRAM_ID,
          })
          .rpc()
        setSignSig(prev  => ({ ...prev, [p.index]: sig }))
        setSignTx(prev   => ({ ...prev, [p.index]: 'success' }))
        await loadTreasury()
      } catch (e: any) {
        setSignErr(prev => ({ ...prev, [p.index]: parseAnchorError(e) }))
        setSignTx(prev  => ({ ...prev, [p.index]: 'error' }))
      }
    } else {
      setConfirm(key)
      setTimeout(() => setConfirm(c => c === key ? null : c), 3000)
    }
  }

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <main className="min-h-screen bg-ink">
      <header className="border-b border-rule px-6 py-4 flex items-center justify-between">
        <Link href={`/${uniSlug}`} className="font-data text-ghost text-xs">
          ← {uniSlug.toUpperCase()}
        </Link>
        <WalletMultiButton />
      </header>

      <div className="px-6 pt-8 pb-28">
        <p className="font-data text-ghost text-xs tracking-widest uppercase mb-2">Exec Panel</p>
        <h1 className="font-display text-2xl font-bold text-ledger mb-6">
          {uniSlug.toUpperCase()} Admin
        </h1>

        {/* ── No wallet ──────────────────────────────────────────────────── */}
        {!wallet.publicKey && (
          <div className="border border-rule p-6">
            <p className="font-data text-ghost text-xs mb-4">Connect your exec wallet to continue</p>
            <WalletMultiButton />
          </div>
        )}

        {/* ── Wallet connected, loading ──────────────────────────────────── */}
        {wallet.publicKey && loading && (
          <p className="font-data text-ghost text-sm animate-pulse">Loading treasury...</p>
        )}

        {/* ── No treasury: init form ─────────────────────────────────────── */}
        {wallet.publicKey && !loading && !treasury && (
          <div>
            <p className="text-body text-sm mb-6">
              No treasury found for <span className="font-data text-ledger">{uniSlug}</span>.
              Initialize it below — you must be the LevyLedger admin.
            </p>
            <div className="space-y-4">
              {initSigners.map((s, i) => (
                <div key={i}>
                  <label className="font-data text-ghost text-xs block mb-1">
                    Exec {i + 1} Wallet Address
                  </label>
                  <input
                    value={s}
                    onChange={e => {
                      const arr = [...initSigners]; arr[i] = e.target.value; setInitSigners(arr)
                    }}
                    placeholder="Solana public key..."
                    className="w-full bg-paper border border-rule text-ledger font-data text-xs px-3 py-2 focus:border-uniben outline-none"
                  />
                </div>
              ))}
              <button
                onClick={handleInit}
                disabled={initTx === 'loading'}
                className="w-full bg-uniben text-ink font-data text-xs py-3 tracking-widest hover:opacity-90 disabled:opacity-50 transition-opacity mt-2"
              >
                {initTx === 'loading' ? 'INITIALIZING...' : 'INITIALIZE TREASURY'}
              </button>
              <TxResult state={initTx} sig={initSig} error={initErr} />
            </div>
          </div>
        )}

        {/* ── Treasury exists, not exec ──────────────────────────────────── */}
        {wallet.publicKey && !loading && treasury && !isExec && (
          <div className="border border-rule p-6">
            <p className="font-data text-void text-xs tracking-widest uppercase mb-2">
              NOT AUTHORIZED
            </p>
            <p className="text-body text-sm">
              Your wallet is not registered as an exec for this treasury.
            </p>
            <p className="font-data text-ghost text-xs mt-3 break-all">
              Connected: {wallet.publicKey.toString()}
            </p>
          </div>
        )}

        {/* ── Treasury exists, is exec: tabs ─────────────────────────────── */}
        {wallet.publicKey && !loading && treasury && isExec && (
          <div>
            {/* Tab bar */}
            <div className="flex border-b border-rule mb-6">
              {(['sign', 'propose', 'deposit'] as Tab[]).map(t => (
                <button
                  key={t}
                  onClick={() => setTab(t)}
                  className={`font-data text-xs px-4 py-3 tracking-widest transition-colors ${
                    tab === t
                      ? 'text-uniben border-b border-uniben -mb-px'
                      : 'text-ghost hover:text-body'
                  }`}
                >
                  {t.toUpperCase()}
                  {t === 'sign' && pendingProposals.length > 0 && (
                    <span className="ml-2 font-data text-xs text-uniben">
                      {pendingProposals.length}
                    </span>
                  )}
                </button>
              ))}
            </div>

            {/* ── SIGN TAB ───────────────────────────────────────────────── */}
            {tab === 'sign' && (
              <div>
                {pendingProposals.length === 0 ? (
                  <p className="font-data text-ghost text-sm pt-4">
                    No proposals waiting for your signature.
                  </p>
                ) : (
                  pendingProposals.map(p => {
                    const txState = signTx[p.index] || 'idle'
                    const aKey    = `${p.index}-a`
                    const rKey    = `${p.index}-r`
                    return (
                      <div key={p.index} className="border-b border-rule py-5">
                        <p className="font-data text-ledger text-2xl font-bold mb-1">
                          ${formatUSDC(p.amount)} USDC
                        </p>
                        <p className="text-body text-sm mb-1">{p.description}</p>
                        <p className="font-data text-ghost text-xs mb-4">
                          {p.signaturesFor}/{treasury.threshold} signed ·{' '}
                          {Object.keys(p.category)[0]}
                        </p>
                        <div className="flex gap-3">
                          <button
                            onClick={() => handleSign(p, true)}
                            disabled={txState === 'loading'}
                            className={`flex-1 py-3 font-data text-xs tracking-widest border transition-colors disabled:opacity-50 ${
                              confirm === aKey
                                ? 'bg-nigerian text-ink border-nigerian'
                                : 'border-nigerian text-nigerian hover:bg-nigerian hover:text-ink'
                            }`}
                          >
                            {confirm === aKey ? 'TAP AGAIN TO CONFIRM' : 'APPROVE'}
                          </button>
                          <button
                            onClick={() => handleSign(p, false)}
                            disabled={txState === 'loading'}
                            className={`flex-1 py-3 font-data text-xs tracking-widest border transition-colors disabled:opacity-50 ${
                              confirm === rKey
                                ? 'bg-void text-ink border-void'
                                : 'border-void text-void hover:bg-void hover:text-ink'
                            }`}
                          >
                            {confirm === rKey ? 'TAP AGAIN TO CONFIRM' : 'REJECT'}
                          </button>
                        </div>
                        <TxResult
                          state={txState}
                          sig={signSig[p.index] || ''}
                          error={signErr[p.index] || ''}
                        />
                      </div>
                    )
                  })
                )}
              </div>
            )}

            {/* ── PROPOSE TAB ────────────────────────────────────────────── */}
            {tab === 'propose' && (
              <div className="space-y-4">
                <div>
                  <p className="font-data text-ghost text-xs mb-1">Available in vault</p>
                  <p className="font-data text-uniben text-xl font-bold">
                    ${formatUSDC(treasury.availableBalance)} USDC
                  </p>
                </div>
                <div>
                  <label className="font-data text-ghost text-xs block mb-1">Amount (USDC)</label>
                  <input
                    type="number"
                    value={propAmt}
                    onChange={e => setPropAmt(e.target.value)}
                    placeholder="0.00"
                    className="w-full bg-paper border border-rule text-ledger font-data text-sm px-3 py-2 focus:border-uniben outline-none"
                  />
                </div>
                <div>
                  <label className="font-data text-ghost text-xs block mb-1">Recipient Wallet</label>
                  <input
                    value={propRecip}
                    onChange={e => setPropRecip(e.target.value)}
                    placeholder="Solana public key..."
                    className="w-full bg-paper border border-rule text-ledger font-data text-xs px-3 py-2 focus:border-uniben outline-none"
                  />
                </div>
                <div>
                  <label className="font-data text-ghost text-xs block mb-1">Category</label>
                  <select
                    value={propCat}
                    onChange={e => setPropCat(e.target.value)}
                    className="w-full bg-paper border border-rule text-ledger font-data text-xs px-3 py-2 focus:border-uniben outline-none"
                  >
                    {Object.entries(CATEGORY_LABELS).map(([k, v]) => (
                      <option key={k} value={k}>{v}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="font-data text-ghost text-xs block mb-1">
                    Description ({propDesc.length}/200)
                  </label>
                  <textarea
                    value={propDesc}
                    onChange={e => setPropDesc(e.target.value)}
                    maxLength={200}
                    rows={3}
                    placeholder="What is this for?"
                    className="w-full bg-paper border border-rule text-ledger text-sm px-3 py-2 focus:border-uniben outline-none resize-none"
                  />
                </div>
                <button
                  onClick={handlePropose}
                  disabled={proposeTx === 'loading' || !propAmt || !propRecip || !propDesc}
                  className="w-full bg-uniben text-ink font-data text-xs py-3 tracking-widest hover:opacity-90 disabled:opacity-50 transition-opacity"
                >
                  {proposeTx === 'loading' ? 'SUBMITTING...' : 'CREATE PROPOSAL'}
                </button>
                <TxResult state={proposeTx} sig={proposeSig} error={proposeErr} />
              </div>
            )}

            {/* ── DEPOSIT TAB ────────────────────────────────────────────── */}
            {tab === 'deposit' && (
              <div className="space-y-4">
                <div>
                  <p className="font-data text-ghost text-xs mb-1">Current vault balance</p>
                  <p className="font-data text-uniben text-xl font-bold">
                    ${formatUSDC(treasury.availableBalance)} USDC
                  </p>
                </div>
                <div>
                  <label className="font-data text-ghost text-xs block mb-1">
                    Amount to deposit (USDC)
                  </label>
                  <input
                    type="number"
                    value={depositAmt}
                    onChange={e => setDepositAmt(e.target.value)}
                    placeholder="0.00"
                    className="w-full bg-paper border border-rule text-ledger font-data text-sm px-3 py-2 focus:border-uniben outline-none"
                  />
                </div>
                <p className="font-data text-ghost text-xs">
                  Your wallet must have devnet USDC and a token account for the USDC mint.
                </p>
                <button
                  onClick={handleDeposit}
                  disabled={depositTx === 'loading' || !depositAmt}
                  className="w-full bg-uniben text-ink font-data text-xs py-3 tracking-widest hover:opacity-90 disabled:opacity-50 transition-opacity"
                >
                  {depositTx === 'loading' ? 'DEPOSITING...' : 'DEPOSIT TO VAULT'}
                </button>
                <TxResult state={depositTx} sig={depositSig} error={depositErr} />
              </div>
            )}
          </div>
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
