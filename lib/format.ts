import type { CategoryId, Payment, Repeat } from './mock-data'

export const LOCALE_TAGS = { az: 'az-AZ', en: 'en-US', ru: 'ru-RU' } as const
export const TIME_ZONE = 'Asia/Baku'

export const CATEGORIES: Record<CategoryId, { color: string }> = {
  subscriptions: { color: 'var(--chart-1)' },
  telecom: { color: 'var(--chart-2)' },
  utilities: { color: 'var(--chart-3)' },
  loans: { color: 'var(--chart-4)' },
  insurance: { color: 'var(--chart-5)' },
  contracts: { color: 'var(--chart-6)' },
}

export const CATEGORY_IDS = Object.keys(CATEGORIES) as CategoryId[]
export const REPEAT_IDS: Repeat[] = ['weekly', 'monthly', 'yearly', 'once']

export type LocalizedMonthNames = {
  standalone: Record<string, string>
  inDate: Record<string, string>
}

export function formatAmount(value: number, locale: keyof typeof LOCALE_TAGS = 'az'): string {
  const amount = formatNumber(value, locale)
  return locale === 'en' ? `AZN ${amount}` : `${amount} AZN`
}

export function formatNumber(value: number, locale: keyof typeof LOCALE_TAGS = 'az'): string {
  const decimals = Number.isInteger(value) ? 0 : 2
  const decimalSeparator = locale === 'en' ? '.' : ','
  const groupingSeparator = locale === 'en' ? ',' : ' '
  const localizedParts = new Intl.NumberFormat(LOCALE_TAGS[locale], {
    useGrouping: true,
    minimumFractionDigits: decimals,
    maximumFractionDigits: 2,
  }).formatToParts(value)
  const decimalIsLocalized = decimals === 0 || localizedParts.some((part) => part.type === 'decimal' && part.value === decimalSeparator)
  const groupingIsLocalized = Math.abs(value) < 1000 || localizedParts
    .filter((part) => part.type === 'group')
    .every((part) => locale === 'en' ? part.value === ',' : /^\s+$/.test(part.value))
  if (decimalIsLocalized && groupingIsLocalized) {
    return localizedParts.map((part) => part.type === 'group' ? groupingSeparator : part.value).join('')
  }

  const fixed = Math.abs(value).toFixed(2)
  const [integerPart, fractionPart] = fixed.split('.')
  const grouped = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, groupingSeparator)
  const sign = value < 0 ? '-' : ''
  return `${sign}${grouped}${fractionPart === '00' ? '' : `${decimalSeparator}${fractionPart}`}`
}

export function parseISO(iso: string): Date {
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(y, m - 1, d)
}

