import { Adset } from '@/lib/types'

export async function getAdsets(campaignId: string): Promise<Adset[]> {
  const apiUrl = `/api/fasty-bot/proxy-get-adsets?campaign_id=${campaignId}`
  try {
    const response = await fetch(apiUrl)

    if (!response.ok) {
      console.error(`HTTP error! status: ${response.status}`)
    }

    const data: Adset[] = await response.json()
    return data
  } catch (error) {
    console.error('Error fetching adsets:', error)
  }
  return []
}
