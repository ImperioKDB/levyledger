use anchor_lang::prelude::*;
use solana_program::pubkey;
use anchor_spl::token::{Mint, Token, TokenAccount};

declare_id!("4tsVfoyorSMTHG6iBG1kBtxsjTFWUfRNe1We26bfBFD9");

pub const THRESHOLD: u8 = 3;
pub const MAX_ACTIVE_PROPOSALS: u64 = 20;
pub const PROPOSAL_EXPIRY_SECS: i64 = 7 * 24 * 60 * 60;
pub const MAX_SLUG_LEN: usize = 20;
pub const MAX_DESC_LEN: usize = 200;

const ADMIN_KEY: Pubkey = pubkey!("4enpQEjX2bLFcXtPkcFg9f5WDkq9j1Q8zNoN5xAF5m1N");

#[program]
pub mod levyledger {
    use super::*;

    pub fn init_treasury(
        ctx: Context<InitTreasury>,
        slug: String,
        signers: [Pubkey; 5],
    ) -> Result<()> {
        require!(
            slug.len() > 0 && slug.len() <= MAX_SLUG_LEN,
            LevyError::InvalidSlug
        );
        let zero = Pubkey::default();
        for i in 0..5 {
            require!(signers[i] != zero, LevyError::InvalidSigners);
            for j in (i + 1)..5 {
                require!(signers[i] != signers[j], LevyError::InvalidSigners);
            }
        }
        let treasury = &mut ctx.accounts.treasury;
        treasury.university_slug = slug;
        treasury.signers = signers;
        treasury.threshold = THRESHOLD;
        treasury.available_balance = 0;
        treasury.reserved_balance = 0;
        treasury.total_deposited = 0;
        treasury.total_spent = 0;
        treasury.proposal_count = 0;
        treasury.active_proposal_count = 0;
        treasury.bump = ctx.bumps.treasury;
        treasury.vault_bump = ctx.bumps.vault;
        Ok(())
    }

    pub fn deposit(ctx: Context<Deposit>, amount: u64) -> Result<()> {
        require!(amount > 0, LevyError::AmountZero);
        let depositor_key = ctx.accounts.depositor.key();
        require!(
            ctx.accounts.treasury.signers.contains(&depositor_key),
            LevyError::UnauthorizedSigner
        );
        let cpi_ctx = CpiContext::new(
            ctx.accounts.token_program.to_account_info(),
            anchor_spl::token::Transfer {
                from: ctx.accounts.depositor_token_account.to_account_info(),
                to: ctx.accounts.vault.to_account_info(),
                authority: ctx.accounts.depositor.to_account_info(),
            },
        );
        anchor_spl::token::transfer(cpi_ctx, amount)?;
        ctx.accounts.treasury.available_balance = ctx.accounts.treasury.available_balance
            .checked_add(amount).ok_or(LevyError::Overflow)?;
        ctx.accounts.treasury.total_deposited = ctx.accounts.treasury.total_deposited
            .checked_add(amount).ok_or(LevyError::Overflow)?;
        Ok(())
    }

    pub fn create_proposal(
        ctx: Context<CreateProposal>,
        amount: u64,
        recipient: Pubkey,
        category: ProposalCategory,
        description: String,
    ) -> Result<()> {
        require!(amount > 0, LevyError::AmountZero);
        require!(
            description.len() > 0 && description.len() <= MAX_DESC_LEN,
            LevyError::InvalidDescription
        );
        let proposer_key = ctx.accounts.proposer.key();
        require!(
            ctx.accounts.treasury.signers.contains(&proposer_key),
            LevyError::UnauthorizedSigner
        );
        require!(
            ctx.accounts.treasury.available_balance >= amount,
            LevyError::InsufficientFunds
        );
        require!(
            ctx.accounts.treasury.active_proposal_count < MAX_ACTIVE_PROPOSALS,
            LevyError::TooManyActiveProposals
        );

        let clock = Clock::get()?;
        let proposal_index = ctx.accounts.treasury.proposal_count;
        let treasury_key = ctx.accounts.treasury.key();

        let proposal = &mut ctx.accounts.proposal;
        proposal.treasury = treasury_key;
        proposal.proposer = proposer_key;
        proposal.recipient = recipient;
        proposal.amount = amount;
        proposal.category = category;
        proposal.description = description;
        proposal.status = ProposalStatus::Active;
        proposal.signed_by = [false; 5];
        proposal.voted_against = [false; 5];
        proposal.signatures_for = 0;
        proposal.signatures_against = 0;
        proposal.proposal_index = proposal_index;
        proposal.created_at = clock.unix_timestamp;
        proposal.expires_at = clock.unix_timestamp + PROPOSAL_EXPIRY_SECS;
        proposal.bump = ctx.bumps.proposal;

        ctx.accounts.treasury.available_balance = ctx.accounts.treasury.available_balance
            .checked_sub(amount).ok_or(LevyError::Overflow)?;
        ctx.accounts.treasury.reserved_balance = ctx.accounts.treasury.reserved_balance
            .checked_add(amount).ok_or(LevyError::Overflow)?;
        ctx.accounts.treasury.proposal_count = ctx.accounts.treasury.proposal_count
            .checked_add(1).ok_or(LevyError::Overflow)?;
        ctx.accounts.treasury.active_proposal_count = ctx.accounts.treasury.active_proposal_count
            .checked_add(1).ok_or(LevyError::Overflow)?;
        Ok(())
    }

