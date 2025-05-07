import { getFbMarketingApiKey } from '@/app/actions';
import { auth } from '@/auth';
import { encryptEmail } from '@/lib/email-encryption';
import { Events } from '@/lib/posthog-events';
import { trackEvent } from '@/lib/utils';

async function setCampaignStatus(campaignId: string, status: string): Promise<boolean> {
    if (campaignId == '0') { // TODO: Remove this once Fasty bot is live and campaign IDs are available
        console.log('Bypassing API call for campaign ID 0');
        return true;
    }

    const token_resp = await getFbMarketingApiKey()
    let token=""
    if(token_resp.success && token_resp.token){
        token=token_resp.token
    }

    try {
        const fastyEndpoint = process.env.FASTY_API_URL;
        const apiUrl = `${fastyEndpoint}/facebook/exec/direct/adjust-campaign/set-status`;

        // Make the direct API call
        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${process.env.FASTY_API_TOKEN}`,
                'fb-api-key': token

            },
            body: JSON.stringify({
                campaign_id: campaignId,
                status: status
            })
        });

        // Parse the response
        const responseData = await response.json();

        // Handle the response
        if (!response.ok) {
            console.error('Error setting status:', {
                status: response.status,
                statusText: response.statusText,
                body: responseData
            });
            return false;
        }

        // Check for success in the result
        if (responseData.result && responseData.result.success === true) {
            const session = await auth()
            const encryptedEmail = await encryptEmail(session?.user?.email || '');
    
            trackEvent(Events.CAMPAIGN_STATUS_CHANGED, {
                email: encryptedEmail,
                id: session?.user?.id || ''
              })            
            console.log('Successfully set status:', responseData);
            return true;
        } else {
            console.error('Unexpected response format:', responseData);
            return false;
        }
    } catch (error) {
        console.error('Error setting status:', error);
        return false;
    }
}

export {setCampaignStatus};