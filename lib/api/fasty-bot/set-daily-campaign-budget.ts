async function setDailyCampaignBudget(campaignId: number, dailyBudget: number): Promise<boolean> {
    if (campaignId === 0) { // TODO: Remove this once Fasty bot is live and campaign IDs are available
        console.log('Bypassing API call for campaign ID 0');
        return true;
    }

    try {
        const fastyEndpoint = process.env.FASTY_API_URL;
        const apiUrl = `${fastyEndpoint}/facebook/exec/direct/adjust-campaign/set-daily-budget`;

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

        // Parse the response
        const responseData = await response.json();

        // Handle the response
        if (!response.ok) {
            console.error('Error setting daily budget:', {
                status: response.status,
                statusText: response.statusText,
                body: responseData
            });
            return false;
        }

        // Check for success in the result
        if (responseData.result && responseData.result.success === true) {
            console.log('Successfully set daily budget:', responseData);
            return true;
        } else {
            console.error('Unexpected response format:', responseData);
            return false;
        }
    } catch (error) {
        console.error('Error setting daily budget:', error);
        return false;
    }
}

export {setDailyCampaignBudget};