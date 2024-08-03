async function setDailyCampaignBudget(campaignId: number, dailyBudget: number): Promise<boolean> {
    if (campaignId === 0) { // TODO: Remove this once Fasty bot is live and campaign IDs are available
        console.log('Bypassing API call for campaign ID 0');
        return true;
    }

    try {
        const fastyEndpoint = process.env.FASTY_API_URL;
        const apiUrl = `${fastyEndpoint}/facebook/exec/direct/adjust-campaign/set-daily-budget`;

        console.log('Campaign budget adjustment. API Url:', apiUrl);
        // submitLog('Campaign budget adjustment. API Url:', apiUrl);

        // Make the direct API call
        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${process.env.FASTY_API_TOKEN}`
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