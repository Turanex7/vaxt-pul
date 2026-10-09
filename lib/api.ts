import type { CategoryId, Payment, PaymentDraft, Repeat } from './mock-data'
import { daysUntil, formatAmount, formatCalendarDate, getLocalizedMonthAliases, getNext7DaysStats, parseISO, startOfToday, toISO } from './format'
import azMessages from '@/messages/az.json'
import enMessages from '@/messages/en.json'
import ruMessages from '@/messages/ru.json'

let lastAiStatus: 'ai' | 'fallback' = 'ai'

export function getLastAiStatus(): 'ai' | 'fallback' {
  return lastAiStatus
}

export interface CancelHelp {
  steps: string[]
  letter: string
}

export interface WeeklySummary {
  paymentCount: number
  deadlineCount: number
  total: number
  headline: string
  text: string
}

function isoFromToday(offsetDays: number): string {
  const d = startOfToday()
  d.setDate(d.getDate() + offsetDays)
  return toISO(d)
}

const CATEGORY_KEYWORDS: [RegExp, CategoryId][] = [
  [/sığorta|insurance|страх|baxış|baxis|техосмотр|pasport|sənəd|sened|vəsiqə/i, 'insurance'],
  [/kredit|loan|кредит|taksit|bank|borc/i, 'loans'],
  [/azercell|bakcell|nar|internet|tarif|citynet|telefon|связ/i, 'telecom'],
  [/elektrik|işıq|isiq|qaz|su\b|kommunal|utilities|коммун|azərişıq|azerisiq/i, 'utilities'],
  [/netflix|spotify|youtube|abunə|subscriptions|подпис|premium|apple|bolt/i, 'subscriptions'],
  [/kirayə|kiraye|zal|idman|gym|üzvlük|uzvluk|müqavilə|contracts|договор|аренд/i, 'contracts'],
]

const monthEntries = getLocalizedMonthAliases()
const monthAliases = monthEntries.flatMap(({ month, aliases }) => aliases.map((alias) => ({ month, alias })))
  .sort((a, b) => b.alias.length - a.alias.length)
