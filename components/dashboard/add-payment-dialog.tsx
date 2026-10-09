'use client'

import { ArrowLeft, ImageUp, Loader2, MessageSquareText, Sparkles, Trash2, Zap } from 'lucide-react'
import { useId, useState } from 'react'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Textarea } from '@/components/ui/textarea'
import { getLastAiStatus, parseQuick, parseReceipt, parseText } from '@/lib/api'
import type { PaymentDraft } from '@/lib/mock-data'
import { cn } from '@/lib/utils'
import { DraftFields, isDraftValid } from './draft-fields'

interface AddPaymentDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: (drafts: PaymentDraft[]) => void
}

export function AddPaymentDialog({ open, onOpenChange, onConfirm }: AddPaymentDialogProps) {
  const t = useTranslations('addDialog')
  const [drafts, setDrafts] = useState<PaymentDraft[] | null>(null)
  const [loading, setLoading] = useState(false)
  const [usedFallback, setUsedFallback] = useState(false)
  const [tab, setTab] = useState('sms')

  const reset = () => {
    setDrafts(null)
    setLoading(false)
    setUsedFallback(false)
  }

  const run = async (task: () => Promise<PaymentDraft[]>) => {
    setLoading(true)
    setUsedFallback(false)
    try {
      setDrafts(await task())
      setUsedFallback(getLastAiStatus() === 'fallback')
    } finally {
      setLoading(false)
    }
  }

  const handleOpenChange = (next: boolean) => {
    onOpenChange(next)
    if (!next) reset()
  }

  const confirm = () => {
    if (!drafts) return
    onConfirm(drafts)
    handleOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-h-[92dvh] gap-5 overflow-y-auto rounded-2xl p-5 text-base sm:max-w-2xl md:p-6">
        <DialogHeader>
          <DialogTitle className="text-2xl font-semibold">
            {drafts ? t('reviewTitle') : t('addTitle')}
          </DialogTitle>
          <DialogDescription className="text-base">
            {drafts
              ? t('reviewDescription')
              : t('description')}
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <LoadingDrafts />
        ) : drafts ? (
          <>
            {usedFallback && <FallbackNotice />}
            <DraftReview drafts={drafts} onChange={setDrafts} onBack={() => setDrafts(null)} onConfirm={confirm} />
          </>
        ) : (
          <Tabs value={tab} onValueChange={(v) => setTab(String(v))}>
            <TabsList className="grid h-auto w-full grid-cols-3 rounded-xl p-1">
              <TabsTrigger value="sms" className="h-auto flex-col gap-1 rounded-lg py-2 text-sm sm:flex-row sm:text-base">
                <MessageSquareText aria-hidden="true" />
                <span className="text-center whitespace-normal">{t('tabSms')}</span>
              </TabsTrigger>
              <TabsTrigger value="receipt" className="h-auto flex-col gap-1 rounded-lg py-2 text-sm sm:flex-row sm:text-base">
                <ImageUp aria-hidden="true" />
                <span className="text-center whitespace-normal">{t('tabReceipt')}</span>
              </TabsTrigger>
              <TabsTrigger value="quick" className="h-auto flex-col gap-1 rounded-lg py-2 text-sm sm:flex-row sm:text-base">
                <Zap aria-hidden="true" />
                <span className="text-center whitespace-normal">{t('tabQuick')}</span>
              </TabsTrigger>
            </TabsList>
            <TabsContent value="sms" className="pt-4">
              <SmsTab onSubmit={(text) => run(() => parseText(text))} />
            </TabsContent>
            <TabsContent value="receipt" className="pt-4">
              <ReceiptTab onSubmit={(file) => run(() => parseReceipt(file))} />
            </TabsContent>
            <TabsContent value="quick" className="pt-4">
              <QuickTab onSubmit={(text) => run(() => parseQuick(text))} />
            </TabsContent>
          </Tabs>
        )}
      </DialogContent>
    </Dialog>
  )
}

function FallbackNotice() {
  const t = useTranslations('addDialog')
  return (
    <p role="status" className="rounded-xl bg-warning-soft px-3 py-2 text-sm text-warning">
      {t('fallback')}
    </p>
  )
}

function SmsTab({ onSubmit }: { onSubmit: (text: string) => void }) {
  const t = useTranslations('addDialog')
  const [text, setText] = useState('')
  const id = useId()
  return (
    <form
      className="flex flex-col gap-3"
      onSubmit={(e) => {
        e.preventDefault()
        if (text.trim()) onSubmit(text)
      }}
    >
      <Label htmlFor={id} className="text-base">{t('smsLabel')}</Label>
      <Textarea
        id={id}
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={7}
        className="min-h-40 rounded-xl text-base md:text-base"
        placeholder={t('smsPlaceholder')}
      />
      <Button type="submit" size="lg" disabled={!text.trim()} className="self-end">
        <Sparkles data-icon="inline-start" aria-hidden="true" />
        {t('recognize')}
      </Button>
    </form>
  )
}

