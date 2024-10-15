import { FbPageAccount } from '@/lib/types'

export async function getPageAccounts(): Promise<FbPageAccount[]> {
    const apiUrl = `/api/fasty-bot/proxy-get-page-accounts`

    try {
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