const MONTH_NAME_RE = monthAliases.map(({ alias }) => alias.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')

const CATEGORY_FROM_LABEL: Record<string, CategoryId> = {
  abunələr: 'subscriptions',
  abuneler: 'subscriptions',
  подписки: 'subscriptions',
  subscriptions: 'subscriptions',
  telekom: 'telecom',
  telecom: 'telecom',
  связь: 'telecom',
  kommunal: 'utilities',
  utilities: 'utilities',
  'коммунальные услуги': 'utilities',
  kredit: 'loans',
  loans: 'loans',
  кредиты: 'loans',
  кредит: 'loans',
  'sığorta və sənədlər': 'insurance',
  'insurance ve senedler': 'insurance',
  'страхование и документы': 'insurance',
  sigorta: 'insurance',
  insurance: 'insurance',
  müqavilələr: 'contracts',
  muqavileler: 'contracts',
  договоры: 'contracts',
  contracts: 'contracts',
}

const REPEAT_FROM_LABEL: Record<string, Repeat> = {
  aylıq: 'monthly',
  ayliq: 'monthly',
  ежемесячно: 'monthly',
  monthly: 'monthly',
  həftəlik: 'weekly',
  heftelik: 'weekly',
  еженедельно: 'weekly',
  weekly: 'weekly',
  illik: 'yearly',
  ежегодно: 'yearly',
  yearly: 'yearly',
  birdəfəlik: 'once',
  birdefelik: 'once',
  разовый: 'once',
  once: 'once',
}

function guessCategory(text: string): CategoryId {
  return CATEGORY_KEYWORDS.find(([re]) => re.test(text))?.[1] ?? 'subscriptions'
}

function guessRepeat(text: string, category: CategoryId): Repeat {
  if (/illik|ildə|ilde|ежегодн|yearly|annually/i.test(text)) return 'yearly'
  if (/birdəfəlik|birdefelik|разов|one[- ]?time/i.test(text)) return 'once'
  if (/həftəlik|heftelik|еженедел|weekly/i.test(text)) return 'weekly'
  if (/aylıq|ayliq|ежемесяч|monthly/i.test(text)) return 'monthly'
  return category === 'insurance' ? 'yearly' : 'monthly'
}

function parseAzDate(text: string): string | null {
  const lower = text.toLowerCase()
  const iso = lower.match(/\b(\d{4})-(\d{2})-(\d{2})\b/)
  if (iso) return `${iso[1]}-${iso[2]}-${iso[3]}`
  const dotted = lower.match(/\b(\d{1,2})[./](\d{1,2})[./](\d{2,4})\b/)
  if (dotted) {
    const day = dotted[1].padStart(2, '0')
    const month = dotted[2].padStart(2, '0')
    const year = dotted[3].length === 2 ? `20${dotted[3]}` : dotted[3]
    return `${year}-${month}-${day}`
  }
  const match = lower.match(new RegExp(`(\\d{1,2})\\s+(${MONTH_NAME_RE})(?:\\s+(\\d{4}))?`, 'iu'))
  if (!match) return null
  const monthIndex = monthAliases.find(({ alias }) => alias === match[2])?.month
  if (monthIndex === undefined) return null
  const today = startOfToday()
  const year = match[3] ? Number(match[3]) : today.getFullYear()
  const date = new Date(year, monthIndex, Number(match[1]))
  if (!match[3] && date < today) date.setFullYear(date.getFullYear() + 1)
  return toISO(date)
}

function cleanPaymentName(text: string): string {
  const monthPattern = new RegExp(
    `\\d{1,2}\\s+(${MONTH_NAME_RE})(?:\\s*\\d{4})?`,
    'giu',
  )
  const name = text
    .replace(/[\d.,]+\s*(?:azn|₼|manat)/gi, ' ')
    .replace(/(?:azn|₼|manat)\s*[\d.,]+/gi, ' ')
    .replace(/\b\d{4}-\d{2}-\d{2}\b/g, ' ')
    .replace(/\b\d{1,2}[./]\d{1,2}[./]\d{2,4}\b/g, ' ')
    .replace(monthPattern, ' ')
    .replace(/[:\-–,]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
  return name.slice(0, 80)
}

function parseAmount(text: string): number | null {
  const match = text.match(/(\d+(?:[.,]\d{1,2})?)\s*(?:azn|₼|manat)/i)
  return match ? Number(match[1].replace(',', '.')) : null
}

function normalizeCategory(value: unknown): CategoryId | null {
  if (typeof value !== 'string') return null
  const key = value.trim().toLowerCase()
  return CATEGORY_FROM_LABEL[key] ?? null
}

function normalizeRepeat(value: unknown): Repeat | null {
  if (typeof value !== 'string') return null
  const key = value.trim().toLowerCase()
  return REPEAT_FROM_LABEL[key] ?? null
}

function normalizeDate(value: unknown): string | null {
  if (typeof value !== 'string') return null
  const match = value.trim().match(/^(\d{4})-(\d{2})-(\d{2})/)
  return match ? `${match[1]}-${match[2]}-${match[3]}` : null
}

function addCalendarMonths(date: Date, months: number): Date {
  const day = date.getDate()
  const next = new Date(date.getFullYear(), date.getMonth() + months, 1)
  const lastDay = new Date(next.getFullYear(), next.getMonth() + 1, 0).getDate()
  next.setDate(Math.min(day, lastDay))
  return next
}

/** Keçmiş və ya bu günə düşən aylıq/illik tarixi növbəti ödənişə çəkir. Gələcək və birdəfəlik dəyişmir. */
function nextDueDate(isoDate: string, repeat: Repeat): string {
  if (repeat === 'once') return isoDate
  const today = startOfToday()
  let date = parseISO(isoDate)
  if (date > today) return isoDate
  if (repeat === 'weekly') {
    while (date <= today) date.setDate(date.getDate() + 7)
    return toISO(date)
  }
  const stepMonths = repeat === 'yearly' ? 12 : 1
  for (let i = 0; i < 120 && date <= today; i++) {
    date = addCalendarMonths(date, stepMonths)
  }
  return toISO(date)
}

function mapParseItems(items: unknown[]): PaymentDraft[] {
  return items
    .map((raw): PaymentDraft | null => {
      if (!raw || typeof raw !== 'object') return null
      const item = raw as Record<string, unknown>
      const amount = Number(item.amount)
      const name = typeof item.name === 'string' ? cleanPaymentName(item.name) : ''
      const category = normalizeCategory(item.category)
      const repeat = normalizeRepeat(item.repeat)
      const parsedDate = normalizeDate(item.date) ?? normalizeDate(item.nextDate)
      if (!name || !Number.isFinite(amount) || !category || !repeat || !parsedDate) return null
      return { name, amount, category, repeat, nextDate: nextDueDate(parsedDate, repeat) }
    })
    .filter((x): x is PaymentDraft => x !== null)
}

async function postJson<T>(url: string, body: unknown): Promise<T | null> {
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    if (!res.ok) {
      console.error(`[api client] ${url} returned HTTP ${res.status}`)
      return null
    }
    return (await res.json()) as T
  } catch (error) {
    console.error(`[api client] ${url} request failed`, error instanceof Error ? error.message : error)
    return null
  }
}

async function fileToBase64(file: File): Promise<string> {
  const buffer = await file.arrayBuffer()
  const bytes = new Uint8Array(buffer)
  let binary = ''
  const chunk = 0x8000
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunk))
  }
  return btoa(binary)
}