function ReceiptTab({ onSubmit }: { onSubmit: (file: File) => void }) {
  const t = useTranslations('addDialog')
  const [file, setFile] = useState<File | null>(null)
  const [dragging, setDragging] = useState(false)
  const id = useId()

  const accept = (f: File | undefined) => {
    if (f && f.type.startsWith('image/')) setFile(f)
  }

  return (
    <div className="flex flex-col gap-3">
      <label
        htmlFor={id}
        onDragOver={(e) => {
          e.preventDefault()
          setDragging(true)
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault()
          setDragging(false)
          accept(e.dataTransfer.files[0])
        }}
        className={cn(
          'flex min-h-48 cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed p-6 text-center transition-colors focus-within:ring-3 focus-within:ring-ring/50',
          dragging ? 'border-primary bg-secondary' : 'border-input hover:bg-muted',
        )}
      >
        <ImageUp className="size-10 text-primary" aria-hidden="true" />
        {file ? (
          <>
            <span className="font-semibold">{file.name}</span>
            <span className="text-sm text-muted-foreground">{t('fileChange')}</span>
          </>
        ) : (
          <>
            <span className="font-semibold">{t('dropReceipt')}</span>
            <span className="text-muted-foreground">{t('orChoose')}</span>
          </>
        )}
        <input id={id} type="file" accept="image/*" className="sr-only" onChange={(e) => accept(e.target.files?.[0])} />
      </label>
      <Button size="lg" disabled={!file} className="self-end" onClick={() => file && onSubmit(file)}>
        <Sparkles data-icon="inline-start" aria-hidden="true" />
        {t('readReceipt')}
      </Button>
    </div>
  )
}

function QuickTab({ onSubmit }: { onSubmit: (text: string) => void }) {
  const t = useTranslations('addDialog')
  const [text, setText] = useState('')
  const id = useId()
  return (
    <form
      className="flex flex-col gap-3"
      onSubmit={(e) => {
        e.preventDefault()
        if (text.trim()) onSubmit(text)
      }}
    >
      <Label htmlFor={id} className="text-base">{t('quickLabel')}</Label>
      <Input
        id={id}
        value={text}
        onChange={(e) => setText(e.target.value)}
        className="h-12 rounded-xl text-base md:text-base"
        placeholder={t('quickPlaceholder')}
      />
      <Button type="submit" size="lg" disabled={!text.trim()} className="self-end">
        <Sparkles data-icon="inline-start" aria-hidden="true" />
        {t('quickSubmit')}
      </Button>
    </form>
  )
}

function LoadingDrafts() {
  const t = useTranslations('addDialog')
  return (
    <div className="flex flex-col gap-4" aria-busy="true">
      <p className="flex items-center gap-2 font-medium text-primary" role="status">
        <Loader2 className="size-5 animate-spin" aria-hidden="true" />
        {t('loading')}
      </p>
      {[0, 1].map((i) => (
        <div key={i} className="flex flex-col gap-3 rounded-2xl border border-border p-4">
          <Skeleton className="h-11 w-full rounded-xl" />
          <div className="grid gap-3 sm:grid-cols-2">
            <Skeleton className="h-11 rounded-xl" />
            <Skeleton className="h-11 rounded-xl" />
          </div>
        </div>
      ))}
    </div>
  )
}

function DraftReview({
  drafts,
  onChange,
  onBack,
  onConfirm,
}: {
  drafts: PaymentDraft[]
  onChange: (drafts: PaymentDraft[]) => void
  onBack: () => void
  onConfirm: () => void
}) {
  const t = useTranslations('addDialog')
  const common = useTranslations('common')
  const prefix = useId()
  const allValid = drafts.length > 0 && drafts.every(isDraftValid)

  return (
    <div className="flex flex-col gap-4">
      {drafts.length === 0 ? (
        <p className="rounded-2xl bg-muted p-6 text-center text-muted-foreground">
          {t('noneFound')}
        </p>
      ) : (
        <ol className="flex flex-col gap-3">
          {drafts.map((draft, i) => (
            <li key={i} className="rounded-2xl border border-border p-4">
              <div className="mb-3 flex items-center justify-between">
                <span className="font-semibold">{t('paymentNumber', { number: i + 1 })}</span>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-destructive hover:text-destructive"
                  onClick={() => onChange(drafts.filter((_, j) => j !== i))}
                >
                  <Trash2 data-icon="inline-start" aria-hidden="true" />
                  {t('remove')}
                </Button>
              </div>
              <DraftFields
                idPrefix={`${prefix}-${i}`}
                draft={draft}
                onChange={(next) => onChange(drafts.map((d, j) => (j === i ? next : d)))}
              />
            </li>
          ))}
        </ol>
      )}
      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-between">
        <Button variant="outline" size="lg" onClick={onBack}>
          <ArrowLeft data-icon="inline-start" aria-hidden="true" />
          {common('back')}
        </Button>
        <Button size="lg" disabled={!allValid} onClick={onConfirm}>
          {drafts.length > 1 ? t('confirmCount', { count: drafts.length }) : common('confirm')}
        </Button>
      </div>
    </div>
  )
}
