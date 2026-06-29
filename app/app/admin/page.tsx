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

type Tab     = 'sign' | 'propose' | 'deposit'
type TxState = 'idle' | 'loading' | 'success' | 'error'

// ── Sub-components ────────────────────────────────────────────────────────────

function TxResult({ state, sig, error }: { state: TxState; sig: string; error: string }) {
  if (state === 'loading') return (
    <p className="font-data text-ghost text-xs mt-3 animate-pulse">
      Awaiting confirmation...
    </p>
  )
  if (state === 'success') return (
    <div className="mt-3 border border-nigerian p-3">
      <p className="font-data text-nigerian text-xs mb-1 tracking-widest">CONFIRMED</p>
      <a
        href={`${EXPLORER}/${sig}?cluster=devnet`}
        target="_blank"
        rel="noopener noreferrer"
        className="font-data text-xs text-ghost hover:text-uniben break-all"
      >
        {sig.slice(0, 24)}...{sig.slice(-8)} →
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

// Mobile: show Phantom deep link instead of wallet modal
function MobileWalletGate({ currentUrl }: { currentUrl: string }) {
  const phantomBrowserUrl =
    `https://phantom.app/ul/browse/${encodeURIComponent(currentUrl)}` +
    `?ref=${encodeURIComponent('https://levyledger.vercel.app')}`

  return (
    <div className="space-y-6">
      {/* Primary action */}
      <div className="border border-uniben p-6">
        <p className="font-data text-uniben text-xs tracking-widest uppercase mb-3">
          Step 1
        </p>
        <p className="font-display font-semibold text-ledger text-lg mb-2">
          Open in Phantom App
        </p>
        <p className="text-body text-sm mb-5 leading-relaxed">
          Mobile browsers cannot connect to Phantom directly. You need to open
          this page inside the Phantom app's built-in browser.
        </p>
        <a
          href={phantomBrowserUrl}
          className="block w-full text-center font-data text-sm tracking-widest py-4 bg-uniben text-ink hover:opacity-90 transition-opacity"
        >
          OPEN IN PHANTOM →
        </a>
      </div>

      {/* Manual steps */}
      <div className="border border-rule p-5">
        <p className="font-data text-ghost text-xs tracking-widest uppercase mb-4">
          Or do it manually
        </p>
        <div className="space-y-4">
          {[
            { n: '01', text: 'Open the Phantom app on your phone' },
            { n: '02', text: 'Tap the globe/browser icon at the bottom' },
            { n: '03', text: 'Type levyledger.vercel.app/admin?treasury=uniben in the address bar' },
            { n: '04', text: 'Your wallet will connect automatically' },
          ].map(s => (
            <div key={s.n} className="flex gap-4">
              <span className="font-data text-ghost text-xs w-6 shrink-0 mt-0.5">{s.n}</span>
              <p className="text-body text-sm leading-relaxed">{s.text}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Devnet reminder */}
      <div className="border border-rule p-5">
        <p className="font-data text-pending text-xs tracking-widest uppercase mb-3">
          Important
        </p>
        <p className="text-body text-sm leading-relaxed">
          Make sure Phantom is set to <span className="font-data text-ledger">Devnet</span>.
          In Phantom → Settings → Developer Settings → Change Network to Devnet.
        </p>
      </div>
    </div>
  )
}

// ── Main admin content ────────────────────────────────────────────────────────
function AdminContent() {
  const params  = useSearchParams()
  const uniSlug = params.get('treasury') || 'uniben'
  const wallet  = useWallet()
  const program = useAnchorProgram()

  const [isMobile,  setIsMobile]  = useState(false)
  const [currentUrl, setCurrentUrl] = useState('')
  const [treasury,  setTreasury]  = useState<any>(null)
  const [proposals, setProposals] = useState<any[]>([])
  const [loading,   setLoading]   = useState(true)
  const [tab,       setTab]       = useState<Tab>('sign')
  const [confirm,   setConfirm]   = useState<string | null>(null)

  // Deposit state
  const [depositAmt, setDepositAmt] = useState('')
  const [depositTx,  setDepositTx]  = useState<TxState>('idle')
  const [depositSig, setDepositSig] = useState('')
  const [depositErr, setDepositErr] = useState('')

  // Propose state
  const [propAmt,    setPropAmt]    = useState('')
  const [propRecip,  setPropRecip]  = useState('')
  const [propCat,    setPropCat]    = useState('welfare')
  const [propDesc,   setPropDesc]   = useState('')
  const [proposeTx,  setProposeTx]  = useState<TxState>('idle')
  const [proposeSig, setProposeSig] = useState('')
  const [proposeErr, setProposeErr] = useState('')

  // Init state
  const [initSigners, setInitSigners] = useState<string[]>(['','','','',''])
  const [initTx,      setInitTx]      = useState<TxState>('idle')
  const [initSig,     setInitSig]     = useState('')
  const [initErr,     setInitErr]     = useState('')

  // Sign state
  const [signTx,  setSignTx]  = useState<Record<number, TxState>>({})
  const [signSig, setSignSig] = useState<Record<number, string>>({})
  const [signErr, setSignErr] = useState<Record<number, string>>({})

  useEffect(() => {
    // Mobile detection — triggers after mount to avoid SSR mismatch
    const mobile = window.innerWidth < 768 ||
      /Android|iPhone|iPad|iPod/i.test(navigator.userAgent)
    setIsMobile(mobile)
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

  useEffect(() => { loadTreasury() }, [uniSlug])

  const execIndex = treasury
    ? treasury.signers.findIndex(
        (s: any) => s.toString() === wallet.publicKey?.toString()
      )
    : -1
  const isExec = execIndex >= 0

  const pendingProposals = proposals.filter(p => {
    const status = Object.keys(p.status)[0]
    return status === 'active' &&
      !p.signedBy?.[execIndex] &&
      !p.votedAgainst?.[execIndex]
  })

  // ── Transactions ───────────────────────────────────────────────────────────
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
          authority:     wallet.publicKey,
          treasury:      treasuryPDA,
          vault:         vaultPDA,
          usdcMint:      USDC_MINT,
          tokenProgram:  TOKEN_PROGRAM_ID,
          systemProgram: SystemProgram.programId,
        })
        .rpc()
      setInitSig(sig); setInitTx('success')
      await loadTreasury()
    } catch (e: any) {
      setInitErr(parseAnchorError(e)); setInitTx('error')
    }
  }

  async function handleDeposit() {
    if (!program || !wallet.publicKey || !treasury) return
    setDepositTx('loading'); setDepositErr('')
    try {
      const amount        = new BN(Math.floor(parseFloat(depositAmt) * 1_000_000))
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

  async function handlePropose() {
    if (!program || !wallet.publicKey || !treasury) return
    setProposeTx('loading'); setProposeErr('')
    try {
      const amount        = new BN(Math.floor(parseFloat(propAmt) * 1_000_000))
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

  async function handleSign(p: any, approve: boolean) {
    if (!program || !wallet.publicKey || !treasury) return
    const key = `${p.index}-${approve ? 'a' : 'r'}`
    if (confirm === key) {
      setConfirm(null)
      setSignTx(prev  => ({ ...prev, [p.index]: 'loading' }))
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
            signer:                wallet.publicKey,
            treasury:              treasuryPDA,
            proposal:              proposalPDA,
            vault:                 vaultPDA,
            recipientTokenAccount: recipientATA,
            tokenProgram:          TOKEN_PROGRAM_ID,
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

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <main className="min-h-screen bg-ink">
      <header className="border-b border-rule px-6 py-4 flex items-center justify-between">
        <Link href={`/${uniSlug}`} className="font-data text-ghost text-xs">
          ← {uniSlug.toUpperCase()}
        </Link>
        {/* Only show wallet button on desktop or when already inside Phantom browser */}
        {(!isMobile || wallet.publicKey) && <WalletMultiButton />}
      </header>

      <div className="px-6 pt-8 pb-28">
        <p className="font-data text-ghost text-xs tracking-widest uppercase mb-1">
          Exec Panel
        </p>
        <h1 className="font-display text-2xl font-bold text-ledger mb-6">
          {uniSlug.toUpperCase()} Admin
        </h1>

        {/* ── CASE 1: Mobile, no wallet → show Phantom deep link guide ──── */}
        {isMobile && !wallet.publicKey && (
          <MobileWalletGate currentUrl={currentUrl} />
        )}

        {/* ── CASE 2: Desktop, no wallet ────────────────────────────────── */}
        {!isMobile && !wallet.publicKey && (
          <div className="border border-rule p-6 space-y-4">
            <p className="font-data text-ghost text-xs tracking-widest uppercase">
              Connect Wallet
            </p>
            <p className="text-body text-sm leading-relaxed">
              Connect your registered exec wallet to access the admin panel.
              Make sure Phantom is set to <span className="font-data text-ledger">Devnet</span>.
            </p>
            <WalletMultiButton />
          </div>
        )}

        {/* ── CASE 3: Wallet connected, loading treasury ────────────────── */}
        {wallet.publicKey && loading && (
          <div className="space-y-3 animate-pulse">
            <div className="h-3 bg-paper w-32" />
            <div className="h-6 bg-paper w-48" />
          </div>
        )}

        {/* ── CASE 4: No treasury — show init form ─────────────────────── */}
        {wallet.publicKey && !loading && !treasury && (
          <div className="space-y-5">
            <div className="border border-rule p-4">
              <p className="font-data text-pending text-xs mb-2 tracking-widest">
                TREASURY NOT INITIALIZED
              </p>
              <p className="text-body text-sm leading-relaxed">
                No on-chain treasury exists for{' '}
                <span className="font-data text-ledger">{uniSlug}</span> yet.
                Fill in the 5 exec wallet addresses and initialize it below.
                Your wallet must be the LevyLedger admin key.
              </p>
            </div>
            <div className="space-y-3">
              {initSigners.map((s, i) => (
                <div key={i}>
                  <label className="font-data text-ghost text-xs block mb-1">
                    Exec {i + 1} Public Key
                  </label>
                  <input
                    value={s}
                    onChange={e => {
                      const arr = [...initSigners]
                      arr[i] = e.target.value
                      setInitSigners(arr)
                    }}
                    placeholder="Solana wallet address..."
                    className="w-full bg-paper border border-rule text-ledger font-data text-xs px-3 py-3 focus:border-uniben outline-none placeholder:text-ghost"
                  />
                </div>
              ))}
              <button
                onClick={handleInit}
                disabled={initTx === 'loading' || initSigners.some(s => !s.trim())}
                className="w-full bg-uniben text-ink font-data text-xs py-4 tracking-widest hover:opacity-90 disabled:opacity-40 transition-opacity mt-2"
              >
                {initTx === 'loading' ? 'INITIALIZING...' : 'INITIALIZE TREASURY'}
              </button>
            </div>
            <TxResult state={initTx} sig={initSig} error={initErr} />
          </div>
        )}

        {/* ── CASE 5: Treasury exists, not exec ────────────────────────── */}
        {wallet.publicKey && !loading && treasury && !isExec && (
          <div className="border border-rule p-6 space-y-4">
            <p className="font-data text-void text-xs tracking-widest uppercase">
              Not Authorized
            </p>
            <p className="text-body text-sm leading-relaxed">
              The connected wallet is not registered as an exec for this treasury.
            </p>
            <div className="border-t border-rule pt-4">
              <p className="font-data text-ghost text-xs mb-1">Connected wallet</p>
              <p className="font-data text-ledger text-xs break-all">
                {wallet.publicKey.toString()}
              </p>
            </div>
            <p className="text-body text-xs leading-relaxed text-ghost">
              If this is the correct wallet, it may not have been added as an exec
              during treasury initialization. Contact the treasury admin.
            </p>
          </div>
        )}

        {/* ── CASE 6: Treasury exists, is exec — full panel ────────────── */}
        {wallet.publicKey && !loading && treasury && isExec && (
          <div>
            {/* Exec info banner */}
            <div className="border border-rule p-4 mb-6 flex items-center justify-between">
              <div>
                <p className="font-data text-nigerian text-xs tracking-widest uppercase mb-1">
                  Authorized Exec #{execIndex + 1}
                </p>
                <p className="font-data text-ghost text-xs">
                  {wallet.publicKey.toString().slice(0, 8)}...
                  {wallet.publicKey.toString().slice(-6)}
                </p>
              </div>
              <p className="font-data text-ghost text-xs text-right">
                Vault<br />
                <span className="text-uniben font-bold">
                  ${formatUSDC(treasury.availableBalance)}
                </span>
              </p>
            </div>

            {/* Tab bar */}
            <div className="flex border-b border-rule mb-6">
              {(['sign', 'propose', 'deposit'] as Tab[]).map(t => (
                <button
                  key={t}
                  onClick={() => setTab(t)}
                  className={`flex-1 py-3 font-data text-xs tracking-widest transition-colors relative ${
                    tab === t
                      ? 'text-uniben'
                      : 'text-ghost hover:text-body'
                  }`}
                >
                  {t.toUpperCase()}
                  {tab === t && (
                    <span className="absolute bottom-0 left-0 right-0 h-px bg-uniben" />
                  )}
                  {t === 'sign' && pendingProposals.length > 0 && (
                    <span className="ml-1 text-uniben">({pendingProposals.length})</span>
                  )}
                </button>
              ))}
            </div>

            {/* ── SIGN TAB ─────────────────────────────────────────────── */}
            {tab === 'sign' && (
              <div>
                {pendingProposals.length === 0 ? (
                  <div className="pt-6 text-center">
                    <p className="font-data text-ghost text-xs tracking-widest uppercase mb-2">
                      All Clear
                    </p>
                    <p className="text-body text-sm">
                      No proposals waiting for your signature.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-0">
                    {pendingProposals.map(p => {
                      const txState = signTx[p.index] || 'idle'
                      const aKey    = `${p.index}-a`
                      const rKey    = `${p.index}-r`
                      return (
                        <div key={p.index} className="border-b border-rule py-6">
                          <p className="font-data text-ghost text-xs mb-1">
                            Proposal #{p.index} · {Object.keys(p.category)[0]}
                          </p>
                          <p className="font-data text-ledger text-3xl font-bold mb-1">
                            ${formatUSDC(p.amount)}
                            <span className="text-ghost text-sm ml-2 font-normal">USDC</span>
                          </p>
                          <p className="text-body text-sm mb-2">{p.description}</p>
                          <p className="font-data text-ghost text-xs mb-5">
                            {p.signaturesFor}/{treasury.threshold} signatures · {' '}
                            {treasury.threshold - p.signaturesFor} more needed to execute
                          </p>
                          <div className="flex gap-3">
                            <button
                              onClick={() => handleSign(p, true)}
                              disabled={txState === 'loading'}
                              className={`flex-1 py-4 font-data text-xs tracking-widest border transition-colors disabled:opacity-40 ${
                                confirm === aKey
                                  ? 'bg-nigerian text-ink border-nigerian'
                                  : 'border-nigerian text-nigerian hover:bg-nigerian hover:text-ink'
                              }`}
                            >
                              {confirm === aKey ? 'CONFIRM APPROVE' : 'APPROVE'}
                            </button>
                            <button
                              onClick={() => handleSign(p, false)}
                              disabled={txState === 'loading'}
                              className={`flex-1 py-4 font-data text-xs tracking-widest border transition-colors disabled:opacity-40 ${
                                confirm === rKey
                                  ? 'bg-void text-ink border-void'
                                  : 'border-void text-void hover:bg-void hover:text-ink'
                              }`}
                            >
                              {confirm === rKey ? 'CONFIRM REJECT' : 'REJECT'}
                            </button>
                          </div>
                          <TxResult
                            state={txState}
                            sig={signSig[p.index] || ''}
                            error={signErr[p.index] || ''}
                          />
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            )}

            {/* ── PROPOSE TAB ──────────────────────────────────────────── */}
            {tab === 'propose' && (
              <div className="space-y-4">
                <div className="border-b border-rule pb-4 mb-2">
                  <p className="font-data text-ghost text-xs mb-1">Available to spend</p>
                  <p className="font-data text-uniben text-2xl font-bold">
                    ${formatUSDC(treasury.availableBalance)} USDC
                  </p>
                </div>
                <div>
                  <label className="font-data text-ghost text-xs block mb-1">
                    Amount (USDC)
                  </label>
                  <input
                    type="number"
                    value={propAmt}
                    onChange={e => setPropAmt(e.target.value)}
                    placeholder="0.00"
                    className="w-full bg-paper border border-rule text-ledger font-data text-lg px-3 py-3 focus:border-uniben outline-none placeholder:text-ghost"
                  />
                </div>
                <div>
                  <label className="font-data text-ghost text-xs block mb-1">
                    Recipient Wallet
                  </label>
                  <input
                    value={propRecip}
                    onChange={e => setPropRecip(e.target.value)}
                    placeholder="Solana public key..."
                    className="w-full bg-paper border border-rule text-ledger font-data text-xs px-3 py-3 focus:border-uniben outline-none placeholder:text-ghost"
                  />
                </div>
                <div>
                  <label className="font-data text-ghost text-xs block mb-1">Category</label>
                  <select
                    value={propCat}
                    onChange={e => setPropCat(e.target.value)}
                    className="w-full bg-paper border border-rule text-ledger font-data text-xs px-3 py-3 focus:border-uniben outline-none"
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
                    placeholder="What is this for? Be specific."
                    className="w-full bg-paper border border-rule text-ledger text-sm px-3 py-3 focus:border-uniben outline-none resize-none placeholder:text-ghost"
                  />
                </div>
                <button
                  onClick={handlePropose}
                  disabled={proposeTx === 'loading' || !propAmt || !propRecip || !propDesc}
                  className="w-full bg-uniben text-ink font-data text-xs py-4 tracking-widest hover:opacity-90 disabled:opacity-40 transition-opacity"
                >
                  {proposeTx === 'loading' ? 'SUBMITTING...' : 'CREATE PROPOSAL'}
                </button>
                <TxResult state={proposeTx} sig={proposeSig} error={proposeErr} />
              </div>
            )}

            {/* ── DEPOSIT TAB ──────────────────────────────────────────── */}
            {tab === 'deposit' && (
              <div className="space-y-4">
                <div className="border-b border-rule pb-4 mb-2">
                  <p className="font-data text-ghost text-xs mb-1">Current vault balance</p>
                  <p className="font-data text-uniben text-2xl font-bold">
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
                    className="w-full bg-paper border border-rule text-ledger font-data text-lg px-3 py-3 focus:border-uniben outline-none placeholder:text-ghost"
                  />
                </div>
                <div className="border border-rule p-4">
                  <p className="font-data text-pending text-xs tracking-widest uppercase mb-2">
                    Before depositing
                  </p>
                  <p className="text-body text-sm leading-relaxed">
                    Your wallet needs devnet USDC. Get it from{' '}
                    <a
                      href="https://spl-token-faucet.com"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-uniben hover:underline"
                    >
                      spl-token-faucet.com
                    </a>
                    {' '}using mint address:
                  </p>
                  <p className="font-data text-ledger text-xs break-all mt-2">
                    {DEVNET_USDC_MINT}
                  </p>
                </div>
                <button
                  onClick={handleDeposit}
                  disabled={depositTx === 'loading' || !depositAmt}
                  className="w-full bg-uniben text-ink font-data text-xs py-4 tracking-widest hover:opacity-90 disabled:opacity-40 transition-opacity"
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
