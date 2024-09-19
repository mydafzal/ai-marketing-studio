import { getUserDetail } from '@/app/actions'
import { FbCampaign } from '@/lib/types'

export async function getCampaigns(): Promise<FbCampaign[]> {
  const userDetail = await getUserDetail()
  console.log('userDetail', userDetail)
  if (userDetail?.user?.fbAccountId) {
    const apiUrl = `/api/fasty-bot/proxy-get-campaigns?fbAccountId=${userDetail?.user?.fbAccountId}`

    try {
      const response = await fetch(apiUrl)

      if (!response.ok) {
        console.error(`HTTP error! status: ${response.status}`)
      }

      const data: any = await response.json()
      return data?.campaigns
    } catch (error) {
      console.error('Error fetching campaigns:', error)
    }
  }
  return []
}
