'use client'

import { useEffect, useRef, useState } from 'react'

export function useAnimatedNumber(target: number, duration = 600): number {
  const [display, setDisplay] = useState(target)
  const currentRef = useRef(target)

  useEffect(() => {
    const from = currentRef.current
    if (from === target) return
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reduceMotion) {
      currentRef.current = target
      setDisplay(target)
      return
    }
    const start = performance.now()
    let frame = 0
    const tick = (now: number) => {
      const progress = Math.min(1, (now - start) / duration)
      const eased = 1 - Math.pow(1 - progress, 3)
      const value = from + (target - from) * eased
      currentRef.current = value
      setDisplay(value)
      if (progress < 1) frame = requestAnimationFrame(tick)
    }
    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [target, duration])

  return display
}
