import {getCampaignIdFromUrl} from "@/lib/api/fasty-bot/helpers/campaign-id-from-url-helper";
import { getFbMarketingApiKey } from '@/app/actions';

export async function getCampaignLeadsCount(campaignId?: string) {
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

    const token_resp = await getFbMarketingApiKey()
    const token = token_resp.success && token_resp.token ? token_resp.token : ""

    const fastyEndpoint = process.env.FASTY_API_URL
    const apiUrl = `${fastyEndpoint}/facebook/exec/direct/lead/count-campaign-leads?campaign_id=${fetchedCampaignId}`

    try {
        const response = await fetch(apiUrl, {
            headers: {
                'Authorization': `Bearer ${process.env.FASTY_API_TOKEN}`,
                'fb-api-key': token
            }
        });

        if (!response.ok) {
            console.error(`HTTP error! status: ${response.status}`);
            return [];
        }

        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error fetching campaign leads count:', error);
        return [];
    }
}
