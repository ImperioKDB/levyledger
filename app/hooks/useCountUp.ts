'use client'

import { useEffect, useRef, useState } from 'react'

// Animates a numeric value from its previous target to a new one whenever
// it changes. Honors prefers-reduced-motion by snapping instead of animating.
export function useCountUp(target: number, durationMs = 900) {
  const [value, setValue] = useState(target)
  const prevTarget = useRef(target)
  const firstRun = useRef(true)
  const reduceMotion = useRef(false)

  useEffect(() => {
    reduceMotion.current = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  }, [])

  useEffect(() => {
    if (firstRun.current) {
      firstRun.current = false
      prevTarget.current = target
      setValue(target)
      return
    }

    const from = prevTarget.current
    const to = target
    if (from === to) return

    if (reduceMotion.current) {
      prevTarget.current = to
      setValue(to)
      return
    }

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
