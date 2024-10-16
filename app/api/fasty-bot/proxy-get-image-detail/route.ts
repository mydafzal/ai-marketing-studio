import { NextResponse } from 'next/server'
import { getImageDetail } from '@/lib/api/fasty-bot/get-image-detail'

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url)
    const image_hash = searchParams.get('image_hash')

    if (!image_hash) {
      return NextResponse.json(
        { error: 'image_hash is required' },
        { status: 400 }
      )
    }

    try {
      const data = await getImageDetail(image_hash)
      return NextResponse.json(data)
    } catch (error) {
      console.error('Error fetching image detail:', error)
      return NextResponse.json(
        { error: 'Failed to fetch image detail' },
        { status: 500 }
      )
    }
}
