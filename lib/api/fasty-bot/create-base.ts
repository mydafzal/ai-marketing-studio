import { getUserDetail } from '@/app/actions'
import { getFbMarketingApiKey } from '@/app/actions';

interface CampaignSummary {
  campaign_id: string
  campaign_name: string
  total_leads: number
  total_spent: number
  creation_date: string
  status: string
  clicks: number
  ctr: number
  frequency: number
  impressions: number
  reach: number
  unique_clicks: number
}
interface CampaignCreateRequest {
  fbAccountId?: string
  campaign_name: string
}



export async function createBase(
  request: CampaignCreateRequest
): Promise<any> {
  let fetchedCampaignId: string | undefined

  // try {
  //   fetchedCampaignId = await getCampaignIdFromUrl()
  //   console.log('Fetched Campaign ID:', fetchedCampaignId)
  // } catch (error) {
  //   console.error('Error fetching campaign ID:', error)
  // }

  if (!fetchedCampaignId) {
    console.warn("No campaign ID fetched, using default '0'")
    fetchedCampaignId = '0'
  }
  // Check if mock data should be returned
  if (process.env.NEXT_PUBLIC_MOCK_CHART_DATA === '1') {
    return getMockData(fetchedCampaignId)
  }

  // Check for hardcoded mode
  if (
    process.env.NEXT_PUBLIC_HARDCODED_MODE === '1' &&
    process.env.NEXT_PUBLIC_HARDCODED_CAMPAIGN_ID
  ) {
    fetchedCampaignId = process.env.NEXT_PUBLIC_HARDCODED_CAMPAIGN_ID
  }

  try {
    let {
      fbAccountId,
      campaign_name,
    } = request

    const userDetail = await getUserDetail();

    let company_name = ""
      
    if (!fbAccountId) {
      fbAccountId = userDetail?.user?.fbAccountId || '0'
    }

    if (!company_name){
      company_name = userDetail?.user?.company_name || ''
    }
  

    let payload: {
      fb_account_id: string;
      campaign_name: string;
      company_name?: string;
    } = {
      fb_account_id: fbAccountId,
      campaign_name,
    };
    
    if (company_name && company_name.trim() !== "") {
      payload.company_name = company_name;
    }

    const fastyEndpoint = process.env.FASTY_API_URL
    const apiUrl = `${fastyEndpoint}/facebook/exec/direct/campaign/create-base`
    console.log('payload to create a new base', payload)
    const token_resp = await getFbMarketingApiKey()
    let token=""
    if(token_resp.success && token_resp.token){
        token=token_resp.token
    }

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.FASTY_API_TOKEN}`,
      //  'fb-api-key': token // Temp removed, need changes in fasty to support this

      },
      body: JSON.stringify(payload)
    })

    return response
  } catch (error) {
    console.error('Error create campaign:', error)
    return false
  }
}

function getMockData(campaignId: string): CampaignSummary {
  return {
    campaign_id: campaignId,
    campaign_name: 'Mock Campaign',
    total_leads: 50,
    total_spent: 500,
    creation_date: new Date().toISOString(),
    status: 'ACTIVE',
    clicks: 1000,
    impressions: 2000,
    ctr: 2,
    reach: 1500,
    frequency: 1.5,
    unique_clicks: 800
  }
}

export type { CampaignSummary }
