import { getFbMarketingApiKey, getUserDetail } from '@/app/actions'
export async function getImageDetail(image_hash: string) {
  const fastyEndpoint = process.env.FASTY_API_URL
  const userDetail = await getUserDetail()
  if (userDetail?.user?.fbAccountId) {
    const apiUrl = `${fastyEndpoint}/facebook/exec/direct/upload/image-detail?fb_account_id=${userDetail?.user?.fbAccountId}&image_hash=${image_hash}`
    const token_resp = await getFbMarketingApiKey()
    let token=""
    if(token_resp.success && token_resp.token){
      token=token_resp.token
    }

    const response = await fetch(apiUrl, {
      headers: {
        Authorization: `Bearer ${process.env.FASTY_API_TOKEN}`,
        'fb-api-key': token
      }
    })

    if (!response.ok) {
      console.error(`HTTP error! status: ${response.status}`)
      throw new Error('Failed to fetch image detail')
    }
    return response.json()
  }
  return false
}
