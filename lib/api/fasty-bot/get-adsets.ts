export interface AdsetResult {
  id: string
}
export async function getAdsets(campaignId: string): Promise<AdsetResult[]> {
  const apiUrl = `/api/fasty-bot/proxy-get-adsets?campaign_id=${campaignId}`
  try {
    const response = await fetch(apiUrl)

    if (!response.ok) {
      console.error(`HTTP error! status: ${response.status}`)
    }

    const data: AdsetResult[] = await response.json()
    return data
  } catch (error) {
    console.error('Error fetching adsets:', error)
  }
  return []
}
