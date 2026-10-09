'use client'

import { Bot, MessageCircle, Send, Trash2, X } from 'lucide-react'
import { useLocale, useTranslations } from 'next-intl'
import { useEffect, useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { useChatData } from './chat-data-context'
import { usePaymentName } from '@/hooks/use-payment-name'

type Role = 'user' | 'assistant'
interface Message { id: number; role: Role; content: string }
type ChatLocale = 'az' | 'en' | 'ru'

export function ChatWidget() {
  const t = useTranslations('chat')
  const locale = useLocale() as ChatLocale
  const { payments, today } = useChatData()
  const paymentName = usePaymentName()
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [draft, setDraft] = useState('')
  const [typing, setTyping] = useState(false)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const messageListRef = useRef<HTMLDivElement>(null)
  const nextId = useRef(0)
  const wasOpen = useRef(false)

  useEffect(() => {
    if (open) {
      inputRef.current?.focus()
      wasOpen.current = true
    } else if (wasOpen.current) {
      triggerRef.current?.focus()
      wasOpen.current = false
    }
  }, [open])

  useEffect(() => {
    if (!open) return
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false)
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [open])

  useEffect(() => {
    if (!open || !messageListRef.current) return
    messageListRef.current.scrollTop = messageListRef.current.scrollHeight
  }, [messages, typing, open])

  const send = async (rawText: string) => {
    const content = rawText.trim()
    if (!content || typing) return
    if (content.length > 500) {
      setMessages((current) => [...current, { id: ++nextId.current, role: 'assistant', content: t('tooLong') }])
      return
    }

    const userMessage: Message = { id: ++nextId.current, role: 'user', content }
    const transcript = [...messages, userMessage]
    setMessages(transcript)
    setDraft('')
    setTyping(true)
    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          locale,
          today,
          payments: payments.map((payment) => ({ name: paymentName(payment), amount: payment.amount, nextDate: payment.nextDate, category: payment.category, repeat: payment.repeat })),
          messages: transcript.map(({ role, content: text }) => ({ role, content: text })),
        }),
      })
      const result = await response.json() as { answer?: unknown; error?: unknown }
      const answer = typeof result.answer === 'string'
        ? result.answer
        : result.error === 'tooLong'
          ? t('tooLong')
          : result.error === 'rateLimit'
            ? t('rateLimit')
            : t('unavailable')
      setMessages((current) => [...current, { id: ++nextId.current, role: 'assistant', content: answer }])
    } catch {
      setMessages((current) => [...current, { id: ++nextId.current, role: 'assistant', content: t('unavailable') }])
    } finally {
      setTyping(false)
    }
  }

  const keepFocusInside = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key !== 'Tab') return
    const controls = event.currentTarget.querySelectorAll<HTMLElement>('button:not(:disabled), textarea:not(:disabled)')
    if (!controls.length) return
    const first = controls[0]
    const last = controls[controls.length - 1]
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault()
      last.focus()
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault()
      first.focus()
    }
  }

  return (
    <>
      {!open && (
        <Button
          ref={triggerRef}
          type="button"
          variant="default"
          size="icon-lg"
          aria-label={t('title')}
          onClick={() => setOpen(true)}
          className="fixed right-5 bottom-5 z-50 size-14 rounded-full bg-primary text-primary-foreground shadow-lg hover:bg-primary/90"
        >
          <MessageCircle className="size-6" aria-hidden="true" />
        </Button>
      )}

      {open && (
        <section
          role="dialog"
          aria-modal="true"
          aria-labelledby="paypulse-chat-title"
          onKeyDown={keepFocusInside}
          className="fixed inset-0 z-50 flex h-[100dvh] flex-col overflow-hidden border border-border bg-background shadow-2xl md:inset-auto md:right-5 md:bottom-5 md:h-[560px] md:w-[380px] md:rounded-2xl"
        >
          <header className="flex shrink-0 items-center justify-between gap-3 border-b border-border px-4 py-3">
            <div className="flex min-w-0 items-center gap-2.5">
              <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground"><Bot className="size-5" aria-hidden="true" /></span>
              <h2 id="paypulse-chat-title" className="truncate font-semibold">{t('title')}</h2>
            </div>
            <div className="flex shrink-0 items-center gap-1">
              <Button type="button" variant="ghost" size="icon-sm" aria-label={t('clearLabel')} title={t('clear')} onClick={() => setMessages([])}>
                <Trash2 className="size-4" aria-hidden="true" />
              </Button>
              <Button type="button" variant="ghost" size="icon-sm" aria-label={t('close')} onClick={() => setOpen(false)}>
                <X className="size-4" aria-hidden="true" />
              </Button>
            </div>
          </header>

          <div ref={messageListRef} className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto p-4" aria-live="polite" aria-relevant="additions text">
            {messages.length === 0 ? (
              <div className="my-auto flex flex-col items-center gap-4 text-center">
                <p className="max-w-xs text-sm text-muted-foreground">{t('empty')}</p>
                <div className="flex w-full flex-col gap-2">
                  <p className="text-xs font-medium text-muted-foreground">{t('suggestionsTitle')}</p>
                  {(['suggestionWeekly', 'suggestionLargest', 'suggestionSubscriptions', 'suggestionMonth'] as const).map((key) => (
                    <Button key={key} type="button" variant="outline" className="h-auto justify-start whitespace-normal text-left" onClick={() => void send(t(key))}>
                      {t(key)}
                    </Button>
                  ))}
                </div>
              </div>
            ) : messages.map((message) => (
              <div key={message.id} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <p className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed whitespace-pre-wrap ${message.role === 'user' ? 'rounded-br-md bg-primary text-primary-foreground' : 'rounded-bl-md bg-muted text-foreground'}`}>
                  {message.content}
                </p>
              </div>
            ))}
            {typing && (
              <div className="flex justify-start">
                <p className="flex items-center gap-2 rounded-2xl rounded-bl-md bg-muted px-3.5 py-2.5 text-sm text-muted-foreground" role="status">
                  <span className="flex gap-1" aria-hidden="true"><i className="size-1.5 animate-bounce rounded-full bg-current [animation-delay:-.2s]" /><i className="size-1.5 animate-bounce rounded-full bg-current [animation-delay:-.1s]" /><i className="size-1.5 animate-bounce rounded-full bg-current" /></span>
                  {t('typing')}
                </p>
              </div>
            )}
          </div>

          <form
            className="flex shrink-0 items-end gap-2 border-t border-border p-3"
            onSubmit={(event) => { event.preventDefault(); void send(draft) }}
          >
            <label className="sr-only" htmlFor="paypulse-chat-input">{t('inputLabel')}</label>
            <Textarea
              ref={inputRef}
              id="paypulse-chat-input"
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' && !event.shiftKey) {
                  event.preventDefault()
                  void send(draft)
                }
              }}
              maxLength={500}
              rows={1}
              placeholder={t('placeholder')}
              className="max-h-28 min-h-11 resize-none rounded-xl text-base md:text-sm"
            />
            <Button type="submit" size="icon" aria-label={t('send')} disabled={!draft.trim() || typing} className="size-11 rounded-xl">
              <Send className="size-4" aria-hidden="true" />
            </Button>
          </form>
        </section>
      )}
    </>
  )
}
