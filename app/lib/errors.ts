export function parseAnchorError(err: any): string {
  const msg: string = err?.message || err?.toString() || 'Unknown error'

  if (msg.includes('UnauthorizedSigner'))
    return 'Your wallet is not a registered exec for this treasury.'
  if (msg.includes('UnauthorizedAdmin'))
    return 'Only the LevyLedger admin wallet can initialize a treasury.'
  if (msg.includes('AlreadySigned'))
    return 'You have already voted for this proposal.'
  if (msg.includes('AlreadyVotedAgainst'))
    return 'You have already voted against this proposal.'
  if (msg.includes('ProposalNotActive'))
    return 'This proposal is no longer active.'
  if (msg.includes('ProposalExpired'))
    return 'This proposal expired before reaching threshold.'
  if (msg.includes('InsufficientFunds'))
    return 'Not enough USDC in the vault for this proposal.'
  if (msg.includes('InvalidSlug'))
    return 'University slug must be 1–20 characters.'
  if (msg.includes('InvalidDescription'))
    return 'Description must be 1–200 characters.'
  if (msg.includes('AmountZero'))
    return 'Amount must be greater than zero.'
  if (msg.includes('TooManyActiveProposals'))
    return 'Vault has 20 active proposals — wait for one to resolve first.'
  if (msg.includes('InvalidSigners'))
    return 'All 5 exec wallets must be unique and non-zero.'
  if (msg.includes('Overflow'))
    return 'Arithmetic overflow — values too large.'
  if (msg.includes('insufficient funds'))
    return 'Your wallet does not have enough SOL to pay transaction fees.'
  if (msg.includes('0x1'))
    return 'Insufficient token balance for this operation.'
  if (msg.includes('User rejected'))
    return 'Transaction cancelled.'

  return `Transaction failed: ${msg.slice(0, 120)}`
}
