'use client'

import { Cell, Label, Pie, PieChart } from 'recharts'
import { type ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart'
import { CATEGORIES, CATEGORY_IDS, formatAZN, monthlyEquivalent } from '@/lib/format'
import type { Payment } from '@/lib/mock-data'
import { Panel } from './panel'

const chartConfig = Object.fromEntries(
  CATEGORY_IDS.map((id) => [id, { label: CATEGORIES[id].label, color: CATEGORIES[id].color }]),
) satisfies ChartConfig

export function CategoryChart({ payments }: { payments: Payment[] }) {
  const data = CATEGORY_IDS.map((id) => ({
    category: id,
    label: CATEGORIES[id].label,
    value: Math.round(
      payments.filter((p) => p.category === id).reduce((acc, p) => acc + monthlyEquivalent(p), 0) * 100,
    ) / 100,
    fill: CATEGORIES[id].color,
  })).filter((d) => d.value > 0)

  const total = data.reduce((acc, d) => acc + d.value, 0)

  return (
    <Panel className="flex flex-col">
      <h3 id="chart-heading" className="text-xl font-semibold">
        Kateqoriyalar üzrə
      </h3>
      <p className="text-muted-foreground">Aylıq orta xərc</p>

      {data.length === 0 ? (
        <p className="py-16 text-center text-muted-foreground">Hələ heç bir ödəniş əlavə olunmayıb.</p>
      ) : (
        <div className="mt-4 flex flex-col items-center gap-6 sm:flex-row lg:flex-col xl:flex-row">
          <ChartContainer
            config={chartConfig}
            className="aspect-auto size-56 shrink-0"
            aria-label={`Kateqoriyalar üzrə xərc diaqramı, cəmi ${formatAZN(total, { round: true })}`}
          >
            <PieChart>
              <ChartTooltip
                cursor={false}
                content={<ChartTooltipContent hideLabel nameKey="category" formatter={(v, name) => (
                  <span className="flex w-full justify-between gap-3">
                    <span>{CATEGORIES[name as keyof typeof CATEGORIES]?.label}</span>
                    <span className="font-semibold tabular-nums">{formatAZN(Number(v))}</span>
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
                          {Math.round(total)}
                        </tspan>
                        <tspan x={viewBox.cx} y={(viewBox.cy ?? 0) + 18} className="fill-muted-foreground text-sm">
                          AZN / ay
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
                  <span className="font-semibold whitespace-nowrap tabular-nums">{formatAZN(d.value, { round: true })}</span>
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
