import { NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { prompt, language = 'en' } = body;

    // We add a system message ensuring GPT responds in the user's preferred language.
    const messages = [
      {
        role: 'system',
        content: `The user prefers the language "${language}". Always respond in "${language}" (avoid other languages).`
      },
      {
        role: 'user',
        content: prompt
      }
    ];
    const completion = await openai.chat.completions.create({
      messages: messages as OpenAI.Chat.ChatCompletionMessageParam[],
      model: 'gpt-4',
      temperature: 0.7,
    });

    return NextResponse.json(completion.choices[0].message);
  } catch (error) {
    console.error('Error in AI analysis:', error);
    return NextResponse.json(
      { error: 'Failed to generate analysis' },
      { status: 500 }
    );
  }
}
