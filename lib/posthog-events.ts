export const Events = {
  // Campaign Creation Events
  LEAD_CAMPAIGN_CREATED: 'lead_campaign_created',
  CONVERSION_CAMPAIGN_CREATED: 'conversion_campaign_created',
  AWARENESS_CAMPAIGN_CREATED: 'awareness_campaign_created',
  RECRUITING_CAMPAIGN_CREATED: 'recruiting_campaign_created',
  CAMPAIGN_FLOW_INITIATED: 'campaign_flow_initiated',
  CAMPAIGN_FINALIZED: 'campaign_finalized',
  // Campaign Management Events
  CAMPAIGN_STATUS_CHANGED: 'campaign_status_changed',
  BUDGET_CHANGED: 'budget_changed',
  CAMPAIGN_ANALYZED: 'campaign_analyzed',
  CAMPAIGN_LIST_FETCHED: 'campaign_list_fetched',

  // Ad Creative Events
  AD_CREATIVE_VIDEO_SUBMITTED: 'ad_creative_video_submitted',
  AD_CREATIVE_IMAGE_SUBMITTED: 'ad_creative_image_submitted',
  AD_CREATIVES_ANALYZED: 'ad_creatives_analyzed',

  // Lead Form Events
  LEADFORM_CREATED: 'leadform_created',
  LEAD_DOWNLOAD_REQUESTED: 'lead_download_requested',
  VIDEO_UPLOADED: 'video_uploaded',
  WEBSITE_ANALYZED: 'website_analyzed',
} as const;

export type EventName = typeof Events[keyof typeof Events]; 