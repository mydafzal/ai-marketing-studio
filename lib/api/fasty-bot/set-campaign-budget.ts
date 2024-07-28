async function setDailyBudget(campaignId: number, dailyBudget: number): Promise<boolean> {
    if (campaignId === 0) { // todo: once fasty bot is live and campaign ids are available, this will be removed
        console.log('Bypassing API call for campaign ID 0');
        return true;
    }

    try {
        const fastyEndpoint = process.env.NEXT_PUBLIC_FASTY_API_URL;
        const response = await fetch(`${fastyEndpoint}/facebook/exec/direct/adjust-campaign/set-daily-budget`, {
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
        return true;
    } catch (error) {
        console.error('Error setting daily budget:', error);
        return false;
    }
}

export {setDailyBudget};