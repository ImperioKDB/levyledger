'use client'

import { WalletMultiButton } from '@solana/wallet-adapter-react-ui'
import { usePhantomGuide } from '@/hooks/usePhantomGuide'

export default function ConnectWallet() {
  const { needsPhantomGuide, currentUrl } = usePhantomGuide()

  if (needsPhantomGuide) {
    const phantomUrl =
      `https://phantom.app/ul/browse/${encodeURIComponent(currentUrl)}` +
      `?ref=${encodeURIComponent('https://levyledger.vercel.app')}`
    return (
      <a
        href={phantomUrl}
        className="font-data text-[10px] tracking-widest px-3 py-1.5 border border-uniben text-uniben hover:bg-uniben hover:text-ink transition-colors shrink-0 whitespace-nowrap"
      >
        OPEN IN PHANTOM
      </a>
    )
  }

  return <div className="shrink-0"><WalletMultiButton /></div>
}
