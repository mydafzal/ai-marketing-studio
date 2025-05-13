/**
 * Types for Campaign Data from the Facebook API 
 */
export interface CampaignMetrics {
  ctr: string;
  conversions: number;
  cpa: string;
  clicks?: number;
  impressions?: number;
  spend?: string;
  leads?: number;
}

export interface CampaignPerformance {
  ctr: number;
  conversions: number;
  cpa: number;
}

export interface AdSet {
  id: number;
  name: string;
  status: string;
  budget: number;
  impressions: number;
  clicks: number;
}

export interface Creative {
  id: number;
  name: string;
  status: string;
  impressions: number;
  clicks: number;
  ctr: string;
}

/**
 * Dashboard Campaign type extending the basic campaign with additional data
 * coming from the dashboard API endpoint
 */
export interface DashboardCampaign {
  id: number;
  name: string;
  thumbnail: string;
  status: string;
  budget?: number;
  startDate?: string;
  endDate?: string;
  metrics: CampaignMetrics;
  performance: CampaignPerformance;
  adSets?: AdSet[];
  creatives?: Creative[];
}

// For displaying mock data
export interface Campaign extends DashboardCampaign {}

// Daily Creative types
export interface DailyCreative {
  id: number;
  imageUrl: string;
  prompt: string;
  title: string;
}