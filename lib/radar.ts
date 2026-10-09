import {
  daysUntil,
  formatAZN,
  formatDayMonth,
  getOccurrences,
  startOfToday,
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
  return `${p.name} ${p.provider ?? ''}`.toLocaleLowerCase('az')
}

export function buildRadarInsights(payments: Payment[]): Insight[] {
  const today = startOfToday()
  const insights: Insight[] = []

  insights.push(...deadlineInsights(payments))
  insights.push(...duplicateSubscriptionInsights(payments))
  insights.push(...heavyWeekInsight(payments, today))
  insights.push(...next7DaysInsight(payments, today))

  return insights
}

function deadlineInsights(payments: Payment[]): Insight[] {
  return payments
    .map((p) => ({ p, days: daysUntil(p.nextDate) }))
    .filter(({ days }) => days <= 14)
    .sort((a, b) => a.days - b.days)
    .map(({ p, days }) => {
      const isDoc = p.category === 'sigorta' || Boolean(p.isDeadline)
      const verb = isDoc ? 'bitir' : 'ödənilir'
      const title =
        days < 0
          ? `${p.name} ${Math.abs(days)} gün gecikib`
          : days === 0
            ? `${p.name} bu gün ${verb}`
            : `${p.name} ${days} gündən sonra ${verb}`
      return {
        id: `radar-deadline-${p.id}`,
        kind: 'deadline' as const,
        severity: days <= 3 ? ('urgent' as const) : ('warning' as const),
        title,
        description: isDoc
          ? `Vaxtında yeniləməsən, cərimə riski var. Təxmini məbləğ ${formatAZN(p.amount)}.`
          : `Məbləğ ${formatAZN(p.amount)}.`,
        relatedPaymentIds: [p.id],
        amount: p.amount,
      }
    })
}

function duplicateSubscriptionInsights(payments: Payment[]): Insight[] {
  const abune = payments.filter((p) => p.category === 'abune')
  const groups: { id: string; hint: string; items: Payment[] }[] = [
    {
      id: 'video',
      hint: 'Netflix və YouTube Premium eyni tipli video abunəsidir.',
      items: abune.filter((p) => {
        const n = paymentLabel(p)
        if (/youtube/i.test(n) && /music/i.test(n)) return false
        return /netflix/i.test(n) || /youtube/i.test(n)
      }),
    },
    {
      id: 'music',
      hint: 'YouTube Premium musiqini də əhatə edir.',
      items: abune.filter((p) => {
        const n = paymentLabel(p)
        return /spotify/i.test(n) || /youtube/i.test(n)
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
      description: `${group.hint} ${names}. Dayandırsan, ildə ${formatAZN(savings, { round: true })} qənaət.`,
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
    if (end > in30) end.setTime(in30.getTime())
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

  const rounded = formatAZN(best.total, { round: true })
  const title =
    best.weekIndex === 0
      ? `Bu həftə ${rounded} lazım olacaq`
      : `Ən yüklü həftədə ${rounded} lazım olacaq`
  const description =
    best.weekIndex === 0
      ? `${best.count} ödəniş növbəti 7 günə düşür.`
      : `${formatDayMonth(best.start)} – ${formatDayMonth(best.end)} arası ${best.count} ödəniş.`

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
  const in7 = new Date(today)
  in7.setDate(in7.getDate() + 6)
  const occ = getOccurrences(payments, today, in7)
  if (occ.length === 0) return []
  const total = sumOccurrences(occ)
  const dayCount = new Set(occ.map((o) => toISO(o.date))).size
  return [
    {
      id: 'radar-next7',
      kind: 'forecast',
      severity: 'warning',
      title: `Növbəti 7 gün: ${occ.length} ödəniş`,
      description: `${dayCount} günə yayılıb, cəmi ${formatAZN(total, { round: true })}.`,
      amount: total,
    },
  ]
}
