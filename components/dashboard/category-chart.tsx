'use client'

import { Cell, Label, Pie, PieChart } from 'recharts'
import { useTranslations } from 'next-intl'
import { type ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart'
import { CATEGORIES, CATEGORY_IDS, monthlyEquivalent } from '@/lib/format'
import type { Payment } from '@/lib/mock-data'
import { Panel } from './panel'
import { useLocalizedFormat } from '@/hooks/use-localized-format'

export function CategoryChart({ payments }: { payments: Payment[] }) {
  const t = useTranslations('categories')
  const { amount } = useLocalizedFormat()
  const chartConfig = Object.fromEntries(
    CATEGORY_IDS.map((id) => [id, { label: t(id), color: CATEGORIES[id].color }]),
  ) satisfies ChartConfig
  const data = CATEGORY_IDS.map((id) => ({
    category: id,
    label: t(id),
    value: payments.filter((p) => p.category === id).reduce((acc, p) => acc + Math.round(monthlyEquivalent(p) * 100), 0) / 100,
    fill: CATEGORIES[id].color,
  })).filter((d) => d.value > 0)

  const total = data.reduce((acc, d) => acc + Math.round(d.value * 100), 0) / 100

  return (
    <Panel className="flex flex-col">
      <h3 id="chart-heading" className="text-xl font-semibold">
        {t('heading')}
      </h3>
      <p className="text-muted-foreground">{t('monthlyAverage')}</p>

      {data.length === 0 ? (
        <p className="py-16 text-center text-muted-foreground">{t('empty')}</p>
      ) : (
        <div className="mt-4 flex flex-col items-center gap-6 sm:flex-row lg:flex-col xl:flex-row">
          <ChartContainer
            config={chartConfig}
            className="aspect-auto size-56 shrink-0"
            aria-label={t('chartLabel', { amount: amount(total) })}
          >
            <PieChart>
              <ChartTooltip
                cursor={false}
                content={<ChartTooltipContent hideLabel nameKey="category" formatter={(v, name) => (
                  <span className="flex w-full justify-between gap-3">
                    <span>{t(name as keyof typeof CATEGORIES)}</span>
                  <span className="font-semibold tabular-nums">{amount(Number(v))}</span>
                  </span>
                )} />}
              />
              <Pie data={data} dataKey="value" nameKey="category" innerRadius="62%" strokeWidth={3} stroke="var(--card)">
                {data.map((d) => (
                  <Cell key={d.category} fill={d.fill} />
                ))}
                <Label
                  content={({ viewBox }) => {
                    if (!viewBox || !('cx' in viewBox)) return null
                    return (
                      <text x={viewBox.cx} y={viewBox.cy} textAnchor="middle" dominantBaseline="middle">
                        <tspan x={viewBox.cx} y={(viewBox.cy ?? 0) - 6} className="fill-foreground text-2xl font-semibold">
                          {amount(total).replace(/(?: AZN|AZN )$/, '')}
                        </tspan>
                        <tspan x={viewBox.cx} y={(viewBox.cy ?? 0) + 18} className="fill-muted-foreground text-sm">
                          {t('perMonth')}
                        </tspan>
                      </text>
                    )
                  }}
                />
              </Pie>
            </PieChart>
          </ChartContainer>

          <ul className="flex w-full flex-col gap-2.5">
            {data
              .slice()
              .sort((a, b) => b.value - a.value)
              .map((d) => (
                <li key={d.category} className="flex items-center gap-3">
                  <span aria-hidden="true" className="size-3 shrink-0 rounded-sm" style={{ backgroundColor: d.fill }} />
                  <span className="flex-1">{d.label}</span>
                  <span className="font-semibold whitespace-nowrap tabular-nums">{amount(d.value)}</span>
                  <span className="w-11 text-right text-sm text-muted-foreground tabular-nums">
                    {Math.round((d.value / total) * 100)}%
                  </span>
                </li>
              ))}
          </ul>
        </div>
      )}
    </Panel>
  )
}