type AppLocale = 'az' | 'en' | 'ru'
const messages = { az: azMessages, en: enMessages, ru: ruMessages }

function fallbackParseText(text: string, locale: AppLocale): PaymentDraft[] {
  const lines = text.split(/\n+/).map((l) => l.trim()).filter(Boolean)
  const parsed = lines
    .map((line): PaymentDraft | null => {
      const amount = parseAmount(line)
      if (amount === null) return null
      const category = guessCategory(line)
      const name = cleanPaymentName(line)
      const repeat = guessRepeat(line, category)
      return {
        name: name || messages[locale].addDialog.fallbackValues.newPayment,
        amount,
        category,
        repeat,
        nextDate: nextDueDate(parseAzDate(line) ?? isoFromToday(30), repeat),
      }
    })
    .filter((x): x is PaymentDraft => x !== null)

  if (parsed.length > 0) return parsed

  return [
    { name: messages[locale].addDialog.fallbackValues.membership, amount: 4.99, category: 'subscriptions', repeat: 'monthly', nextDate: isoFromToday(14) },
    { name: messages[locale].addDialog.fallbackValues.tariff, amount: 12, category: 'telecom', repeat: 'monthly', nextDate: isoFromToday(8) },
  ]
}

function fallbackParseReceipt(file: File, locale: AppLocale): PaymentDraft[] {
  const fromName = file.name.replace(/\.[a-z0-9]+$/i, '').replace(/[_-]+/g, ' ')
  return [
    {
      name: /qəbz|receipt|квитанц|img|image|photo|screenshot/i.test(fromName) ? messages[locale].addDialog.fallbackValues.receipt : fromName.slice(0, 40),
      amount: 34.6,
      category: 'utilities',
      repeat: 'monthly',
      nextDate: isoFromToday(20),
    },
  ]
}

function fallbackParseQuick(text: string, locale: AppLocale): PaymentDraft[] {
  const parts = text.split(',').map((p) => p.trim()).filter(Boolean)
  const category = guessCategory(text)
  const name = cleanPaymentName(parts[0] || text)
  const repeat = guessRepeat(text, category)
  return [
    {
      name: name || messages[locale].addDialog.fallbackValues.newPayment,
      amount: parseAmount(text) ?? 0,
      category,
      repeat,
      nextDate: nextDueDate(parseAzDate(text) ?? isoFromToday(30), repeat),
    },
  ]
}

function fallbackCancelHelp(item: Payment, locale: 'az' | 'en' | 'ru' = 'az'): CancelHelp {
  const provider = item.provider ?? item.name
  const nextDate = formatCalendarDate(item.nextDate, locale, { day: 'numeric', month: 'long', year: 'numeric' })
  const isOnline = item.category === 'subscriptions'
  const copy = messages[locale].cancelDialog.fallbackCopy
  const interpolate = (value: string) => value
    .replace(/\{provider\}/g, provider)
    .replace(/\{name\}/g, item.name)
    .replace(/\{nextDate\}/g, nextDate)
  const steps = (isOnline ? copy.onlineSteps : copy.offlineSteps).map(interpolate)
  const letter = [copy.dear, copy.request, copy.number, copy.phone, copy.stop, copy.regards, copy.signature, copy.date]
    .map(interpolate)
    .join('\n\n')

  return { steps, letter }
}

export async function parseText(text: string, locale: AppLocale = 'az'): Promise<PaymentDraft[]> {
  try {
    const data = await postJson<{ items?: unknown[] }>('/api/parse', { text, locale })
    if (!data) {
      lastAiStatus = 'fallback'
      return fallbackParseText(text, locale)
    }
    const items = mapParseItems(data.items ?? [])
    lastAiStatus = 'ai'
    return items
  } catch {
    lastAiStatus = 'fallback'
    return fallbackParseText(text, locale)
  }
}

export async function parseReceipt(file: File, locale: AppLocale = 'az'): Promise<PaymentDraft[]> {
  try {
    const imageBase64 = await fileToBase64(file)
    const data = await postJson<{ items?: unknown[] }>('/api/parse', {
      imageBase64,
      mimeType: file.type || 'image/jpeg',
      locale,
    })
    if (!data) {
      lastAiStatus = 'fallback'
      return fallbackParseReceipt(file, locale)
    }
    const items = mapParseItems(data.items ?? [])
    lastAiStatus = 'ai'
    return items
  } catch {
    lastAiStatus = 'fallback'
    return fallbackParseReceipt(file, locale)
  }
}

