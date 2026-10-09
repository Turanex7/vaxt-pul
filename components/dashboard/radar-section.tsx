'use client'

import { CalendarRange, CircleCheck, Copy, type LucideIcon, ShieldAlert, TrendingUp, TriangleAlert } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import { useLocalizedFormat } from '@/hooks/use-localized-format'
import { usePaymentName } from '@/hooks/use-payment-name'
import type { Insight, InsightKind, InsightSeverity, Payment } from '@/lib/mock-data'
import { cn } from '@/lib/utils'
import { SectionHeading } from './panel'

const ICONS: Record<InsightKind, LucideIcon> = { deadline: ShieldAlert, duplicate: Copy, spike: TrendingUp, 'unknown-charge': TriangleAlert, forecast: CalendarRange }
const SEVERITY_STYLES: Record<InsightSeverity, { card: string; icon: string }> = {
  urgent: { card: 'border-l-urgent', icon: 'bg-urgent-soft text-urgent' },
  warning: { card: 'border-l-warning', icon: 'bg-warning-soft text-warning' },
  saving: { card: 'border-l-success', icon: 'bg-success-soft text-success' },
}

interface RadarSectionProps {
  insights: Insight[]
  payments: Payment[]
  onViewDuplicates: (insight: Insight) => void
  onRecognize: (insight: Insight, recognized: boolean) => void
}

export function RadarSection({ insights, payments, onViewDuplicates, onRecognize }: RadarSectionProps) {
  const t = useTranslations('radar')
  return <section aria-labelledby="radar-heading">
    <SectionHeading id="radar-heading" title={t('title')} description={t('subtitle')} />
    {insights.length === 0 ? <div className="flex items-center gap-3 rounded-2xl bg-success-soft p-5 text-success"><CircleCheck className="size-6" aria-hidden="true" /><p className="text-lg font-medium">{t('empty')}</p></div> :
      <ul className="-mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-2 md:mx-0 md:grid md:grid-cols-2 md:overflow-visible md:px-0 lg:grid-cols-3">
        {insights.map((insight) => <li key={insight.id} className="w-[85%] shrink-0 snap-start sm:w-[60%] md:w-auto"><RadarCard insight={insight} payments={payments} onViewDuplicates={onViewDuplicates} onRecognize={onRecognize} /></li>)}
      </ul>}
  </section>
}

function RadarCard({ insight, payments, onViewDuplicates, onRecognize }: { insight: Insight; payments: Payment[] } & Omit<RadarSectionProps, 'insights' | 'payments'>) {
  const t = useTranslations('radar')
  const { amount, dayMonth } = useLocalizedFormat()
  const paymentName = usePaymentName()
  const style = SEVERITY_STYLES[insight.severity]
  const Icon = ICONS[insight.kind]
  const severityKey = insight.severity === 'warning' ? 'attention' : insight.severity
  const label = insight.kind === 'spike' ? t('changed') : t(severityKey)
  const values: Record<string, string | number> = { ...insight.values }
  for (const key of ['paymentId', 'spotifyId', 'youtubeId']) {
    const id = values[key]
    if (typeof id === 'string') {
      const payment = payments.find((item) => item.id === id)
      const translatedKey = key === 'paymentId' ? 'name' : key === 'spotifyId' ? 'spotify' : 'youtube'
      values[translatedKey] = payment ? paymentName(payment) : t('unknownService')
    }
  }
  for (const key of ['amount', 'previousAmount', 'savings']) if (typeof values[key] === 'number') values[key] = amount(values[key] as number)
  for (const key of ['start', 'end']) if (typeof values[key] === 'string') values[key] = dayMonth(values[key] as string)
  const title = insight.titleKey ? t(insight.titleKey, values) : insight.title
  const description = insight.descriptionKey ? t(insight.descriptionKey, values) : insight.description
  return <article className={cn('flex h-full flex-col gap-3 rounded-2xl border-l-4 bg-card p-5 shadow-[0_1px_2px_rgba(30,27,75,0.04),0_8px_24px_-12px_rgba(30,27,75,0.12)] ring-1 ring-border/70', style.card)}>
    <div className="flex items-start gap-3"><span className={cn('flex size-11 shrink-0 items-center justify-center rounded-xl', style.icon)}><Icon className="size-5" aria-hidden="true" /></span><div className="min-w-0"><p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">{label}</p><h3 className="text-lg leading-snug font-semibold text-balance">{title}</h3></div></div>
    <p className="text-base text-muted-foreground text-pretty">{description}</p>
    {insight.kind === 'duplicate' && <Button variant="secondary" className="mt-auto self-start" onClick={() => onViewDuplicates(insight)}>{t('view')}</Button>}
    {insight.kind === 'unknown-charge' && <div className="mt-auto flex flex-wrap gap-2"><Button variant="outline" onClick={() => onRecognize(insight, true)}>{t('recognize')}</Button><Button variant="destructive" onClick={() => onRecognize(insight, false)}>{t('notRecognize')}</Button></div>}
  </article>
}
