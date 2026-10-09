'use client'

import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import type { Payment } from '@/lib/mock-data'
import { mockPayments } from '@/lib/mock-data'
import { toISO } from '@/lib/format'

interface ChatData {
  payments: Payment[]
  today: string
}

interface ChatDataContextValue extends ChatData {
  updateChatData: (data: ChatData) => void
}

const ChatDataContext = createContext<ChatDataContextValue | null>(null)

export function ChatDataProvider({ children }: { children: React.ReactNode }) {
  const [data, setData] = useState<ChatData>(() => ({ payments: mockPayments, today: '2026-10-09' }))
  const value = useMemo(() => ({ ...data, updateChatData: setData }), [data])
  return <ChatDataContext.Provider value={value}>{children}</ChatDataContext.Provider>
}

export function usePublishChatData(payments: Payment[], today: Date) {
  const context = useContext(ChatDataContext)
  if (!context) throw new Error('usePublishChatData must be used inside ChatDataProvider')
  const { updateChatData } = context
  useEffect(() => {
    updateChatData({ payments, today: toISO(today) })
  }, [updateChatData, payments, today])
}

export function useChatData() {
  const context = useContext(ChatDataContext)
  if (!context) throw new Error('useChatData must be used inside ChatDataProvider')
  return { payments: context.payments, today: context.today }
}