    pub fn sign_proposal(ctx: Context<SignProposal>, approve: bool) -> Result<()> {
        let signer_key = ctx.accounts.signer.key();
        let signer_index = ctx.accounts.treasury.signers
            .iter()
            .position(|k| k == &signer_key)
            .ok_or(LevyError::UnauthorizedSigner)?;

        let threshold = ctx.accounts.treasury.threshold;
        let proposal_amount = ctx.accounts.proposal.amount;

        // Lazy expiry check
        let clock = Clock::get()?;
        if clock.unix_timestamp > ctx.accounts.proposal.expires_at {
            ctx.accounts.proposal.status = ProposalStatus::Expired;
            ctx.accounts.treasury.reserved_balance = ctx.accounts.treasury.reserved_balance
                .checked_sub(proposal_amount).ok_or(LevyError::Overflow)?;
            ctx.accounts.treasury.available_balance = ctx.accounts.treasury.available_balance
                .checked_add(proposal_amount).ok_or(LevyError::Overflow)?;
            ctx.accounts.treasury.active_proposal_count = ctx.accounts.treasury.active_proposal_count
                .checked_sub(1).ok_or(LevyError::Overflow)?;
            return err!(LevyError::ProposalExpired);
        }

        require!(
            ctx.accounts.proposal.status == ProposalStatus::Active,
            LevyError::ProposalNotActive
        );

        if approve {
            require!(
                !ctx.accounts.proposal.signed_by[signer_index],
                LevyError::AlreadySigned
            );
            ctx.accounts.proposal.signed_by[signer_index] = true;
            ctx.accounts.proposal.signatures_for += 1;

            if ctx.accounts.proposal.signatures_for >= threshold {
                // Clone data needed for PDA signing before CPI
                let treasury_slug = ctx.accounts.treasury.university_slug.clone();
                let treasury_bump = ctx.accounts.treasury.bump;
                let seeds = &[
                    b"treasury".as_ref(),
                    treasury_slug.as_bytes(),
                    &[treasury_bump],
                ];
                let signer_seeds = &[&seeds[..]];

                let cpi_ctx = CpiContext::new_with_signer(
                    ctx.accounts.token_program.to_account_info(),
                    anchor_spl::token::Transfer {
                        from: ctx.accounts.vault.to_account_info(),
                        to: ctx.accounts.recipient_token_account.to_account_info(),
                        authority: ctx.accounts.treasury.to_account_info(),
                    },
                    signer_seeds,
                );
                anchor_spl::token::transfer(cpi_ctx, proposal_amount)?;

                ctx.accounts.treasury.reserved_balance = ctx.accounts.treasury.reserved_balance
                    .checked_sub(proposal_amount).ok_or(LevyError::Overflow)?;
                ctx.accounts.treasury.total_spent = ctx.accounts.treasury.total_spent
                    .checked_add(proposal_amount).ok_or(LevyError::Overflow)?;
                ctx.accounts.treasury.active_proposal_count = ctx.accounts.treasury.active_proposal_count
                    .checked_sub(1).ok_or(LevyError::Overflow)?;
                ctx.accounts.proposal.status = ProposalStatus::Executed;
            }
        } else {
            require!(
                !ctx.accounts.proposal.voted_against[signer_index],
                LevyError::AlreadyVotedAgainst
            );
            ctx.accounts.proposal.voted_against[signer_index] = true;
            ctx.accounts.proposal.signatures_against += 1;

            if ctx.accounts.proposal.signatures_against >= threshold {
                ctx.accounts.treasury.reserved_balance = ctx.accounts.treasury.reserved_balance
                    .checked_sub(proposal_amount).ok_or(LevyError::Overflow)?;
                ctx.accounts.treasury.available_balance = ctx.accounts.treasury.available_balance
                    .checked_add(proposal_amount).ok_or(LevyError::Overflow)?;
                ctx.accounts.treasury.active_proposal_count = ctx.accounts.treasury.active_proposal_count
                    .checked_sub(1).ok_or(LevyError::Overflow)?;
                ctx.accounts.proposal.status = ProposalStatus::Rejected;
            }
        }
        Ok(())
    }
}

