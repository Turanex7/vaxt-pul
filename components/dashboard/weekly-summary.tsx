'use client'

import { Sparkles } from 'lucide-react'
import useSWR from 'swr'
import { useEffect, useMemo, useState } from 'react'
import { useLocale, useTranslations } from 'next-intl'
import { useLocalizedFormat } from '@/hooks/use-localized-format'
import { usePaymentName } from '@/hooks/use-payment-name'
import { Button } from '@/components/ui/button'
import { getNext7DaysStats, toISO } from '@/lib/format'
import { getWeeklySummary } from '@/lib/api'
import type { Payment } from '@/lib/mock-data'
import { Panel } from './panel'

export function WeeklySummary({ payments, today }: { payments: Payment[]; today: Date }) {
  const t = useTranslations('weekly')
  const categories = useTranslations('categories')
  const locale = useLocale() as 'az' | 'en' | 'ru'
  const { amount } = useLocalizedFormat()
  const paymentName = usePaymentName()
  const [debouncedPayments, setDebouncedPayments] = useState(payments)
  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedPayments(payments), 600)
    return () => window.clearTimeout(timer)
  }, [payments])

  const key = useMemo(() => ['weekly-summary', locale, toISO(today), JSON.stringify(debouncedPayments)], [debouncedPayments, locale, today])
  const { data, error, mutate } = useSWR(
    key,
    () => getWeeklySummary(
      debouncedPayments,
      today,
      (key, values) => t(key as 'headline' | 'paymentCount' | 'deadlineCount' | 'budget' | 'budgetWithDeadline' | 'empty', values),
      locale,
      paymentName,
      (payment) => categories(payment.category),
    ),
    {
      keepPreviousData: false,
      revalidateOnFocus: false,
      errorRetryCount: 2,
      onError: (requestError) => console.error('[weekly summary] request failed', requestError),
    },
  )
  const fallback = useMemo(() => {
    const stats = getNext7DaysStats(debouncedPayments, today)
    const biggest = [...stats.items].sort((a, b) => b.payment.amount - a.payment.amount)[0]
    return {
      headline: t('headline', { payments: t('paymentCount', { count: stats.count }), deadlines: t('deadlineCount', { count: stats.deadlineCount }) }),
      text: biggest
        ? t('budget', { amount: amount(stats.total), name: paymentName(biggest.payment), paymentAmount: amount(biggest.payment.amount) })
        : t('empty'),
    }
  }, [debouncedPayments, today, t, amount, paymentName])
  const summary = data ?? fallback

  return (
    <section aria-labelledby="weekly-heading">
      <Panel className="flex flex-col gap-3 bg-linear-to-br from-card to-secondary/60">
        {error && <div role="status" className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-warning-soft px-3 py-2 text-sm text-warning">
          <span>{t('loadError')}</span>
          <Button type="button" variant="outline" size="sm" onClick={() => void mutate()}>{t('retry')}</Button>
        </div>}
        <span className="inline-flex items-center gap-1.5 self-start rounded-full bg-secondary px-3 py-1 text-sm font-semibold text-secondary-foreground">
          <Sparkles className="size-4" aria-hidden="true" />
          {t('title')}
        </span>
        <h2 id="weekly-heading" className="sr-only">{t('title')}</h2>
        <p className="text-2xl font-semibold tracking-tight text-balance">{summary.headline}</p>
        <p className="text-lg text-muted-foreground text-pretty">{summary.text}</p>
      </Panel>
    </section>
  )
}
