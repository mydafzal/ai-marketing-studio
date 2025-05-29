import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { generateImageVariation } from '@/app/actions/generate-image'
import { AspectRatio } from '@/app/actions/generate-image'

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

    // Parse request
    const data = await req.json()
    const { prompt, referenceImages, aspectRatio } = data

    // Validate input
    if (!prompt) {
      return NextResponse.json({ error: 'Prompt is required' }, { status: 400 })
    }
    
    if (!referenceImages || !Array.isArray(referenceImages) || referenceImages.length === 0) {
      return NextResponse.json({ error: 'At least one reference image is required' }, { status: 400 })
    }

    // Call the generateImageVariation function
    const result = await generateImageVariation(
      referenceImages,
      aspectRatio as AspectRatio || '1:1',
      1,
      prompt
    )

    // Return the result
    return NextResponse.json(result)
  } catch (error) {
    console.error('Error generating image variation:', error)
    return NextResponse.json(
      { error: 'Failed to generate image variation', success: false },
      { status: 500 }
    )
  }
}