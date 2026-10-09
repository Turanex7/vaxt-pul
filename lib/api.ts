import type { CategoryId, Payment, PaymentDraft, Repeat } from './mock-data'
import { MONTHS_LOWER, getOccurrences, startOfToday, toISO } from './format'

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

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

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
  [/kirayə|kiraye|zal|idman|müqavilə|muqavile/i, 'muqavile'],
]

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
  const match = text.toLocaleLowerCase('az').match(/(\d{1,2})\s+([a-zəığöşüç]+)/i)
  if (!match) return null
  const monthIndex = MONTHS_LOWER.findIndex((m) => match[2].startsWith(m.slice(0, 3)))
  if (monthIndex === -1) return null
  const today = startOfToday()
  const date = new Date(today.getFullYear(), monthIndex, Number(match[1]))
  if (date < today) date.setFullYear(date.getFullYear() + 1)
  return toISO(date)
}

function parseAmount(text: string): number | null {
  const match = text.match(/(\d+(?:[.,]\d{1,2})?)\s*(?:azn|₼|manat)/i)
  return match ? Number(match[1].replace(',', '.')) : null
}

/** TODO: replace with fetch('/api/parse-text', { method: 'POST', body: JSON.stringify({ text }) }) */
export async function parseText(text: string): Promise<PaymentDraft[]> {
  await wait(1500)
  const lines = text.split(/\n+/).map((l) => l.trim()).filter(Boolean)
  const parsed = lines
    .map((line): PaymentDraft | null => {
      const amount = parseAmount(line)
      if (amount === null) return null
      const category = guessCategory(line)
      const name = line.replace(/[\d.,]+\s*(azn|₼|manat)/gi, '').replace(/[:\-–]+/g, ' ').trim().slice(0, 40)
      return {
        name: name || 'Yeni ödəniş',
        amount,
        category,
        repeat: guessRepeat(line, category),
        nextDate: parseAzDate(line) ?? isoFromToday(30),
      }
    })
    .filter((x): x is PaymentDraft => x !== null)

  if (parsed.length > 0) return parsed

  return [
    { name: 'Bolt Plus abunəsi', amount: 4.99, category: 'abune', repeat: 'monthly', nextDate: isoFromToday(14) },
    { name: 'Bakcell tarif', amount: 12, category: 'telekom', repeat: 'monthly', nextDate: isoFromToday(8) },
  ]
}

/** TODO: replace with fetch('/api/parse-receipt', { method: 'POST', body: formData }) */
export async function parseReceipt(file: File): Promise<PaymentDraft[]> {
  await wait(1500)
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

/** TODO: replace with fetch('/api/parse-quick', { method: 'POST', body: JSON.stringify({ text }) }) */
export async function parseQuick(text: string): Promise<PaymentDraft[]> {
  await wait(1500)
  const parts = text.split(',').map((p) => p.trim()).filter(Boolean)
  const category = guessCategory(text)
  return [
    {
      name: parts[0] || 'Yeni ödəniş',
      amount: parseAmount(text) ?? 0,
      category,
      repeat: guessRepeat(text, category),
      nextDate: parseAzDate(text) ?? isoFromToday(30),
    },
  ]
}

/** TODO: replace with fetch('/api/cancel-help', { method: 'POST', body: JSON.stringify({ item }) }) */
export async function generateCancelHelp(item: Payment): Promise<CancelHelp> {
  await wait(1500)
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

/** TODO: replace with fetch('/api/weekly-summary') */
export async function getWeeklySummary(payments: Payment[]): Promise<WeeklySummary> {
  await wait(900)
  const start = startOfToday()
  const end = new Date(start)
  end.setDate(end.getDate() + 6)
  const occurrences = getOccurrences(payments, start, end)
  const deadlineCount = occurrences.filter((o) => o.payment.isDeadline).length
  const paymentCount = occurrences.length - deadlineCount
  const total = occurrences.reduce((acc, o) => acc + o.payment.amount, 0)
  const biggest = [...occurrences].sort((a, b) => b.payment.amount - a.payment.amount)[0]

  return {
    paymentCount,
    deadlineCount,
    total,
    headline: `Bu həftə ${paymentCount} ödəniş, ${deadlineCount} son tarix var.`,
    text: biggest
      ? `Ən böyük məbləğ ${biggest.payment.name} üçündür (${biggest.payment.amount} AZN). Hesabında həftə ərzində ən azı ${Math.ceil(total)} AZN saxlamağı tövsiyə edirik.`
      : 'Bu həftə heç bir ödəniş yoxdur. Rahat həftə!',
  }
}
