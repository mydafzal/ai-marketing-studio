import { AdCreative } from '@/lib/types'
import { getFbMarketingApiKey, getUserDetail } from '@/app/actions'


export async function getAdCreatives(campaignId:string): Promise<any> {
  try {
    const fastyEndpoint = process.env.FASTY_API_URL

    const userDetail = await getUserDetail();

    const apiUrl = `${fastyEndpoint}/facebook/exec/direct/ads/get-adcreatives-with-adset?fb_account_id=${userDetail?.user?.fbAccountId || '0'}&campaign_id=${campaignId}`

    const token_resp = await getFbMarketingApiKey()
    let token=""
    if(token_resp.success && token_resp.token){
      token=token_resp.token
    }

    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.FASTY_API_TOKEN}`,
        'fb-api-key': token
      }
    })

    return response
  } catch (error) {
    console.error('Error get adcreatives:', error)
    return false
  }
}
