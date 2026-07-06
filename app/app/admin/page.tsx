'use client'
import { Suspense, useEffect, useState, useRef } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { PublicKey, SystemProgram } from '@solana/web3.js'
import { getAssociatedTokenAddress, TOKEN_PROGRAM_ID } from '@solana/spl-token'
import { BN } from '@coral-xyz/anchor'
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui'
import { useWallet } from '@solana/wallet-adapter-react'
import { toPng } from 'html-to-image'
import { useAnchorProgram } from '@/hooks/useAnchorProgram'
import { fetchTreasury, fetchAllProposals, getLastTreasuryFetchError, getLastTreasuryFetchStack, getBundledIdlAccountNames } from '@/lib/queries'
import * as AnchorPkg from '@coral-xyz/anchor'
import { getTreasuryPDA, getVaultPDA, getProposalPDA, formatUSDC } from '@/lib/anchor'
import { DEVNET_USDC_MINT, CATEGORY_LABELS, ADMIN_KEY } from '@/lib/constants'
import { parseAnchorError } from '@/lib/errors'
import {
  fetchPendingRequests,
  DepartmentRequest,
} from '@/lib/supabase'
import DesktopSidebar from '@/components/DesktopSidebar'
import DesktopTopBar from '@/components/DesktopTopBar'
import { useIsDesktop } from '@/hooks/useIsDesktop'

const USDC_MINT = new PublicKey(DEVNET_USDC_MINT)
const EXPLORER  = 'https://explorer.solana.com/tx'

type Tab     = 'sign' | 'propose'
type TxState = 'idle' | 'loading' | 'success' | 'error'

function TxResult({
  state, sig, error, amount, onClose,
}: { state: TxState; sig: string; error: string; amount?: string; onClose?: () => void }) {
  const receiptRef = useRef<HTMLDivElement>(null)
  const [saving, setSaving] = useState(false)

  async function handleSaveImage() {
    if (!receiptRef.current) return
    setSaving(true)
    try {
      const dataUrl = await toPng(receiptRef.current, { backgroundColor: '#111111', pixelRatio: 2 })
      const link = document.createElement('a')
      link.download = `levyledger-receipt-${sig.slice(0, 8)}.png`
      link.href = dataUrl
      link.click()
    } catch (e) {
      console.error('Failed to save receipt image', e)
    }
    setSaving(false)
  }

  if (state === 'loading') return (
    <div className="mt-6 border border-rule bg-paper p-5 flex flex-col items-center justify-center text-center">
      <span className="font-data text-pending text-xs mb-3">● PROCESSING TRANSACTION</span>
      <div className="w-full h-1 bg-rule overflow-hidden mb-3">
        <div className="h-full w-1/3 bg-pending progress-indeterminate" />
      </div>
      <p className="text-body text-xs">Waiting for block confirmation on Solana Devnet...</p>
    </div>
  )
  if (state === 'success') return (
    <div className="mt-6">
      <div ref={receiptRef} className="border border-nigerian bg-paper p-5">
        <div className="flex items-center justify-between mb-4 pb-2 border-b border-rule">
          <span className="font-data text-nigerian text-xs tracking-widest uppercase">TRANSACTION RECEIPT</span>
          <span className="font-data text-ghost text-[10px]">SUCCESS</span>
        </div>
        <div className="space-y-3">
          {amount && (
            <div>
              <p className="font-data text-ghost text-[10px] uppercase">Amount</p>
              <p className="font-data text-ledger text-lg font-bold">${amount} USDC</p>
            </div>
          )}
          <div>
            <p className="font-data text-ghost text-[10px] uppercase">On-Chain Proof</p>
            <p className="font-data text-body text-xs break-all leading-relaxed bg-lifted p-2 border border-rule">
              {sig}
            </p>
          </div>
        </div>
      </div>
      <div className="flex gap-3 mt-3">
        <a href={`${EXPLORER}/${sig}?cluster=devnet`} target="_blank" rel="noopener noreferrer"
          className="flex-1 text-center font-data text-xs py-3 border border-uniben text-uniben hover:bg-uniben hover:text-ink transition-colors">
          EXPLORER LINK ↗
        </a>
        <button onClick={handleSaveImage} disabled={saving}
          className="flex-1 font-data text-xs py-3 border border-rule text-ghost hover:border-ledger transition-colors disabled:opacity-50">
          {saving ? 'SAVING...' : 'SAVE IMAGE'}
        </button>
        {onClose && (
          <button onClick={onClose} className="flex-1 font-data text-xs py-3 border border-rule text-ghost hover:border-ledger transition-colors">
            DISMISS
          </button>
        )}
      </div>
    </div>
  )
  if (state === 'error') return (
    <div className="mt-6 border border-void bg-paper p-5">
      <p className="font-data text-void text-xs tracking-widest uppercase mb-1">TRANSACTION FAILED</p>
      <p className="font-data text-void text-xs break-all bg-lifted p-2 border border-rule leading-relaxed">{error}</p>
    </div>
  )
  return null
}

