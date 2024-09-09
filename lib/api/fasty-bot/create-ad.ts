import { getUserDetail } from '@/app/actions'

async function createCampaignAd(campaignId: string, data: any, adset: any): Promise<boolean | any> {
    if (campaignId == '0') { // TODO: Remove this once Fasty bot is live and campaign IDs are available
        console.log('Bypassing API call for campaign ID 0');
        return true;
    }

    try {
        const fastyEndpoint = process.env.FASTY_API_URL;
        const apiUrl = `${fastyEndpoint}/facebook/exec/direct/ads/create`;
        const userDetail = await getUserDetail();

        // Make the direct API call
        const response = await fetch(apiUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${process.env.FASTY_API_TOKEN}`
          },
          body: JSON.stringify({
            campaign_id: campaignId,
            ...data,
            adset: { ...adset, campaign_id: campaignId },
            fbAccountId: userDetail?.user?.fbAccountId || '0',
        })
        })

        // Parse the response
        const responseData = await response.json();

        // Handle the response
        if (!response.ok) {
            console.error('Error in creating campaign ad:', {
                status: response.status,
                statusText: response.statusText,
                body: JSON.stringify(responseData)
            });
            return false;
        }

        // Check for success in the result
        if (responseData.result && responseData.result.success === true) {
            console.log('Successfully created campaign ad:', responseData);
            return responseData;
        } else {
            console.error('Unexpected response format:', responseData);
            return false;
        }
    } catch (error) {
        console.error('Error create campaign ad:', JSON.stringify(error));
        return false;
    }
}

export {createCampaignAd};