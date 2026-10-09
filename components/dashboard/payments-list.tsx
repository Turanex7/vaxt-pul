'use client'

import { CalendarPlus, Check, Ellipsis, FileX2, Inbox, Pencil, RefreshCw, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { useLocale, useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  CATEGORY_IDS,
  daysUntil,
} from '@/lib/format'
import type { CategoryId, Payment } from '@/lib/mock-data'
import { cn } from '@/lib/utils'
import { buildIcs } from '@/lib/ics'
import { CategoryBadge, CategoryDot } from './category-badge'
import { Panel, SectionHeading } from './panel'
import { useLocalizedFormat } from '@/hooks/use-localized-format'
import { usePaymentName, usePaymentProvider } from '@/hooks/use-payment-name'

interface PaymentsListProps {
  payments: Payment[]
  today: Date
  onEdit: (payment: Payment) => void
  onCancelHelp: (payment: Payment) => void
  onDelete: (payment: Payment) => void
  onMarkPaid: (payment: Payment) => void
}

export function PaymentsList({ payments, today, onEdit, onCancelHelp, onDelete, onMarkPaid }: PaymentsListProps) {
  const t = useTranslations()
  const locale = useLocale() as 'az' | 'en' | 'ru'
  const paymentProvider = usePaymentProvider()
  const { amount, dayMonth } = useLocalizedFormat()
  const paymentName = usePaymentName()
  const [filter, setFilter] = useState<CategoryId | 'all'>('all')
  const visible = payments
    .filter((p) => filter === 'all' || p.category === filter)
    .sort((a, b) => a.nextDate.localeCompare(b.nextDate))

  return (
    <section aria-labelledby="payments-heading">
      <SectionHeading
        id="payments-heading"
        title={t('payments.heading')}
        description={t('payments.tracked', { count: payments.length })}
      />
      <Panel className="p-0 md:p-0">
        <div className="flex gap-2 overflow-x-auto border-b border-border p-4 md:px-6" role="group" aria-label={t('payments.filter')}>
          <FilterChip active={filter === 'all'} onClick={() => setFilter('all')}>
            {t('common.all')}
          </FilterChip>
          {CATEGORY_IDS.map((id) => (
            <FilterChip key={id} active={filter === id} onClick={() => setFilter(id)}>
              <CategoryDot category={id} />
              {t(`categories.${id}`)}
            </FilterChip>
          ))}
        </div>

        {visible.length === 0 ? (
          <div className="flex flex-col items-center gap-2 px-6 py-14 text-center text-muted-foreground">
            <Inbox className="size-10" aria-hidden="true" />
            <p className="text-lg font-medium text-foreground">{t('payments.emptyTitle')}</p>
            <p>{t('payments.emptyBody')}</p>
          </div>
        ) : (
          <>
            <table className="hidden w-full text-left md:table">
              <thead className="text-sm text-muted-foreground">
                <tr className="border-b border-border">
                  <th scope="col" className="px-6 py-3 font-medium">{t('common.name')}</th>
                  <th scope="col" className="px-3 py-3 font-medium">{t('common.category')}</th>
                  <th scope="col" className="px-3 py-3 text-right font-medium">{t('common.amount')}</th>
                  <th scope="col" className="px-3 py-3 font-medium">{t('common.nextDate')}</th>
                  <th scope="col" className="px-3 py-3 font-medium">{t('common.repeat')}</th>
                  <th scope="col" className="px-3 py-3 font-medium">{t('common.status')}</th>
                  <th scope="col" className="w-14 px-3 py-3"><span className="sr-only">{t('common.actions')}</span></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {visible.map((p) => (
                  <tr key={p.id} className="transition-colors hover:bg-muted/50">
                    <td className="px-6 py-3.5">
                      <p className="font-medium">{paymentName(p)}</p>
                      {paymentProvider(p) && paymentProvider(p)!.trim().toLowerCase() !== paymentName(p).trim().toLowerCase() && (
                        <p className="text-sm text-muted-foreground">{paymentProvider(p)}</p>
                      )}
                    </td>
                    <td className="px-3 py-3.5"><CategoryBadge category={p.category} /></td>
                    <td className="px-3 py-3.5 text-right font-semibold whitespace-nowrap tabular-nums">{amount(p.amount)}</td>
                    <td className="px-3 py-3.5 whitespace-nowrap">{dayMonth(p.nextDate)}</td>
                    <td className="px-3 py-3.5">{t(`repeat.${p.repeat}`)}</td>
                    <td className="px-3 py-3.5"><StatusBadge payment={p} today={today} /></td>
                    <td className="px-3 py-3.5">
                    <RowMenu payment={p} name={paymentName(p)} locale={locale} categoryName={t(`categories.${p.category}`)} onEdit={onEdit} onCancelHelp={onCancelHelp} onDelete={onDelete} onMarkPaid={onMarkPaid} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <ul className="divide-y divide-border md:hidden">
              {visible.map((p) => (
                <li key={p.id} className="flex items-start gap-3 p-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <p className="font-semibold">{paymentName(p)}</p>
                      <p className="font-semibold whitespace-nowrap tabular-nums">{amount(p.amount)}</p>
                    </div>
                    <p className="mt-0.5 text-muted-foreground">
                      {dayMonth(p.nextDate)} · {t(`repeat.${p.repeat}`)}
                    </p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      <CategoryBadge category={p.category} />
                      <StatusBadge payment={p} today={today} />
                    </div>
                  </div>
                      <RowMenu payment={p} name={paymentName(p)} locale={locale} categoryName={t(`categories.${p.category}`)} onEdit={onEdit} onCancelHelp={onCancelHelp} onDelete={onDelete} onMarkPaid={onMarkPaid} />
                </li>
              ))}
            </ul>
          </>
        )}
      </Panel>
    </section>
  )
}

function FilterChip({
  active,
  onClick,
  children,
}: {
  active: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        'inline-flex h-10 shrink-0 items-center gap-2 rounded-full border px-4 text-base font-medium whitespace-nowrap transition-colors focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none',
        active
          ? 'border-primary bg-primary text-primary-foreground'
          : 'border-border bg-card text-foreground hover:bg-muted',
      )}
    >
      {children}
    </button>
  )
}

function StatusBadge({ payment, today }: { payment: Payment; today: Date }) {
  const t = useTranslations()
  const days = daysUntil(payment.nextDate, today)
  let label = days === 0 ? t('days.today') : days === 1 ? t('days.tomorrow') : days < 0
    ? t('days.late', { count: Math.abs(days) })
    : t('days.left', { count: days })
  let tone = 'bg-muted text-muted-foreground'

  if (payment.installment) {
    label = t('payments.installments', { paid: payment.installment.paid, total: payment.installment.total })
    tone = 'bg-secondary text-secondary-foreground'
  } else if (days <= 3) {
    tone = 'bg-urgent-soft text-urgent'
  } else if (days <= 7 || payment.isDeadline) {
    tone = 'bg-warning-soft text-warning'
  } else if (payment.autoRenew) {
    label = t('payments.autoRenew')
    tone = 'bg-success-soft text-success'
  }

  return (
    <span className={cn('inline-flex rounded-full px-2.5 py-1 text-sm font-semibold whitespace-nowrap', tone)}>
      {label}
    </span>
  )
}

function RowMenu({ payment, name, locale, categoryName, onEdit, onCancelHelp, onDelete, onMarkPaid }: { payment: Payment; name: string; locale: 'az' | 'en' | 'ru'; categoryName: string } & Omit<PaymentsListProps, 'payments' | 'today'>) {
  const t = useTranslations()
  const addToCalendar = () => {
    const fileName = payment.name
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[əƏ]/g, 'e')
      .replace(/[^a-zA-Z0-9_-]+/g, '-')
      .replace(/^-+|-+$/g, '') || 'odenis'
    const blob = new Blob([buildIcs({ ...payment, name }, locale, { description: t('ics.description', { category: categoryName }), oneDay: t('ics.oneDay', { name }), sevenDays: t('ics.sevenDays', { name }) })], { type: 'text/calendar;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `${fileName}.ics`
    link.click()
    window.setTimeout(() => URL.revokeObjectURL(url), 0)
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button variant="ghost" size="icon" aria-label={t('payments.menuLabel', { name })}>
            <Ellipsis className="size-5" />
          </Button>
        }
      />
      <DropdownMenuContent align="end" className="min-w-52">
        <DropdownMenuItem className="py-2 text-base" onClick={() => onEdit(payment)}>
          <Pencil aria-hidden="true" />
          {t('common.edit')}
        </DropdownMenuItem>
        <DropdownMenuItem className="py-2 text-base" onClick={() => onCancelHelp(payment)}>
          {payment.autoRenew ? <RefreshCw aria-hidden="true" /> : <FileX2 aria-hidden="true" />}
          {t('payments.cancelHelp')}
        </DropdownMenuItem>
        <DropdownMenuItem className="py-2 text-base" onClick={addToCalendar}>
          <CalendarPlus aria-hidden="true" />
          {t('payments.calendarAdd')}
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem className="py-2 text-base" onClick={() => onMarkPaid(payment)}>
          <Check aria-hidden="true" />
          {t('payments.paid')}
        </DropdownMenuItem>
        <DropdownMenuItem variant="destructive" className="py-2 text-base" onClick={() => onDelete(payment)}>
          <Trash2 aria-hidden="true" />
          {t('common.delete')}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
