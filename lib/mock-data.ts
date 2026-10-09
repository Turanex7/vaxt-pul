export type CategoryId =
  | 'subscriptions'
  | 'telecom'
  | 'utilities'
  | 'loans'
  | 'insurance'
  | 'contracts'

export type Repeat = 'weekly' | 'monthly' | 'yearly' | 'once'

export interface Installment {
  paid: number
  total: number
}

export interface Payment {
  id: string
  name: string
  /** Translation key for bundled demo data; user-entered names remain plain text. */
  nameKey?: string
  providerKey?: string
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
  titleKey: string
  descriptionKey: string
  values?: Record<string, string | number>
  relatedPaymentIds?: string[]
  amount?: number
}

export function createMockPayments(today: Date): Payment[] {
  const isoFromToday = (offsetDays: number): string => {
    const d = new Date(today)
    d.setHours(0, 0, 0, 0)
    d.setDate(d.getDate() + offsetDays)
    const y = d.getFullYear()
    const m = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    return `${y}-${m}-${day}`
  }

  return [
  { id: 'netflix', nameKey: 'netflix', providerKey: 'netflix', name: 'Netflix', provider: 'Netflix', category: 'subscriptions', amount: 9.99, nextDate: isoFromToday(2), repeat: 'monthly', autoRenew: true },
  { id: 'youtube', nameKey: 'youtube', providerKey: 'youtube', name: 'YouTube Premium', provider: 'Google', category: 'subscriptions', amount: 11.99, nextDate: isoFromToday(16), repeat: 'monthly', autoRenew: true },
  { id: 'spotify', nameKey: 'spotify', providerKey: 'spotify', name: 'Spotify Premium', provider: 'Spotify', category: 'subscriptions', amount: 9.99, nextDate: isoFromToday(21), repeat: 'monthly', autoRenew: true },
  { id: 'azercell-tarif', nameKey: 'azercellTariff', providerKey: 'azercell', name: 'Azercell tarif', provider: 'Azercell', category: 'telecom', amount: 15, nextDate: isoFromToday(4), repeat: 'monthly' },
  { id: 'azercell-paket', nameKey: 'azercellPack', providerKey: 'azercell', name: 'Azercell əlavə internet paketi', provider: 'Azercell', category: 'telecom', amount: 5, nextDate: isoFromToday(18), repeat: 'monthly', autoRenew: true },
  { id: 'internet', nameKey: 'internet', providerKey: 'internet', name: 'Ev interneti', provider: 'CityNet', category: 'telecom', amount: 20, nextDate: isoFromToday(9), repeat: 'monthly' },
  { id: 'elektrik', nameKey: 'electricity', providerKey: 'electricity', name: 'Elektrik', provider: 'Azərişıq', category: 'utilities', amount: 37.8, previousAmount: 28, nextDate: isoFromToday(11), repeat: 'monthly' },
  { id: 'qaz', nameKey: 'gas', providerKey: 'gas', name: 'Qaz', provider: 'Azəriqaz', category: 'utilities', amount: 22, nextDate: isoFromToday(13), repeat: 'monthly' },
  { id: 'su', nameKey: 'water', providerKey: 'water', name: 'Su', provider: 'Azərsu', category: 'utilities', amount: 8, nextDate: isoFromToday(13), repeat: 'monthly' },
  { id: 'kredit', nameKey: 'loan', providerKey: 'loan', name: 'Bank krediti', provider: 'Kapital Bank', category: 'loans', amount: 210, nextDate: isoFromToday(6), repeat: 'monthly' },
  { id: 'taksit', nameKey: 'installment', providerKey: 'installment', name: 'Taksit: telefon', provider: 'Birmarket', category: 'loans', amount: 85, nextDate: isoFromToday(24), repeat: 'monthly', installment: { paid: 6, total: 12 } },
  { id: 'sigorta', nameKey: 'insurance', providerKey: 'insurance', name: 'Avtomobil sığortası', provider: 'Paşa Sığorta', category: 'insurance', amount: 180, nextDate: isoFromToday(12), repeat: 'yearly', isDeadline: true },
  { id: 'texbaxis', nameKey: 'inspection', providerKey: 'inspection', name: 'Texniki baxış', provider: 'DYP', category: 'insurance', amount: 30, nextDate: isoFromToday(5), repeat: 'yearly', isDeadline: true },
  { id: 'idman', nameKey: 'gym', providerKey: 'gym', name: 'İdman zalı üzvlüyü', provider: 'Sport Life', category: 'contracts', amount: 60, nextDate: isoFromToday(27), repeat: 'monthly', autoRenew: true },
  { id: 'kiraye', nameKey: 'rent', providerKey: 'rent', name: 'Kirayə', provider: 'Ev sahibi', category: 'contracts', amount: 400, nextDate: isoFromToday(28), repeat: 'monthly' },
  ]
}

// Fixed dates make the server render and the first client render identical.
export const mockPayments: Payment[] = createMockPayments(new Date(2026, 9, 9))
