export const PROGRAM_ID       = '4tsVfoyorSMTHG6iBG1kBtxsjTFWUfRNe1We26bfBFD9'
export const DEVNET_USDC_MINT = 'Gh9ZwEmdLJ8DscKNTkTqPbNwLNNBjuSzaG9Vp2KGtKJr'
export const ADMIN_KEY         = '4enpQEjX2bLFcXtPkcFg9f5WDkq9j1Q8zNoN5xAF5m1N'

export const CATEGORY_LABELS: Record<string, string> = {
  welfare:   'Welfare',
  events:    'Events',
  logistics: 'Logistics',
  equipment: 'Equipment',
  other:     'Other',
}

export const STATUS_COLORS: Record<string, string> = {
  active:   'text-uniben   border-uniben',
  executed: 'text-nigerian border-nigerian',
  rejected: 'text-void     border-void',
  expired:  'text-ghost    border-ghost',
}

// Static fallback — dynamic directory (from approved requests) supersedes
// this on the landing page once Feature: dynamic directory ships.
export const UNIVERSITIES: Record<string, string> = {
  uniben: 'University of Benin',
  unilag: 'University of Lagos',
  abu:    'Ahmadu Bello University',
  oau:    'Obafemi Awolowo University',
}
