import { getFbMarketingApiKey } from '@/app/actions';

export async function getAdsets(campaignId: string): Promise<any> {
  const token_resp = await getFbMarketingApiKey()
  const token = token_resp.success && token_resp.token ? token_resp.token : ""

  const fastyEndpoint = process.env.FASTY_API_URL
  const apiUrl = `${fastyEndpoint}/facebook/exec/direct/dynamic-ads/get-adsets?campaign_id=${campaignId}`

  try {
    const response = await fetch(apiUrl, {
      headers: {
        'Authorization': `Bearer ${process.env.FASTY_API_TOKEN}`,
        'fb-api-key': token
      }
    })

    return response
  } catch (error) {
    console.error('Error fetching adsets:', error)
  }
  return []
}
