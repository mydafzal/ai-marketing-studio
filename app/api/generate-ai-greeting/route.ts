import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'
import { auth } from '@/auth'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export async function POST(request: NextRequest) {
  try {
    // Verify authentication
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { firstName, timeOfDay, userDetails } = body

    // Determine time period
    let timePeriod = 'morning'
    if (timeOfDay >= 12 && timeOfDay < 17) {
      timePeriod = 'afternoon'
    } else if (timeOfDay >= 17) {
      timePeriod = 'evening'
    }

    // Build user context for more personalized greeting
    let userContext = ''
    if (userDetails?.company_name) {
      userContext += `They work at ${userDetails.company_name}. `
    }
    if (userDetails?.company_segment) {
      userContext += `Their business is in the ${userDetails.company_segment} industry. `
    }

    // Create the prompt for OpenAI
    const prompt = `You are a friendly AI marketing assistant. Generate a warm, personalized greeting for ${firstName} who is visiting their marketing dashboard in the ${timePeriod}. 

${userContext}

The greeting should be:
- Welcoming and enthusiastic but professional
- Reference the time of day naturally
- Be marketing/business focused
- 1-2 sentences maximum
- Vary in tone and content (don't be repetitive)
- Sometimes include motivation about marketing success
- Sometimes mention specific marketing activities like campaigns, analytics, or creativity

Examples of good greetings:
- "Good morning, ${firstName}! Ready to turn those marketing ideas into successful campaigns today?"
- "Welcome back, ${firstName}! Your analytics are looking great - let's build on that momentum this ${timePeriod}!"
- "Hey ${firstName}! Perfect timing this ${timePeriod} to review your campaign performance and plan your next big win!"

Generate a fresh, unique greeting now:`

    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content: 'You are a helpful AI marketing assistant that creates personalized, friendly greetings for users visiting their marketing dashboard.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      max_tokens: 100,
      temperature: 0.8, // Higher temperature for more varied responses
    })

    const greeting = completion.choices[0]?.message?.content?.trim()

    if (!greeting) {
      throw new Error('No greeting generated')
    }

    return NextResponse.json({ 
      success: true,
      greeting: greeting 
    })

  } catch (error) {
    console.error('Error generating AI greeting:', error)
    
    // Return a fallback greeting on error
    const { firstName, timeOfDay } = await request.json().catch(() => ({ firstName: 'there', timeOfDay: 12 }))
    
    let fallbackGreeting = `Good morning, ${firstName}! Welcome back!`
    if (timeOfDay >= 12 && timeOfDay < 17) {
      fallbackGreeting = `Good afternoon, ${firstName}! Ready to create some amazing campaigns?`
    } else if (timeOfDay >= 17) {
      fallbackGreeting = `Good evening, ${firstName}! Let's make your marketing shine!`
    }

    return NextResponse.json({ 
      success: false,
      greeting: fallbackGreeting 
    })
  }
} 