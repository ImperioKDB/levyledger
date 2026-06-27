import type { Metadata } from 'next'
import './globals.css'
import { WalletContextProvider } from '@/components/WalletContextProvider'

export const metadata: Metadata = {
  title: 'LevyLedger — Transparent Student Union Treasury',
  description: 'On-chain treasury accountability for Nigerian student unions',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        <WalletContextProvider>
          {children}
        </WalletContextProvider>
      </body>
    </html>
  )
}
