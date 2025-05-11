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

  // Ad Creative Events
  AD_CREATIVES_ANALYZED: 'ad_creatives_analyzed',

  // Lead Form Events
  LEAD_DOWNLOAD_REQUESTED: 'lead_download_requested',
  WEBSITE_ANALYZED: 'website_analyzed',
} as const;

export type EventName = typeof Events[keyof typeof Events]; 