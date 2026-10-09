'use client'

import { useFormatter, useLocale } from 'next-intl'
import { formatAmount as formatAmountValue, parseISO } from '@/lib/format'

function asUtcDate(value: Date | string) {
  const date = typeof value === 'string' ? parseISO(value) : value
  return new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()))
}

export function useLocalizedFormat() {
  const formatter = useFormatter()
  const locale = useLocale()
  return {
    amount: (value: number) => formatAmountValue(value, locale),
    dayMonth: (value: Date | string) => formatter.dateTime(asUtcDate(value), { day: 'numeric', month: 'long', timeZone: 'UTC' }),
    monthYear: (value: Date) => formatter.dateTime(asUtcDate(value), { month: 'long', year: 'numeric', timeZone: 'UTC' }),
  }
}
