import { generateGeminiJson, type GeminiPart } from '@/lib/gemini'
import { NextResponse } from 'next/server'

const PARSE_PROMPT = `Sən ödəniş çıxarışı köməkçisisən. Verilən mətndən və/və ya qəbz şəklindən BÜTÜN ödənişləri çıxar.

Hər ödəniş üçün yalnız bu sahələri doldur:
- name: YALNIZ xidmətin və ya şirkətin qısa adı (məs. "Sport Life Gym", "Netflix", "Avtomobil sığortası"). Məbləğ, tarix, valyuta (AZN, ₼, manat) və artıq sözlər name-ə DAXİL OLMASIN.
- amount: məbləğ, yalnız rəqəm, AZN
- date: növbəti ödəniş tarixi, mütləq YYYY-MM-DD. Mətndəki tarix adətən ödənişin edildiyi gündür; təkrarlanan ödənişlər üçün növbəti ödəniş tarixini hesabla. Tarix yoxdursa bu günün tarixindən təxmin et.
- category: YALNIZ bunlardan biri: "Abunələr", "Telekom", "Kommunal", "Kredit", "Sığorta və sənədlər", "Müqavilələr"
- repeat: YALNIZ bunlardan biri: "aylıq", "illik", "birdəfəlik"

Kateqoriya qaydaları:
- Müqavilələr: idman zalı, gym, kirayə, üzvlük
- Abunələr: Netflix, Spotify, YouTube
- Telekom: Azercell, internet, mobil tarif
- Kommunal: işıq, qaz, su
- Kredit: bank krediti, taksit
- Sığorta və sənədlər: sığorta, texniki baxış

Nümunə:
Mətn: "Sport Life Gym 60azn 9 oktyabr 2026"
Cavab: {"items":[{"name":"Sport Life Gym","amount":60,"date":"2026-10-09","category":"Müqavilələr","repeat":"aylıq"}]}

Cavabı YALNIZ JSON obyekti kimi ver, başqa mətn yox:
{ "items": [ { "name": "", "amount": 0, "date": "YYYY-MM-DD", "category": "", "repeat": "" } ] }

Ödəniş tapılmasa: { "items": [] }`

interface ParseBody {
  text?: string
  imageBase64?: string
  mimeType?: string
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as ParseBody
    const text = typeof body.text === 'string' ? body.text.trim() : ''
    const imageBase64 =
      typeof body.imageBase64 === 'string' ? body.imageBase64.replace(/^data:[^;]+;base64,/, '') : ''
    const mimeType = typeof body.mimeType === 'string' ? body.mimeType : 'image/jpeg'

    if (!text && !imageBase64) {
      return NextResponse.json({ error: 'text or imageBase64 is required' }, { status: 400 })
    }

    const parts: GeminiPart[] = [{ text: PARSE_PROMPT }]
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
