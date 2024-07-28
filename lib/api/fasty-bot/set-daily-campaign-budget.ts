import { headers } from 'next/headers';

async function setDailyCampaignBudget(campaignId: number, dailyBudget: number): Promise<boolean> {
    console.log('setDailyCampaignBudget called with:', { campaignId, dailyBudget });

    if (campaignId === 0) {
        console.log('Bypassing API call for campaign ID 0');
        return true;
    }

    try {
        let url: string;

        if (typeof window !== 'undefined') {
            url = '/api/fasty-bot/proxy-set-daily-campaign-budget';
            console.log('Client-side request. URL:', url);
        } else {
            const host = headers().get('host') || 'localhost:3000';
            const protocol = process.env.NODE_ENV === 'production' ? 'https' : 'http';
            url = `${protocol}://${host}/api/fasty-bot/proxy-set-daily-campaign-budget`;
            console.log('Server-side request. URL:', url);
        }

        console.log('Sending request to proxy');
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
        console.log('Received response from proxy. Status:', response.status);

        if (!response.ok) {
            const errorBody = await response.text();
            console.error('Error setting daily campaign budget:', {
                status: response.status,
                statusText: response.statusText,
                body: errorBody
            });
            return false;
        }

        const result = await response.json();
        console.log('Proxy response:', result);
        return result.success;
    } catch (error) {
        console.error('Error in setDailyCampaignBudget:', error);
        return false;
    }
}

export { setDailyCampaignBudget };