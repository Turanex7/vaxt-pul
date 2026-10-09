'use client'

import { PiggyBank } from 'lucide-react'
import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { Switch } from '@/components/ui/switch'
import { useAnimatedNumber } from '@/hooks/use-animated-number'
import { monthlyEquivalent } from '@/lib/format'
import type { Payment } from '@/lib/mock-data'
import { cn } from '@/lib/utils'
import { useLocalizedFormat } from '@/hooks/use-localized-format'
import { usePaymentName } from '@/hooks/use-payment-name'
import { CategoryDot } from './category-badge'
import { Panel, SectionHeading } from './panel'

interface WhatIfSimulatorProps {
  payments: Payment[]
  highlightIds: string[]
}

export function WhatIfSimulator({ payments, highlightIds }: WhatIfSimulatorProps) {
  const t = useTranslations('simulator')
  const repeat = useTranslations('repeat')
  const { amount } = useLocalizedFormat()
  const paymentName = usePaymentName()
  const [disabledIds, setDisabledIds] = useState<Set<string>>(() => new Set())
  const candidates = payments.filter((p) => p.autoRenew || p.category === 'abune')

  const monthly = candidates
    .filter((p) => disabledIds.has(p.id))
    .reduce((acc, p) => acc + monthlyEquivalent(p), 0)
  const animatedMonthly = useAnimatedNumber(monthly)
  const animatedYearly = useAnimatedNumber(monthly * 12)

  const toggle = (id: string, keepActive: boolean) => {
    setDisabledIds((prev) => {
      const next = new Set(prev)
      if (keepActive) next.delete(id)
      else next.add(id)
      return next
    })
  }

  return (
    <section id="simulator" aria-labelledby="simulator-heading" className="scroll-mt-24">
      <SectionHeading
        id="simulator-heading"
        title={t('title')}
        description={t('description')}
      />
      <Panel className="grid gap-6 lg:grid-cols-[1fr_minmax(0,320px)]">
        {candidates.length === 0 ? (
          <p className="text-muted-foreground">{t('none')}</p>
        ) : (
          <ul className="flex flex-col divide-y divide-border pr-2">
            {candidates.map((p) => {
              const active = !disabledIds.has(p.id)
              const highlighted = highlightIds.includes(p.id)
              const switchId = `sim-${p.id}`
              return (
                <li
                  key={p.id}
                  className={cn(
                    'flex items-center gap-3 py-3 transition-colors',
                    highlighted && '-mx-3 rounded-xl bg-success-soft px-3',
                  )}
                >
                  <CategoryDot category={p.category} />
                  <label htmlFor={switchId} className="min-w-0 flex-1 cursor-pointer">
                    <span className={cn('block font-medium', !active && 'text-muted-foreground line-through')}>
                      {paymentName(p)}
                    </span>
                    <span className="text-sm text-muted-foreground">
                      {amount(p.amount)} / {p.repeat === 'yearly' ? repeat('perYear') : repeat('perMonth')}
                      {highlighted && <span className="ml-2 font-semibold text-success">{t('overlap')}</span>}
                    </span>
                  </label>
                  <Switch
                    id={switchId}
                    checked={active}
                    onCheckedChange={(checked) => toggle(p.id, checked)}
                    className="shrink-0"
                    aria-label={t('switchLabel', { name: paymentName(p) })}
                  />
                </li>
              )
            })}
          </ul>
        )}

        <div className="flex flex-col justify-center gap-4 rounded-2xl bg-success-soft p-5" aria-live="polite">
          <div className="flex items-center gap-2 text-success">
            <PiggyBank className="size-6" aria-hidden="true" />
            <span className="font-semibold">{t('savings')}</span>
          </div>
          <div>
            <p className="text-muted-foreground">{t('yearly')}</p>
            <p className="text-4xl font-semibold tracking-tight text-success tabular-nums">
              {amount(Math.round(animatedYearly * 100) / 100)}
            </p>
          </div>
          <div>
            <p className="text-muted-foreground">{t('monthly')}</p>
            <p className="text-2xl font-semibold text-foreground tabular-nums">
              {amount(Math.round(animatedMonthly * 100) / 100)}
            </p>
          </div>
          {monthly === 0 && (
            <p className="text-sm text-muted-foreground">{t('hint')}</p>
          )}
        </div>
      </Panel>
    </section>
  )
}
