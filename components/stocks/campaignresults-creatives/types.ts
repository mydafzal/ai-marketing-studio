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