'use client'

import {
  CalendarRange,
  CircleCheck,
  Copy,
  type LucideIcon,
  ShieldAlert,
  TrendingUp,
  TriangleAlert,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { Insight, InsightKind, InsightSeverity } from '@/lib/mock-data'
import { cn } from '@/lib/utils'
import { SectionHeading } from './panel'

const ICONS: Record<InsightKind, LucideIcon> = {
  deadline: ShieldAlert,
  duplicate: Copy,
  spike: TrendingUp,
  'unknown-charge': TriangleAlert,
  forecast: CalendarRange,
}

const SEVERITY_STYLES: Record<InsightSeverity, { card: string; icon: string; label: string }> = {
  urgent: { card: 'border-l-urgent', icon: 'bg-urgent-soft text-urgent', label: 'Təcili' },
  warning: { card: 'border-l-warning', icon: 'bg-warning-soft text-warning', label: 'Diqqət' },
  saving: { card: 'border-l-success', icon: 'bg-success-soft text-success', label: 'Qənaət' },
}

interface RadarSectionProps {
  insights: Insight[]
  onViewDuplicates: (insight: Insight) => void
  onRecognize: (insight: Insight, recognized: boolean) => void
}

export function RadarSection({ insights, onViewDuplicates, onRecognize }: RadarSectionProps) {
  return (
    <section aria-labelledby="radar-heading">
      <SectionHeading
        id="radar-heading"
        title="Radar"
        description="Diqqət etməli olduğun şeylər — vaxtında xəbər veririk."
      />
      {insights.length === 0 ? (
        <div className="flex items-center gap-3 rounded-2xl bg-success-soft p-5 text-success">
          <CircleCheck className="size-6" aria-hidden="true" />
          <p className="text-lg font-medium">Hər şey qaydasındadır. Yeni xəbərdarlıq yoxdur.</p>
        </div>
      ) : (
        <ul className="-mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-2 md:mx-0 md:grid md:grid-cols-2 md:overflow-visible md:px-0 lg:grid-cols-3">
          {insights.map((insight) => (
            <li key={insight.id} className="w-[85%] shrink-0 snap-start sm:w-[60%] md:w-auto">
              <RadarCard
                insight={insight}
                onViewDuplicates={onViewDuplicates}
                onRecognize={onRecognize}
              />
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}

function RadarCard({
  insight,
  onViewDuplicates,
  onRecognize,
}: { insight: Insight } & Omit<RadarSectionProps, 'insights'>) {
  const Icon = ICONS[insight.kind]
  const style = SEVERITY_STYLES[insight.severity]

  return (
    <article
      className={cn(
        'flex h-full flex-col gap-3 rounded-2xl border-l-4 bg-card p-5 shadow-[0_1px_2px_rgba(30,27,75,0.04),0_8px_24px_-12px_rgba(30,27,75,0.12)] ring-1 ring-border/70',
        style.card,
      )}
    >
      <div className="flex items-start gap-3">
        <span className={cn('flex size-11 shrink-0 items-center justify-center rounded-xl', style.icon)}>
          <Icon className="size-5" aria-hidden="true" />
        </span>
        <div className="min-w-0">
          <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
            {style.label}
          </p>
          <h3 className="text-lg leading-snug font-semibold text-balance">{insight.title}</h3>
        </div>
      </div>
      <p className="text-base text-muted-foreground text-pretty">{insight.description}</p>

      {insight.kind === 'duplicate' && (
        <Button variant="secondary" className="mt-auto self-start" onClick={() => onViewDuplicates(insight)}>
          Bax
        </Button>
      )}
      {insight.kind === 'unknown-charge' && (
        <div className="mt-auto flex flex-wrap gap-2">
          <Button variant="outline" onClick={() => onRecognize(insight, true)}>
            Tanıyıram
          </Button>
          <Button variant="destructive" onClick={() => onRecognize(insight, false)}>
            Tanımıram
          </Button>
        </div>
      )}
    </article>
  )
}
