import { getUserDetail } from '@/app/actions'
import { FbVideo } from '@/lib/types'

export async function getVideoDetail(video_id: string) {
  const fastyEndpoint = process.env.FASTY_API_URL
  const apiUrl = `${fastyEndpoint}/facebook/exec/direct/upload/video-detail?video_id=${video_id}`

  const response = await fetch(apiUrl, {
    headers: {
      Authorization: `Bearer ${process.env.FASTY_API_TOKEN}`
    }
  })

  if (!response.ok) {
    console.error(`HTTP error! status: ${response.status}`)
    throw new Error('Failed to fetch video detail')
  }

  return response.json()
}
