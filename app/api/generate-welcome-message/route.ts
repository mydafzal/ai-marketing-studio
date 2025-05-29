import { auth } from '@/auth'
import { getUserDetail } from '@/app/actions'
import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY as string,
})

export async function POST(req: NextRequest) {
  try {
    // Verify authentication
    const session = await auth()
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Get user details from session
    const userDetail = await getUserDetail()
    const user = userDetail.user

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Extract company information for the AI message
    const companyName = user.company_name || 'your company'
    const companyDescription = user.company_description || ''
    const companySegment = user.company_segment || ''
    const preferredLanguage = user.preferred_language || 'en'
    const hasBrandColors = user.brand_colors && Array.isArray(user.brand_colors) && user.brand_colors.length > 0
    const hasWebsiteImages = user.website_images && Array.isArray(user.website_images) && user.website_images.length > 0

    // Create a prompt for the OpenAI API to generate a personalized welcome message
    const prompt = `
You are an AI marketing assistant named Reeply. Write a very concise, friendly welcome message to the user who has just completed their profile setup.
The message should:
1. Acknowledge their completion of the profile
2. Mention that you now understand their business and audience
3. Mention that you're ready to help create marketing images for them
4. Suggest that the user can upload 1-4 reference images to better capture their brand style (this is important to include but keep it brief)
5. Include just 1 specific detail from their profile to demonstrate understanding

Company details:
- Company name: ${companyName}
- Company description: ${companyDescription}
- Company segment: ${companySegment}
- Preferred language: ${preferredLanguage}
- Has brand colors extracted: ${hasBrandColors ? 'Yes' : 'No'}
- Has website images: ${hasWebsiteImages ? 'Yes' : 'No'}

Keep the message under 80 words, conversational, and enthusiastic. Be extremely concise.
DO NOT include a greeting at the beginning (like "Hi there!") - just start with the message.
Start with something like "Great — I now have a basic understanding of your business and target audience."
`

    // Generate message using OpenAI
    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: "You are Reeply, an AI marketing assistant that creates personalized marketing content." },
        { role: "user", content: prompt }
      ],
      max_tokens: 250,
      temperature: 0.4,
    })

    // Extract and return the generated message
    const aiMessage = completion.choices[0].message.content || "Great — I now have a basic understanding of your product and target audience. Let me create some images for you!"

    // Return the message along with some company details for the frontend
    return NextResponse.json({
      message: aiMessage,
      companyInfo: {
        name: companyName,
        description: companyDescription,
        segment: companySegment,
        brandColors: user.brand_colors || [],
        websiteImages: user.website_images || []
      }
    })
  } catch (error) {
    console.error('Error generating welcome message:', error)
    return NextResponse.json(
      { error: 'Failed to generate welcome message' },
      { status: 500 }
    )
  }
}