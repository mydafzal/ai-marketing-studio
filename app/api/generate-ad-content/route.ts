import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    const { companyInfo, campaignType } = await request.json();

    if (!companyInfo) {
      return NextResponse.json({ error: 'Company information is required' }, { status: 400 });
    }

    const { name, description, segment } = companyInfo;

    let campaignFocus = '';
    switch (campaignType) {
      case 'social':
        campaignFocus = 'social media engagement and brand awareness';
        break;
      case 'product':
        campaignFocus = 'product promotion and sales conversion';
        break;
      case 'branding':
        campaignFocus = 'brand building and trust establishment';
        break;
      default:
        campaignFocus = 'general marketing';
    }

    const prompt = `Create compelling ad copy for ${name}, a ${segment} business. 

Company Description: ${description}

Campaign Focus: ${campaignFocus}

Generate:
1. A short, punchy headline (max 8 words)
2. Ad text that highlights the key value proposition (max 125 characters including spaces)

Requirements:
- Use clear, direct language
- Focus on benefits to the customer
- Include a subtle call to action
- Match the tone appropriate for ${segment} industry
- Do NOT use markdown formatting
- Keep it concise and impactful

Format your response as:
HEADLINE: [headline here]
TEXT: [ad text here]`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: "You are an expert copywriter specializing in creating high-converting ad copy. Always follow the exact format requested and never use markdown formatting."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      max_tokens: 200,
      temperature: 0.7,
    });

    const response = completion.choices[0]?.message?.content;
    
    if (!response) {
      throw new Error('No response from OpenAI');
    }

    // Parse the response
    const lines = response.split('\n').filter(line => line.trim());
    let headline = '';
    let text = '';

    for (const line of lines) {
      if (line.startsWith('HEADLINE:')) {
        headline = line.replace('HEADLINE:', '').trim();
      } else if (line.startsWith('TEXT:')) {
        text = line.replace('TEXT:', '').trim();
      }
    }

    // Fallback parsing if format is different
    if (!headline || !text) {
      const parts = response.split('\n').filter(line => line.trim());
      if (parts.length >= 2) {
        headline = parts[0].replace(/^(HEADLINE:|Headline:)/i, '').trim();
        text = parts[1].replace(/^(TEXT:|Text:)/i, '').trim();
      }
    }

    return NextResponse.json({
      success: true,
      adContent: {
        headline: headline || 'Discover What Makes Us Different',
        text: text || 'Experience quality and service that exceeds expectations. Get started today!'
      }
    });

  } catch (error) {
    console.error('Error generating ad content:', error);
    return NextResponse.json(
      { error: 'Failed to generate ad content' },
      { status: 500 }
    );
  }
} 