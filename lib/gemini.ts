const GEMINI_URL =
  'https://generativelanguage.googleapis.com/v1beta/models/gemini-3.8-flash:generateContent'

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
      },
    }),
  })

  if (!res.ok) {
    const responseText = await res.text()
    let providerMessage = responseText.trim()
    try {
      const errorBody = JSON.parse(responseText) as { error?: { message?: unknown } }
      if (typeof errorBody.error?.message === 'string') providerMessage = errorBody.error.message
    } catch {
      // Keep the raw response text when the provider did not return JSON.
    }
    const error = new Error(`Gemini request failed (${res.status}): ${providerMessage || res.statusText}`)
    Object.assign(error, { status: res.status })
    throw error
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
