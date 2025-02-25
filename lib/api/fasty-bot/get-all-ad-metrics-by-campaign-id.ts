import { getCampaignIdFromUrl } from "./helpers/campaign-id-from-url-helper"

// Define base types for actions
interface ActionType {
  action_type: string
  value: string
}

interface VideoAction {
  value: string
}

// Main AdInsight interface with all possible fields from the API
export interface AdInsight {
  ad_id: string
  ad_name: string
  adset_id: string
  adset_name: string
  campaign_id: string
  campaign_name: string
  impressions: string
  reach: string
  spend: string
  clicks: string
  ctr: string
  cpc: string
  frequency: string
  cpp: string
  cpm: string
  inline_link_clicks?: string
  inline_link_click_ctr?: string
  video_p25_watched_actions?: VideoAction[]
  video_p50_watched_actions?: VideoAction[]
  video_p75_watched_actions?: VideoAction[]
  video_p95_watched_actions?: VideoAction[]
  video_p100_watched_actions?: VideoAction[]
  video_avg_time_watched_actions?: VideoAction[]
  outbound_clicks?: VideoAction[]
  outbound_clicks_ctr?: VideoAction[]
  unique_clicks?: string
  unique_ctr?: string
  cost_per_action_type?: ActionType[]
  actions?: ActionType[]
  website_ctr?: VideoAction[]
}

export interface AdMetricsResponse {
  ads_insights: AdInsight[]
}

// Cache configuration
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
const metricsCache = new Map<string, {
  data: TransformedAdMetricsResponse;
  timestamp: number;
}>();

// Request tracking to prevent duplicate in-flight requests
const pendingRequests = new Map<string, Promise<TransformedAdMetricsResponse>>();

// Helper function to extract video metrics safely
const getVideoMetric = (actions: VideoAction[] | undefined): number => {
  if (!actions || !actions[0]) return 0
  return parseFloat(actions[0].value) || 0
}

// Helper to get action value safely
const getActionValue = (actions: ActionType[] | undefined, type: string): number => {
  if (!actions) return 0
  const action = actions.find(a => a.action_type === type)
  return action ? parseFloat(action.value) : 0
}

// Define the transformed metrics interface
export interface TransformedMetrics {
  impressions: number
  reach: number
  spend: number
  engagement: number
  watchTime: number
  conversionRate: number
  clickThroughRate: number
  costPerClick: number
  frequency: number
  cpp: number
  cpm: number
  inlineLinkClicks: number
  inlineLinkClickRate: number
  outboundClicks: number
  outboundClickRate: number
  uniqueClicks: number
  uniqueClickRate: number
  websiteCtr: number
  videoMetrics?: {
    p25: number
    p50: number
    p75: number
    p95: number
    p100: number
    avgTimeWatched: number
  }
}

// Define the transformed creative interface
export interface TransformedAdCreative {
  id: string
  name: string
  type: "video" | "image"
  metrics: TransformedMetrics
}

export interface TransformedAdMetricsResponse {
  adCreatives: TransformedAdCreative[]
}

// Main function to transform the data
const transformMetricsData = (insights: AdInsight[]): TransformedAdCreative[] => {
  return insights.map(insight => ({
    id: insight.ad_id,
    name: insight.ad_name,
    type: insight.video_avg_time_watched_actions ? "video" : "image",
    metrics: {
      impressions: parseInt(insight.impressions) || 0,
      reach: parseInt(insight.reach) || 0,
      spend: parseFloat(insight.spend) || 0,
      engagement: parseInt(insight.clicks) || 0,
      watchTime: getVideoMetric(insight.video_avg_time_watched_actions),
      conversionRate: getActionValue(insight.actions, 'complete_registration'),
      clickThroughRate: parseFloat(insight.ctr) || 0,
      costPerClick: parseFloat(insight.cpc) || 0,
      frequency: parseFloat(insight.frequency) || 0,
      cpp: parseFloat(insight.cpp) || 0,
      cpm: parseFloat(insight.cpm) || 0,
      inlineLinkClicks: parseInt(insight.inline_link_clicks || '0'),
      inlineLinkClickRate: parseFloat(insight.inline_link_click_ctr || '0'),
      outboundClicks: getVideoMetric(insight.outbound_clicks),
      outboundClickRate: getVideoMetric(insight.outbound_clicks_ctr),
      uniqueClicks: parseInt(insight.unique_clicks || '0'),
      uniqueClickRate: parseFloat(insight.unique_ctr || '0'),
      websiteCtr: getVideoMetric(insight.website_ctr),
      ...(insight.video_avg_time_watched_actions && {
        videoMetrics: {
          p25: getVideoMetric(insight.video_p25_watched_actions),
          p50: getVideoMetric(insight.video_p50_watched_actions),
          p75: getVideoMetric(insight.video_p75_watched_actions),
          p95: getVideoMetric(insight.video_p95_watched_actions),
          p100: getVideoMetric(insight.video_p100_watched_actions),
          avgTimeWatched: getVideoMetric(insight.video_avg_time_watched_actions)
        }
      })
    }
  }));
};

// Main function to fetch and transform ad metrics
export async function getAllAdMetricsByCampaignId(campaignId?: string): Promise<TransformedAdMetricsResponse> {
  if (!campaignId) {
    console.error("No campaign ID provided");
    return { adCreatives: [] };
  }

  // Check if there's already a request in flight for this campaign
  if (pendingRequests.has(campaignId)) {
    console.log("Request already in flight, reusing promise");
    return pendingRequests.get(campaignId)!;
  }

  // Check cache first
  const cachedData = metricsCache.get(campaignId);
  const now = Date.now();
  
  if (cachedData && (now - cachedData.timestamp) < CACHE_DURATION) {
    console.log("Using cached metrics data");
    return cachedData.data;
  }

  // Create new request promise
  const requestPromise = (async () => {
    try {
      console.log("Fetching fresh metrics data");
      const response = await fetch(`/api/fasty-bot/proxy-get-all-ad-metrics-by-campaign-id?campaignId=${campaignId}`, {
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (!response.ok) {
        // If we have cached data, return it even if expired
        if (cachedData) {
          console.log("Request failed, using stale cache");
          return cachedData.data;
        }
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch metrics');
      }

      const data = await response.json();
      if (!data?.ads_insights) {
        console.warn("No ads_insights in response");
        return { adCreatives: [] };
      }

      const transformedData: TransformedAdMetricsResponse = {
        adCreatives: transformMetricsData(data.ads_insights)
      };

      // Update cache
      metricsCache.set(campaignId, {
        data: transformedData,
        timestamp: now
      });

      return transformedData;
    } catch (error) {
      console.error("Error fetching ad metrics:", error);
      // If we have cached data, return it even if expired
      if (cachedData) {
        console.log("Error occurred, using stale cache");
        return cachedData.data;
      }
      throw error;
    } finally {
      // Clean up pending request
      pendingRequests.delete(campaignId);
    }
  })();

  // Store the promise
  pendingRequests.set(campaignId, requestPromise);
  
  return requestPromise;
}