#[derive(Accounts)]
#[instruction(slug: String)]
pub struct InitTreasury<'info> {
    #[account(
        mut,
        constraint = authority.key() == ADMIN_KEY @ LevyError::UnauthorizedAdmin
    )]
    pub authority: Signer<'info>,
    #[account(
        init,
        payer = authority,
        space = TreasuryAccount::SPACE,
        seeds = [b"treasury", slug.as_bytes()],
        bump
    )]
    pub treasury: Account<'info, TreasuryAccount>,
    #[account(
        init,
        payer = authority,
        token::mint = usdc_mint,
        token::authority = treasury,
        seeds = [b"vault", treasury.key().as_ref()],
        bump
    )]
    pub vault: Account<'info, TokenAccount>,
    pub usdc_mint: Account<'info, Mint>,
    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct Deposit<'info> {
    #[account(mut)]
    pub depositor: Signer<'info>,
    #[account(
        mut,
        seeds = [b"treasury", treasury.university_slug.as_bytes()],
        bump = treasury.bump
    )]
    pub treasury: Account<'info, TreasuryAccount>,
    #[account(mut)]
    pub depositor_token_account: Account<'info, TokenAccount>,
    #[account(
        mut,
        seeds = [b"vault", treasury.key().as_ref()],
        bump = treasury.vault_bump
    )]
    pub vault: Account<'info, TokenAccount>,
    pub token_program: Program<'info, Token>,
}

#[derive(Accounts)]
pub struct CreateProposal<'info> {
    #[account(mut)]
    pub proposer: Signer<'info>,
    #[account(
        mut,
        seeds = [b"treasury", treasury.university_slug.as_bytes()],
        bump = treasury.bump
    )]
    pub treasury: Account<'info, TreasuryAccount>,
    #[account(
        init,
        payer = proposer,
        space = ProposalAccount::SPACE,
        seeds = [
            b"proposal",
            treasury.key().as_ref(),
            &treasury.proposal_count.to_le_bytes()
        ],
        bump
    )]
    pub proposal: Account<'info, ProposalAccount>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct SignProposal<'info> {
    #[account(mut)]
    pub signer: Signer<'info>,
    #[account(
        mut,
        seeds = [b"treasury", treasury.university_slug.as_bytes()],
        bump = treasury.bump
    )]
    pub treasury: Account<'info, TreasuryAccount>,
    #[account(
        mut,
        constraint = proposal.treasury == treasury.key() @ LevyError::UnauthorizedSigner
    )]
    pub proposal: Account<'info, ProposalAccount>,
    #[account(
        mut,
        seeds = [b"vault", treasury.key().as_ref()],
        bump = treasury.vault_bump
    )]
    pub vault: Account<'info, TokenAccount>,
    #[account(mut)]
    pub recipient_token_account: Account<'info, TokenAccount>,
    pub token_program: Program<'info, Token>,
}

#[account]
pub struct TreasuryAccount {
    pub university_slug: String,
    pub signers: [Pubkey; 5],
    pub threshold: u8,
    pub available_balance: u64,
    pub reserved_balance: u64,
    pub total_deposited: u64,
    pub total_spent: u64,
    pub proposal_count: u64,
    pub active_proposal_count: u64,
    pub bump: u8,
    pub vault_bump: u8,
}

impl TreasuryAccount {
    // 8 + 24 + 160 + 1 + 8 + 8 + 8 + 8 + 8 + 8 + 1 + 1 = 243 → padded to 300
    pub const SPACE: usize = 300;
}

#[account]
pub struct ProposalAccount {
    pub treasury: Pubkey,
    pub proposer: Pubkey,
    pub recipient: Pubkey,
    pub amount: u64,
    pub category: ProposalCategory,
    pub description: String,
    pub status: ProposalStatus,
    pub signed_by: [bool; 5],
    pub voted_against: [bool; 5],
    pub signatures_for: u8,
    pub signatures_against: u8,
    pub proposal_index: u64,
    pub created_at: i64,
    pub expires_at: i64,
    pub bump: u8,
}

impl ProposalAccount {
    // 8 + 32 + 32 + 32 + 8 + 1 + 204 + 1 + 5 + 5 + 1 + 1 + 8 + 8 + 8 + 1 = 355 → padded to 420
    pub const SPACE: usize = 420;
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, PartialEq, Eq)]
pub enum ProposalStatus {
    Active,
    Executed,
    Rejected,
    Expired,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, PartialEq, Eq)]
pub enum ProposalCategory {
    Welfare,
    Events,
    Logistics,
    Equipment,
    Other,
}

#[error_code]
pub enum LevyError {
    #[msg("Unauthorized: caller is not a registered exec signer")]
    UnauthorizedSigner,
    #[msg("Unauthorized: only the admin key can initialize a treasury")]
    UnauthorizedAdmin,
    #[msg("You have already voted for this proposal")]
    AlreadySigned,
    #[msg("You have already voted against this proposal")]
    AlreadyVotedAgainst,
    #[msg("Proposal is not in Active status")]
    ProposalNotActive,
    #[msg("Proposal has expired without reaching threshold")]
    ProposalExpired,
    #[msg("Insufficient available balance in vault for this proposal")]
    InsufficientFunds,
    #[msg("University slug must be 1-20 characters")]
    InvalidSlug,
    #[msg("Description must be 1-200 characters")]
    InvalidDescription,
    #[msg("Proposal amount must be greater than zero")]
    AmountZero,
    #[msg("Treasury has 20 active proposals — wait for one to resolve first")]
    TooManyActiveProposals,
    #[msg("All 5 signer pubkeys must be unique and non-zero")]
    InvalidSigners,
    #[msg("Arithmetic overflow")]
    Overflow,
}
