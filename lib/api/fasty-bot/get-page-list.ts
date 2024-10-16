import { FbPageAccount } from '@/lib/types'
import { getUserDetail } from '@/app/actions'

export async function getPageList(): Promise<FbPageAccount[]> {
    const userDetail = await getUserDetail();
    try {
      const apiUrl = `/api/fasty-bot/proxy-get-page-list?fb_business_acc_id=${userDetail?.user?.fbBusinessAccId}`
      const response = await fetch(apiUrl)

      if (!response.ok) {
        console.error(`HTTP error! status: ${response.status}`)
      }

      const data: any = await response.json()      
      return data?.data
    } catch (error) {
      console.error('Error fetching accounts:', error)
    }
  return []
}
