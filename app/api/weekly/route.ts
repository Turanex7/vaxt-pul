import { generateGeminiJson } from '@/lib/gemini'
import { formatAmount } from '@/lib/format'
import { NextResponse } from 'next/server'

interface WeeklyStats {
  count: number
  total: number
  deadlineCount: number
  biggestPayment: { name: string; amount: number } | null
  nearestDeadline: { name: string; daysLeft: number } | null
}

export async function POST(request: Request) {
  let locale: 'az' | 'en' | 'ru' = 'az'
  let stats: Partial<WeeklyStats> | undefined
  try {
    const body = (await request.json()) as { stats?: Partial<WeeklyStats>; locale?: string }
    locale = body.locale === 'en' || body.locale === 'ru' ? body.locale : 'az'
    stats = body.stats
    if (
      !stats ||
      !Number.isFinite(stats.count) ||
      !Number.isFinite(stats.total) ||
      !Number.isFinite(stats.deadlineCount)
    ) {
      return NextResponse.json({ error: 'Valid weekly stats are required' }, { status: 400 })
    }

    const language = locale === 'en' ? 'English' : locale === 'ru' ? 'Russian' : 'Azerbaijani'
    const example = locale === 'en' ? 'Next 7 days: 5 payments, 1 deadline.' : locale === 'ru' ? 'Следующие 7 дней: платежей — 5, сроков — 1.' : 'Növbəti 7 gündə 5 ödəniş, 1 son tarix var.'
    const prompt = `You are a personal finance assistant. Write a concise weekly summary in ${language}, using the supplied names and figures.

Vacib qaydalar:
- Heç bir say, cəm, gün fərqi və ya məbləği özün hesablamamalısan.
- Yalnız verilən stats obyektindəki faktlardan istifadə et; yeni rəqəm və ödəniş uydurma.
- title qısa olsun, məsələn: "${example}"
- body 1–2 cümləlik praktik tövsiyə olsun, yalnız ${language} dilində.
- YALNIZ bu JSON formatında cavab ver: {"title":"...","body":"..."}

Verilmiş stats (toxunmadan istifadə et):
${JSON.stringify(stats)}`

    const result = await generateGeminiJson([{ text: prompt }])
    if (!result || typeof result !== 'object') {
      throw new Error('Invalid weekly summary response')
    }
    const { title, body: summaryBody } = result as { title?: unknown; body?: unknown }
    if (typeof title !== 'string' || !title.trim() || typeof summaryBody !== 'string' || !summaryBody.trim()) {
      throw new Error('Invalid weekly summary response')
    }
    return NextResponse.json({ title: title.trim(), body: summaryBody.trim() })
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    const status = error && typeof error === 'object' && 'status' in error
      ? Number((error as { status?: unknown }).status) || null
      : Number(message.match(/\b(?:failed|error)\s*\(?([45]\d\d)\)?/i)?.[1]) || null
    const key = process.env.GEMINI_API_KEY
    console.error('[api/weekly] Gemini request failed', {
      status,
      message: key ? message.split(key).join('[redacted]') : message,
    })
    if (!stats || !Number.isFinite(stats.count) || !Number.isFinite(stats.total) || !Number.isFinite(stats.deadlineCount)) {
      return NextResponse.json({ error: message }, { status: 400 })
    }
    const summary = buildFallback(stats as WeeklyStats, locale)
    return NextResponse.json(summary, { status: 200 })
  }
}

function buildFallback(stats: WeeklyStats, locale: 'az' | 'en' | 'ru') {
  const paymentCount = plural(stats.count, locale, 'payment')
  const deadlineCount = plural(stats.deadlineCount, locale, 'deadline')
  const title = locale === 'en'
    ? `Next 7 days: ${paymentCount}, ${deadlineCount}.`
    : locale === 'ru'
      ? `Следующие 7 дней: ${paymentCount}, ${deadlineCount}.`
      : `Növbəti 7 gündə ${paymentCount}, ${deadlineCount} var.`
  const amount = formatAmount(stats.total, locale)
  const biggest = stats.biggestPayment
  const deadline = stats.nearestDeadline
  let body: string
  if (locale === 'en') {
    body = biggest
      ? `Set aside ${amount} for the next 7 days. The largest payment is ${biggest.name} (${formatAmount(biggest.amount, locale)})${deadline ? `; ${deadline.name} is due in ${deadline.daysLeft} ${deadline.daysLeft === 1 ? 'day' : 'days'}` : ''}.`
      : 'No payments are due in the next 7 days. Enjoy a lighter week.'
  } else if (locale === 'ru') {
    body = biggest
      ? `Запланируйте ${amount} на следующие 7 дней. Самый крупный платёж — ${biggest.name} (${formatAmount(biggest.amount, locale)})${deadline ? `; до срока «${deadline.name}» осталось ${deadline.daysLeft} ${russianDays(deadline.daysLeft)}` : ''}.`
      : 'В следующие 7 дней платежей нет. Наслаждайтесь спокойной неделей.'
  } else {
    body = biggest
      ? `Növbəti 7 gün üçün ${amount} məbləğini nəzərdə saxla. Ən böyük ödəniş ${biggest.name} üçündür (${formatAmount(biggest.amount, locale)})${deadline ? `, ${deadline.name} üçün isə ${deadline.daysLeft} gün qalıb` : ''}.`
      : 'Növbəti 7 gündə ödəniş yoxdur. Rahat həftədən yararlan.'
  }
  return { title, body }
}

function plural(count: number, locale: 'az' | 'en' | 'ru', type: 'payment' | 'deadline') {
  if (locale === 'az') return type === 'payment' ? `${count} ödəniş` : `${count} son tarix`
  if (locale === 'en') {
    const singular = count === 1
    return `${count} ${type === 'payment' ? singular ? 'payment' : 'payments' : singular ? 'deadline' : 'deadlines'}`
  }
  const mod10 = Math.abs(count) % 10
  const mod100 = Math.abs(count) % 100
  const form = mod10 === 1 && mod100 !== 11 ? 'one' : mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14) ? 'few' : 'many'
  if (type === 'payment') return `${count} ${form === 'one' ? 'платёж' : form === 'few' ? 'платежа' : 'платежей'}`
  return `${count} ${form === 'one' ? 'срок' : form === 'few' ? 'срока' : 'сроков'}`
}

function russianDays(value: number) {
  const n = Math.abs(value)
  const mod10 = n % 10
  const mod100 = n % 100
  if (mod10 === 1 && mod100 !== 11) return 'день'
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return 'дня'
  return 'дней'
}
