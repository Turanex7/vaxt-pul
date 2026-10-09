'use client'

import { useTranslations } from 'next-intl'
import type { Payment } from '@/lib/mock-data'
import { paymentNameKey, paymentProviderKey } from '@/lib/payment-name'

export function usePaymentName() {
  const t = useTranslations('payments.name')
  return (payment: Pick<Payment, 'id' | 'name'>) => {
    const key = ('nameKey' in payment && typeof payment.nameKey === 'string' ? payment.nameKey : undefined) ?? paymentNameKey(payment.id)
    return key ? t(key) : payment.name
  }
}

export function usePaymentProvider() {
  const t = useTranslations('payments.providerNames')
  return (payment: Pick<Payment, 'id' | 'provider'>) => {
    const key = ('providerKey' in payment && typeof payment.providerKey === 'string' ? payment.providerKey : undefined) ?? paymentProviderKey(payment.id)
    return key ? t(key) : payment.provider
  }
}
