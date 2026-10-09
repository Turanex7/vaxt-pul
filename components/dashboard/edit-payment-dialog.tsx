'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { usePaymentName } from '@/hooks/use-payment-name'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import type { Payment, PaymentDraft } from '@/lib/mock-data'
import { DraftFields, isDraftValid } from './draft-fields'

interface EditPaymentDialogProps {
  payment: Payment | null
  onOpenChange: (open: boolean) => void
  onSave: (id: string, draft: PaymentDraft) => void
}

export function EditPaymentDialog({ payment, onOpenChange, onSave }: EditPaymentDialogProps) {
  return (
    <Dialog open={payment !== null} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-2xl p-5 text-base sm:max-w-lg md:p-6">
        {payment && <EditForm key={payment.id} payment={payment} onCancel={() => onOpenChange(false)} onSave={onSave} />}
      </DialogContent>
    </Dialog>
  )
}

function EditForm({
  payment,
  onCancel,
  onSave,
}: {
  payment: Payment
  onCancel: () => void
  onSave: EditPaymentDialogProps['onSave']
}) {
  const t = useTranslations('editDialog')
  const common = useTranslations('common')
  const paymentName = usePaymentName()
  const [draft, setDraft] = useState<PaymentDraft>({
    name: payment.name,
    amount: payment.amount,
    nextDate: payment.nextDate,
    category: payment.category,
    repeat: payment.repeat,
  })

  return (
    <form
      className="flex flex-col gap-5"
      onSubmit={(e) => {
        e.preventDefault()
        if (isDraftValid(draft)) onSave(payment.id, draft)
      }}
    >
      <DialogHeader>
        <DialogTitle className="text-2xl font-semibold">{t('title')}</DialogTitle>
        <DialogDescription className="text-base">{t('description', { name: paymentName(payment) })}</DialogDescription>
      </DialogHeader>
      <DraftFields idPrefix={`edit-${payment.id}`} draft={draft} onChange={setDraft} />
      <DialogFooter className="-mx-5 -mb-5 rounded-b-2xl md:-mx-6 md:-mb-6">
        <Button type="button" variant="outline" size="lg" onClick={onCancel}>{common('cancel')}</Button>
        <Button type="submit" size="lg" disabled={!isDraftValid(draft)}>{common('save')}</Button>
      </DialogFooter>
    </form>
  )
}
