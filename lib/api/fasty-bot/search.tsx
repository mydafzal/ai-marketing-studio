import { builQueryString } from '@/lib/utils'
import { getFbMarketingApiKey } from '@/app/actions'

export async function getSearch(params: any): Promise<any> {
  try {
    const fastyEndpoint = process.env.FASTY_API_URL

    const queryString = builQueryString(params);
    const token_resp = await getFbMarketingApiKey();
    let token = "";
    if (token_resp.success && token_resp.token) {
      token = token_resp.token;
    }

    const apiUrl = `${fastyEndpoint}/facebook/read/search${queryString}`
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
    console.error('Error search:', error)
    return false
  }
}
