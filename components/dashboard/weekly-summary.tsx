'use client'

import { Sparkles } from 'lucide-react'
import { formatAZN, getNext7DaysStats, startOfToday } from '@/lib/format'
import type { Payment } from '@/lib/mock-data'
import { Panel } from './panel'

export function WeeklySummary({ payments }: { payments: Payment[] }) {
  const stats = getNext7DaysStats(payments, startOfToday())
  const biggest = [...stats.items].sort((a, b) => b.payment.amount - a.payment.amount)[0]
  const headline = `Növbəti 7 gün: ${stats.count} ödəniş, ${stats.deadlineCount} son tarix · ${formatAZN(stats.total, { round: true })}`
  const text = biggest
    ? `Ən böyük məbləğ ${biggest.payment.name} üçündür (${formatAZN(biggest.payment.amount)}). Hesabında həftə ərzində ən azı ${Math.ceil(stats.total)} AZN saxlamağı tövsiyə edirik.`
    : 'Növbəti 7 gündə heç bir ödəniş yoxdur. Rahat həftə!'

  return (
    <section aria-labelledby="weekly-heading">
      <Panel className="flex flex-col gap-3 bg-linear-to-br from-card to-secondary/60">
        <span className="inline-flex items-center gap-1.5 self-start rounded-full bg-secondary px-3 py-1 text-sm font-semibold text-secondary-foreground">
          <Sparkles className="size-4" aria-hidden="true" />
          Həftəlik xülasə
        </span>
        <h2 id="weekly-heading" className="sr-only">Həftəlik xülasə</h2>
        <p className="text-2xl font-semibold tracking-tight text-balance">{headline}</p>
        <p className="text-lg text-muted-foreground text-pretty">{text}</p>
      </Panel>
    </section>
  )
}
