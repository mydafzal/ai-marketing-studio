// Campaign data types
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

export interface Campaign {
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

// Daily Creative types
export interface DailyCreative {
  id: number;
  imageUrl: string;
  prompt: string;
  title: string;
}