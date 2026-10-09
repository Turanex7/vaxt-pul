'use client'

import { useLocale, useTranslations } from 'next-intl'
import { formatAmount as formatAmountValue, formatCalendarDate, formatMonthYear, formatNumber as formatNumberValue, type LocalizedMonthNames } from '@/lib/format'

export function useLocalizedFormat() {
  const locale = useLocale() as 'az' | 'en' | 'ru'
  const t = useTranslations('formatting.months')
  const months: LocalizedMonthNames = {
    standalone: Object.fromEntries(Array.from({ length: 12 }, (_, i) => {
      const key = String(i + 1).padStart(2, '0')
      return [key, t(`standalone.${key}`)]
    })),
    inDate: Object.fromEntries(Array.from({ length: 12 }, (_, i) => {
      const key = String(i + 1).padStart(2, '0')
      return [key, t(`inDate.${key}`)]
    })),
  }
  return {
    amount: (value: number) => formatAmountValue(value, locale),
    number: (value: number) => formatNumberValue(value, locale),
    dayMonth: (value: Date | string) => formatCalendarDate(value, locale, { day: 'numeric', month: 'long' }, months),
    monthYear: (value: Date) => formatMonthYear(value, locale, months),
  }
}
