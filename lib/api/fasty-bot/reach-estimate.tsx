import { builQueryString } from '@/lib/utils'
import { getFbMarketingApiKey, getUserDetail } from '@/app/actions'

export async function getReachEstimate(params: any): Promise<any> {
  try {
    const fastyEndpoint = process.env.FASTY_API_URL
    const userDetail = await getUserDetail()

    const queryString = builQueryString({...params, fb_account_id: userDetail?.user?.fbAccountId || '0'});
    
    const apiUrl = `${fastyEndpoint}/facebook/read/search/reachestimate${queryString}`
    const token_resp = await getFbMarketingApiKey();
    let token = "";
    if (token_resp.success && token_resp.token) {
      token = token_resp.token;
    }


    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.FASTY_API_TOKEN}`,
        'fb-api-key': token,
      }
    })
    return await response.json()
  } catch (error) {
    console.error('Error get reach estimate:', error)
    return false
  }
}
