import type { CategoryId, Payment, PaymentDraft, Repeat } from './mock-data'
import { daysUntil, formatAmount, getNext7DaysStats, MONTHS_LOWER, parseISO, startOfToday, toISO } from './format'

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
  [/sığorta|sigorta|baxış|baxis|pasport|sənəd|sened|vəsiqə/i, 'sigorta'],
  [/kredit|taksit|bank|borc/i, 'kredit'],
  [/azercell|bakcell|nar|internet|tarif|citynet|telefon/i, 'telekom'],
  [/elektrik|işıq|isiq|qaz|su\b|kommunal|azərişıq|azerisiq/i, 'kommunal'],
  [/netflix|spotify|youtube|abunə|abune|premium|apple|bolt/i, 'abune'],
  [/kirayə|kiraye|zal|idman|gym|üzvlük|uzvluk|müqavilə|muqavile/i, 'muqavile'],
]

const MONTH_NAME_RE = MONTHS_LOWER.join('|')

const CATEGORY_FROM_LABEL: Record<string, CategoryId> = {
  abunələr: 'abune',
  abuneler: 'abune',
  abune: 'abune',
  telekom: 'telekom',
  kommunal: 'kommunal',
  kredit: 'kredit',
  'sığorta və sənədlər': 'sigorta',
  'sigorta ve senedler': 'sigorta',
  sigorta: 'sigorta',
  müqavilələr: 'muqavile',
  muqavileler: 'muqavile',
  muqavile: 'muqavile',
}

const REPEAT_FROM_LABEL: Record<string, Repeat> = {
  aylıq: 'monthly',
  ayliq: 'monthly',
  monthly: 'monthly',
  illik: 'yearly',
  yearly: 'yearly',
  birdəfəlik: 'once',
  birdefelik: 'once',
  once: 'once',
}

function guessCategory(text: string): CategoryId {
  return CATEGORY_KEYWORDS.find(([re]) => re.test(text))?.[1] ?? 'abune'
}

function guessRepeat(text: string, category: CategoryId): Repeat {
  if (/illik|ildə|ilde/i.test(text)) return 'yearly'
  if (/birdəfəlik|birdefelik/i.test(text)) return 'once'
  if (/aylıq|ayliq/i.test(text)) return 'monthly'
  return category === 'sigorta' ? 'yearly' : 'monthly'
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
  const match = lower.match(new RegExp(`(\\d{1,2})\\s+(${MONTH_NAME_RE})[a-zəığöşüç]*(?:\\s+(\\d{4}))?`, 'i'))
  if (!match) return null
  const monthIndex = MONTHS_LOWER.findIndex((m) => match[2].startsWith(m.slice(0, 3)))
  if (monthIndex === -1) return null
  const today = startOfToday()
  const year = match[3] ? Number(match[3]) : today.getFullYear()
  const date = new Date(year, monthIndex, Number(match[1]))
  if (!match[3] && date < today) date.setFullYear(date.getFullYear() + 1)
  return toISO(date)
}

