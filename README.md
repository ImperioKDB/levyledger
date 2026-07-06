# LevyLedger

**On-chain treasury transparency for University of Benin faculty student unions.**

Every semester, faculty student unions in Nigerian universities collect levies — union dues, faculty dues, departmental fees. Millions of naira move through student executives with zero public accountability: no receipts, no audit trail, no records that survive a handover. LevyLedger makes that structurally impossible for any faculty that adopts it.

**Live app:** [levyledger.vercel.app](https://levyledger.vercel.app)
**Program (Solana Devnet):** `4Av48RVmUb2U5V3jqkEC15C5cbjNRY2TqD64ebc1jn1M`
**Explorer:** [View program on Solana Explorer](https://explorer.solana.com/address/4Av48RVmUb2U5V3jqkEC15C5cbjNRY2TqD64ebc1jn1M?cluster=devnet)

---

## The Problem

A faculty exco collects dues from students every semester. The money is spent on welfare, events, equipment, logistics — supposedly. There's no public record of what came in, what went out, or who approved it. When the exco changes hands, the financial history usually doesn't survive the handover. Students have no way to verify anything without simply trusting whoever is currently in charge.

## What LevyLedger Does

LevyLedger deploys one on-chain treasury per faculty on Solana. Each treasury is controlled by a 3-of-5 executive multisig:

- **Deposits are hybrid.** An exec can deposit collected off-chain levies, or any student with a wallet can deposit their dues directly — closing the gap where money could disappear between "collected" and "recorded."
- **Spending requires 3-of-5 approval.** Any exec can propose a payment. The moment the third signature lands, the smart contract — not a person — transfers the funds. No human releases the money.
- **Everything is public.** Any student opens a faculty's page, with no wallet and no login, and sees the live balance, every proposal, every signature, and every executed payment. Permanently.

## How It Works

1. A faculty is registered and vetted by a LevyLedger admin.
2. The admin initializes an on-chain treasury with 5 registered executive wallets.
3. Execs deposit collected dues, or students deposit directly.
4. Any exec can propose a spend; 3 of 5 signatures auto-executes it.
5. Anyone — student, journalist, incoming exco — can verify the entire history at any time.

## Architecture

```
Solana Program (Anchor)
├── init_treasury    — admin-gated, creates a treasury PDA + USDC vault
├── deposit          — permissionless, any wallet can fund the vault
├── create_proposal  — exec-only, reserves funds and opens a vote
├── sign_proposal     — exec-only, auto-executes USDC transfer at 3-of-5
└── expire_proposal   — permissionless cleanup for stale proposals

Next.js Frontend
├── Public pages      — faculty directory, treasury dashboards, proposal history
│                       (no wallet required to read anything)
├── Admin panel        — wallet-gated: sign/propose/deposit for execs,
│                       faculty registration review for admins
└── Supabase           — identity directory (wallet ↔ name ↔ matric number)
                        and the faculty-registration request queue only.
                        Never holds balances, amounts, or transaction data —
                        those are always read live from the chain.
```

The trust boundary is deliberate: **Supabase can never become a second ledger.** If it disappeared entirely, every naira's history would still be intact and independently verifiable on Solana.

## Why Solana

- **Permanent record.** Once a payment executes, no party — not the exco, not us, not the university — can edit or delete it.
- **Programmable custody.** The vault's authority is the treasury's on-chain program itself, not any individual exec's wallet. Auto-execution at 3-of-5 threshold is only possible because the contract holds the funds, not a person.
- **Cost.** A Solana transaction costs a fraction of a cent, making it economically sane to collect signatures and release small payments — this would be impractical on a chain with meaningful gas costs.
- **USDC.** The treasury is denominated in a stablecoin so balances don't fluctuate with market volatility.

## Testing It Yourself (Devnet)

1. Install [Phantom Wallet](https://phantom.app) and switch it to **Devnet** (Settings → Developer Settings).
2. Visit [levyledger.vercel.app/faculties](https://levyledger.vercel.app/faculties) to browse registered faculties — no wallet needed.
3. Open a faculty page and connect your wallet to try depositing. First-time depositors register a name and matric number (verified by wallet signature) before the deposit form unlocks.
4. Need devnet USDC? Use the **FUND WALLET (DEVNET)** button inside the Deposit tab — it sends test USDC directly to your connected wallet with one tap, no external faucet required.
5. Registered execs can propose and sign spending from the same admin panel.

## Known Limitations

These are deliberate v1 scope decisions, not oversights:

- **Devnet only.** The architecture is mainnet-ready in structure, but a real deployment needs a security audit and a solved fiat-to-USDC on-ramp first.
- **No fiat on-ramp.** Execs convert collected naira to USDC off-chain via any exchange before depositing — LevyLedger doesn't handle currency conversion.
- **Fixed signers, no on-chain rotation.** The 5 exec wallets are set once at treasury initialization. There is no instruction to rotate signers when a new exco takes over. Handover currently means: the outgoing exco proposes and signs a full payout of the remaining balance to a new wallet, which is then deposited into a freshly initialized treasury for the incoming exco. A dedicated `update_signers` instruction (gated by the same 3-of-5 threshold) is the planned v2 fix.
- **Single admin key for on-chain initialization.** Only one wallet can call `init_treasury`. Faculty *request review* can be delegated to additional trusted wallets, but the final on-chain initialization step is currently a single point of contact by design, to avoid expanding the program's trusted signer set this close to launch.
- **UNIBEN only.** LevyLedger currently serves University of Benin faculties exclusively. The program itself is architecture-agnostic — any university's faculty could get its own treasury from the same deployed program — but the frontend and admin flow are scoped to UNIBEN for this release.

## Stack

Anchor (Rust) · Solana Devnet · SPL Token (USDC) · Next.js 14 (App Router) · Tailwind CSS · `@coral-xyz/anchor` · `@solana/wallet-adapter-react` · Supabase (identity directory only) · Vercel

## What's Next

- On-chain signer rotation for exco handovers
- Delegated faculty-request review for additional trusted admins
- Cross-faculty transparency leaderboard (deposit consistency, resolution speed, activity)
- Public exec reputation records
- Downloadable, verifiable handover certificates

---

*Built at UNIBEN, for UNIBEN. One naira at a time, on the record.*