export function toISO(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

export function startOfToday(): Date {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(new Date())
  const value = Object.fromEntries(parts.map(({ type, value }) => [type, value]))
  return parseISO(`${value.year}-${value.month}-${value.day}`)
}

export function formatDayMonth(date: Date | string, locale: keyof typeof LOCALE_TAGS = 'az'): string {
  return formatCalendarDate(date, locale, { day: 'numeric', month: 'long' })
}

export function formatCalendarDate(
  value: Date | string,
  locale: keyof typeof LOCALE_TAGS,
  options: Intl.DateTimeFormatOptions,
  monthNames?: LocalizedMonthNames,
): string {
  const date = typeof value === 'string' ? value : toISO(value)
  const [year, month, day] = date.split('-').map(Number)
  if (monthNames && options.month === 'long') {
    const key = String(month).padStart(2, '0')
    const monthName = (options.day ? monthNames.inDate : monthNames.standalone)[key]
    const dayPart = options.day ? String(day) : ''
    const yearPart = options.year ? String(year) : ''
    const datePart = locale === 'en'
      ? [monthName, dayPart].filter(Boolean).join(' ')
      : [dayPart, monthName].filter(Boolean).join(' ')
    return [datePart, yearPart].filter(Boolean).join(' ')
  }
  const stableDate = new Date(Date.UTC(year, month - 1, day, 12))
  return new Intl.DateTimeFormat(LOCALE_TAGS[locale], { ...options, timeZone: TIME_ZONE }).format(stableDate)
}

export function formatMonthYear(value: Date, locale: keyof typeof LOCALE_TAGS, monthNames?: LocalizedMonthNames): string {
  if (monthNames) {
    const month = monthNames.standalone[String(value.getMonth() + 1).padStart(2, '0')]
    return `${month} ${value.getFullYear()}`
  }
  const date = toISO(value)
  const month = formatCalendarDate(date, locale, { month: 'long' })
  const year = String(value.getFullYear())
  return `${month.slice(0, 1).toUpperCase()}${month.slice(1)} ${year}`
}

export function getLocalizedMonthAliases(): Array<{ month: number; aliases: string[] }> {
  const locales = Object.keys(LOCALE_TAGS) as Array<keyof typeof LOCALE_TAGS>
  return Array.from({ length: 12 }, (_, month) => {
    const date = new Date(Date.UTC(2026, month, 1, 12))
    const aliases = locales.flatMap((locale) => {
      const formatter = new Intl.DateTimeFormat(LOCALE_TAGS[locale], { month: 'long', timeZone: TIME_ZONE })
      const standalone = formatter.format(date).toLowerCase()
      const genitive = new Intl.DateTimeFormat(LOCALE_TAGS[locale], { day: 'numeric', month: 'long', timeZone: TIME_ZONE })
        .formatToParts(date).find((part) => part.type === 'month')?.value.toLowerCase() ?? ''
      return [standalone, genitive]
    })
    return { month, aliases: [...new Set(aliases.filter(Boolean))] }
  })
}

export function daysUntil(date: Date | string, today = startOfToday()): number {
  const d = typeof date === 'string' ? parseISO(date) : date
  const start = new Date(today)
  start.setHours(0, 0, 0, 0)
  return Math.round((d.getTime() - start.getTime()) / 86_400_000)
}

export function monthlyEquivalent(p: Pick<Payment, 'amount' | 'repeat'>): number {
  if (p.repeat === 'yearly') return p.amount / 12
  if (p.repeat === 'weekly') return p.amount * 52 / 12
  if (p.repeat === 'once') return 0
  return p.amount
}

function addMonthsClamped(base: Date, months: number): Date {
  const targetDay = base.getDate()
  const d = new Date(base.getFullYear(), base.getMonth() + months, 1)
  const lastDay = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate()
  d.setDate(Math.min(targetDay, lastDay))
  return d
}

export function nextPaymentPeriod(nextDate: string, repeat: Repeat): string {
  const date = parseISO(nextDate)
  if (repeat === 'weekly') {
    date.setDate(date.getDate() + 7)
    return toISO(date)
  }
  return toISO(addMonthsClamped(date, repeat === 'yearly' ? 12 : 1))
}

export interface Occurrence {
  payment: Payment
  date: Date
}

/** Expands recurring payments into concrete dates within [start, end] (inclusive). */
export function getOccurrences(payments: Payment[], start: Date, end: Date): Occurrence[] {
  const result: Occurrence[] = []
  for (const payment of payments) {
    const base = parseISO(payment.nextDate)
    const step = payment.repeat === 'weekly' ? 7 : payment.repeat === 'monthly' ? 1 : payment.repeat === 'yearly' ? 12 : 0
    if (step === 0) {
      if (base >= start && base <= end) result.push({ payment, date: base })
      continue
    }
    const remaining = payment.installment
      ? payment.installment.total - payment.installment.paid
      : Infinity
    for (let k = 0; k <= 36; k++) {
      if (k >= remaining) break
      const date = payment.repeat === 'weekly'
        ? new Date(base.getFullYear(), base.getMonth(), base.getDate() + k * step)
        : addMonthsClamped(base, k * step)
      if (date > end) break
      if (date >= start) result.push({ payment, date })
    }
  }
  return result.sort((a, b) => a.date.getTime() - b.date.getTime())
}

export function sumOccurrences(list: Occurrence[]): number {
  const cents = list.reduce((acc, o) => acc + Math.round(o.payment.amount * 100), 0)
  return cents / 100
}

export function getNext7DaysStats(payments: Payment[], today: Date) {
  const start = new Date(today)
  start.setHours(0, 0, 0, 0)
  const end = new Date(start)
  end.setDate(end.getDate() + 6)
  const items = getOccurrences(payments, start, end)
  return {
    count: items.length,
    total: sumOccurrences(items),
    deadlineCount: items.filter(({ payment }) => payment.isDeadline).length,
    items,
  }
}
