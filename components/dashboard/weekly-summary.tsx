'use client'

import { Sparkles } from 'lucide-react'
import useSWR from 'swr'
import { useEffect, useMemo, useState } from 'react'
import { formatAmount, getNext7DaysStats, toISO } from '@/lib/format'
import { getWeeklySummary } from '@/lib/api'
import type { Payment } from '@/lib/mock-data'
import { Panel } from './panel'

export function WeeklySummary({ payments, today }: { payments: Payment[]; today: Date }) {
  const [debouncedPayments, setDebouncedPayments] = useState(payments)
  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedPayments(payments), 600)
    return () => window.clearTimeout(timer)
  }, [payments])

  const key = useMemo(() => ['weekly-summary', toISO(today), JSON.stringify(debouncedPayments)], [debouncedPayments, today])
  const { data } = useSWR(key, () => getWeeklySummary(debouncedPayments, today), { keepPreviousData: true })
  const fallback = useMemo(() => {
    const stats = getNext7DaysStats(debouncedPayments, today)
    const biggest = [...stats.items].sort((a, b) => b.payment.amount - a.payment.amount)[0]
    return {
      headline: `Növbəti 7 gündə ${stats.count} ödəniş, ${stats.deadlineCount} son tarix var.`,
      text: biggest
        ? `${formatAmount(stats.total)} məbləğini həftəlik büdcəndə nəzərdə saxla. Ən böyük ödəniş ${biggest.payment.name} üçündür (${formatAmount(biggest.payment.amount)}).`
        : 'Növbəti 7 gündə ödəniş yoxdur. Rahat həftədən yararlan.',
    }
  }, [debouncedPayments, today])
  const summary = data ?? fallback

  return (
    <section aria-labelledby="weekly-heading">
      <Panel className="flex flex-col gap-3 bg-linear-to-br from-card to-secondary/60">
        <span className="inline-flex items-center gap-1.5 self-start rounded-full bg-secondary px-3 py-1 text-sm font-semibold text-secondary-foreground">
          <Sparkles className="size-4" aria-hidden="true" />
          Həftəlik xülasə
        </span>
        <h2 id="weekly-heading" className="sr-only">Həftəlik xülasə</h2>
        <p className="text-2xl font-semibold tracking-tight text-balance">{summary.headline}</p>
        <p className="text-lg text-muted-foreground text-pretty">{summary.text}</p>
      </Panel>
    </section>
  )
}
