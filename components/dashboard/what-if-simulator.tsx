'use client'

import { PiggyBank } from 'lucide-react'
import { useState } from 'react'
import { Switch } from '@/components/ui/switch'
import { useAnimatedNumber } from '@/hooks/use-animated-number'
import { formatAmount, monthlyEquivalent } from '@/lib/format'
import type { Payment } from '@/lib/mock-data'
import { cn } from '@/lib/utils'
import { CategoryDot } from './category-badge'
import { Panel, SectionHeading } from './panel'

interface WhatIfSimulatorProps {
  payments: Payment[]
  highlightIds: string[]
}

export function WhatIfSimulator({ payments, highlightIds }: WhatIfSimulatorProps) {
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
        title="Nə olar əgər?"
        description="Abunəni söndür və nə qədər qənaət edəcəyini gör."
      />
      <Panel className="grid gap-6 lg:grid-cols-[1fr_minmax(0,320px)]">
        {candidates.length === 0 ? (
          <p className="text-muted-foreground">Söndürülə bilən abunə yoxdur.</p>
        ) : (
          <ul className="flex flex-col divide-y divide-border">
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
                      {p.name}
                    </span>
                    <span className="text-sm text-muted-foreground">
                      {formatAmount(p.amount)} / {p.repeat === 'yearly' ? 'il' : 'ay'}
                      {highlighted && <span className="ml-2 font-semibold text-success">Təkrarlanır</span>}
                    </span>
                  </label>
                  <Switch
                    id={switchId}
                    checked={active}
                    onCheckedChange={(checked) => toggle(p.id, checked)}
                    aria-label={`${p.name} aktiv`}
                  />
                </li>
              )
            })}
          </ul>
        )}

        <div className="flex flex-col justify-center gap-4 rounded-2xl bg-success-soft p-5" aria-live="polite">
          <div className="flex items-center gap-2 text-success">
            <PiggyBank className="size-6" aria-hidden="true" />
            <span className="font-semibold">Qənaət</span>
          </div>
          <div>
            <p className="text-muted-foreground">İllik qənaət</p>
            <p className="text-4xl font-semibold tracking-tight text-success tabular-nums">
              {formatAmount(Math.round(animatedYearly * 100) / 100)}
            </p>
          </div>
          <div>
            <p className="text-muted-foreground">Aylıq qənaət</p>
            <p className="text-2xl font-semibold text-foreground tabular-nums">
              {formatAmount(Math.round(animatedMonthly * 100) / 100)}
            </p>
          </div>
          {monthly === 0 && (
            <p className="text-sm text-muted-foreground">Hesablamaq üçün soldakı abunələrdən birini söndür.</p>
          )}
        </div>
      </Panel>
    </section>
  )
}
