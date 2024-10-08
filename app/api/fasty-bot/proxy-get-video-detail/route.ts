import { NextResponse } from 'next/server'

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url)
    const video_id = searchParams.get('video_id')

    if (!video_id) {
      return NextResponse.json(
        { error: 'Video ID is required' },
        { status: 400 }
      )
    }

    const fastyEndpoint = process.env.FASTY_API_URL
    const apiUrl = `${fastyEndpoint}/facebook/exec/direct/upload/video-detail?video_id=${video_id}`

    try {
      const response = await fetch(apiUrl, {
        headers: {
          Authorization: `Bearer ${process.env.FASTY_API_TOKEN}`
        }
      })

      if (!response.ok) {
        console.error(`HTTP error! status: ${response.status}`)
        return NextResponse.json(
          { error: 'Failed to fetch video detail' },
          { status: response.status }
        )
      }

      const data = await response.json()
      return NextResponse.json(data)
    } catch (error) {
      console.error('Error fetching video detail:', error)
      return NextResponse.json(
        { error: 'Failed to fetch video detail' },
        { status: 500 }
      )
    }
}