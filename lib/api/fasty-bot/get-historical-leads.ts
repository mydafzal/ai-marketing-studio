import {getCampaignIdFromUrl} from "@/lib/api/fasty-bot/helpers/campaign-id-from-url-helper";

async function getCampaignHistoricalLeadsResults(campaignId: string, timeline: 'today' | 'last_week' | 'last_month' | 'last_year'): Promise<{
    campaign_id: string;
    timeline: string;
    lead_results: Array<{ date: string; leads: number }>
}> {
    const fetchedCampaignId = getCampaignIdFromUrl()?.toString() || '0';

    // If the campaign ID is '0', return immediately with an empty lead_results array
    if (fetchedCampaignId === '0') {
        return {
            campaign_id: fetchedCampaignId,
            timeline: timeline,
            lead_results: []
        };
    }

    const fastyEndpoint = process.env.NEXT_PUBLIC_FASTY_API_URL;
    const apiUrl = `${fastyEndpoint}/facebook/read/insights/get-campaign-historical-leads-results?campaign_id=${fetchedCampaignId}&timeline=${timeline}`;

    try {
        const response = await fetch(apiUrl);

        if (!response.ok) {
            console.error(`HTTP error! status: ${response.status}`);
            return {
                campaign_id: fetchedCampaignId,
                timeline: timeline,
                lead_results: []
            };
        }

        const data = await response.json();
        console.log('API Response:', data);
        return data;
    } catch (error) {
        console.error('Error fetching historical leads data:', error);
        return {
            campaign_id: fetchedCampaignId,
            timeline: timeline,
            lead_results: []
        };
    }
}

export {getCampaignHistoricalLeadsResults};