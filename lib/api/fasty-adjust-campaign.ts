async function setMonthlyBudget(campaignId: number, monthlyBudget: number): Promise<boolean> {
    if (campaignId === 0) { // todo: once fasty bot is live and campaign ids are available, this will be removed
        console.log('Bypassing API call for campaign ID 0');
        return true;
    }

    try {
        const fastyEndpoint = process.env.FASTY_API_URL;
        const response = await fetch(`${fastyEndpoint}/facebook/exec/direct/adjust-campaign/set-monthly-budget`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                campaign_id: campaignId,
                monthly_budget: monthlyBudget
            })
        });
        if (!response.ok) {
            const errorBody = await response.text();
            console.error('Error setting monthly budget:', {
                status: response.status,
                statusText: response.statusText,
                body: errorBody
            });
            return false;
        }
        return true;
    } catch (error) {
        console.error('Error setting monthly budget:', error);
        return false;
    }
}

export {setMonthlyBudget};