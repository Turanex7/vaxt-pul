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
    const language = locale === 'en' ? 'English' : locale === 'ru' ? 'Russian' : 'Azerbaijani'

    if (!name || !Number.isFinite(amount)) {
      return NextResponse.json({ error: 'name and amount are required' }, { status: 400 })
    }

    const prompt = `You are an assistant helping users cancel payments and subscriptions. Respond only in ${language}.

Ödəniş:
- ad: ${name}
- məbləğ: ${amount} AZN
- kateqoriya: ${category || 'naməlum'}

Give concise, clear instructions. Return JSON only:
{
  "steps": ["3 və ya 4 qısa addım"],
  "letter": "qısa rəsmi ləğv məktubu"
}

The steps array must contain 3 or 4 short sentences. The letter should be a brief formal message. Use natural placeholders appropriate for ${language}.`

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
