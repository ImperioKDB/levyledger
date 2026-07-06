'use client'

import { useEffect, useState } from 'react'

// Mobile browsers (not Phantom's own in-app browser) can't connect to an
// injected wallet provider directly -- there isn't one. The wallet-adapter
// modal's default behavior in that case is to treat Phantom as "not
// installed" and link to the install/download page, even for someone who
// already has the app. The fix is a deep link into Phantom's own browser,
// not a generic connect button. This was previously only handled inside
// admin/page.tsx; every other page's wallet button needs the same check.
export function usePhantomGuide() {
  const [needsPhantomGuide, setNeedsPhantomGuide] = useState(false)
  const [currentUrl, setCurrentUrl] = useState('')

  useEffect(() => {
    const win = window as any
    const phantomInjected =
      win.solana?.isPhantom === true ||
      win.phantom?.solana?.isPhantom === true
    const mobile =
      /Android|iPhone|iPad|iPod/i.test(navigator.userAgent) ||
      window.innerWidth < 768
    setNeedsPhantomGuide(mobile && !phantomInjected)
    setCurrentUrl(window.location.href)
  }, [])

  return { needsPhantomGuide, currentUrl }
}
