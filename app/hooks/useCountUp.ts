'use client'

import { useEffect, useRef, useState } from 'react'

// Animates a numeric value from its previous target to a new one whenever
// it changes. Used for the homepage aggregate balance so it counts up
// instead of just snapping to a new number on each refresh.
export function useCountUp(target: number, durationMs = 900) {
  const [value, setValue] = useState(target)
  const prevTarget = useRef(target)
  const firstRun = useRef(true)

  useEffect(() => {
    // Don't animate the very first paint -- only animate real changes.
    if (firstRun.current) {
      firstRun.current = false
      prevTarget.current = target
      setValue(target)
      return
    }

    const from = prevTarget.current
    const to = target
    if (from === to) return

    const start = performance.now()
    let raf: number

    function tick(now: number) {
      const t = Math.min(1, (now - start) / durationMs)
      const eased = 1 - Math.pow(1 - t, 3)
      setValue(from + (to - from) * eased)
      if (t < 1) {
        raf = requestAnimationFrame(tick)
      } else {
        prevTarget.current = to
        setValue(to)
      }
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [target, durationMs])

  return value
}
