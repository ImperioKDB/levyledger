import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  safelist: [
    'text-pending',   'border-pending',
    'text-nigerian',  'border-nigerian',
    'text-uniben',    'border-uniben',
    'text-void',      'border-void',
    'text-ghost',     'border-ghost',
    'text-ledger',    'border-ledger',
  ],
  theme: {
    borderRadius: {
      none: '0px', sm: '0px', DEFAULT: '0px',
      md: '0px', lg: '0px', xl: '0px',
      '2xl': '0px', '3xl': '0px', full: '0px',
    },
    extend: {
      colors: {
        ink:      'var(--ink)',
        paper:    'var(--paper)',
        lifted:   'var(--lifted)',
        rule:     'var(--rule)',
        ghost:    'var(--ghost)',
        body:     'var(--body)',
        ledger:   'var(--ledger)',
        uniben:   'var(--uniben)',
        nigerian: 'var(--nigerian)',
        void:     'var(--void)',
        pending:  'var(--pending)',
      },
      fontFamily: {
        display: ['var(--font-display)', 'Space Grotesk', 'system-ui', 'sans-serif'],
        body:    ['var(--font-body)',    'DM Sans',        'system-ui', 'sans-serif'],
        data:    ['var(--font-data)',    'Space Mono',     'monospace'],
      },
    },
  },
  plugins: [],
}

export default config
