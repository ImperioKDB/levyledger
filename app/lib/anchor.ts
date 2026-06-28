import { Connection, PublicKey, SystemProgram } from '@solana/web3.js'
import { Program, AnchorProvider, BN } from '@coral-xyz/anchor'
import type { Idl } from '@coral-xyz/anchor'
import idl from './idl/levyledger.json'

const PROGRAM_ID = new PublicKey('DuUdUQKvHgjMpceHc3qPoG3C61DUSToZWPHkRLB3zrjW')
const RPC_URL    = process.env.NEXT_PUBLIC_RPC_URL || 'https://api.devnet.solana.com'

const USDC_MINT  = new PublicKey(
  process.env.NEXT_PUBLIC_USDC_MINT || 'Gh9ZwEmdLJ8DscKNTkTqPbNwLNNBjuSzaG9Vp2KGtKJr'
)

export const connection = new Connection(RPC_URL, 'confirmed')

const IDL = idl as unknown as Idl

export function getReadonlyProgram() {
  const dummyWallet = {
    publicKey:           new PublicKey('11111111111111111111111111111111'),
    signTransaction:     async (tx: any) => tx,
    signAllTransactions: async (txs: any[]) => txs,
  }
  const provider = new AnchorProvider(connection, dummyWallet as any, { commitment: 'confirmed' })
  return new Program(IDL, provider)
}

export function getProgram(provider: AnchorProvider) {
  return new Program(IDL, provider)
}

// ── PDA derivation ────────────────────────────────────────────────────────────
export function getTreasuryPDA(slug: string): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from('treasury'), Buffer.from(slug)],
    PROGRAM_ID
  )
}

export function getVaultPDA(treasuryPubkey: PublicKey): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from('vault'), treasuryPubkey.toBuffer()],
    PROGRAM_ID
  )
}

export function getProposalPDA(treasuryPubkey: PublicKey, index: number): [PublicKey, number] {
  const buf = Buffer.alloc(8)
  buf.writeBigUInt64LE(BigInt(index))
  return PublicKey.findProgramAddressSync(
    [Buffer.from('proposal'), treasuryPubkey.toBuffer(), buf],
    PROGRAM_ID
  )
}

// ── Read utilities ────────────────────────────────────────────────────────────
export function formatUSDC(amount: any): string {
  const val = typeof amount?.toNumber === 'function' ? amount.toNumber() : Number(amount)
  return (val / 1_000_000).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
}

export function abbreviate(pubkey: string): string {
  if (!pubkey) return ''
  return pubkey.slice(0, 4) + '...' + pubkey.slice(-4)
}

// ── Transaction functions ─────────────────────────────────────────────────────

// initTreasury — one-time setup. Must be called by the admin wallet.
// After this succeeds, the treasury exists on-chain and all other operations
// (deposit, createProposal, signProposal) become available.
//
// signerPubkeys: the 5 exec wallet addresses as strings
// threshold:     number of signatures required to execute (default: 3)
export async function initTreasury(
  provider:      AnchorProvider,
  slug:          string,
  signerPubkeys: string[],
  threshold:     number = 3
): Promise<string> {
  const program    = getProgram(provider)
  const [treasury] = getTreasuryPDA(slug)
  const [vault]    = getVaultPDA(treasury)
  const signers    = signerPubkeys.map(k => new PublicKey(k))

  return (program.methods as any)
    .initTreasury(slug, signers, threshold)
    .accounts({
      admin:         provider.wallet.publicKey,
      treasury,
      vault,
      systemProgram: SystemProgram.programId,
    })
    .rpc()
}

export async function depositFunds(
  provider:    AnchorProvider,
  slug:        string,
  amountUsdc:  number
): Promise<string> {
  const { getAssociatedTokenAddress, TOKEN_PROGRAM_ID } = await import('@solana/spl-token')
  const program     = getProgram(provider)
  const [treasury]  = getTreasuryPDA(slug)
  const [vault]     = getVaultPDA(treasury)
  const depositorTA = await getAssociatedTokenAddress(USDC_MINT, provider.wallet.publicKey)

  return (program.methods as any)
    .deposit(new BN(Math.round(amountUsdc * 1_000_000)))
    .accounts({
      depositor:             provider.wallet.publicKey,
      treasury,
      depositorTokenAccount: depositorTA,
      vault,
      tokenProgram:          TOKEN_PROGRAM_ID,
    })
    .rpc()
}

export async function createProposalTx(
  provider:    AnchorProvider,
  slug:        string,
  amountUsdc:  number,
  recipient:   string,
  category:    string,
  description: string
): Promise<string> {
  const program    = getProgram(provider)
  const [treasury] = getTreasuryPDA(slug)
  const tData      = await (program.account as any).treasuryAccount.fetch(treasury)
  const idx        = typeof tData.proposalCount?.toNumber === 'function'
    ? tData.proposalCount.toNumber()
    : Number(tData.proposalCount)
  const [proposal] = getProposalPDA(treasury, idx)

  return (program.methods as any)
    .createProposal(
      new BN(Math.round(amountUsdc * 1_000_000)),
      new PublicKey(recipient),
      { [category.toLowerCase()]: {} },
      description
    )
    .accounts({
      proposer:      provider.wallet.publicKey,
      treasury,
      proposal,
      systemProgram: SystemProgram.programId,
    })
    .rpc()
}

export async function signProposalTx(
  provider:        AnchorProvider,
  slug:            string,
  proposalIndex:   number,
  recipientPubkey: PublicKey,
  approve:         boolean
): Promise<string> {
  const { getAssociatedTokenAddress, TOKEN_PROGRAM_ID } = await import('@solana/spl-token')
  const program    = getProgram(provider)
  const [treasury] = getTreasuryPDA(slug)
  const [vault]    = getVaultPDA(treasury)
  const [proposal] = getProposalPDA(treasury, proposalIndex)
  const recipientTA = await getAssociatedTokenAddress(USDC_MINT, recipientPubkey)

  return (program.methods as any)
    .signProposal(approve)
    .accounts({
      signer:                provider.wallet.publicKey,
      treasury,
      proposal,
      vault,
      recipientTokenAccount: recipientTA,
      tokenProgram:          TOKEN_PROGRAM_ID,
    })
    .rpc()
}
