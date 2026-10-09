'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { toast } from 'sonner'
import { useTranslations } from 'next-intl'
import { nextPaymentPeriod, startOfToday } from '@/lib/format'
import { createMockPayments, type Insight, type Payment, type PaymentDraft, mockPayments } from '@/lib/mock-data'
import { buildRadarInsights } from '@/lib/radar'
import { useToday } from '@/hooks/use-today'
import { AddPaymentDialog } from './add-payment-dialog'
import { AppHeader } from './app-header'
import { CancelAssistantDialog } from './cancel-assistant-dialog'
import { CategoryChart } from './category-chart'
import { EditPaymentDialog } from './edit-payment-dialog'
import { HeroSummary } from './hero-summary'
import { PaymentCalendar } from './payment-calendar'
import { PaymentsList } from './payments-list'
import { RadarSection } from './radar-section'
import { WeeklySummary } from './weekly-summary'
import { WhatIfSimulator } from './what-if-simulator'
import { paymentNameKey } from '@/lib/payment-name'

const PAYMENTS_STORAGE_KEY = 'paypulse:payments'

export function Dashboard() {
  const t = useTranslations()
  const today = useToday()
  const [payments, setPayments] = useState<Payment[]>(mockPayments)
  const [paymentsLoaded, setPaymentsLoaded] = useState(false)
  const skipNextStorageWrite = useRef(false)
  const insights = useMemo(() => buildRadarInsights(payments, today), [payments, today])
  const [addOpen, setAddOpen] = useState(false)
  const [editing, setEditing] = useState<Payment | null>(null)
  const [cancelling, setCancelling] = useState<Payment | null>(null)
  const [highlightIds, setHighlightIds] = useState<string[]>([])
  const localizedName = (id: string, name: string) => {
    const key = paymentNameKey(id)
    return key ? t(`payments.name.${key}`) : name
  }

  useEffect(() => {
    let restored = false
    try {
      const stored = window.localStorage.getItem(PAYMENTS_STORAGE_KEY)
      if (stored) {
        const parsed: unknown = JSON.parse(stored)
        if (Array.isArray(parsed)) {
          setPayments(parsed as Payment[])
          restored = true
        }
      }
    } catch {
      // Invalid or unavailable storage falls back to fresh demo data.
    } finally {
      if (!restored) setPayments(createMockPayments(startOfToday()))
      setPaymentsLoaded(true)
    }
  }, [])

  useEffect(() => {
    if (!paymentsLoaded) return
    if (skipNextStorageWrite.current) {
      skipNextStorageWrite.current = false
      return
    }
    try {
      window.localStorage.setItem(PAYMENTS_STORAGE_KEY, JSON.stringify(payments))
    } catch {
      // Keep the in-memory state usable when storage is unavailable.
    }
  }, [payments, paymentsLoaded])

  const addDrafts = (drafts: PaymentDraft[]) => {
    const created: Payment[] = drafts.map((d) => ({
      id: crypto.randomUUID(),
      name: d.name,
      category: d.category,
      amount: d.amount,
      nextDate: d.nextDate,
      repeat: d.repeat,
    }))
    setPayments((prev) => [...prev, ...created])
    toast.success(created.length === 1 ? t('toast.addedOne', { name: created[0].name }) : t('toast.addedMany', { count: created.length }))
  }

  const savePayment = (id: string, draft: PaymentDraft) => {
    setPayments((prev) =>
      prev.map((p) =>
        p.id === id
          ? {
              ...p,
              name: draft.name,
              category: draft.category,
              amount: draft.amount,
              nextDate: draft.nextDate,
              repeat: draft.repeat,
            }
          : p,
      ),
    )
    setEditing(null)
    toast.success(t('toast.saved'))
  }

  const deletePayment = (payment: Payment) => {
    setPayments((prev) => prev.filter((p) => p.id !== payment.id))
    toast(t('toast.deleted', { name: localizedName(payment.id, payment.name) }), {
      action: { label: t('toast.undo'), onClick: () => setPayments((prev) => [...prev, payment]) },
    })
  }

  const markPaid = (payment: Payment) => {
    if (payment.repeat === 'once') {
      setPayments((prev) => prev.filter((p) => p.id !== payment.id))
      toast.success(t('toast.paidRemoved', { name: localizedName(payment.id, payment.name) }))
      return
    }

    const nextDate = nextPaymentPeriod(payment.nextDate, payment.repeat)
    setPayments((prev) => prev.map((p) => p.id === payment.id ? { ...p, nextDate } : p))
    toast.success(t('toast.paidAdvanced', { name: localizedName(payment.id, payment.name) }))
  }

  const resetDemoData = () => {
    if (!window.confirm(t('toast.resetConfirm'))) return
    try {
      window.localStorage.removeItem(PAYMENTS_STORAGE_KEY)
    } catch {
      // Reset the visible data even if browser storage is unavailable.
    }
    skipNextStorageWrite.current = true
    setPayments(createMockPayments(startOfToday()))
    toast.success(t('toast.resetDone'))
  }

  const viewDuplicates = (insight: Insight) => {
    setHighlightIds(insight.relatedPaymentIds ?? [])
    document.getElementById('simulator')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  const recognize = (_insight: Insight, recognized: boolean) => {
    if (recognized) {
      toast.success(t('toast.recognized'))
    } else {
      toast.error(t('toast.notRecognized'), { duration: 6000 })
    }
  }

  return (
    <>
      <AppHeader onAdd={() => setAddOpen(true)} onReset={resetDemoData} />
      <main className="mx-auto flex w-full max-w-6xl flex-col gap-10 px-4 py-6 md:gap-12 md:px-6 md:py-10">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-balance md:text-4xl">{t('dashboard.greeting')}</h1>
          <p className="mt-2 max-w-2xl text-lg text-muted-foreground text-pretty">
            {t('dashboard.intro')}
          </p>
        </div>

        <HeroSummary payments={payments} today={today} />
        <RadarSection insights={insights} payments={payments} onViewDuplicates={viewDuplicates} onRecognize={recognize} />

        <section aria-labelledby="overview-heading">
          <h2 id="overview-heading" className="mb-4 text-2xl font-semibold tracking-tight">{t('dashboard.expenses')}</h2>
          <div className="grid gap-4 lg:grid-cols-2">
            <CategoryChart payments={payments} />
            <PaymentCalendar payments={payments} today={today} />
          </div>
        </section>

        <PaymentsList
          payments={payments}
          today={today}
          onEdit={setEditing}
          onCancelHelp={setCancelling}
          onDelete={deletePayment}
          onMarkPaid={markPaid}
        />
        <WhatIfSimulator payments={payments} highlightIds={highlightIds} />
        <WeeklySummary payments={payments} today={today} />
      </main>

      <AddPaymentDialog open={addOpen} onOpenChange={setAddOpen} onConfirm={addDrafts} />
      <EditPaymentDialog payment={editing} onOpenChange={(o) => !o && setEditing(null)} onSave={savePayment} />
      <CancelAssistantDialog payment={cancelling} onOpenChange={(o) => !o && setCancelling(null)} />
    </>
  )
}
