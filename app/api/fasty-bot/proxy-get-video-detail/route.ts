import { NextResponse } from 'next/server'
import { getVideoDetail } from '@/lib/api/fasty-bot/get-video-detail'

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url)
    const video_id = searchParams.get('video_id')

    if (!video_id) {
      return NextResponse.json(
        { error: 'Video ID is required' },
        { status: 400 }
      )
    }

    try {
      const data = await getVideoDetail(video_id)
      return NextResponse.json(data)
    } catch (error) {
      console.error('Error fetching video detail:', error)
      return NextResponse.json(
        { error: 'Failed to fetch video detail' },
        { status: 500 }
      )
    }
}
