import type { CategoryId, Payment, Repeat } from './mock-data'
import { paymentNameKey, paymentProviderKey } from './payment-name'

const categoryAliases: Record<string, CategoryId> = {
  subscriptions: 'subscriptions', abune: 'subscriptions', abuneler: 'subscriptions', 'abunələr': 'subscriptions', 'подписки': 'subscriptions',
  telecom: 'telecom', telekom: 'telecom', связь: 'telecom',
  utilities: 'utilities', kommunal: 'utilities', 'коммунальные услуги': 'utilities',
  loans: 'loans', kredit: 'loans', кредит: 'loans', кредиты: 'loans',
  insurance: 'insurance', sigorta: 'insurance', 'sığorta və sənədlər': 'insurance', 'страхование и документы': 'insurance',
  contracts: 'contracts', muqavile: 'contracts', muqavileler: 'contracts', 'müqavilələr': 'contracts', договоры: 'contracts',
}
const repeatAliases: Record<string, Repeat> = {
  weekly: 'weekly', həftəlik: 'weekly', heftelik: 'weekly', еженедельно: 'weekly',
  monthly: 'monthly', aylıq: 'monthly', ayliq: 'monthly', ежемесячно: 'monthly',
  yearly: 'yearly', illik: 'yearly', ежегодно: 'yearly',
  once: 'once', birdəfəlik: 'once', birdefelik: 'once', разовый: 'once',
}

export function migrateSavedPayments(value: unknown): Payment[] | null {
  if (!Array.isArray(value)) return null
  const migrated: Payment[] = []
  for (const entry of value) {
    if (!entry || typeof entry !== 'object') continue
    const row = entry as Record<string, unknown>
    const category = typeof row.category === 'string' ? categoryAliases[row.category.trim().toLowerCase()] : undefined
    const repeat = typeof row.repeat === 'string' ? repeatAliases[row.repeat.trim().toLowerCase()] : undefined
    if (
      typeof row.id !== 'string' || typeof row.name !== 'string' || !row.name.trim() || !category || !repeat ||
      typeof row.amount !== 'number' || !Number.isFinite(row.amount) || typeof row.nextDate !== 'string' ||
      !/^\d{4}-\d{2}-\d{2}$/.test(row.nextDate)
    ) return null
    migrated.push({
      ...row,
      id: row.id,
      name: row.name,
      nameKey: paymentNameKey(row.id),
      providerKey: paymentProviderKey(row.id),
      category,
      repeat,
      amount: row.amount,
      nextDate: row.nextDate,
    } as Payment)
  }
  return migrated
}
