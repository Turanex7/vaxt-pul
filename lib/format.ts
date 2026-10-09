import type { CategoryId, Payment, Repeat } from './mock-data'

export const MONTHS_NOMINATIVE = [
  'Yanvar', 'Fevral', 'Mart', 'Aprel', 'May', 'İyun',
  'İyul', 'Avqust', 'Sentyabr', 'Oktyabr', 'Noyabr', 'Dekabr',
]

export const MONTHS_LOWER = MONTHS_NOMINATIVE.map((m) => m.toLowerCase())

export const WEEKDAYS_SHORT = ['B.e', 'Ç.a', 'Ç', 'C.a', 'C', 'Ş', 'B']

export const CATEGORIES: Record<CategoryId, { label: string; color: string }> = {
  abune: { label: 'Abunələr', color: 'var(--chart-1)' },
  telekom: { label: 'Telekom', color: 'var(--chart-2)' },
  kommunal: { label: 'Kommunal', color: 'var(--chart-3)' },
  kredit: { label: 'Kredit', color: 'var(--chart-4)' },
  sigorta: { label: 'Sığorta və sənədlər', color: 'var(--chart-5)' },
  muqavile: { label: 'Müqavilələr', color: 'var(--chart-6)' },
}

export const CATEGORY_IDS = Object.keys(CATEGORIES) as CategoryId[]

export const REPEAT_LABELS: Record<Repeat, string> = {
  monthly: 'Aylıq',
  yearly: 'İllik',
  once: 'Birdəfəlik',
}

export function formatAmount(value: number, locale = 'az'): string {
  const [integerPart, fractionPart] = Number.isInteger(value)
    ? [String(value), '']
    : value.toFixed(2).split('.')
  const separator = locale === 'en' ? ',' : ' '
  const grouped = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, separator)
  const decimalSeparator = locale === 'en' ? '.' : ','
  const formatted = fractionPart && fractionPart !== '00' ? `${grouped}${decimalSeparator}${fractionPart}` : grouped
  return locale === 'en' ? `AZN ${formatted}` : `${formatted} AZN`
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
  const d = new Date()
  d.setHours(0, 0, 0, 0)
  return d
}

export function formatDayMonth(date: Date | string): string {
  const d = typeof date === 'string' ? parseISO(date) : date
  return `${d.getDate()} ${MONTHS_LOWER[d.getMonth()]}`
}

export function daysUntil(date: Date | string, today = startOfToday()): number {
  const d = typeof date === 'string' ? parseISO(date) : date
  const start = new Date(today)
  start.setHours(0, 0, 0, 0)
  return Math.round((d.getTime() - start.getTime()) / 86_400_000)
}

export function daysLeftLabel(days: number): string {
  if (days < 0) return `${Math.abs(days)} gün gecikib`
  if (days === 0) return 'Bu gün'
  if (days === 1) return 'Sabah'
  return `${days} gün qalıb`
}

export function monthlyEquivalent(p: Pick<Payment, 'amount' | 'repeat'>): number {
  if (p.repeat === 'yearly') return p.amount / 12
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
    const step = payment.repeat === 'monthly' ? 1 : payment.repeat === 'yearly' ? 12 : 0
    if (step === 0) {
      if (base >= start && base <= end) result.push({ payment, date: base })
      continue
    }
    const remaining = payment.installment
      ? payment.installment.total - payment.installment.paid
      : Infinity
    for (let k = 0; k <= 36; k++) {
      if (k >= remaining) break
      const date = addMonthsClamped(base, k * step)
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
