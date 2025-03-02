import { AdCreative } from '@/lib/types'
import { getUserDetail } from '@/app/actions'

interface AdCreativeCreateRequest extends AdCreative {
    fb_account_id: string
}

export async function createAdCreative(
  payload: AdCreative
): Promise<any> {
  try {
    const fastyEndpoint = process.env.FASTY_API_URL
    const apiUrl = `${fastyEndpoint}/facebook/exec/direct/ads/create-adcreative`
    console.log('payload to create a new adcreative', payload)
    const userDetail = await getUserDetail();

    const data: AdCreativeCreateRequest = {
        ...payload,
        fb_account_id: userDetail?.user?.fbAccountId || '0',
    }
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.FASTY_API_TOKEN}`
      },
      body: JSON.stringify(data)
    })

    return response
  } catch (error) {
    console.error('Error create adcreative:', error)
    return false
  }
}
