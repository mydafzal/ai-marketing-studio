import {headers} from 'next/headers';

async function setDailyCampaignBudget(campaignId: number, dailyBudget: number): Promise<boolean> {
    if (campaignId === 0) { // todo: once fasty bot is live and campaign ids are available, this will be removed
        console.log('Bypassing API call for campaign ID 0');
        return true;
    }

    try {
        let url: string;

        // Check if we're in a browser environment
        if (typeof window !== 'undefined') {
            // We're on the client side
            url = '/api/fasty-bot/proxy-set-daily-budget';
        } else {
            // We're on the server side
            const host = headers().get('host') || 'localhost:3000';
            const protocol = process.env.NODE_ENV === 'production' ? 'https' : 'http';
            url = `${protocol}://${host}/api/fasty-bot/proxy-set-daily-campaign-budget`;
        }

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

        if (!response.ok) {
            const errorBody = await response.text();
            console.error('Error setting daily budget:', {
                status: response.status,
                statusText: response.statusText,
                body: errorBody
            });
            return false;
        }

        const result = await response.json();
        return result.success;
    } catch (error) {
        console.error('Error setting daily budget:', error);
        return false;
    }
}

export {setDailyCampaignBudget};