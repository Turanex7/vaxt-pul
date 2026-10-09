'use client'

import { Check, Copy, Loader2 } from 'lucide-react'
import { useState } from 'react'
import { useLocale, useTranslations } from 'next-intl'
import { toast } from 'sonner'
import useSWR from 'swr'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Skeleton } from '@/components/ui/skeleton'
import { generateCancelHelp, getLastAiStatus } from '@/lib/api'
import { usePaymentName, usePaymentProvider } from '@/hooks/use-payment-name'
import type { Payment } from '@/lib/mock-data'

interface CancelAssistantDialogProps {
  payment: Payment | null
  onOpenChange: (open: boolean) => void
}

export function CancelAssistantDialog({ payment, onOpenChange }: CancelAssistantDialogProps) {
  return (
    <Dialog open={payment !== null} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92dvh] gap-5 overflow-y-auto rounded-2xl p-5 text-base sm:max-w-2xl md:p-6">
        {payment && <CancelHelpBody key={payment.id} payment={payment} />}
      </DialogContent>
    </Dialog>
  )
}

function CancelHelpBody({ payment }: { payment: Payment }) {
  const t = useTranslations('cancelDialog')
  const toastT = useTranslations('toast')
  const locale = useLocale() as 'az' | 'en' | 'ru'
  const paymentName = usePaymentName()
  const paymentProvider = usePaymentProvider()
  const categories = useTranslations('categories')
  const { data, isLoading } = useSWR(['cancel-help', locale, payment.id], async () => ({
    help: await generateCancelHelp(payment, locale, paymentName(payment), paymentProvider(payment) ?? paymentName(payment), categories(payment.category)),
    usedFallback: getLastAiStatus() === 'fallback',
  }), {
    revalidateOnFocus: false,
  })
  const [copied, setCopied] = useState(false)

  const copy = async () => {
    if (!data) return
    try {
      await navigator.clipboard.writeText(data.help.letter)
      setCopied(true)
      toast.success(toastT('copySuccess'))
      setTimeout(() => setCopied(false), 2000)
    } catch {
      toast.error(toastT('copyError'))
    }
  }

  return (
    <>
      <DialogHeader>
        <DialogTitle className="text-2xl font-semibold">{t('title')}</DialogTitle>
        <DialogDescription className="text-base">
          {t('description', { name: paymentName(payment), provider: paymentProvider(payment) ?? t('service') })}
        </DialogDescription>
      </DialogHeader>

      {isLoading || !data ? (
        <div className="flex flex-col gap-4" aria-busy="true">
          <p className="flex items-center gap-2 font-medium text-primary" role="status">
            <Loader2 className="size-5 animate-spin" aria-hidden="true" />
            {t('loading')}
          </p>
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-6 w-full" />
          ))}
          <Skeleton className="h-40 w-full rounded-xl" />
        </div>
      ) : (
        <>
          {data.usedFallback && (
            <p role="status" className="rounded-xl bg-warning-soft px-3 py-2 text-sm text-warning">
              {t('fallback')}
            </p>
          )}
          <section aria-labelledby="cancel-steps">
            <h3 id="cancel-steps" className="mb-3 text-lg font-semibold">{t('steps')}</h3>
            <ol className="flex flex-col gap-3">
              {data.help.steps.map((step, i) => (
                <li key={i} className="flex gap-3">
                  <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-secondary font-semibold text-secondary-foreground">
                    {i + 1}
                  </span>
                  <span className="pt-0.5 text-pretty">{step}</span>
                </li>
              ))}
            </ol>
          </section>

          <section aria-labelledby="cancel-letter">
            <div className="mb-2 flex items-center justify-between gap-2">
              <h3 id="cancel-letter" className="text-lg font-semibold">{t('letter')}</h3>
              <Button variant="outline" onClick={copy}>
                {copied ? <Check data-icon="inline-start" aria-hidden="true" /> : <Copy data-icon="inline-start" aria-hidden="true" />}
                {copied ? t('copied') : t('copy')}
              </Button>
            </div>
            <pre className="rounded-xl bg-muted p-4 font-sans text-base leading-relaxed whitespace-pre-wrap">
              {data.help.letter}
            </pre>
          </section>
        </>
      )}
    </>
  )
}
