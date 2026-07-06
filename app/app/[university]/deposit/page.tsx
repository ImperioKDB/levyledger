'use client'

import { useParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { PublicKey } from '@solana/web3.js'
import { getAssociatedTokenAddress, TOKEN_PROGRAM_ID } from '@solana/spl-token'
import { BN } from '@coral-xyz/anchor'
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui'
import { useWallet } from '@solana/wallet-adapter-react'
import { useAnchorProgram } from '@/hooks/useAnchorProgram'
import { fetchTreasury } from '@/lib/queries'
import { fetchFacultyBySlug, fetchProfileByWallet } from '@/lib/supabase'
import { getTreasuryPDA, getVaultPDA, formatUSDC } from '@/lib/anchor'
import { DEVNET_USDC_MINT } from '@/lib/constants'
import { parseAnchorError } from '@/lib/errors'
import { useIsDesktop } from '@/hooks/useIsDesktop'
import BottomNav from '@/components/BottomNav'
import DesktopSidebar from '@/components/DesktopSidebar'
import DesktopTopBar from '@/components/DesktopTopBar'

const USDC_MINT = new PublicKey(DEVNET_USDC_MINT)
const EXPLORER  = 'https://explorer.solana.com/tx'
type TxState = 'idle' | 'loading' | 'success' | 'error'

function TxResult({ state, sig, error, amount, onClose }: {
  state: TxState; sig: string; error: string; amount?: string; onClose?: () => void
}) {
  if (state === 'loading') return (
    <div className="border border-rule bg-paper p-5 animate-pulse flex flex-col items-center justify-center text-center">
      <span className="font-data text-pending text-xs mb-2">● PROCESSING TRANSACTION</span>
      <p className="text-body text-xs">Waiting for block confirmation on Solana Devnet...</p>
    </div>
  )
  if (state === 'success') return (
    <div className="border border-nigerian bg-paper p-5">
      <div className="flex items-center justify-between mb-4 pb-2 border-b border-rule">
        <span className="font-data text-nigerian text-xs tracking-widest uppercase">RECEIPT</span>
        <span className="font-data text-ghost text-[10px]">SUCCESS</span>
      </div>
      {amount && (
        <div className="mb-4">
          <p className="font-data text-ghost text-[10px] uppercase">Amount</p>
          <p className="font-data text-ledger text-lg font-bold">${amount} USDC</p>
        </div>
      )}
      <p className="font-data text-ghost text-[10px] uppercase mb-1">On-Chain Proof</p>
      <p className="font-data text-body text-xs break-all bg-lifted p-2 border border-rule mb-4">{sig}</p>
      <div className="flex gap-3">
        <a href={`${EXPLORER}/${sig}?cluster=devnet`} target="_blank" rel="noopener noreferrer"
          className="flex-1 text-center font-data text-xs py-3 border border-uniben text-uniben hover:bg-uniben hover:text-ink transition-colors">
          EXPLORER LINK ↗
        </a>
        {onClose && (
          <button onClick={onClose} className="flex-1 font-data text-xs py-3 border border-rule text-ghost hover:border-ledger transition-colors">
            DISMISS
          </button>
        )}
      </div>
    </div>
  )
  if (state === 'error') return (
    <div className="border border-void bg-paper p-5">
      <p className="font-data text-void text-xs tracking-widest uppercase mb-1">TRANSACTION FAILED</p>
      <p className="font-data text-void text-xs break-all bg-lifted p-2 border border-rule">{error}</p>
    </div>
  )
  return null
}

export default function DepositPage() {
  const { university } = useParams() as { university: string }
  const wallet = useWallet()
  const { program } = useAnchorProgram()
  const isDesktop = useIsDesktop()

  const [facultyName, setFacultyName] = useState<string | null>(null)
  const [treasury,    setTreasury]    = useState<any>(null)
  const [loading,     setLoading]     = useState(true)

  const [profile, setProfile] = useState<any>(null)
  const [checkingProfile, setCheckingProfile] = useState(false)
  const [regName, setRegName] = useState('')
  const [regMatric, setRegMatric] = useState('')
  const [regTx, setRegTx] = useState<TxState>('idle')
  const [regErr, setRegErr] = useState('')

  const [fundTx,  setFundTx]  = useState<TxState>('idle')
  const [fundSig, setFundSig] = useState('')
  const [fundErr, setFundErr] = useState('')

  const [depositAmt, setDepositAmt] = useState('')
  const [depositTx,  setDepositTx]  = useState<TxState>('idle')
  const [depositSig, setDepositSig] = useState('')
  const [depositErr, setDepositErr] = useState('')
  const [successAmt, setSuccessAmt] = useState('')

  async function loadTreasury() {
    const t = await fetchTreasury(university)
    setTreasury(t)
    setLoading(false)
    const req = await fetchFacultyBySlug(university)
    setFacultyName(req?.department ?? null)
  }

  useEffect(() => { loadTreasury() }, [university])

  useEffect(() => {
    async function checkProfile() {
      if (!wallet.publicKey) { setProfile(null); return }
      setCheckingProfile(true)
      try {
        const p = await fetchProfileByWallet(wallet.publicKey.toString())
        setProfile(p)
      } catch (err) {
        console.error('[profile] check failed:', err)
      }
      setCheckingProfile(false)
    }
    checkProfile()
  }, [wallet.publicKey])

  async function handleRegisterProfile() {
    if (!wallet.publicKey || !wallet.signMessage) return
    setRegTx('loading'); setRegErr('')
    try {
      const messageStr = `Registering LevyLedger profile: ${regName.trim()} (${regMatric.trim()})`
      const messageBytes = new TextEncoder().encode(messageStr)
      const signatureBytes = await wallet.signMessage(messageBytes)
      const signatureHex = Buffer.from(signatureBytes).toString('hex')

      const r = await fetch('/api/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          walletAddress: wallet.publicKey.toString(),
          fullName: regName.trim(),
          matricNumber: regMatric.trim(),
          facultySlug: university,
          signature: signatureHex,
          message: messageStr,
        }),
      })
      const res = await r.json()
      if (!r.ok) throw new Error(res.error || 'Failed to save profile.')

      setProfile({
        wallet_address: wallet.publicKey.toString(),
        full_name: regName.trim(),
        matric_number: regMatric.trim(),
        faculty_slug: university,
      })
      setRegTx('success')
    } catch (e: any) {
      setRegErr(e.message || 'Failed to save profile. Please try again.')
      setRegTx('error')
    }
  }

  async function handleFund() {
    if (!wallet.publicKey) return
    setFundTx('loading'); setFundErr('')
    try {
      const res = await fetch('/api/fund', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ walletAddress: wallet.publicKey.toString() }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Faucet request failed')
      setFundSig(data.signature)
      setFundTx('success')
    } catch (e: any) {
      setFundErr(e.message || 'Faucet request failed')
      setFundTx('error')
    }
  }

  async function handleDeposit() {
    if (!wallet.publicKey) return
    if (!program) {
      setDepositErr('Program not ready. Please refresh and try again.')
      setDepositTx('error'); return
    }
    if (!treasury) return
    setDepositTx('loading'); setDepositErr('')
    try {
      const currentAmt = depositAmt
      const amount = new BN(Math.floor(parseFloat(currentAmt) * 1_000_000))
      const [treasuryPDA] = getTreasuryPDA(university)
      const [vaultPDA]    = getVaultPDA(treasuryPDA)
      const depositorATA  = await getAssociatedTokenAddress(USDC_MINT, wallet.publicKey)
      const sig = await (program.methods as any)
        .deposit(amount)
        .accounts({
          depositor: wallet.publicKey, treasury: treasuryPDA,
          depositorTokenAccount: depositorATA, vault: vaultPDA,
          usdcMint: USDC_MINT, tokenProgram: TOKEN_PROGRAM_ID,
        })
        .rpc()
      setSuccessAmt(currentAmt)
      setDepositSig(sig); setDepositTx('success')
      setDepositAmt(''); await loadTreasury()
    } catch (e: any) {
      setDepositErr(parseAnchorError(e)); setDepositTx('error')
    }
  }

  const displayName = facultyName || university

  const body = (
    <div className="max-w-lg mx-auto">
      <p className="font-data text-ghost text-xs tracking-widest uppercase mb-1">Deposit Dues</p>
      <h1 className="font-display text-2xl font-bold text-ledger mb-6">{displayName}</h1>

      {loading ? (
        <p className="font-data text-ghost text-xs animate-pulse">Loading treasury...</p>
      ) : !treasury ? (
        <p className="text-body text-sm">No on-chain treasury exists for this faculty yet.</p>
      ) : !wallet.publicKey ? (
        <div className="border border-rule p-6 space-y-4">
          <p className="font-data text-ghost text-xs tracking-widest uppercase">Connect Wallet</p>
          <p className="text-body text-sm leading-relaxed">
            Connect any Solana wallet to pay your dues directly into this faculty's treasury.
          </p>
          <WalletMultiButton />
        </div>
      ) : (
        <div className="space-y-4">
          <div className="border-b border-rule pb-4">
            <p className="font-data text-ghost text-xs mb-1">Current vault balance</p>
            <p className="font-data text-uniben text-2xl font-bold">${formatUSDC(treasury.availableBalance)} USDC</p>
          </div>

          {checkingProfile ? (
            <p className="font-data text-ghost text-xs animate-pulse">Verifying student profile...</p>
          ) : !profile ? (
            <div className="space-y-4 border border-uniben p-5 bg-paper/30">
              <p className="font-data text-uniben text-[10px] tracking-widest uppercase">Student Profile Required</p>
              <p className="text-body text-xs leading-relaxed">
                Dues payments on LevyLedger are public and transparent. Register your name and matric number
                once to link them with your connected wallet before continuing.
              </p>
              <div>
                <label className="font-data text-ghost text-xs block mb-1">Full Name</label>
                <input value={regName} onChange={e => setRegName(e.target.value)} placeholder="e.g. Chinedu Okeke"
                  className="w-full bg-ink border border-rule text-ledger font-data text-xs px-3 py-3 focus:border-uniben outline-none placeholder:text-ghost" />
              </div>
              <div>
                <label className="font-data text-ghost text-xs block mb-1">Matriculation Number</label>
                <input value={regMatric} onChange={e => setRegMatric(e.target.value)} placeholder="e.g. ENG1802345"
                  className="w-full bg-ink border border-rule text-ledger font-data text-xs px-3 py-3 focus:border-uniben outline-none placeholder:text-ghost" />
              </div>
              <button onClick={handleRegisterProfile}
                disabled={regTx === 'loading' || !regName.trim() || !regMatric.trim() || !wallet.signMessage}
                className="w-full bg-uniben text-ink font-data text-xs py-3.5 tracking-widest hover:opacity-90 disabled:opacity-40 transition-all duration-150 active:scale-[0.98]">
                {regTx === 'loading' ? 'SAVING PROFILE...' : 'SAVE PROFILE & CONTINUE'}
              </button>
              {regErr && <p className="font-data text-void text-xs mt-2">{regErr}</p>}
            </div>
          ) : depositTx === 'idle' ? (
            <>
              <div className="border border-rule p-4 bg-paper/50 space-y-1">
                <p className="font-data text-uniben text-[10px] tracking-widest uppercase">Linked Profile</p>
                <p className="font-display font-semibold text-ledger text-sm">{profile.full_name}</p>
                <p className="font-data text-ghost text-xs">{profile.matric_number} · {displayName}</p>
              </div>

              {fundTx === 'idle' && (
                <div className="border border-pending p-4">
                  <p className="font-data text-pending text-xs tracking-widest uppercase mb-1">Need Devnet USDC?</p>
                  <p className="text-body text-xs leading-relaxed mb-3">
                    Tap below to instantly receive test USDC in your connected wallet — no external faucet, no captcha.
                  </p>
                  <button onClick={handleFund}
                    className="w-full py-3 font-data text-xs tracking-widest border border-pending text-pending hover:bg-pending hover:text-ink transition-colors">
                    FUND WALLET (DEVNET)
                  </button>
                </div>
              )}
              {fundTx !== 'idle' && (
                <TxResult state={fundTx} sig={fundSig} error={fundErr}
                  onClose={() => { setFundTx('idle'); setFundSig(''); setFundErr('') }} />
              )}

              <div>
                <label className="font-data text-ghost text-xs block mb-1">Amount (USDC)</label>
                <input type="number" value={depositAmt} onChange={e => setDepositAmt(e.target.value)} placeholder="0.00"
                  className="w-full bg-paper border border-rule text-ledger font-data text-lg px-3 py-3 focus:border-uniben outline-none placeholder:text-ghost" />
              </div>
              <button onClick={handleDeposit} disabled={!depositAmt}
                className="w-full bg-uniben text-ink font-data text-xs py-4 tracking-widest hover:opacity-90 disabled:opacity-40 transition-opacity">
                DEPOSIT TO VAULT
              </button>
            </>
          ) : (
            <TxResult state={depositTx} sig={depositSig} error={depositErr} amount={successAmt}
              onClose={() => { setDepositTx('idle'); setDepositSig(''); setDepositErr(''); setSuccessAmt('') }} />
          )}
        </div>
      )}
    </div>
  )

  return (
    <>
      {!isDesktop && (
        <main className="min-h-screen bg-ink pb-16">
          <header className="border-b border-rule px-6 py-4 flex items-center justify-between">
            <Link href={`/${university}`} className="font-data text-ghost text-xs">← {displayName.toUpperCase()}</Link>
          </header>
          <div className="px-6 pt-8">{body}</div>
          <BottomNav university={university} activeTab="deposit" />
        </main>
      )}
      {isDesktop && (
        <div className="flex min-h-screen bg-ink">
          <DesktopSidebar university={university} />
          <div className="flex-1 flex flex-col">
            <DesktopTopBar universityName={displayName} connected={!!wallet.publicKey} isAdmin={false} isExec={false} />
            <div className="p-8 overflow-y-auto">{body}</div>
          </div>
        </div>
      )}
    </>
  )
}
