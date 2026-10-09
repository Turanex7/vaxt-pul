import { CalendarClock, Wallet } from 'lucide-react'
import {
  daysLeftLabel,
  daysUntil,
  formatAZN,
  formatDayMonth,
  getOccurrences,
  startOfToday,
  sumOccurrences,
} from '@/lib/format'
import type { Payment } from '@/lib/mock-data'
import { cn } from '@/lib/utils'
import { CategoryDot } from './category-badge'
import { Panel } from './panel'

export function HeroSummary({ payments }: { payments: Payment[] }) {
  const today = startOfToday()
  const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0)
  const in30 = new Date(today)
  in30.setDate(in30.getDate() + 29)
  const in7 = new Date(today)
  in7.setDate(in7.getDate() + 6)

  const thisMonth = sumOccurrences(getOccurrences(payments, today, endOfMonth))
  const next30 = sumOccurrences(getOccurrences(payments, today, in30))
  const week = getOccurrences(payments, today, in7)
  const deadlineCount = week.filter((o) => o.payment.isDeadline).length
  const paymentCount = week.length - deadlineCount

  return (
    <section aria-labelledby="summary-heading" className="grid gap-4 md:grid-cols-2">
      <h2 id="summary-heading" className="sr-only">
        Ümumi baxış
      </h2>

      <Panel className="flex flex-col justify-between gap-6 bg-primary text-primary-foreground ring-0">
        <div className="flex items-center gap-2 text-primary-foreground/80">
          <Wallet className="size-5" aria-hidden="true" />
          <span className="text-base font-medium">Pul</span>
        </div>
        <div>
          <p className="text-lg text-primary-foreground/80">Bu ay</p>
          <p className="text-5xl font-semibold tracking-tight tabular-nums md:text-6xl">
            {formatAZN(thisMonth, { round: true })}
          </p>
        </div>
        <p className="rounded-xl bg-primary-foreground/10 px-4 py-3 text-base">
          Növbəti 30 gündə:{' '}
          <strong className="font-semibold tabular-nums">{formatAZN(next30, { round: true })}</strong>
        </p>
      </Panel>

      <Panel className="flex flex-col gap-4">
        <div className="flex items-center gap-2 text-muted-foreground">
          <CalendarClock className="size-5" aria-hidden="true" />
          <span className="text-base font-medium">Vaxt</span>
        </div>
        <p className="text-2xl font-semibold tracking-tight text-balance">
          Növbəti 7 gün: {paymentCount} ödəniş, {deadlineCount} son tarix
        </p>
        {week.length === 0 ? (
          <p className="text-muted-foreground">Bu həftə heç bir ödəniş yoxdur.</p>
        ) : (
          <ul className="flex flex-col divide-y divide-border">
            {week.slice(0, 5).map(({ payment, date }) => {
              const days = daysUntil(date)
              return (
                <li key={`${payment.id}-${date.getTime()}`} className="flex items-center gap-3 py-2.5">
                  <CategoryDot category={payment.category} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">
                      {payment.name}
                      {payment.isDeadline && (
                        <span className="ml-2 rounded-md bg-urgent-soft px-1.5 py-0.5 text-xs font-semibold text-urgent">
                          Son tarix
                        </span>
                      )}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {formatDayMonth(date)} · {formatAZN(payment.amount)}
                    </p>
                  </div>
                  <span
                    className={cn(
                      'shrink-0 rounded-full px-2.5 py-1 text-sm font-semibold tabular-nums',
                      days <= 2 ? 'bg-urgent-soft text-urgent' : 'bg-warning-soft text-warning',
                    )}
                  >
                    {daysLeftLabel(days)}
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
