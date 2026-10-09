import { generateGeminiJson } from '@/lib/gemini'
import { NextResponse } from 'next/server'

interface CancelBody {
  name?: string
  amount?: number
  category?: string
  locale?: string
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as CancelBody
    const name = typeof body.name === 'string' ? body.name.trim() : ''
    const category = typeof body.category === 'string' ? body.category.trim() : ''
    const amount = typeof body.amount === 'number' ? body.amount : Number(body.amount)
    const locale = body.locale === 'en' || body.locale === 'ru' ? body.locale : 'az'

    if (!name || !Number.isFinite(amount)) {
      return NextResponse.json({ error: 'name and amount are required' }, { status: 400 })
    }

    const prompt = `You are a helpful assistant for canceling a payment or subscription.
Reply only in ${locale} (az: Azərbaycan dili, en: English, ru: Русский).
Use only the supplied name, amount, and localized category. Do not invent provider-specific steps or policies.
Name: ${name}
Amount: ${amount} AZN
Category: ${category || 'unknown'}
Return JSON only:
{
  "steps": ["3 or 4 short steps"],
  "letter": "a brief formal cancellation message"
}
The steps array must contain 3 or 4 short sentences. The letter should be brief and formal. Use natural placeholders for the selected language.`

    const parsed = await generateGeminiJson([{ text: prompt }])
    const result = normalizeCancel(parsed)
    if (!result) {
      return NextResponse.json({ error: 'Invalid Gemini cancel response' }, { status: 502 })
    }
    return NextResponse.json(result)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Cancel help failed'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

function normalizeCancel(parsed: unknown): { steps: string[]; letter: string } | null {
  if (!parsed || typeof parsed !== 'object') return null
  const { steps, letter } = parsed as { steps?: unknown; letter?: unknown }
  if (!Array.isArray(steps) || typeof letter !== 'string' || !letter.trim()) return null
  const cleanSteps = steps.map((s) => String(s).trim()).filter(Boolean).slice(0, 4)
  if (cleanSteps.length < 3) return null
  return { steps: cleanSteps, letter: letter.trim() }
}
