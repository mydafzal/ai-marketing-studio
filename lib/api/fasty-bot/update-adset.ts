import { Adset } from '@/lib/types'

export async function updateAdset(
  adsetId: string,
  adset: any
): Promise<Adset | boolean> {
  try {
    const apiCreateUrl = `/api/fasty-bot/proxy-update-adset`
    const dataSubmit = {
      adset_id: adsetId,
      adset
    }
    const response = await fetch(apiCreateUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.FASTY_API_TOKEN}`
      },
      body: JSON.stringify(dataSubmit)
    })
    // Handle the response
    if (!response.ok) {
      console.error('Error update adset:', {
        status: response.status,
        statusText: response.statusText
      })
      return false
    }
    const data: Adset = await response.json()
    return data
  } catch (error) {
    console.error('Error update adset:', error)
    return false
  }
}
