import { getFbMarketingApiKey } from '@/app/actions';

async function updateCampaign(campaignId: string, data: any): Promise<boolean | any> {
  if (campaignId == '0') { // TODO: Remove this once Fasty bot is live and campaign IDs are available
      console.log('Bypassing API call for campaign ID 0');
      return true;
  }

  try {
      const fastyEndpoint = process.env.FASTY_API_URL;
      const apiUrl = `${fastyEndpoint}/facebook/exec/direct/campaign/update`;

      const token_resp = await getFbMarketingApiKey()
      let token=""
      if(token_resp.success && token_resp.token){
          token=token_resp.token
      }

      // Make the direct API call
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${process.env.FASTY_API_TOKEN}`,
          'fb-api-key': token

        },
        body: JSON.stringify({
          campaign_id: campaignId,
          data,
        })
      })

      // Parse the response
      const responseData = await response.json();

      // Handle the response
      if (!response.ok) {
          console.error('Error update campaign:', {
              status: response.status,
              statusText: response.statusText,
              body: JSON.stringify(responseData)
          });
          return false;
      }

      // Check for success in the result
      if (responseData && responseData.success === true) {
          console.log('Successfully update campaign:', responseData);
          return responseData;
      } else {
          console.error('Unexpected response format:', responseData);
          return false;
      }
  } catch (error) {
      console.error('Error update campaign:', JSON.stringify(error));
      return false;
  }
}

export {updateCampaign};