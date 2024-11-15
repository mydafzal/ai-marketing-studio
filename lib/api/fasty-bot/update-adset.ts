import { Adset } from '@/lib/types'
import { getFbMarketingApiKey } from '@/app/actions';

interface UpdateAdsetResponseProp {
  success: boolean
  data: Adset | any
}
export async function updateAdset(
  adsetId: string,
  adset: any
): Promise<UpdateAdsetResponseProp> {
  try {
    const fastyEndpoint = process.env.FASTY_API_URL
    const apiUrl = `${fastyEndpoint}/facebook/exec/direct/ads/update-adset`

    const dataSubmit = {
      adset_id: adsetId,
      adset
    }

    const token_resp = await getFbMarketingApiKey()
    let token=""
    if(token_resp.success && token_resp.token){
        token=token_resp.token
    }
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.FASTY_API_TOKEN}`,
        'fb-api-key': token

      },
      body: JSON.stringify(dataSubmit)
    })
    // Handle the response
    if (!response.ok) {
      const errorData = await response.json()
      console.error('Error update adset:', {
        status: response.status,
        statusText: response.statusText,
        data: JSON.stringify(errorData)
      })
      return { success: false, data: errorData }
    }
    const data: Adset = await response.json()
    return { success: true, data }
  } catch (error) {
    console.error('Error update adset:', error)
    return { success: false, data: {} }
  }
}
