const GEMINI_URL =
  'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent'

export type GeminiPart =
  | { text: string }
  | { inline_data: { mime_type: string; data: string } }

export async function generateGeminiJson(parts: GeminiPart[]): Promise<unknown> {
  const key = process.env.GEMINI_API_KEY
  if (!key) {
    throw new Error('GEMINI_API_KEY is missing')
  }

  const res = await fetch(`${GEMINI_URL}?key=${key}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts }],
      generationConfig: {
        responseMimeType: 'application/json',
        temperature: 0.1,
      },
    }),
  })

  if (!res.ok) {
    throw new Error(`Gemini request failed (${res.status})`)
  }

  const data = (await res.json()) as {
    candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>
  }
  const text = data.candidates?.[0]?.content?.parts
    ?.map((p) => p.text ?? '')
    .join('')
    .trim()

  if (!text) {
    throw new Error('Empty Gemini response')
  }

  return JSON.parse(extractJson(text))
}

function extractJson(text: string): string {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i)
  if (fenced?.[1]) return fenced[1].trim()
  const start = text.search(/[{[]/)
  if (start === -1) return text
  return text.slice(start)
}
