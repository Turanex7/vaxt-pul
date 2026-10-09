import { generateGeminiJson } from '@/lib/gemini'
import { formatAmount, LOCALE_TAGS } from '@/lib/format'
import { NextResponse } from 'next/server'
import azMessages from '@/messages/az.json'
import enMessages from '@/messages/en.json'
import ruMessages from '@/messages/ru.json'

interface WeeklyStats {
  count: number
  total: number
  deadlineCount: number
  biggestPayment: { name: string; amount: number; category?: string } | null
  nearestDeadline: { name: string; daysLeft: number; category?: string } | null
}
const messages = { az: azMessages, en: enMessages, ru: ruMessages }

export async function POST(request: Request) {
  let locale: 'az' | 'en' | 'ru' = 'az'
  let stats: Partial<WeeklyStats> | undefined
  try {
    const body = (await request.json()) as { stats?: Partial<WeeklyStats>; locale?: string }
    locale = body.locale === 'en' || body.locale === 'ru' ? body.locale : 'az'
    stats = body.stats
    if (
      !stats ||
      !Number.isFinite(stats.count) ||
      !Number.isFinite(stats.total) ||
      !Number.isFinite(stats.deadlineCount)
    ) {
      return NextResponse.json({ error: 'Valid weekly stats are required' }, { status: 400 })
    }

    const example = messages[locale].weekly.example
    const prompt = `You are a personal finance assistant. Write a concise weekly summary using the supplied names and figures.

Yalnız ${locale} dilində cavab ver (az: Azərbaycan dili, en: English, ru: Русский). Use category labels in the supplied data as given.
Do not calculate counts, totals, date differences, or amounts. Use only supplied facts and invent no values.
Keep the title short, for example: "${example}". Make the body 1–2 sentences with a practical suggestion.
Return JSON only in this shape: {"title":"...","body":"..."}

Stats (use without changes):
${JSON.stringify(stats)}`

    const result = await generateGeminiJson([{ text: prompt }])
    if (!result || typeof result !== 'object') {
      throw new Error('Invalid weekly summary response')
    }
    const { title, body: summaryBody } = result as { title?: unknown; body?: unknown }
    if (typeof title !== 'string' || !title.trim() || typeof summaryBody !== 'string' || !summaryBody.trim()) {
      throw new Error('Invalid weekly summary response')
    }
    return NextResponse.json({ title: title.trim(), body: summaryBody.trim() })
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    const status = error && typeof error === 'object' && 'status' in error
      ? Number((error as { status?: unknown }).status) || null
      : Number(message.match(/\b(?:failed|error)\s*\(?([45]\d\d)\)?/i)?.[1]) || null
    const key = process.env.GEMINI_API_KEY
    console.error('[api/weekly] Gemini request failed', {
      status,
      message: key ? message.split(key).join('[redacted]') : message,
    })
    if (!stats || !Number.isFinite(stats.count) || !Number.isFinite(stats.total) || !Number.isFinite(stats.deadlineCount)) {
      return NextResponse.json({ error: message }, { status: 400 })
    }
    const summary = buildFallback(stats as WeeklyStats, locale)
    return NextResponse.json(summary, { status: 200 })
  }
}

function buildFallback(stats: WeeklyStats, locale: 'az' | 'en' | 'ru') {
  const copy = messages[locale].weekly.serverFallback
  const title = interpolate(copy.headline, {
    payments: plural(copy.paymentCount, stats.count, locale),
    deadlines: plural(copy.deadlineCount, stats.deadlineCount, locale),
  })
  const amount = formatAmount(stats.total, locale)
  const biggest = stats.biggestPayment
  const deadline = stats.nearestDeadline
  if (!biggest) return { title, body: copy.empty }
  const deadlineClause = deadline
    ? interpolate(copy.deadlineClause, { name: deadline.name, days: plural(copy.dayCount, deadline.daysLeft, locale) })
    : ''
  const body = interpolate(copy.budget, {
    amount,
    biggest: biggest.name,
    paymentAmount: formatAmount(biggest.amount, locale),
    deadlineClause,
  })
  return { title, body }
}

function plural(forms: Record<string, string>, count: number, locale: 'az' | 'en' | 'ru') {
  const category = new Intl.PluralRules(LOCALE_TAGS[locale], { type: 'cardinal' }).select(count)
  return interpolate(forms[category] ?? forms.other, { count })
}

function interpolate(template: string, values: Record<string, string | number>) {
  return template.replace(/\{(\w+)\}/g, (_, key: string) => String(values[key] ?? ''))
}