export async function parseQuick(text: string, locale: AppLocale = 'az'): Promise<PaymentDraft[]> {
  try {
    const data = await postJson<{ items?: unknown[] }>('/api/parse', { text, locale })
    if (!data) {
      lastAiStatus = 'fallback'
      return fallbackParseQuick(text, locale)
    }
    const items = mapParseItems(data.items ?? [])
    lastAiStatus = 'ai'
    return items
  } catch {
    lastAiStatus = 'fallback'
    return fallbackParseQuick(text, locale)
  }
}

export async function generateCancelHelp(item: Payment, locale: AppLocale = 'az', displayName = item.name, displayProvider = item.provider ?? displayName, displayCategory: string = item.category): Promise<CancelHelp> {
  const localizedItem = { ...item, name: displayName, provider: displayProvider }
  try {
    const data = await postJson<CancelHelp>('/api/cancel', {
      name: displayName,
      amount: item.amount,
      category: displayCategory,
      locale,
    })
    if (!data) {
      lastAiStatus = 'fallback'
      return fallbackCancelHelp(localizedItem, locale)
    }
    const steps = Array.isArray(data.steps) ? data.steps.map(String).filter(Boolean) : []
    const letter = typeof data.letter === 'string' ? data.letter.trim() : ''
    if (steps.length === 0 || !letter) {
      lastAiStatus = 'fallback'
      return fallbackCancelHelp(localizedItem, locale)
    }
    lastAiStatus = 'ai'
    return { steps, letter }
  } catch {
    lastAiStatus = 'fallback'
    return fallbackCancelHelp(localizedItem, locale)
  }
}

export async function getWeeklySummary(
  payments: Payment[],
  today: Date,
  localizedText: (key: string, values?: Record<string, string | number>) => string,
  locale: 'az' | 'en' | 'ru' = 'az',
  localizedName: (payment: Payment) => string = (payment) => payment.name,
  localizedCategory: (payment: Payment) => string = (payment) => payment.category,
): Promise<WeeklySummary> {
  const stats = getNext7DaysStats(payments, today)
  const biggest = [...stats.items].sort((a, b) => b.payment.amount - a.payment.amount)[0]
  const nearestDeadline = stats.items
    .filter(({ payment }) => payment.isDeadline)
    .sort((a, b) => a.date.getTime() - b.date.getTime())[0]
  const payload = {
    count: stats.count,
    total: stats.total,
    deadlineCount: stats.deadlineCount,
    biggestPayment: biggest ? { name: localizedName(biggest.payment), amount: biggest.payment.amount, category: localizedCategory(biggest.payment) } : null,
    nearestDeadline: nearestDeadline
      ? { name: localizedName(nearestDeadline.payment), daysLeft: daysUntil(nearestDeadline.date, today), category: localizedCategory(nearestDeadline.payment) }
      : null,
  }
  const fallbackHeadline = localizedText('headline', {
    payments: localizedText('paymentCount', { count: stats.count }),
    deadlines: localizedText('deadlineCount', { count: stats.deadlineCount }),
  })
  const fallbackBody = biggest
    ? localizedText(nearestDeadline ? 'budgetWithDeadline' : 'budget', {
      amount: formatAmount(payload.total, locale),
      name: localizedName(biggest.payment),
      paymentAmount: formatAmount(biggest.payment.amount, locale),
      deadlineName: nearestDeadline ? localizedName(nearestDeadline.payment) : '',
      days: nearestDeadline ? daysUntil(nearestDeadline.date, today) : 0,
    })
    : localizedText('empty')

  try {
    const result = await postJson<{ title?: unknown; body?: unknown }>('/api/weekly', { stats: payload, locale })
    if (!result) throw new Error('Weekly summary request failed')
    if (typeof result.title !== 'string' || typeof result.body !== 'string' || !result.title.trim() || !result.body.trim()) {
      throw new Error('Invalid weekly summary response')
    }
    return {
      paymentCount: stats.count,
      deadlineCount: stats.deadlineCount,
      total: stats.total,
      headline: result.title.trim(),
      text: result.body.trim(),
    }
  } catch {
    return {
      paymentCount: stats.count,
      deadlineCount: stats.deadlineCount,
      total: stats.total,
      headline: fallbackHeadline,
      text: fallbackBody,
    }
  }
}
