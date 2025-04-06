import type {
  TransformedMetrics,
  TransformedAdCreative,
} from "@/lib/api/fasty-bot/get-all-ad-metrics-by-campaign-id"

// RawCreative from your /proxy-get-adcreatives endpoint
export interface RawCreative {
  id: string
  name: string
  status: string
  object_type: "VIDEO" | "IMAGE" | "SHARE"
  thumbnail_url?: string
  video_url?: string
  object_story_spec: {
    page_id: string
    video_data?: {
      video_id: string
      title: string
      message: string
      image_url: string
      image_hash: string
    }
    link_data?: {
      name: string
      message: string
      link: string
      image_hash: string
    }
  }
}

// Our final merged creative
export interface AdCreative {
  id: string
  name: string             // Ad name from metrics
  creativeName: string     // Original creative name from raw data
  status: string
  type: "image" | "video"
  url?: string
  videoId?: string
  object_story_spec: any
  metrics: TransformedMetrics
}

export type MetricKey = keyof TransformedMetrics
export type MetricCategory = "engagement" | "conversion" | "clicks" | "video"

// Helper function to format ad names
export function formatAdName(name: string): string {
  // Customize this pattern based on your ad name format
  const pattern = /^(.*?)(\s\d{4}-\d{2}-\d{2}-[a-z0-9]+)$/i
  const match = name.match(pattern)
  return match ? match[1] : name
}

/**
 * A helper function to compute an overall "score" from multiple metrics
 * for deciding which creative is the "Top Performer."
 */
export function getPerformanceScore(creative: AdCreative): number {
  const m = creative.metrics
  // watchTime is in seconds
  return (
    m.engagement * 2 +
    m.impressions * 0.3 +
    m.watchTime * 0.03 +
    m.reach * 0.1 -
    m.costPerClick * 5
  )
}

/**
 * Gets the best performer ID for a specific metric
 * (For cost metrics, lower is better; for others, higher is better)
 */
export function getBestPerformerIdForMetric(creatives: AdCreative[], metric: MetricKey): string {
  if (!creatives.length) return ""
  const costMetrics = [
    "costPerClick",
    "cpp",
    "cpm",
    "spend",
    "costPerLead",
    "costPerConversion",
  ]
  const isLowerBetter = costMetrics.includes(metric)
  return [...creatives].sort((a, b) => {
    return isLowerBetter
      ? Number(a.metrics[metric] || 0) - Number(b.metrics[metric] || 0)
      : Number(b.metrics[metric] || 0) - Number(a.metrics[metric] || 0)
  })[0]?.id || ""
}

/**
 * Calculates combined metrics from an array of ad creatives
 * Sums numerical metrics and calculates averages for rate-based metrics
 */
export function getCombinedMetrics(creatives: AdCreative[]): TransformedMetrics {
  if (!creatives.length) {
    return {
      impressions: 0,
      reach: 0,
      spend: 0,
      engagement: 0,
      watchTime: 0,
      conversionRate: 0,
      clickThroughRate: 0,
      costPerClick: 0,
      frequency: 0,
      cpp: 0,
      cpm: 0,
      inlineLinkClicks: 0,
      inlineLinkClickRate: 0,
      outboundClicks: 0,
      outboundClickRate: 0,
      uniqueClicks: 0,
      uniqueClickRate: 0,
      websiteCtr: 0,
      leads: 0,
      conversions: 0,
      costPerLead: 0,
      costPerConversion: 0,
      conversionValue: 0,
      roi: 0,
      objective: "",
      optimizationGoal: "",
    }
  }

  // Initialize with first creative's metrics
  const combined: TransformedMetrics = { ...creatives[0].metrics }
  
  // Sum metrics from all other creatives
  for (let i = 1; i < creatives.length; i++) {
    const current = creatives[i].metrics
    
    // Sum count-based metrics
    combined.impressions += current.impressions || 0
    combined.reach += current.reach || 0
    combined.spend += current.spend || 0
    combined.engagement += current.engagement || 0
    combined.watchTime += current.watchTime || 0
    combined.inlineLinkClicks += current.inlineLinkClicks || 0
    combined.outboundClicks += current.outboundClicks || 0
    combined.uniqueClicks += current.uniqueClicks || 0
    combined.leads += current.leads || 0
    combined.conversions += current.conversions || 0
    combined.conversionValue += current.conversionValue || 0
  }
  
  // Calculate averages for rate-based metrics
  if (creatives.length > 1) {
    // Average the rate-based metrics
    combined.conversionRate = creatives.reduce((sum, creative) => sum + (creative.metrics.conversionRate || 0), 0) / creatives.length
    combined.clickThroughRate = creatives.reduce((sum, creative) => sum + (creative.metrics.clickThroughRate || 0), 0) / creatives.length
    combined.frequency = creatives.reduce((sum, creative) => sum + (creative.metrics.frequency || 0), 0) / creatives.length
    combined.inlineLinkClickRate = creatives.reduce((sum, creative) => sum + (creative.metrics.inlineLinkClickRate || 0), 0) / creatives.length
    combined.outboundClickRate = creatives.reduce((sum, creative) => sum + (creative.metrics.outboundClickRate || 0), 0) / creatives.length
    combined.uniqueClickRate = creatives.reduce((sum, creative) => sum + (creative.metrics.uniqueClickRate || 0), 0) / creatives.length
    combined.websiteCtr = creatives.reduce((sum, creative) => sum + (creative.metrics.websiteCtr || 0), 0) / creatives.length
    combined.roi = creatives.reduce((sum, creative) => sum + (creative.metrics.roi || 0), 0) / creatives.length
    
    // Calculate averages for cost efficiency metrics
    combined.costPerClick = creatives.reduce((sum, creative) => sum + (creative.metrics.costPerClick || 0), 0) / creatives.length
    combined.cpp = creatives.reduce((sum, creative) => sum + (creative.metrics.cpp || 0), 0) / creatives.length
    combined.cpm = creatives.reduce((sum, creative) => sum + (creative.metrics.cpm || 0), 0) / creatives.length
    
    // These can still be calculated from totals since they represent overall campaign efficiency
    combined.costPerLead = combined.spend / combined.leads || 0
    combined.costPerConversion = combined.spend / combined.conversions || 0
  }
  
  return combined
}

// Ad format constants for previews
export const IMAGE_AD_FORMATS = [
  "FACEBOOK_PROFILE_FEED_MOBILE",
  "FACEBOOK_STORY_MOBILE",
  "INSTAGRAM_STANDARD",
  "INSTAGRAM_STORY",
  "INSTAGRAM_EXPLORE_GRID_HOME"
]

export const VIDEO_AD_FORMATS = [
  "FACEBOOK_PROFILE_FEED_MOBILE",
  "FACEBOOK_STORY_MOBILE",
  "INSTAGRAM_STANDARD",
  "INSTAGRAM_STORY",
  "INSTAGRAM_EXPLORE_GRID_HOME",
  "FACEBOOK_REELS_MOBILE",
  "INSTAGRAM_REELS"
]

export const AD_FORMAT_LABELS = {
  "INSTAGRAM_STANDARD": "Instagram Feed",
  "INSTAGRAM_STORY": "Instagram Story",
  "INSTAGRAM_REELS": "Instagram Reels",
  "INSTAGRAM_EXPLORE_GRID_HOME": "Instagram Explore",
  "FACEBOOK_PROFILE_FEED_MOBILE": "Facebook Feed",
  "FACEBOOK_STORY_MOBILE": "Facebook Story",
  "FACEBOOK_REELS_MOBILE": "Facebook Reels"
}