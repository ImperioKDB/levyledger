import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        base: '#0D0D0D',
        surface: '#141414',
        raised: '#1C1C1C',
        border: '#2A2A2A',
        primary: '#F5F5F5',
        muted: '#888888',
        mono: '#AAAAAA',
        accent: '#008751',
        'accent-dim': '#005c37',
        danger: '#C0392B',
        warning: '#D97706',
      },
      fontFamily: {
        grotesk: ['Space Grotesk', 'sans-serif'],
        sans: ['DM Sans', 'sans-serif'],
        mono: ['Space Mono', 'monospace'],
      },
    },
  },
  plugins: [],
}
export default config
