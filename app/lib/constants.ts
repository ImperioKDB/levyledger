export const PROGRAM_ID = 'DuUdUQKvHgjMpceHc3qPoG3C61DUSToZWPHkRLB3zrjW'

export const DEVNET_USDC_MINT = 'Gh9ZwEmdLJ8DscKNTkTqPbNwLNNBjuSzaG9Vp2KGtKJr'

export const PROPOSAL_STATUS = {
  0: 'Active',
  1: 'Executed',
  2: 'Rejected',
  3: 'Expired',
} as const

export const PROPOSAL_CATEGORY = {
  0: 'Welfare',
  1: 'Events',
  2: 'Logistics',
  3: 'Equipment',
  4: 'Other',
} as const

export const STATUS_COLORS = {
  Active:   'text-warning border-warning',
  Executed: 'text-accent border-accent',
  Rejected: 'text-danger border-danger',
  Expired:  'text-muted border-muted',
} as const

export const ADMIN_KEY = '4enpQEjX2bLFcXtPkcFg9f5WDkq9j1Q8zNoN5xAF5m1N'
