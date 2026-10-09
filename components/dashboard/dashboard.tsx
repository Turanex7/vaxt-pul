'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { type Insight, type Payment, type PaymentDraft, mockInsights, mockPayments } from '@/lib/mock-data'
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

export function Dashboard() {
  const [payments, setPayments] = useState<Payment[]>(mockPayments)
  const [insights, setInsights] = useState<Insight[]>(mockInsights)
  const [addOpen, setAddOpen] = useState(false)
  const [editing, setEditing] = useState<Payment | null>(null)
  const [cancelling, setCancelling] = useState<Payment | null>(null)
  const [highlightIds, setHighlightIds] = useState<string[]>([])

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
    toast.success(created.length === 1 ? `«${created[0].name}» əlavə olundu` : `${created.length} ödəniş əlavə olundu`)
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
    toast.success('Dəyişikliklər yadda saxlanıldı')
  }

  const deletePayment = (payment: Payment) => {
    setPayments((prev) => prev.filter((p) => p.id !== payment.id))
    toast(`«${payment.name}» silindi`, {
      action: { label: 'Geri qaytar', onClick: () => setPayments((prev) => [...prev, payment]) },
    })
  }

  const viewDuplicates = (insight: Insight) => {
    setHighlightIds(insight.relatedPaymentIds ?? [])
    document.getElementById('simulator')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  const recognize = (insight: Insight, recognized: boolean) => {
    setInsights((prev) => prev.filter((i) => i.id !== insight.id))
    if (recognized) {
      toast.success('Təşəkkürlər! Bu ödənişi tanınmış kimi qeyd etdik.')
    } else {
      toast.error('Kartını bloklamağı və bankına zəng etməyi tövsiyə edirik.', { duration: 6000 })
    }
  }

  return (
    <>
      <AppHeader onAdd={() => setAddOpen(true)} />
      <main className="mx-auto flex max-w-6xl flex-col gap-10 px-4 py-6 md:gap-12 md:px-6 md:py-10">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-balance md:text-4xl">Salam!</h1>
          <p className="mt-2 max-w-2xl text-lg text-muted-foreground text-pretty">
            Növbəti 30 gündə nə qədər ödəyəcəksən və hansı tarixi qaçırmamalısan?
          </p>
        </div>

        <HeroSummary payments={payments} />
        <RadarSection insights={insights} onViewDuplicates={viewDuplicates} onRecognize={recognize} />

        <section aria-labelledby="overview-heading">
          <h2 id="overview-heading" className="mb-4 text-2xl font-semibold tracking-tight">Xərclərin mənzərəsi</h2>
          <div className="grid gap-4 lg:grid-cols-2">
            <CategoryChart payments={payments} />
            <PaymentCalendar payments={payments} />
          </div>
        </section>

        <PaymentsList
          payments={payments}
          onEdit={setEditing}
          onCancelHelp={setCancelling}
          onDelete={deletePayment}
        />
        <WhatIfSimulator payments={payments} highlightIds={highlightIds} />
        <WeeklySummary payments={payments} />
      </main>

      <AddPaymentDialog open={addOpen} onOpenChange={setAddOpen} onConfirm={addDrafts} />
      <EditPaymentDialog payment={editing} onOpenChange={(o) => !o && setEditing(null)} onSave={savePayment} />
      <CancelAssistantDialog payment={cancelling} onOpenChange={(o) => !o && setCancelling(null)} />
    </>
  )
}
