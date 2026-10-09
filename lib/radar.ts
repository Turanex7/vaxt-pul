import {
  daysUntil,
  formatAmount,
  formatDayMonth,
  getNext7DaysStats,
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
  insights.push(...next7DaysInsight(payments, today))

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
      severity: 'urgent' as const,
      title: `${p.name} dəyişkən ödənişdir — Təcili yoxla`,
      description: `Bu dəfə ${formatAmount(p.amount)}, əvvəl ${formatAmount(p.previousAmount!)} idi.`,
      relatedPaymentIds: [p.id],
      amount: p.amount,
    }))

  return [...variablePayments, ...deadlines]
}

function duplicateSubscriptionInsights(payments: Payment[]): Insight[] {
  const abune = payments.filter((p) => p.category === 'abune')
  const groups: { id: string; items: Payment[] }[] = [
    {
      id: 'video',
      items: abune.filter((p) => {
        const n = paymentLabel(p)
        if (/youtube/i.test(n) && /music/i.test(n)) return false
        return /netflix/i.test(n) || /youtube/i.test(n)
      }),
    },
    {
      id: 'music',
      items: abune.filter((p) => {
        const n = paymentLabel(p)
        return /spotify/i.test(n) || (/youtube/i.test(n) && /music/i.test(n))
      }),
    },
  ]

  const cards: Insight[] = []
  for (const group of groups) {
    if (group.items.length < 2) continue
    const yearly = group.items.map((p) => yearlyAmount(p))
    const keep = Math.max(...yearly)
    const savings = Math.round((yearly.reduce((a, b) => a + b, 0) - keep) * 100) / 100
    if (savings <= 0) continue
    const names = group.items.map((p) => p.name).join(', ')
    cards.push({
      id: `radar-dup-${group.id}`,
      kind: 'duplicate',
      severity: 'saving',
      title: `Bu ${group.items.length} abunə təkrarlanır`,
      description: `${names} eyni tipli abunədir. Birini dayandırsan, ildə ${formatAmount(savings)} qənaət.`,
      relatedPaymentIds: group.items.map((p) => p.id),
      amount: savings,
    })
  }
  return cards
}

function heavyWeekInsight(payments: Payment[], today: Date): Insight[] {
  const in30 = new Date(today)
  in30.setDate(in30.getDate() + 29)

  let best: { start: Date; end: Date; count: number; total: number; weekIndex: number } | null = null
  for (let w = 0; w < 5; w++) {
    const start = new Date(today)
    start.setDate(start.getDate() + w * 7)
    if (start > in30) break
    const end = new Date(start)
    end.setDate(end.getDate() + 6)
    const occ = getOccurrences(payments, start, end)
    const total = sumOccurrences(occ)
    const count = occ.length
    if (!best || total > best.total || (total === best.total && count > best.count)) {
      best = { start, end, count, total, weekIndex: w }
    }
  }

  if (!best) return []
  const isHeavy = best.count >= 2 || best.total >= WEEK_LOAD_LARGE_AZN
  if (!isHeavy || best.total <= 0) return []

  const rounded = formatAmount(best.total)
  const title = best.weekIndex === 0
    ? `Bu həftə ${rounded} lazım olacaq`
    : `Ən yüklü həftə: ${formatDayMonth(best.start)} – ${formatDayMonth(best.end)}, ${rounded}`
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

function next7DaysInsight(payments: Payment[], today: Date): Insight[] {
  const stats = getNext7DaysStats(payments, today)
  if (stats.count === 0) return []
  return [
    {
      id: 'radar-next7',
      kind: 'forecast',
      severity: 'warning',
      title: `Növbəti 7 gündə ${stats.count} ödəniş`,
      description: `${stats.deadlineCount} son tarix, cəmi ${formatAmount(stats.total)}.`,
      amount: stats.total,
    },
  ]
}
