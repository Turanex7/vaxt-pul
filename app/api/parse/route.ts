import { generateGeminiJson, type GeminiPart } from '@/lib/gemini'
import { NextResponse } from 'next/server'

function parsePrompt(locale: 'az' | 'en' | 'ru') {
  const language = locale === 'az' ? 'Azərbaycan dili' : locale === 'en' ? 'English' : 'Русский'
  return `You extract all payment records from the supplied text and/or receipt image. Interpret dates and recurrence phrases in any language.
Reply only in ${locale} (${language}) when writing a payment name; preserve the service/company's original name when it is provided.
For each item return only these fields: name (short service/company name), amount (number in AZN), date (next date as YYYY-MM-DD), category, repeat.
Never include amount, date, currency, or extra words in name. Use category keys only: subscriptions, telecom, utilities, loans, insurance, contracts.
Use repeat keys only: weekly, monthly, yearly, once.
Category guidance: gym/rent/membership=contracts; Netflix/Spotify/YouTube=subscriptions; mobile/internet=telecom; electricity/gas/water=utilities; bank/instalment=loans; insurance/inspection=insurance.
The date is the next due date. If recurrence is indicated, choose the next occurrence. If no date is supplied, use today's date.
Return JSON only, with no prose: {"items":[{"name":"","amount":0,"date":"YYYY-MM-DD","category":"contracts","repeat":"monthly"}]}. If nothing is found, return {"items":[]}.`
}

interface ParseBody {
  text?: string
  imageBase64?: string
  mimeType?: string
  locale?: string
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as ParseBody
    const locale = body.locale === 'en' || body.locale === 'ru' ? body.locale : 'az'
    const text = typeof body.text === 'string' ? body.text.trim() : ''
    const imageBase64 =
      typeof body.imageBase64 === 'string' ? body.imageBase64.replace(/^data:[^;]+;base64,/, '') : ''
    const mimeType = typeof body.mimeType === 'string' ? body.mimeType : 'image/jpeg'

    if (!text && !imageBase64) {
      return NextResponse.json({ error: 'text or imageBase64 is required' }, { status: 400 })
    }

    const parts: GeminiPart[] = [{ text: parsePrompt(locale) }]
    if (text) {
      parts.push({ text: `İstifadəçi mətni:\n${text}` })
    }
    if (imageBase64) {
      parts.push({
        inline_data: {
          mime_type: mimeType || 'image/jpeg',
          data: imageBase64,
        },
      })
    }

    const parsed = await generateGeminiJson(parts)
    const items = normalizeItems(parsed)
    return NextResponse.json({ items })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Parse failed'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

function normalizeItems(parsed: unknown): unknown[] {
  if (!parsed || typeof parsed !== 'object') return []
  const items = (parsed as { items?: unknown }).items
  if (!Array.isArray(items)) return []
  return items.map((item) => {
    if (!item || typeof item !== 'object') return item
    const row = item as { id?: unknown }
    return { ...row, id: typeof row.id === 'string' && row.id ? row.id : crypto.randomUUID() }
  })
}
