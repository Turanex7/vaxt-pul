export type CategoryId =
  | 'abune'
  | 'telekom'
  | 'kommunal'
  | 'kredit'
  | 'sigorta'
  | 'muqavile'

export type Repeat = 'monthly' | 'yearly' | 'once'

export interface Installment {
  paid: number
  total: number
}

export interface Payment {
  id: string
  name: string
  category: CategoryId
  amount: number
  /** ISO date, YYYY-MM-DD */
  nextDate: string
  repeat: Repeat
  /** True for expiring documents/deadlines (insurance, inspection) rather than regular bills */
  isDeadline?: boolean
  autoRenew?: boolean
  previousAmount?: number
  installment?: Installment
  provider?: string
}

export type PaymentDraft = Pick<
  Payment,
  'name' | 'category' | 'amount' | 'nextDate' | 'repeat'
>

export type InsightSeverity = 'urgent' | 'warning' | 'saving'

export type InsightKind =
  | 'deadline'
  | 'duplicate'
  | 'spike'
  | 'unknown-charge'
  | 'forecast'

export interface Insight {
  id: string
  kind: InsightKind
  severity: InsightSeverity
  title: string
  description: string
  relatedPaymentIds?: string[]
  amount?: number
}

function isoFromToday(offsetDays: number): string {
  const d = new Date()
  d.setHours(0, 0, 0, 0)
  d.setDate(d.getDate() + offsetDays)
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export const mockPayments: Payment[] = [
  { id: 'netflix', name: 'Netflix', provider: 'Netflix', category: 'abune', amount: 9.99, nextDate: isoFromToday(2), repeat: 'monthly', autoRenew: true },
  { id: 'youtube', name: 'YouTube Premium', provider: 'Google', category: 'abune', amount: 11.99, nextDate: isoFromToday(16), repeat: 'monthly', autoRenew: true },
  { id: 'spotify', name: 'Spotify Premium', provider: 'Spotify', category: 'abune', amount: 9.99, nextDate: isoFromToday(21), repeat: 'monthly', autoRenew: true },
  { id: 'azercell-tarif', name: 'Azercell tarif', provider: 'Azercell', category: 'telekom', amount: 15, nextDate: isoFromToday(4), repeat: 'monthly' },
  { id: 'azercell-paket', name: 'Azercell əlavə internet paketi', provider: 'Azercell', category: 'telekom', amount: 5, nextDate: isoFromToday(18), repeat: 'monthly', autoRenew: true },
  { id: 'internet', name: 'Ev interneti', provider: 'CityNet', category: 'telekom', amount: 20, nextDate: isoFromToday(9), repeat: 'monthly' },
  { id: 'elektrik', name: 'Elektrik', provider: 'Azərişıq', category: 'kommunal', amount: 37.8, previousAmount: 28, nextDate: isoFromToday(11), repeat: 'monthly' },
  { id: 'qaz', name: 'Qaz', provider: 'Azəriqaz', category: 'kommunal', amount: 22, nextDate: isoFromToday(13), repeat: 'monthly' },
  { id: 'su', name: 'Su', provider: 'Azərsu', category: 'kommunal', amount: 8, nextDate: isoFromToday(13), repeat: 'monthly' },
  { id: 'kredit', name: 'Bank krediti', provider: 'Kapital Bank', category: 'kredit', amount: 210, nextDate: isoFromToday(6), repeat: 'monthly' },
  { id: 'taksit', name: 'Taksit: telefon', provider: 'Birmarket', category: 'kredit', amount: 85, nextDate: isoFromToday(24), repeat: 'monthly', installment: { paid: 6, total: 12 } },
  { id: 'sigorta', name: 'Avtomobil sığortası', provider: 'Paşa Sığorta', category: 'sigorta', amount: 180, nextDate: isoFromToday(12), repeat: 'yearly', isDeadline: true },
  { id: 'texbaxis', name: 'Texniki baxış', provider: 'DYP', category: 'sigorta', amount: 30, nextDate: isoFromToday(5), repeat: 'yearly', isDeadline: true },
  { id: 'idman', name: 'İdman zalı üzvlüyü', provider: 'Sport Life', category: 'muqavile', amount: 60, nextDate: isoFromToday(27), repeat: 'monthly', autoRenew: true },
  { id: 'kiraye', name: 'Kirayə', provider: 'Ev sahibi', category: 'muqavile', amount: 400, nextDate: isoFromToday(28), repeat: 'monthly' },
]

export const mockInsights: Insight[] = [
  {
    id: 'ins-sigorta',
    kind: 'deadline',
    severity: 'urgent',
    title: 'Avtomobil sığortası 12 gündən sonra bitir',
    description: 'Vaxtında yeniləməsən, cərimə riski var. Təxmini məbləğ 180 AZN.',
    relatedPaymentIds: ['sigorta'],
  },
  {
    id: 'ins-duplicate',
    kind: 'duplicate',
    severity: 'saving',
    title: 'Bu 2 abunə təkrarlanır',
    description: 'YouTube Premium musiqini də əhatə edir. Spotify-ı dayandırsan, ildə 120 AZN qənaət.',
    relatedPaymentIds: ['youtube', 'spotify'],
    amount: 120,
  },
  {
    id: 'ins-spike',
    kind: 'spike',
    severity: 'warning',
    title: 'Elektrik xərci 35% artıb',
    description: 'Əvvəlki ay 28 AZN idi, bu ay 37.80 AZN gözlənilir.',
    relatedPaymentIds: ['elektrik'],
  },
  {
    id: 'ins-unknown',
    kind: 'unknown-charge',
    severity: 'urgent',
    title: 'Tanımadığımız ödəniş tapıldı: 14.90 AZN',
    description: '«PAYMNT*DIGI SRV» adlı kartdan çıxılma. Bu sənin ödənişindir?',
    amount: 14.9,
  },
  {
    id: 'ins-forecast',
    kind: 'forecast',
    severity: 'warning',
    title: 'Dekabrda 3 böyük ödəniş eyni həftəyə düşür',
    description: 'Kirayə, kredit və sığorta üçün həmin həftə 620 AZN lazım olacaq.',
    amount: 620,
  },
]
