import {getCampaignIdFromUrl} from "@/lib/api/fasty-bot/helpers/campaign-id-from-url-helper";

export interface CampaignSummary {
    campaign_id: string;
    campaign_name: string;
    total_leads: number;
    total_spent: number;
    creation_date: string;
    status: string;
    clicks: number;
    ctr: number;
    frequency: number;
    impressions: number;
    reach: number;
    unique_clicks: number;
    daily_budget: number | null;
}

export async function getCampaignSummary(campaignId?: string): Promise<CampaignSummary> {
    let fetchedCampaignId: string | undefined;
    if (!campaignId) {
        try {
            fetchedCampaignId = await getCampaignIdFromUrl();
            console.log("Fetched Campaign ID:", fetchedCampaignId);
        } catch (error) {
            console.error("Error fetching campaign ID:", error);
        }
    } else {
        fetchedCampaignId = campaignId;
    }
   
    if (!fetchedCampaignId) {
        console.warn("No campaign ID fetched, using default '0'");
        fetchedCampaignId = '0';
    }
    // Check if mock data should be returned
    if (process.env.NEXT_PUBLIC_MOCK_CHART_DATA === '1') {
        return getMockData(fetchedCampaignId);
    }

    // Check for hardcoded mode
    if (process.env.NEXT_PUBLIC_HARDCODED_MODE === '1' && process.env.NEXT_PUBLIC_HARDCODED_CAMPAIGN_ID) {
        fetchedCampaignId = process.env.NEXT_PUBLIC_HARDCODED_CAMPAIGN_ID;
    }

    // Default values
    const defaultSummary: CampaignSummary = {
        campaign_id: fetchedCampaignId,
        campaign_name: "Your campaign is not connected",
        total_leads: 0,
        total_spent: 0,
        creation_date: new Date().toISOString(),
        status: "Not Connected",
        clicks: 0,
        ctr: 0,
        frequency: 0,
        impressions: 0,
        reach: 0,
        unique_clicks: 0,
        daily_budget: null
    };

    // If the campaign ID is '0', return immediately with default values
    if (fetchedCampaignId === '0') {
        return defaultSummary;
    }

    const apiUrl = `/api/fasty-bot/proxy-get-campaign-summary?campaign_id=${fetchedCampaignId}`;

    try {
        const response = await fetch(apiUrl);

        if (!response.ok) {
            console.error(`HTTP error! status: ${response.status}`);
            return defaultSummary;
        }

        const data: CampaignSummary = await response.json();
        return {...data, campaign_id: fetchedCampaignId};
    } catch (error) {
        console.error('Error fetching campaign summary:', error);
        return defaultSummary;
    }
}

function getMockData(campaignId: string): CampaignSummary {
    return {
        campaign_id: campaignId,
        campaign_name: "Mock Campaign",
        total_leads: 50,
        total_spent: 500,
        creation_date: new Date().toISOString(),
        status: "ACTIVE",
        clicks: 1000,
        impressions: 2000,
        ctr: 2,
        reach: 1500,
        frequency: 1.5,
        unique_clicks: 800,
        daily_budget: 1000
    };
}
