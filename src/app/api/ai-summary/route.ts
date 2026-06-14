import { NextRequest, NextResponse } from 'next/server'

const MODELS: Record<string, string> = {
  'gemini-flash':   'gemini-1.5-flash',
  'gemini-pro':     'gemini-1.5-pro',
  'gemini-flash-2': 'gemini-2.0-flash',
}

export async function POST(req: NextRequest) {
  try {
    const { question, context, model = 'gemini-flash' } = await req.json()
    const apiKey = process.env.GOOGLE_AI_API_KEY
    if (!apiKey) return NextResponse.json({ error: 'API key tidak ditemukan' }, { status: 500 })

    const modelId = MODELS[model] ?? MODELS['gemini-flash']
    const systemPrompt = `Kamu adalah AI Asisten Kecerdasan Tim Alexandria — sebuah lembaga pendidikan.
Kamu membantu tim marketing (staff, manager, head manager) menganalisis performa dan memberikan rekomendasi strategis.
Gunakan bahasa Indonesia yang profesional namun ramah.
Berikan insight yang actionable dan spesifik berdasarkan data yang diberikan.
Format jawaban dengapoin-poin yang jelas. Gunakan emoji untuk memudahkan pembacaan.`

    const userMessage = context
      ? `Data performa tim saat ini:\n${context}\n\nPertanyaan: ${question}`
      : question

    const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelId}:generateContent?key=${apiKey}`
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        system_instruction: { parts: [{ text: systemPrompt }] },
        contents: [{ parts: [{ text: userMessage }] }],
        generationConfig: { temperature: 0.7, maxOutputTokens: 1500, topP: 0.9 },
      }),
    })

    if (!res.ok) {
      const err = await res.json()
      return NextResponse.json({ error: err.error?.message ?? 'Gemini error' }, { status: res.status })
    }

    const data = await res.json()
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text ?? 'Tidak ada respons dari AI.'
    return NextResponse.json({ text, model: modelId })
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Unknown error'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
