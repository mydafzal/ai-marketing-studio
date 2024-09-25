import { getUserDetail } from '@/app/actions'
import { Adset } from '@/lib/types'

export async function createAdset(
  campaignId: string,
  adset: any
): Promise<Adset | boolean> {
  try {
    const apiCreateUrl = `/api/fasty-bot/proxy-create-adset`
    const userDetail = await getUserDetail()

    const dataSubmit = {
      campaign_id: campaignId,
      adset,
      fbAccountId: userDetail?.user?.fbAccountId || '0'
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
      console.error('Error create adset:', {
        status: response.status,
        statusText: response.statusText
      })
      return false
    }
    const data: Adset = await response.json()
    return data
  } catch (error) {
    console.error('Error create adset:', error)
    return false
  }
}
