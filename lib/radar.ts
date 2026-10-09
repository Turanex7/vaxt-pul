import {
  daysUntil,
  formatAmount,
  formatDayMonth,
  getOccurrences,
  sumOccurrences,
  toISO,
} from './format'
import type { Insight, Payment } from './mock-data'

const WEEK_LOAD_LARGE_AZN = 200

function yearlyAmount(p: Payment): number {
  if (p.repeat === 'yearly') return p.amount
  if (p.repeat === 'once') return p.amount
  return p.amount * 12
}

function paymentLabel(p: Payment): string {
  return `${p.name} ${p.provider ?? ''}`.toLowerCase()
}

export function buildRadarInsights(payments: Payment[], today: Date): Insight[] {
  const insights: Insight[] = []

  insights.push(...deadlineInsights(payments, today))
  insights.push(...duplicateSubscriptionInsights(payments))
  insights.push(...heavyWeekInsight(payments, today))

  return insights
}

function deadlineInsights(payments: Payment[], today: Date): Insight[] {
  const deadlines = payments
    .map((p) => ({ p, days: daysUntil(p.nextDate, today) }))
    .filter(({ p, days }) => (p.category === 'sigorta' || p.isDeadline) && days >= 0 && days <= 14)
    .sort((a, b) => a.days - b.days)
    .map(({ p, days }) => {
      return {
        id: `radar-expiry-${p.id}`,
        kind: 'deadline' as const,
        severity: 'warning' as const,
        title: days === 0 ? `${p.name} bu gün bitir` : `${p.name} ${days} gündən sonra bitir`,
        description: `Vaxtında yenilə. Məbləğ ${formatAmount(p.amount)}.`,
        relatedPaymentIds: [p.id],
        amount: p.amount,
      }
    })

  const variablePayments = payments
    .filter((p) => p.previousAmount !== undefined && p.amount !== p.previousAmount)
    .map((p) => ({
      id: `radar-variable-${p.id}`,
      kind: 'spike' as const,
      severity: 'warning' as const,
      title: `${p.name} ödənişi artıb`,
      description: `Bu dəfə ${formatAmount(p.amount)}, əvvəl ${formatAmount(p.previousAmount!)} idi.`,
      relatedPaymentIds: [p.id],
      amount: p.amount,
    }))

  return [...variablePayments, ...deadlines]
}

function duplicateSubscriptionInsights(payments: Payment[]): Insight[] {
  const abune = payments.filter((p) => p.category === 'abune')
  const items = [
    abune.find((p) => /spotify/i.test(paymentLabel(p))),
    abune.find((p) => /youtube/i.test(paymentLabel(p)) && /premium/i.test(paymentLabel(p)) && !/music/i.test(paymentLabel(p))),
  ].filter((p): p is Payment => Boolean(p))
  if (items.length < 2) return []

  const yearly = items.map(yearlyAmount)
  const savings = Math.round((yearly.reduce((a, b) => a + b, 0) - Math.max(...yearly)) * 100) / 100
  if (savings <= 0) return []
  const names = items.map((p) => p.name)
  return [{
    id: 'radar-dup-music',
    kind: 'duplicate',
    severity: 'saving',
    title: 'Abunəliklər üst-üstə düşür',
    description: `${names.join(' və ')} musiqi xidmətləri üst-üstə düşür (YouTube Premium-a YouTube Music daxildir). Birini dayandırsan, ildə ${formatAmount(savings)} qənaət.`,
    relatedPaymentIds: items.map((p) => p.id),
    amount: savings,
  }]
}

function heavyWeekInsight(payments: Payment[], today: Date): Insight[] {
  const horizonEnd = new Date(today)
  horizonEnd.setHours(0, 0, 0, 0)
  horizonEnd.setDate(horizonEnd.getDate() + 29)

  let best: { start: Date; end: Date; count: number; total: number } | null = null
  for (let start = new Date(today); start <= horizonEnd; start.setDate(start.getDate() + 1)) {
    const windowStart = new Date(start)
    const end = new Date(start)
    end.setDate(end.getDate() + 6)
    if (end > horizonEnd) end.setTime(horizonEnd.getTime())
    const occ = getOccurrences(payments, start, end)
    const total = sumOccurrences(occ)
    const count = occ.length
    if (!best || total > best.total || (total === best.total && count > best.count)) {
      best = { start: windowStart, end, count, total }
    }
  }

  if (!best) return []
  const isHeavy = best.count >= 2 || best.total >= WEEK_LOAD_LARGE_AZN
  if (!isHeavy || best.total <= 0) return []

  const rounded = formatAmount(best.total)
  const title = `Ən yüklü həftə: ${formatDayMonth(best.start)} – ${formatDayMonth(best.end)}, ${rounded}`
  const description = `${best.count} ödəniş, həftə üzrə cəmi ${rounded}.`

  return [
    {
      id: `radar-week-${toISO(best.start)}`,
      kind: 'forecast',
      severity: 'warning',
      title,
      description,
      amount: best.total,
    },
  ]
}
