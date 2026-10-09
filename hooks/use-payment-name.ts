'use client'

import { useTranslations } from 'next-intl'
import type { Payment } from '@/lib/mock-data'
import { paymentNameKey } from '@/lib/payment-name'

export function usePaymentName() {
  const t = useTranslations('payments.name')
  return (payment: Pick<Payment, 'id' | 'name'>) => {
    const key = paymentNameKey(payment.id)
    return key ? t(key) : payment.name
  }
}
