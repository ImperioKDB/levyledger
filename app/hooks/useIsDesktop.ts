'use client'

import { useLayoutEffect, useState } from 'react'

const DESKTOP_QUERY = '(min-width: 1280px)'

// Reports whether the real browser viewport is currently >=1280px,
// and stays in sync on resize. No query params, no saved
// preferences. Every visitor gets the correct layout automatically
// based on their actual screen.
export function useIsDesktop(): boolean {
  const [isDesktop, setIsDesktop] = useState(false)

  useLayoutEffect(() => {
    const mql = window.matchMedia(DESKTOP_QUERY)
    setIsDesktop(mql.matches)
    const handler = (e: MediaQueryListEvent) => setIsDesktop(e.matches)
    mql.addEventListener('change', handler)
    return () => mql.removeEventListener('change', handler)
  }, [])

  return isDesktop
}