function cleanPaymentName(text: string): string {
  const monthPattern = new RegExp(
    `\\b\\d{1,2}\\s+(${MONTH_NAME_RE})[a-zəığöşüç]*\\s*(?:\\d{4})?\\b`,
    'gi',
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

async function postJson<T>(url: string, body: unknown): Promise<T> {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  if (!res.ok) {
    throw new Error(`${url} failed (${res.status})`)
  }
  return (await res.json()) as T
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

function fallbackParseText(text: string): PaymentDraft[] {
  const lines = text.split(/\n+/).map((l) => l.trim()).filter(Boolean)
  const parsed = lines
    .map((line): PaymentDraft | null => {
      const amount = parseAmount(line)
      if (amount === null) return null
      const category = guessCategory(line)
      const name = cleanPaymentName(line)
      const repeat = guessRepeat(line, category)
      return {
        name: name || 'Yeni ödəniş',
        amount,
        category,
        repeat,
        nextDate: nextDueDate(parseAzDate(line) ?? isoFromToday(30), repeat),
      }
    })
    .filter((x): x is PaymentDraft => x !== null)

  if (parsed.length > 0) return parsed

  return [
    { name: 'Bolt Plus abunəsi', amount: 4.99, category: 'abune', repeat: 'monthly', nextDate: isoFromToday(14) },
    { name: 'Bakcell tarif', amount: 12, category: 'telekom', repeat: 'monthly', nextDate: isoFromToday(8) },
  ]
}

function fallbackParseReceipt(file: File): PaymentDraft[] {
  const fromName = file.name.replace(/\.[a-z0-9]+$/i, '').replace(/[_-]+/g, ' ')
  return [
    {
      name: /qəbz|receipt|img|image|photo|screenshot/i.test(fromName) ? 'Azərişıq qəbzi' : fromName.slice(0, 40),
      amount: 34.6,
      category: 'kommunal',
      repeat: 'monthly',
      nextDate: isoFromToday(20),
    },
  ]
}

function fallbackParseQuick(text: string): PaymentDraft[] {
  const parts = text.split(',').map((p) => p.trim()).filter(Boolean)
  const category = guessCategory(text)
  const name = cleanPaymentName(parts[0] || text)
  const repeat = guessRepeat(text, category)
  return [
    {
      name: name || 'Yeni ödəniş',
      amount: parseAmount(text) ?? 0,
      category,
      repeat,
      nextDate: nextDueDate(parseAzDate(text) ?? isoFromToday(30), repeat),
    },
  ]
}

function fallbackCancelHelp(item: Payment): CancelHelp {
  const provider = item.provider ?? item.name
  const isOnline = item.category === 'abune'

  const steps = isOnline
    ? [
        `${provider} hesabına daxil ol (tətbiq və ya sayt).`,
        '«Hesab» və ya «Abunəlik» bölməsini aç.',
        '«Abunəliyi ləğv et» düyməsini seç və təsdiqlə.',
        'Təsdiq e-poçtunu saxla — növbəti ay pul çıxılmamalıdır.',
        'Kart çıxarışını növbəti ödəniş tarixində yoxla.',
      ]
    : [
        `${provider} ilə müqavilə nömrəni tap (qəbz və ya müqavilədə olur).`,
        'Aşağıdakı məktubu e-poçtla göndər və ya ofisə apar.',
        'Qəbul nömrəsini və ya imzalı surəti mütləq saxla.',
        'Avtomatik ödənişi bank tətbiqində də dayandır.',
        'Son ödəniş tarixindən sonra çıxarışı yoxla.',
      ]

  const letter = `Hörmətli ${provider} komandası,

Mən, [Ad Soyad], "${item.name}" xidməti üzrə müqaviləmin/abunəliyimin ləğv edilməsini xahiş edirəm.

Müqavilə / hesab nömrəsi: [nömrə]
Əlaqə telefonu: [telefon]

Xahiş edirəm, növbəti ödəniş tarixindən (${item.nextDate}) etibarən heç bir məbləğ silinməsin və ləğvin təsdiqini yazılı şəkildə göndərəsiniz.

Hörmətlə,
[Ad Soyad]
[Tarix]`

  return { steps, letter }
}

export async function parseText(text: string): Promise<PaymentDraft[]> {
  try {
    const data = await postJson<{ items?: unknown[] }>('/api/parse', { text })
    const items = mapParseItems(data.items ?? [])
    lastAiStatus = 'ai'
    return items
  } catch {
    lastAiStatus = 'fallback'
    return fallbackParseText(text)
  }
}

export async function parseReceipt(file: File): Promise<PaymentDraft[]> {
  try {
    const imageBase64 = await fileToBase64(file)
    const data = await postJson<{ items?: unknown[] }>('/api/parse', {
      imageBase64,
      mimeType: file.type || 'image/jpeg',
    })
    const items = mapParseItems(data.items ?? [])
    lastAiStatus = 'ai'
    return items
  } catch {
    lastAiStatus = 'fallback'
    return fallbackParseReceipt(file)
  }
}

export async function parseQuick(text: string): Promise<PaymentDraft[]> {
  try {
    const data = await postJson<{ items?: unknown[] }>('/api/parse', { text })
    const items = mapParseItems(data.items ?? [])
    lastAiStatus = 'ai'
    return items
  } catch {
    lastAiStatus = 'fallback'
    return fallbackParseQuick(text)
  }
}

export async function generateCancelHelp(item: Payment): Promise<CancelHelp> {
  try {
    const data = await postJson<CancelHelp>('/api/cancel', {
      name: item.name,
      amount: item.amount,
      category: item.category,
    })
    const steps = Array.isArray(data.steps) ? data.steps.map(String).filter(Boolean) : []
    const letter = typeof data.letter === 'string' ? data.letter.trim() : ''
    if (steps.length === 0 || !letter) {
      lastAiStatus = 'fallback'
      return fallbackCancelHelp(item)
    }
    lastAiStatus = 'ai'
    return { steps, letter }
  } catch {
    lastAiStatus = 'fallback'
    return fallbackCancelHelp(item)
  }
}

export async function getWeeklySummary(payments: Payment[], today: Date): Promise<WeeklySummary> {
  const stats = getNext7DaysStats(payments, today)
  const biggest = [...stats.items].sort((a, b) => b.payment.amount - a.payment.amount)[0]
  const nearestDeadline = stats.items
    .filter(({ payment }) => payment.isDeadline)
    .sort((a, b) => a.date.getTime() - b.date.getTime())[0]
  const payload = {
    count: stats.count,
    total: stats.total,
    deadlineCount: stats.deadlineCount,
    biggestPayment: biggest ? { name: biggest.payment.name, amount: biggest.payment.amount } : null,
    nearestDeadline: nearestDeadline
      ? { name: nearestDeadline.payment.name, daysLeft: daysUntil(nearestDeadline.date, today) }
      : null,
  }
  const fallbackHeadline = `Növbəti 7 gündə ${stats.count} ödəniş, ${stats.deadlineCount} son tarix var.`
  const fallbackBody = biggest
    ? `${formatAmount(stats.total)} məbləğini həftəlik büdcəndə nəzərdə saxla. Ən böyük ödəniş ${biggest.payment.name} üçündür (${formatAmount(biggest.payment.amount)})${nearestDeadline ? `, ${nearestDeadline.payment.name} üçün isə ${daysUntil(nearestDeadline.date, today)} gün qalıb` : ''}.`
    : 'Növbəti 7 gündə ödəniş yoxdur. Rahat həftədən yararlan.'

  try {
    const result = await postJson<{ title?: unknown; body?: unknown }>('/api/weekly', { stats: payload })
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
