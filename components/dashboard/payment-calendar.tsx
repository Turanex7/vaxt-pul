'use client'

import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  CATEGORIES,
  MONTHS_NOMINATIVE,
  WEEKDAYS_SHORT,
  formatAmount,
  formatDayMonth,
  getOccurrences,
  sumOccurrences,
  parseISO,
  toISO,
  type Occurrence,
} from '@/lib/format'
import type { Payment } from '@/lib/mock-data'
import { cn } from '@/lib/utils'
import { CategoryBadge } from './category-badge'
import { Panel } from './panel'

const HEAVY_DAY_THRESHOLD = 100

export function PaymentCalendar({ payments, today }: { payments: Payment[]; today: Date }) {
  const [cursor, setCursor] = useState(() => new Date(today.getFullYear(), today.getMonth(), 1))
  const [selectedISO, setSelectedISO] = useState(() => toISO(today))

  useEffect(() => {
    setCursor(new Date(today.getFullYear(), today.getMonth(), 1))
    setSelectedISO(toISO(today))
  }, [today])

  const year = cursor.getFullYear()
  const month = cursor.getMonth()
  const monthStart = new Date(year, month, 1)
  const monthEnd = new Date(year, month + 1, 0)
  const leadingBlanks = (monthStart.getDay() + 6) % 7

  const byDay = new Map<string, Occurrence[]>()
  for (const occ of getOccurrences(payments, monthStart, monthEnd)) {
    const key = toISO(occ.date)
    byDay.set(key, [...(byDay.get(key) ?? []), occ])
  }

  const selected = byDay.get(selectedISO) ?? []
  const selectedDate = parseISO(selectedISO)
  const monthTotal = sumOccurrences([...byDay.values()].flat())

  const shiftMonth = (delta: number) => {
    const next = new Date(year, month + delta, 1)
    setCursor(next)
    setSelectedISO(
      next.getFullYear() === today.getFullYear() && next.getMonth() === today.getMonth()
        ? toISO(today)
        : toISO(next),
    )
  }

  return (
    <Panel className="flex flex-col">
      <div className="flex items-center justify-between gap-2">
        <div>
          <h3 className="text-xl font-semibold" aria-live="polite">
            {MONTHS_NOMINATIVE[month]} {year}
          </h3>
          <p className="text-muted-foreground">
            Cəmi: <span className="font-semibold text-foreground tabular-nums">{formatAmount(monthTotal)}</span>
          </p>
        </div>
        <div className="flex gap-1">
          <Button variant="outline" size="icon" onClick={() => shiftMonth(-1)} aria-label="Əvvəlki ay">
            <ChevronLeft className="size-5" />
          </Button>
          <Button variant="outline" size="icon" onClick={() => shiftMonth(1)} aria-label="Növbəti ay">
            <ChevronRight className="size-5" />
          </Button>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-7 gap-1 text-center" role="group" aria-label="Ödəniş təqvimi">
        {WEEKDAYS_SHORT.map((d) => (
          <div key={d} aria-hidden="true" className="pb-1 text-sm font-medium text-muted-foreground">
            {d}
          </div>
        ))}
        {Array.from({ length: leadingBlanks }).map((_, i) => (
          <div key={`blank-${i}`} aria-hidden="true" />
        ))}
        {Array.from({ length: monthEnd.getDate() }).map((_, i) => {
          const date = new Date(year, month, i + 1)
          const iso = toISO(date)
          const items = byDay.get(iso) ?? []
          const total = sumOccurrences(items)
          const heavy = total >= HEAVY_DAY_THRESHOLD
          const isToday = iso === toISO(today)
          const isSelected = iso === selectedISO
          const categories = [...new Set(items.map((o) => o.payment.category))]

          return (
            <button
              key={iso}
              type="button"
              aria-pressed={isSelected}
              aria-label={`${formatDayMonth(date)}${items.length ? `, ${items.length} ödəniş, ${formatAmount(total)}` : ', ödəniş yoxdur'}`}
              onClick={() => setSelectedISO(iso)}
              className={cn(
                'flex aspect-square min-h-11 flex-col items-center justify-center gap-1 rounded-xl text-base tabular-nums transition-colors hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none',
                heavy && 'bg-secondary font-semibold text-secondary-foreground',
                isToday && 'ring-2 ring-primary/40',
                isSelected && 'bg-primary text-primary-foreground hover:bg-primary/90',
              )}
            >
              <span>{i + 1}</span>
              <span className="flex h-2.5 items-center gap-0.5" aria-hidden="true">
                {categories.slice(0, 3).map((c) => (
                  <span
                    key={c}
                    className={cn(
                      'rounded-full',
                      heavy ? 'size-2.5' : 'size-1.5',
                      isSelected && 'ring-1 ring-primary-foreground',
                    )}
                    style={{ backgroundColor: CATEGORIES[c].color }}
                  />
                ))}
              </span>
            </button>
          )
        })}
      </div>

      <div className="mt-4 rounded-xl bg-muted p-4" aria-live="polite">
        <p className="font-semibold">{formatDayMonth(selectedDate)}</p>
        {selected.length === 0 ? (
          <p className="mt-1 text-muted-foreground">Bu gün üçün ödəniş yoxdur.</p>
        ) : (
          <ul className="mt-2 flex flex-col gap-2">
            {selected.map(({ payment }) => (
              <li key={payment.id} className="flex flex-wrap items-center justify-between gap-2">
                <span className="font-medium">{payment.name}</span>
                <span className="flex items-center gap-2">
                  <CategoryBadge category={payment.category} />
                  <span className="font-semibold tabular-nums">{formatAmount(payment.amount)}</span>
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </Panel>
  )
}
