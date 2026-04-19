use anchor_lang::prelude::*;

declare_id!("SentinelProgramID1111111111111111111111111");

#[program]
pub mod sentinel {
    use super::*;

    /// Creates a new Sentinel Identity for a user or AI agent
    pub fn create_identity(
        ctx: Context<CreateIdentity>,
        identity_type: IdentityType,
        metadata_hash: [u8; 32],
    ) -> Result<()> {
        let identity = &mut ctx.accounts.identity;
        identity.owner = ctx.accounts.owner.key();
        identity.identity_type = identity_type;
        identity.metadata_hash = metadata_hash;
        identity.created_at = Clock::get()?.unix_timestamp;
        identity.reputation_score = 100; // Initial reputation score
        identity.activity_count = 0;
        identity.bump = ctx.bumps.identity;

        emit!(IdentityCreated {
            owner: ctx.accounts.owner.key(),
            identity_type: identity_type,
            created_at: identity.created_at,
        });

        Ok(())
    }

    /// Updates the reputation score based on verified activities
    pub fn update_reputation(
        ctx: Context<UpdateReputation>,
        activity_type: ActivityType,
        amount: u64,
    ) -> Result<()> {
        let identity = &mut ctx.accounts.identity;
        
        // Verify that the caller is the owner
        require!(
            identity.owner == ctx.accounts.owner.key(),
            SentinelError::Unauthorized
        );

        // Calculate reputation change based on activity type
        let reputation_delta = match activity_type {
            ActivityType::PayFiTransaction => (amount / 1_000_000).min(50) as i32, // USDC-based
            ActivityType::GovernanceParticipation => 25,
            ActivityType::ContractFulfillment => 75,
            ActivityType::CommunityContribution => 50,
        };

        identity.reputation_score = ((identity.reputation_score as i32) + reputation_delta).max(0) as u32;
        identity.activity_count += 1;
        identity.last_activity = Clock::get()?.unix_timestamp;

        emit!(ReputationUpdated {
            owner: ctx.accounts.owner.key(),
            new_score: identity.reputation_score,
            activity_type: activity_type,
        });

        Ok(())
    }

    /// Verifies if an identity meets a minimum reputation threshold
    pub fn verify_reputation_threshold(
        ctx: Context<VerifyReputationThreshold>,
        threshold: u32,
    ) -> Result<bool> {
        let identity = &ctx.accounts.identity;
        Ok(identity.reputation_score >= threshold)
    }

    /// Records a PayFi transaction for reputation building
    pub fn register_payfi_event(
        ctx: Context<RegisterPayFiEvent>,
        transaction_signature: [u8; 64],
        amount_usdc: u64,
    ) -> Result<()> {
        let identity = &mut ctx.accounts.identity;
        
        require!(
            identity.owner == ctx.accounts.owner.key(),
            SentinelError::Unauthorized
        );

        // Record the PayFi event
        identity.total_payfi_volume = identity.total_payfi_volume.saturating_add(amount_usdc);
        identity.payfi_transaction_count = identity.payfi_transaction_count.saturating_add(1);

        // Update reputation based on PayFi activity
        let reputation_increase = (amount_usdc / 1_000_000).min(100) as u32;
        identity.reputation_score = identity.reputation_score.saturating_add(reputation_increase);

        emit!(PayFiEventRecorded {
            owner: ctx.accounts.owner.key(),
            amount_usdc: amount_usdc,
            total_volume: identity.total_payfi_volume,
        });

        Ok(())
    }
}

#[derive(Accounts)]
pub struct CreateIdentity<'info> {
    #[account(
        init,
        payer = owner,
        space = 8 + std::mem::size_of::<Identity>(),
        seeds = [b"identity", owner.key().as_ref()],
        bump
    )]
    pub identity: Account<'info, Identity>,
    
    #[account(mut)]
    pub owner: Signer<'info>,
    
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct UpdateReputation<'info> {
    #[account(
        mut,
        seeds = [b"identity", owner.key().as_ref()],
        bump = identity.bump
    )]
    pub identity: Account<'info, Identity>,
    
    pub owner: Signer<'info>,
}

#[derive(Accounts)]
pub struct VerifyReputationThreshold<'info> {
    #[account(
        seeds = [b"identity", identity.owner.as_ref()],
        bump = identity.bump
    )]
    pub identity: Account<'info, Identity>,
}

#[derive(Accounts)]
pub struct RegisterPayFiEvent<'info> {
    #[account(
        mut,
        seeds = [b"identity", owner.key().as_ref()],
        bump = identity.bump
    )]
    pub identity: Account<'info, Identity>,
    
    pub owner: Signer<'info>,
}

#[account]
pub struct Identity {
    pub owner: Pubkey,
    pub identity_type: IdentityType,
    pub metadata_hash: [u8; 32],
    pub created_at: i64,
    pub last_activity: i64,
    pub reputation_score: u32,
    pub activity_count: u32,
    pub total_payfi_volume: u64,
    pub payfi_transaction_count: u32,
    pub bump: u8,
}

#[derive(Clone, Copy, AnchorSerialize, AnchorDeserialize, Debug, PartialEq)]
pub enum IdentityType {
    Human,
    AIAgent,
}

#[derive(Clone, Copy, AnchorSerialize, AnchorDeserialize, Debug)]
pub enum ActivityType {
    PayFiTransaction,
    GovernanceParticipation,
    ContractFulfillment,
    CommunityContribution,
}

#[event]
pub struct IdentityCreated {
    pub owner: Pubkey,
    pub identity_type: IdentityType,
    pub created_at: i64,
}

#[event]
pub struct ReputationUpdated {
    pub owner: Pubkey,
    pub new_score: u32,
    pub activity_type: ActivityType,
}

#[event]
pub struct PayFiEventRecorded {
    pub owner: Pubkey,
    pub amount_usdc: u64,
    pub total_volume: u64,
}

#[error_code]
pub enum SentinelError {
    #[msg("Unauthorized access")]
    Unauthorized,
    #[msg("Invalid reputation threshold")]
    InvalidThreshold,
}
