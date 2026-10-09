import { CalendarClock, Wallet } from 'lucide-react'
import { useTranslations } from 'next-intl'
import {
  daysUntil,
  getNext7DaysStats,
  getOccurrences,
  sumOccurrences,
} from '@/lib/format'
import type { Payment } from '@/lib/mock-data'
import { cn } from '@/lib/utils'
import { CategoryDot } from './category-badge'
import { Panel } from './panel'
import { useLocalizedFormat } from '@/hooks/use-localized-format'
import { usePaymentName } from '@/hooks/use-payment-name'

export function HeroSummary({ payments, today }: { payments: Payment[]; today: Date }) {
  const t = useTranslations()
  const { amount, dayMonth } = useLocalizedFormat()
  const paymentName = usePaymentName()
  const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0)
  const in30 = new Date(today)
  in30.setDate(in30.getDate() + 29)

  const thisMonth = sumOccurrences(getOccurrences(payments, today, endOfMonth))
  const next30 = sumOccurrences(getOccurrences(payments, today, in30))
  const week = getNext7DaysStats(payments, today)

  return (
    <section aria-labelledby="summary-heading" className="grid gap-4 md:grid-cols-2">
      <h2 id="summary-heading" className="sr-only">
        {t('dashboard.overview')}
      </h2>

      <Panel className="flex flex-col justify-between gap-6 bg-primary text-primary-foreground ring-0">
        <div className="flex items-center gap-2 text-primary-foreground/80">
          <Wallet className="size-5" aria-hidden="true" />
          <span className="text-base font-medium">{t('hero.money')}</span>
        </div>
        <div>
          <p className="text-lg text-primary-foreground/80">{t('hero.remaining')}</p>
          <p className="text-5xl font-semibold tracking-tight tabular-nums md:text-6xl">
            {amount(thisMonth)}
          </p>
        </div>
        <p className="rounded-xl bg-primary-foreground/10 px-4 py-3 text-base">
          {t('hero.next30', { amount: amount(next30) })}
        </p>
      </Panel>

      <Panel className="flex flex-col gap-4">
        <div className="flex items-center gap-2 text-muted-foreground">
          <CalendarClock className="size-5" aria-hidden="true" />
          <span className="text-base font-medium">{t('hero.time')}</span>
        </div>
        <p className="text-2xl font-semibold tracking-tight text-balance">
          {t('hero.next7', {
            payments: t('common.paymentCount', { count: week.count }),
            deadlines: t('common.deadlineCount', { count: week.deadlineCount }),
            amount: amount(week.total),
          })}
        </p>
        {week.count === 0 ? (
          <p className="text-muted-foreground">{t('hero.emptyWeek')}</p>
        ) : (
          <ul className="flex flex-col divide-y divide-border">
            {week.items.map(({ payment, date }) => {
              const days = daysUntil(date, today)
              return (
                <li key={`${payment.id}-${date.getTime()}`} className="flex items-center gap-3 py-2.5">
                  <CategoryDot category={payment.category} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">
                      {paymentName(payment)}
                      {payment.isDeadline && (
                        <span className="ml-2 rounded-md bg-urgent-soft px-1.5 py-0.5 text-xs font-semibold text-urgent">
                          {t('hero.deadline')}
                        </span>
                      )}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {dayMonth(date)} · {amount(payment.amount)}
                    </p>
                  </div>
                  <span
                    className={cn(
                      'shrink-0 rounded-full px-2.5 py-1 text-sm font-semibold tabular-nums',
                      days <= 2 ? 'bg-urgent-soft text-urgent' : 'bg-warning-soft text-warning',
                    )}
                  >
                    {days === 0 ? t('days.today') : days === 1 ? t('days.tomorrow') : days < 0 ? t('days.late', { count: Math.abs(days) }) : t('days.left', { count: days })}
                  </span>
                </li>
              )
            })}
          </ul>
        )}
      </Panel>
    </section>
  )
}
