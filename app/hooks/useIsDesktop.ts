import { useState, useEffect } from 'react'

export function useIsDesktop(breakpoint: number = 1280): boolean {
  const [isDesktop, setIsDesktop] = useState(false)

  useEffect(() => {
    function check() {
      setIsDesktop(window.innerWidth >= breakpoint)
    }
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [breakpoint])

  return isDesktop
}
