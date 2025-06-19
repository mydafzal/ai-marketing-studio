import { AdCreative } from '@/lib/types'
import { getFbMarketingApiKey, getUserDetail } from '@/app/actions'

interface AdCreativeUpdateRequest extends AdCreative {
    fb_account_id: string
    id: string
}

export async function updateAdCreative(
  payload: AdCreative
): Promise<any> {
  try {
    const fastyEndpoint = process.env.FASTY_API_URL
    const apiUrl = `${fastyEndpoint}/facebook/exec/direct/ads/update-adcreative`
    console.log('payload to update adcreative', payload)
    if(!payload?.id){
      console.error('Error update adcreative without id:', payload)
      return false
    }
    const userDetail = await getUserDetail();

    const token_resp = await getFbMarketingApiKey();
    let token = "";
    if (token_resp.success && token_resp.token) {
      token = token_resp.token;
    }

    const data: AdCreativeUpdateRequest = {
        ...payload,
        fb_account_id: userDetail?.user?.fbAccountId || '0',
        id: payload?.id || '0',
    }
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.FASTY_API_TOKEN}`,
        'fb-api-key': token,
      },
      body: JSON.stringify(data)
    })

    return response
  } catch (error) {
    console.error('Error update adcreative:', error)
    return false
  }
}
