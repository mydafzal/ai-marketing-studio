import { NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { prompt } = body;

    const completion = await openai.chat.completions.create({
      messages: [{ 
        role: "user", 
        content: prompt 
      }],
      model: "gpt-4-turbo-preview",
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