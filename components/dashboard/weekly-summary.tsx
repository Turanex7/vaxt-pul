'use client'

import { Sparkles } from 'lucide-react'
import useSWR from 'swr'
import { Skeleton } from '@/components/ui/skeleton'
import { getWeeklySummary } from '@/lib/api'
import type { Payment } from '@/lib/mock-data'
import { Panel } from './panel'

export function WeeklySummary({ payments }: { payments: Payment[] }) {
  const key = ['weekly-summary', payments.map((p) => `${p.id}:${p.amount}:${p.nextDate}`).join('|')]
  const { data, isLoading } = useSWR(key, () => getWeeklySummary(payments), { keepPreviousData: true })

  return (
    <section aria-labelledby="weekly-heading">
      <Panel className="flex flex-col gap-3 bg-linear-to-br from-card to-secondary/60">
        <span className="inline-flex items-center gap-1.5 self-start rounded-full bg-secondary px-3 py-1 text-sm font-semibold text-secondary-foreground">
          <Sparkles className="size-4" aria-hidden="true" />
          Həftəlik xülasə
        </span>
        <h2 id="weekly-heading" className="sr-only">Həftəlik xülasə</h2>
        {isLoading && !data ? (
          <div className="flex flex-col gap-3" aria-busy="true" aria-label="Yüklənir">
            <Skeleton className="h-8 w-3/4" />
            <Skeleton className="h-5 w-full" />
            <Skeleton className="h-5 w-2/3" />
          </div>
        ) : data ? (
          <>
            <p className="text-2xl font-semibold tracking-tight text-balance">{data.headline}</p>
            <p className="text-lg text-muted-foreground text-pretty">{data.text}</p>
          </>
        ) : null}
      </Panel>
    </section>
  )
}
