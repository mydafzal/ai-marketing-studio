import { getUserDetail } from '@/app/actions'
import { DashboardCampaign } from '@/components/dashboard/types'

interface GetDashboardCampaignsOptions {
  limit?: number;
  offset?: number;
}

interface DashboardCampaignsResponse {
  success: boolean;
  campaigns: DashboardCampaign[];
  total: number;
  paging: {
    previous?: string;
    next?: string;
  } | null;
}

/**
 * Fetches campaigns with enhanced data for the dashboard
 * Includes basic campaign data, performance metrics, and thumbnails
 */
export async function getDashboardCampaigns(
  options: GetDashboardCampaignsOptions = {}
): Promise<DashboardCampaignsResponse> {
  const { limit = 10, offset = 0 } = options
  const userDetail = await getUserDetail()
  
  // Default empty response
  const emptyResponse: DashboardCampaignsResponse = {
    success: false,
    campaigns: [],
    total: 0,
    paging: null
  }
  
  if (!userDetail?.user?.fbAccountId) {
    console.error('User has no Facebook account ID')
    return emptyResponse
  }
  
  const fbAccountId = userDetail.user.fbAccountId
  const apiUrl = `/api/dashboard/get-campaigns?fb_account_id=${fbAccountId}&limit=${limit}&offset=${offset}`

  try {
    const response = await fetch(apiUrl)

    if (!response.ok) {
      console.error(`HTTP error! status: ${response.status}`)
      return emptyResponse
    }

    const data = await response.json()
    return {
      success: true,
      campaigns: data.campaigns || [],
      total: data.total || 0,
      paging: data.paging
    }
  } catch (error) {
    console.error('Error fetching dashboard campaigns:', error)
    return emptyResponse
  }
}