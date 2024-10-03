import { Adset } from '@/lib/types'

export async function getAdset(adsetId: string): Promise<Adset | false> {
  const apiUrl = `/api/fasty-bot/proxy-get-adset?adset_id=${adsetId}`
  try {
    const response = await fetch(apiUrl)

    if (!response.ok) {
      console.error(`HTTP error! status: ${response.status}`)
    }

    const data: Adset = await response.json()
    return data
  } catch (error) {
    console.error('Error fetching adsets:', error)
  }
  return false
}
