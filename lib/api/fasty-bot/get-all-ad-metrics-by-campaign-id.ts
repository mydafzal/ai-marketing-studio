import {getCampaignIdFromUrl} from "@/lib/api/fasty-bot/helpers/campaign-id-from-url-helper";// Types for Facebook Ad Insights
// File: /lib/api/fasty-bot/helpers/get-all-ad-metrics-by-campaign-id.ts


// Action type interfaces
export interface ActionType {
    action_type: string;
    value: string;
}

export interface CostPerActionType {
    action_type: string;
    value: string;
}

export interface OutboundClick {
    action_type: string;
    value: string;
}

export interface OutboundClickCTR {
    action_type: string;
    value: string;
}

export interface WebsiteCTR {
    action_type: string;
    value: string;
}

// Main Ad Insight interface
export interface AdInsight {
    ad_id: string;
    ad_name: string;
    adset_id: string;
    adset_name: string;
    campaign_id: string;
    campaign_name: string;
    impressions: string;
    reach: string;
    spend: string;
    clicks: string;
    ctr: string;
    cost_per_unique_click: string;
    cost_per_inline_link_click?: string;
    frequency: string;
    inline_link_clicks?: string;
    inline_link_click_ctr?: string;
    
    // Video metrics
    video_p25_watched_actions?: ActionType[];
    video_p50_watched_actions?: ActionType[];
    video_p75_watched_actions?: ActionType[];
    video_p95_watched_actions?: ActionType[];
    video_p100_watched_actions?: ActionType[];
    video_avg_time_watched_actions?: ActionType[];
    video_play_actions?: ActionType[];
    
    // Engagement metrics
    actions: ActionType[];
    cost_per_action_type: CostPerActionType[];
    outbound_clicks?: OutboundClick[];
    outbound_clicks_ctr?: OutboundClickCTR[];
    website_ctr: WebsiteCTR[];
    
    // Additional metrics
    unique_clicks: string;
    unique_ctr: string;
    cpp: string;
    cpm: string;
    cpc: string;
    objective: string;
    optimization_goal: string;
    date_start: string;
    date_stop: string;
}

// Response interface
export interface AdMetricsResponse {
    campaign_id: string;
    ads_insights: AdInsight[];
}

// Main function to get ad metrics
export async function getAllAdMetricsByCampaignId(
    campaignId?: string
): Promise<AdMetricsResponse> {
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

    // Return mock data if environment variable is set
    if (process.env.NEXT_PUBLIC_MOCK_CHART_DATA === '1') {
        return getMockAdMetrics(fetchedCampaignId);
    }

    // Check for hardcoded mode
    if (process.env.NEXT_PUBLIC_HARDCODED_MODE === '1' && process.env.NEXT_PUBLIC_HARDCODED_CAMPAIGN_ID) {
        fetchedCampaignId = process.env.NEXT_PUBLIC_HARDCODED_CAMPAIGN_ID;
    }

    // Default empty response
    const defaultResponse: AdMetricsResponse = {
        campaign_id: fetchedCampaignId,
        ads_insights: []
    };

    // If the campaign ID is '0', return immediately with default values
    if (fetchedCampaignId === '0') {
        return defaultResponse;
    }

    const apiUrl = `/api/fasty-bot/proxy-get-campaign-creatives?campaign_id=${fetchedCampaignId}`;

    try {
        const response = await fetch(apiUrl);

        if (!response.ok) {
            console.error(`HTTP error! status: ${response.status}`);
            return defaultResponse;
        }

        const data: AdMetricsResponse = await response.json();
        return {...data, campaign_id: fetchedCampaignId};
    } catch (error) {
        console.error('Error fetching ad metrics:', error);
        return defaultResponse;
    }
}

// Mock data function
function getMockAdMetrics(campaignId: string): AdMetricsResponse {
    const mockAd: AdInsight = {
        ad_id: "120210938073670208",
        ad_name: "Reeply AI Engagement Ad for Max 3",
        adset_id: "120210937692790208",
        adset_name: "Group for Reeply AI Engagement Ad",
        campaign_id: campaignId,
        campaign_name: "Reeply AI Lead Ad September to October",
        impressions: "375",
        reach: "372",
        spend: "3.67",
        clicks: "5",
        ctr: "1.333333",
        cost_per_unique_click: "0.9175",
        cost_per_inline_link_click: "1.223333",
        frequency: "1.008065",
        inline_link_clicks: "3",
        inline_link_click_ctr: "0.8",
        
        video_p25_watched_actions: [
            {
                action_type: "video_view",
                value: "13"
            }
        ],
        video_p50_watched_actions: [
            {
                action_type: "video_view",
                value: "8"
            }
        ],
        video_p75_watched_actions: [
            {
                action_type: "video_view",
                value: "5"
            }
        ],
        video_p95_watched_actions: [
            {
                action_type: "video_view",
                value: "4"
            }
        ],
        video_p100_watched_actions: [
            {
                action_type: "video_view",
                value: "3"
            }
        ],
        video_avg_time_watched_actions: [
            {
                action_type: "video_view",
                value: "3"
            }
        ],
        video_play_actions: [
            {
                action_type: "video_view",
                value: "369"
            }
        ],
        
        actions: [
            {
                action_type: "page_engagement",
                value: "45"
            },
            {
                action_type: "post_engagement",
                value: "45"
            },
            {
                action_type: "video_view",
                value: "42"
            },
            {
                action_type: "link_click",
                value: "3"
            }
        ],
        cost_per_action_type: [
            {
                action_type: "video_view",
                value: "0.087381"
            },
            {
                action_type: "link_click",
                value: "1.223333"
            },
            {
                action_type: "post_engagement",
                value: "0.081556"
            },
            {
                action_type: "page_engagement",
                value: "0.081556"
            }
        ],
        website_ctr: [
            {
                action_type: "link_click",
                value: "0.8"
            }
        ],
        unique_clicks: "4",
        unique_ctr: "1.075269",
        cpp: "9.865591",
        cpm: "9.786667",
        cpc: "0.734",
        objective: "OUTCOME_LEADS",
        optimization_goal: "LEAD_GENERATION",
        date_start: "2024-09-26",
        date_stop: "2025-02-17"
    };

    // Create a second mock ad with different metrics
    const mockAd2: AdInsight = {
        ...mockAd,
        ad_id: "120210937902760208",
        ad_name: "Reeply AI Engagement Ad for Marc",
        impressions: "322",
        reach: "292",
        spend: "6.01",
        actions: [
            ...mockAd.actions,
            {
                action_type: "lead",
                value: "1"
            }
        ]
    };

    return {
        campaign_id: campaignId,
        ads_insights: [mockAd, mockAd2]
    };
}

// Helper functions for data processing
export const getActionValue = (actions: ActionType[] | undefined, actionType: string): number => {
    if (!actions) return 0;
    const action = actions.find(a => a.action_type === actionType);
    return action ? parseFloat(action.value) : 0;
};

export const parseMetricValue = (value: string): number => {
    return parseFloat(value) || 0;
};