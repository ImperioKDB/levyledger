import type { Metadata } from 'next'
import { Space_Grotesk, DM_Sans, Space_Mono } from 'next/font/google'
import { WalletContextProvider } from '@/components/WalletContextProvider'
import './globals.css'

const spaceGrotesk = Space_Grotesk({
  subsets:  ['latin'],
  weight:   ['400', '500', '600', '700'],
  variable: '--font-display',
  display:  'swap',
})

const dmSans = DM_Sans({
  subsets:  ['latin'],
  weight:   ['400', '500'],
  variable: '--font-body',
  display:  'swap',
})

const spaceMono = Space_Mono({
  subsets:  ['latin'],
  weight:   ['400', '700'],
  variable: '--font-data',
  display:  'swap',
})

export const metadata: Metadata = {
  title: {
    default:  'LevyLedger',
    template: '%s — LevyLedger',
  },
  description:
    'On-chain treasury transparency for Nigerian student unions. ' +
    'Every levy. Every vote. On-chain.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html
      lang="en"
      className={[
        spaceGrotesk.variable,
        dmSans.variable,
        spaceMono.variable,
      ].join(' ')}
    >
      <body>
        <WalletContextProvider>
          <div className="page-enter">
            {children}
          </div>
        </WalletContextProvider>
      </body>
    </html>
  )
}