function MobileWalletGate({ currentUrl }: { currentUrl: string }) {
  const phantomUrl =
    `https://phantom.app/ul/browse/${encodeURIComponent(currentUrl)}` +
    `?ref=${encodeURIComponent('https://levyledger.vercel.app')}`
  return (
    <div className="space-y-6">
      <div className="border border-uniben p-6">
        <p className="font-data text-uniben text-xs tracking-widest uppercase mb-3">Step 1</p>
        <p className="font-display font-semibold text-ledger text-lg mb-2">Open in Phantom App</p>
        <p className="text-body text-sm mb-5 leading-relaxed">
          Mobile browsers can't connect to Phantom directly.
          Tap below to open this page inside Phantom's built-in browser.
        </p>
        <a href={phantomUrl}
          className="block w-full text-center font-data text-sm tracking-widest py-4 bg-uniben text-ink hover:opacity-90 transition-opacity">
          OPEN IN PHANTOM →
        </a>
      </div>
      <div className="border border-rule p-5">
        <p className="font-data text-ghost text-xs tracking-widest uppercase mb-4">Or manually</p>
        <div className="space-y-4">
          {[
            'Open the Phantom app on your phone',
            'Tap the globe icon at the bottom of the app',
            'Type levyledger.vercel.app/admin in the address bar',
            'Your wallet connects automatically inside the app',
          ].map((text, i) => (
            <div key={i} className="flex gap-4">
              <span className="font-data text-ghost text-xs w-6 shrink-0 mt-0.5">
                {String(i + 1).padStart(2, '0')}
              </span>
              <p className="text-body text-sm leading-relaxed">{text}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function AdminContent() {
  const params  = useSearchParams()
  const uniSlug = params.get('treasury') || 'uniben'
  const wallet  = useWallet()
  const { program, anchorError } = useAnchorProgram()
  const isAdminWallet = wallet.publicKey?.toString() === ADMIN_KEY
  const isDesktop = useIsDesktop()

  const [needsPhantomGuide, setNeedsPhantomGuide] = useState(false)
  const [currentUrl,  setCurrentUrl]  = useState('')
  const [treasury,    setTreasury]    = useState<any>(null)
  const [proposals,   setProposals]   = useState<any[]>([])
  const [loading,     setLoading]     = useState(true)
  const [tab,         setTab]         = useState<Tab>('sign')
  const [confirm,     setConfirm]     = useState<string | null>(null)

  const [propAmt,     setPropAmt]     = useState('')
  const [propRecip,   setPropRecip]   = useState('')
  const [propCat,     setPropCat]     = useState('welfare')
  const [propDesc,    setPropDesc]    = useState('')
  const [proposeTx,   setProposeTx]   = useState<TxState>('idle')
  const [proposeSig,  setProposeSig]  = useState('')
  const [proposeErr,  setProposeErr]  = useState('')
  const [successPropAmt, setSuccessPropAmt] = useState('')

  const [initSigners, setInitSigners] = useState<string[]>(['','','','',''])
  const [initSlug,    setInitSlug]    = useState(uniSlug)
  const [initTx,      setInitTx]      = useState<TxState>('idle')
  const [initSig,     setInitSig]     = useState('')
  const [initErr,     setInitErr]     = useState('')

  const [signTx,      setSignTx]      = useState<Record<number, TxState>>({})
  const [signSig,     setSignSig]     = useState<Record<number, string>>({})
  const [signErr,     setSignErr]     = useState<Record<number, string>>({})

  const [requests,        setRequests]        = useState<DepartmentRequest[]>([])
  const [requestsLoading, setRequestsLoading] = useState(true)
  const [reviewTx,        setReviewTx]        = useState<Record<string, TxState>>({})
  const [reviewErr,       setReviewErr]       = useState<Record<string, string>>({})

  useEffect(() => {
    const win = window as any
    const phantomInjected =
      win.solana?.isPhantom === true ||
      win.phantom?.solana?.isPhantom === true
    const mobile =
      /Android|iPhone|iPad|iPod/i.test(navigator.userAgent) ||
      window.innerWidth < 768
    setNeedsPhantomGuide(mobile && !phantomInjected)
    setCurrentUrl(window.location.href)
  }, [])

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

  async function loadRequests() {
    if (!isAdminWallet) { setRequestsLoading(false); return }
    try {
      const r = await fetchPendingRequests()
      setRequests(r)
    } catch (e) {
      console.error('[requests] failed to load', e)
    }
    setRequestsLoading(false)
  }

  useEffect(() => { loadTreasury() }, [uniSlug])
  useEffect(() => { loadRequests() }, [isAdminWallet])

  const execIndex = treasury
    ? treasury.signers.findIndex((s: any) => s.toString() === wallet.publicKey?.toString())
    : -1
  const isExec = execIndex >= 0

  const pendingProposals = proposals.filter(p => {
    if (!isExec || execIndex === -1) return false
    const status = Object.keys(p.status)[0]
    return status === 'active' && !p.signedBy?.[execIndex] && !p.votedAgainst?.[execIndex]
  })

  async function handleInit() {
    if (!wallet.publicKey) return
    if (!program) {
      setInitErr('Program not ready. Please refresh the page and try again.')
      setInitTx('error'); return
    }
    setInitTx('loading'); setInitErr('')
    try {
      const signerPubkeys = initSigners.map(s => new PublicKey(s.trim()))
      const [treasuryPDA] = getTreasuryPDA(initSlug)
      const [vaultPDA]    = getVaultPDA(treasuryPDA)
      const sig = await (program.methods as any)
        .initTreasury(initSlug, signerPubkeys)
        .accounts({
          authority: wallet.publicKey, treasury: treasuryPDA, vault: vaultPDA,
          usdcMint: USDC_MINT, tokenProgram: TOKEN_PROGRAM_ID, systemProgram: SystemProgram.programId,
        })
        .rpc()
      setInitSig(sig); setInitTx('success')
      await loadTreasury()
    } catch (e: any) {
      setInitErr(parseAnchorError(e)); setInitTx('error')
    }
  }

  async function handleReviewRequest(req: DepartmentRequest, action: 'approve' | 'reject') {
    if (!wallet.publicKey || !wallet.signMessage) return
    setReviewTx(prev => ({ ...prev, [req.id]: 'loading' }))
    setReviewErr(prev => ({ ...prev, [req.id]: '' }))
    try {
      const messageStr = `LevyLedger admin review: ${action} request ${req.id}`
      const messageBytes = new TextEncoder().encode(messageStr)
      const signatureBytes = await wallet.signMessage(messageBytes)
      const signatureHex = Buffer.from(signatureBytes).toString('hex')

      const r = await fetch('/api/requests/review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          walletAddress: wallet.publicKey.toString(),
          requestId: req.id,
          action,
          signature: signatureHex,
          message: messageStr,
        }),
      })
      const res = await r.json()
      if (!r.ok) throw new Error(res.error || 'Failed to update request.')

      setReviewTx(prev => ({ ...prev, [req.id]: 'success' }))
      await loadRequests()
    } catch (e: any) {
      setReviewErr(prev => ({ ...prev, [req.id]: e.message || 'Failed to update' }))
      setReviewTx(prev => ({ ...prev, [req.id]: 'error' }))
    }
  }

  async function handleMarkApproved(req: DepartmentRequest) {
    await handleReviewRequest(req, 'approve')
  }

  async function handleReject(req: DepartmentRequest) {
    await handleReviewRequest(req, 'reject')
  }

  async function handlePropose() {
    if (!wallet.publicKey) return
    if (!program) {
      setProposeErr('Program not ready. Please refresh and try again.')
      setProposeTx('error'); return
    }
    if (!treasury) return
    setProposeTx('loading'); setProposeErr('')
    try {
      const currentAmt = propAmt
      const amount = new BN(Math.floor(parseFloat(currentAmt) * 1_000_000))
      const recipientKey = new PublicKey(propRecip.trim())
      const categoryEnum = { [propCat]: {} }
      const count = typeof treasury.proposalCount?.toNumber === 'function'
        ? treasury.proposalCount.toNumber() : Number(treasury.proposalCount)
      const [treasuryPDA] = getTreasuryPDA(uniSlug)
      const [proposalPDA] = getProposalPDA(treasuryPDA, count)
      const sig = await (program.methods as any)
        .createProposal(amount, recipientKey, categoryEnum, propDesc)
        .accounts({
          proposer: wallet.publicKey, treasury: treasuryPDA,
          proposal: proposalPDA, systemProgram: SystemProgram.programId,
        })
        .rpc()
      setSuccessPropAmt(currentAmt)
      setProposeSig(sig); setProposeTx('success')
      setPropAmt(''); setPropRecip(''); setPropDesc('')
      await loadTreasury()
    } catch (e: any) {
      setProposeErr(parseAnchorError(e)); setProposeTx('error')
    }
  }

  async function handleSign(p: any, approve: boolean) {
    if (!wallet.publicKey) return
    if (!program) {
      setSignErr(prev => ({ ...prev, [p.index]: 'Program not ready. Please refresh.' }))
      setSignTx(prev  => ({ ...prev, [p.index]: 'error' }))
      return
    }
    if (!treasury) return
    const key = `${p.index}-${approve ? 'a' : 'r'}`
    if (confirm === key) {
      setConfirm(null)
      setSignTx(prev  => ({ ...prev, [p.index]: 'loading' }))
      setSignErr(prev => ({ ...prev, [p.index]: '' }))
      try {
        const [treasuryPDA] = getTreasuryPDA(uniSlug)
        const [proposalPDA] = getProposalPDA(treasuryPDA, p.index)
        const [vaultPDA]    = getVaultPDA(treasuryPDA)
        const recipientATA  = await getAssociatedTokenAddress(USDC_MINT, new PublicKey(p.recipient.toString()))
        const sig = await (program.methods as any)
          .signProposal(approve)
          .accounts({
            signer: wallet.publicKey, treasury: treasuryPDA, proposal: proposalPDA,
            vault: vaultPDA, recipientTokenAccount: recipientATA, tokenProgram: TOKEN_PROGRAM_ID,
          })
          .rpc()
        setSignSig(prev => ({ ...prev, [p.index]: sig }))
        setSignTx(prev  => ({ ...prev, [p.index]: 'success' }))
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

  const innerContent = (
    <div className="max-w-3xl mx-auto">
      <p className="font-data text-ghost text-xs tracking-widest uppercase mb-1">Exec Panel</p>
      <h1 className="font-display text-2xl font-bold text-ledger mb-6">{uniSlug.toUpperCase()} Admin</h1>

      <div className="border border-pending bg-paper px-4 py-3 mb-6 flex gap-3 items-start">
        <span className="font-data text-pending text-xs mt-0.5">!</span>
        <div>
          <p className="font-data text-pending text-xs tracking-widest uppercase mb-1">Devnet Notice</p>
          <p className="text-body text-xs leading-relaxed">
            Phantom may show a <span className="font-data text-ledger">"Failed to simulate"</span> warning
            on devnet. This is expected — not an error. Tap{' '}
            <span className="font-data text-ledger">Yes, confirm (unsafe)</span> to proceed.
            All funds here are test tokens with no real value.
          </p>
        </div>
      </div>

      {needsPhantomGuide && !wallet.publicKey && (
        <MobileWalletGate currentUrl={currentUrl} />
      )}

      {!needsPhantomGuide && !wallet.publicKey && (
        <div className="border border-rule p-6 space-y-4">
          <p className="font-data text-ghost text-xs tracking-widest uppercase">Connect Wallet</p>
          <p className="text-body text-sm leading-relaxed">
            Connect your registered exec wallet. Make sure Phantom is on{' '}
            <span className="font-data text-ledger">Devnet</span>.
          </p>
          <WalletMultiButton />
        </div>
      )}

      {wallet.publicKey && isAdminWallet && (
        <div className="mb-8 border border-uniben p-4">
          <p className="font-data text-uniben text-xs tracking-widest uppercase mb-3">Department Requests</p>
          {requestsLoading ? (
            <p className="font-data text-ghost text-xs animate-pulse">Loading requests...</p>
          ) : requests.length === 0 ? (
            <p className="text-body text-sm">No pending requests.</p>
          ) : (
            requests.map(req => {
              const rTx = reviewTx[req.id] || 'idle'
              return (
                <div key={req.id} className="border-t border-rule py-4 first:border-t-0 first:pt-0">
                  <p className="font-display font-semibold text-ledger text-sm">{req.department}</p>
                  <p className="text-ghost text-xs mb-2">{req.university}</p>
                  <p className="font-data text-uniben text-xs mb-3">{req.slug}</p>
                  <details className="mb-3">
                    <summary className="font-data text-ghost text-xs cursor-pointer">View 5 exec addresses</summary>
                    <div className="mt-2 space-y-1">
                      {[req.exec_1, req.exec_2, req.exec_3, req.exec_4, req.exec_5].map((e, i) => (
                        <p key={i} className="font-data text-ledger text-xs break-all">{e}</p>
                      ))}
                    </div>
                  </details>
                  <div className="flex gap-2">
                    <button
                      onClick={() => { setInitSlug(req.slug); setInitSigners([req.exec_1, req.exec_2, req.exec_3, req.exec_4, req.exec_5]) }}
                      className="flex-1 py-2 font-data text-xs border border-uniben text-uniben hover:bg-uniben hover:text-ink transition-colors"
                    >LOAD INTO INIT FORM</button>
                    <button
                      onClick={() => handleMarkApproved(req)} disabled={rTx === 'loading'}
                      className="flex-1 py-2 font-data text-xs border border-nigerian text-nigerian hover:bg-nigerian hover:text-ink transition-colors disabled:opacity-40"
                    >MARK APPROVED</button>
                    <button
                      onClick={() => handleReject(req)} disabled={rTx === 'loading'}
                      className="flex-1 py-2 font-data text-xs border border-void text-void hover:bg-void hover:text-ink transition-colors disabled:opacity-40"
                    >REJECT</button>
                  </div>
                  {reviewErr[req.id] && <p className="font-data text-void text-xs mt-2">{reviewErr[req.id]}</p>}
                </div>
              )
            })
          )}
        </div>
      )}

      {wallet.publicKey && loading && (
        <div className="space-y-3 animate-pulse">
          <div className="h-3 bg-paper w-32" />
          <div className="h-6 bg-paper w-48" />
        </div>
      )}

      {wallet.publicKey && !loading && !treasury && (
        <div className="space-y-5">
          <div className="border border-rule p-4">
            <p className="font-data text-pending text-xs mb-2 tracking-widest uppercase">Treasury Not Initialized</p>
            <p className="text-body text-sm leading-relaxed mb-3">
              No treasury exists for{' '}
              <span className="font-data text-ledger">{initSlug}</span> yet.
              Enter the slug and 5 exec wallet addresses below, or load a request from the queue above.
            </p>
            {getLastTreasuryFetchError() && (
              <div className="bg-lifted border border-void p-3 mb-3">
                <p className="font-data text-void text-xs tracking-widest uppercase mb-1">Debug: Fetch Error</p>
                <p className="font-data text-void text-xs break-all">{getLastTreasuryFetchError()}</p>
              </div>
            )}
            <div className="bg-lifted p-3">
              <p className="font-data text-ghost text-xs">
                Public key = wallet address. Each exec needs a separate Phantom account.
              </p>
            </div>
          </div>
          {!program && wallet.publicKey && (
            <div className="border border-pending p-3 space-y-2">
              <p className="font-data text-pending text-xs tracking-widest uppercase">Program Loading</p>
              {anchorError ? (
                <p className="font-data text-void text-xs break-all">ERROR: {anchorError}</p>
              ) : (
                <p className="text-body text-xs">Connecting to the Solana program...</p>
              )}
            </div>
          )}
          <div className="space-y-3">
            <div>
              <label className="font-data text-ghost text-xs block mb-1">Treasury Slug</label>
              <input value={initSlug} onChange={e => setInitSlug(e.target.value)} placeholder="e.g. uniben-eng"
                className="w-full bg-paper border border-rule text-ledger font-data text-xs px-3 py-3 focus:border-uniben outline-none placeholder:text-ghost" />
            </div>
            {initSigners.map((s, i) => (
              <div key={i}>
                <label className="font-data text-ghost text-xs block mb-1">Exec {i + 1} Wallet Address</label>
                <input value={s} onChange={e => { const arr = [...initSigners]; arr[i] = e.target.value; setInitSigners(arr) }}
                  placeholder="e.g. 4enpQEjX2bLFcXtPkcFg..."
                  className="w-full bg-paper border border-rule text-ledger font-data text-xs px-3 py-3 focus:border-uniben outline-none placeholder:text-ghost" />
              </div>
            ))}
            <button onClick={handleInit}
              disabled={initTx === 'loading' || !initSlug.trim() || initSigners.some(s => !s.trim()) || !wallet.publicKey}
              className="w-full bg-uniben text-ink font-data text-xs py-4 tracking-widest hover:opacity-90 disabled:opacity-40 transition-opacity mt-2">
              {initTx === 'loading' ? 'INITIALIZING...' : 'INITIALIZE TREASURY'}
            </button>
          </div>
          <TxResult state={initTx} sig={initSig} error={initErr} />
        </div>
      )}

      {wallet.publicKey && !loading && treasury && !isExec && (
        <div className="border border-rule p-6 space-y-4">
          <p className="font-data text-ghost text-xs tracking-widest uppercase">Not An Exec</p>
          <p className="text-body text-sm leading-relaxed">
            This wallet isn't one of the 5 registered exec signers for {uniSlug.toUpperCase()}.
            This page is for signing and proposing spending only.
          </p>
          <Link href={`/${uniSlug}/deposit`}
            className="inline-block font-data text-xs tracking-widest py-3 px-6 border border-uniben text-uniben hover:bg-uniben hover:text-ink transition-colors">
            GO TO DEPOSIT →
          </Link>
        </div>
      )}

      {wallet.publicKey && !loading && treasury && isExec && (
        <div>
          <div className="border border-rule p-4 mb-6 flex items-center justify-between">
            <div>
              <p className="font-data text-nigerian text-xs tracking-widest uppercase mb-1">Authorized · Exec #{execIndex + 1}</p>
              <p className="font-data text-ghost text-xs">{wallet.publicKey.toString().slice(0, 8)}...{wallet.publicKey.toString().slice(-6)}</p>
            </div>
            <div className="text-right">
              <p className="font-data text-ghost text-xs mb-1">Available</p>
              <p className="font-data text-uniben text-sm font-bold">${formatUSDC(treasury.availableBalance)}</p>
              <p className="font-data text-ghost text-[10px] mt-1">Reserved ${formatUSDC(treasury.reservedBalance)}</p>
            </div>
          </div>

          <div className="flex border-b border-rule mb-6 overflow-x-auto no-scrollbar">
            {(['sign', 'propose'] as Tab[]).map(t => (
              <button key={t} onClick={() => setTab(t)}
                className={`shrink-0 px-4 py-3 font-data text-xs tracking-widest transition-colors relative ${tab === t ? 'text-uniben' : 'text-ghost hover:text-body'}`}>
                {t.toUpperCase()}
                {tab === t && <span className="absolute bottom-0 left-0 right-0 h-px bg-uniben" />}
                {t === 'sign' && pendingProposals.length > 0 && <span className="ml-1 text-uniben">({pendingProposals.length})</span>}
              </button>
            ))}
          </div>

          {tab === 'sign' && isExec && (
            <div>
              {pendingProposals.length === 0 ? (
                <div className="pt-6 text-center">
                  <p className="font-data text-ghost text-xs tracking-widest uppercase mb-2">All Clear</p>
                  <p className="text-body text-sm">No proposals waiting for your signature.</p>
                </div>
              ) : (
                pendingProposals.map(p => {
                  const txState = signTx[p.index] || 'idle'
                  const aKey = `${p.index}-a`, rKey = `${p.index}-r`
                  return (
                    <div key={p.index} className="border-b border-rule py-6">
                      <p className="font-data text-ghost text-xs mb-1">Proposal #{p.index} · {Object.keys(p.category)[0]}</p>
                      <p className="font-data text-ledger text-3xl font-bold mb-1">${formatUSDC(p.amount)}<span className="text-ghost text-sm ml-2 font-normal">USDC</span></p>
                      <p className="text-body text-sm mb-2">{p.description}</p>
                      <p className="font-data text-ghost text-xs mb-5">{p.signaturesFor}/{treasury.threshold} signed · {treasury.threshold - p.signaturesFor} more needed</p>
                      {txState === 'idle' ? (
                        <div className="flex gap-3">
                          <button onClick={() => handleSign(p, true)} disabled={signTx[p.index] === 'loading'}
                            className={`flex-1 py-4 font-data text-xs tracking-widest border transition-colors disabled:opacity-40 ${confirm === aKey ? 'bg-nigerian text-ink border-nigerian' : 'border-nigerian text-nigerian hover:bg-nigerian hover:text-ink'}`}>
                            {confirm === aKey ? 'CONFIRM APPROVE' : 'APPROVE'}
                          </button>
                          <button onClick={() => handleSign(p, false)} disabled={signTx[p.index] === 'loading'}
                            className={`flex-1 py-4 font-data text-xs tracking-widest border transition-colors disabled:opacity-40 ${confirm === rKey ? 'bg-void text-ink border-void' : 'border-void text-void hover:bg-void hover:text-ink'}`}>
                            {confirm === rKey ? 'CONFIRM REJECT' : 'REJECT'}
                          </button>
                        </div>
                      ) : (
                        <TxResult state={txState} sig={signSig[p.index] || ''} error={signErr[p.index] || ''} amount={formatUSDC(p.amount)}
                          onClose={() => { setSignTx(prev => ({ ...prev, [p.index]: 'idle' })); setSignSig(prev => ({ ...prev, [p.index]: '' })); setSignErr(prev => ({ ...prev, [p.index]: '' })) }} />
                      )}
                    </div>
                  )
                })
              )}
            </div>
          )}

          {tab === 'propose' && isExec && (
            <div className="space-y-4">
              {proposeTx === 'idle' ? (
                <>
                  <div className="border-b border-rule pb-4">
                    <p className="font-data text-ghost text-xs mb-1">Available to spend</p>
                    <p className="font-data text-uniben text-2xl font-bold">${formatUSDC(treasury.availableBalance)} USDC</p>
                  </div>
                  <div className="border border-rule p-3 bg-paper/20">
                    <p className="text-body text-xs leading-relaxed">
                      Creating a proposal reserves this amount immediately — it moves from Available
                      to Reserved, not out of the vault. Nothing is actually sent until 3 execs sign.
                      Rejected or expired proposals return the full amount to Available.
                    </p>
                  </div>
                  <div>
                    <label className="font-data text-ghost text-xs block mb-1">Amount (USDC)</label>
                    <input type="number" value={propAmt} onChange={e => setPropAmt(e.target.value)} placeholder="0.00"
                      className="w-full bg-paper border border-rule text-ledger font-data text-lg px-3 py-3 focus:border-uniben outline-none placeholder:text-ghost" />
                  </div>
                  <div>
                    <label className="font-data text-ghost text-xs block mb-1">Recipient Wallet Address</label>
                    <input value={propRecip} onChange={e => setPropRecip(e.target.value)} placeholder="Solana public key..."
                      className="w-full bg-paper border border-rule text-ledger font-data text-xs px-3 py-3 focus:border-uniben outline-none placeholder:text-ghost" />
                  </div>
                  <div>
                    <label className="font-data text-ghost text-xs block mb-1">Category</label>
                    <select value={propCat} onChange={e => setPropCat(e.target.value)}
                      className="w-full bg-paper border border-rule text-ledger font-data text-xs px-3 py-3 focus:border-uniben outline-none">
                      {Object.entries(CATEGORY_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="font-data text-ghost text-xs block mb-1">Description ({propDesc.length}/200)</label>
                    <textarea value={propDesc} onChange={e => setPropDesc(e.target.value)} maxLength={200} rows={3} placeholder="What is this for? Be specific."
                      className="w-full bg-paper border border-rule text-ledger text-sm px-3 py-3 focus:border-uniben outline-none resize-none placeholder:text-ghost" />
                  </div>
                  <button onClick={handlePropose} disabled={!propAmt || !propRecip || !propDesc}
                    className="w-full bg-uniben text-ink font-data text-xs py-4 tracking-widest hover:opacity-90 disabled:opacity-40 transition-opacity">
                    CREATE PROPOSAL
                  </button>
                </>
              ) : (
                <TxResult state={proposeTx} sig={proposeSig} error={proposeErr} amount={successPropAmt}
                  onClose={() => { setProposeTx('idle'); setProposeSig(''); setProposeErr(''); setSuccessPropAmt('') }} />
              )}
            </div>
          )}

        </div>
      )}
    </div>
  )

  return (
    <>
      {!isDesktop && (
        <main className="min-h-screen bg-ink">
          <header className="border-b border-rule px-6 py-4 flex items-center justify-between">
            <Link href={`/${uniSlug}`} className="font-data text-ghost text-xs">← {uniSlug.toUpperCase()}</Link>
            {!needsPhantomGuide && <WalletMultiButton />}
          </header>
          <div className="px-6 pt-8 pb-28">{innerContent}</div>
        </main>
      )}
      {isDesktop && (
        <div className="flex min-h-screen bg-ink">
          <DesktopSidebar university={uniSlug} isAuthorized={isAdminWallet || isExec} />
          <div className="flex-1 flex flex-col">
            <DesktopTopBar universityName={uniSlug.toUpperCase() + " ADMIN"} connected={!!wallet.publicKey} isAdmin={isAdminWallet} isExec={isExec} />
            <div className="p-8 max-w-4xl w-full mx-auto overflow-y-auto">{innerContent}</div>
          </div>
        </div>
      )}
    </>
  )
}

export default function AdminPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-ink" />}>
      <AdminContent />
    </Suspense>
  )
}


