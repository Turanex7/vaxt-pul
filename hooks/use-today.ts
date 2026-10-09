'use client'

import { useEffect, useState } from 'react'
import { parseISO, startOfToday } from '@/lib/format'

export function useToday(): Date {
  const [today, setToday] = useState(() => parseISO('2026-10-09'))

  useEffect(() => {
    setToday(startOfToday())
  }, [])

  return today
}
