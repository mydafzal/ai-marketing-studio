import { NextResponse } from 'next/server'
import OpenAI from 'openai'
import { auth } from '@/auth'
import { getUserDetail } from '@/app/actions'  // or wherever it is

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
})

export async function POST(request: Request) {
  try {
    // 1) Parse incoming JSON
    const body = await request.json()
    const { prompt } = body

    // 2) Attempt to load user session
    const session = await auth()
    let userLang = 'en' // fallback if not logged in or no preference

    if (session?.user) {
      // 3) Retrieve user detail from kv (or DB) 
      const detail = await getUserDetail()
      // if successful => use detail.user.preferred_language
      if (!detail.error && detail.user?.preferred_language) {
        userLang = detail.user.preferred_language
      }
    }

    // 4) Build system + user messages
    const messages = [
      {
        role: 'system',
        content: `The user prefers the language "${userLang}". Always respond in "${userLang}" (avoid other languages).`
      },
      {
        role: 'user',
        content: prompt
      }
    ]

    // 5) Call OpenAI
    const completion = await openai.chat.completions.create({
      messages: messages as OpenAI.Chat.ChatCompletionMessageParam[],
      model: 'gpt-4o',
      temperature: 0.2
    })

    // 6) Return the GPT response
    return NextResponse.json(completion.choices[0].message)

  } catch (error) {
    console.error('Error in AI analysis:', error)
    return NextResponse.json(
      { error: 'Failed to generate analysis' },
      { status: 500 }
    )
  }
}
