import { getUserDetail } from '@/app/actions'
import { FbVideo } from '@/lib/types'

export async function getVideoDetail(
  video_id: string
): Promise<FbVideo | false> {
  const apiUrl = `/api/fasty-bot/proxy-get-video-detail?video_id=${video_id}`

  try {
    const response = await fetch(apiUrl)

    if (!response.ok) {
      console.error(`HTTP error! status: ${response.status}`)
    }

    const data: FbVideo = await response.json()
    return data
  } catch (error) {
    console.error('Error fetching campaigns:', error)
  }
  return false
}
