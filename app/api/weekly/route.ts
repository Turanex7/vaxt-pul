import { generateGeminiJson } from '@/lib/gemini'
import { NextResponse } from 'next/server'

interface WeeklyStats {
  count: number
  total: number
  deadlineCount: number
  biggestPayment: { name: string; amount: number } | null
  nearestDeadline: { name: string; daysLeft: number } | null
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { stats?: Partial<WeeklyStats> }
    const stats = body.stats
    if (
      !stats ||
      !Number.isFinite(stats.count) ||
      !Number.isFinite(stats.total) ||
      !Number.isFinite(stats.deadlineCount)
    ) {
      return NextResponse.json({ error: 'Valid weekly stats are required' }, { status: 400 })
    }

    const prompt = `Sən şəxsi maliyyə köməkçisisən. Aşağıdakı hazır rəqəm və adları istifadə edib Azərbaycan dilində qısa həftəlik xülasə yaz.

Vacib qaydalar:
- Heç bir say, cəm, gün fərqi və ya məbləği özün hesablamamalısan.
- Yalnız verilən stats obyektindəki faktlardan istifadə et; yeni rəqəm və ödəniş uydurma.
- title qısa olsun, məsələn: "Növbəti 7 gündə 5 ödəniş, 1 son tarix var."
- body 1–2 cümləlik praktik tövsiyə olsun.
- YALNIZ bu JSON formatında cavab ver: {"title":"...","body":"..."}

Verilmiş stats (toxunmadan istifadə et):
${JSON.stringify(stats)}`

    const result = await generateGeminiJson([{ text: prompt }])
    if (!result || typeof result !== 'object') {
      return NextResponse.json({ error: 'Invalid weekly summary response' }, { status: 502 })
    }
    const { title, body: summaryBody } = result as { title?: unknown; body?: unknown }
    if (typeof title !== 'string' || !title.trim() || typeof summaryBody !== 'string' || !summaryBody.trim()) {
      return NextResponse.json({ error: 'Invalid weekly summary response' }, { status: 502 })
    }
    return NextResponse.json({ title: title.trim(), body: summaryBody.trim() })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Weekly summary failed'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
