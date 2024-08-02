import { getBaseUrl } from '@/lib/helpers/vercel/get-base-url';

async function setDailyCampaignBudget(campaignId: number, dailyBudget: number): Promise<boolean> {
    if (campaignId === 0) { // TODO: Remove this once Fasty bot is live and campaign IDs are available
        console.log('Bypassing API call for campaign ID 0');
        return true;
    }

    try {
        // Determine base URL using the utility function
        const baseUrl = getBaseUrl();
        // Construct the full URL
        const url = `${baseUrl}/api/fasty-bot/proxy-set-daily-campaign-budget`;

        // Make the API call
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                campaign_id: campaignId,
                daily_budget: dailyBudget
            })
        });

        // Handle the response
        if (!response.ok) {
            const errorBody = await response.text();
            console.error('Error setting daily budget:', {
                status: response.status,
                statusText: response.statusText,
                body: errorBody
            });
            return false;
        }

        // Parse and return the result
        const result = await response.json();
        return result.success;
    } catch (error) {
        console.error('Error setting daily budget:', error);
        return false;
    }
}

export { setDailyCampaignBudget };
