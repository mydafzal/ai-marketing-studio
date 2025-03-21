// Define types used across components
export type AspectRatio = '1:1' | '16:9' | '9:16' | '4:3' | '3:4' | '2:3' | '3:2';

export interface MediaItem {
  id: string;
  type: 'image' | 'video';
  url: string;
  aspectRatio: AspectRatio;
  progress?: number;
  hash?: string;     // Store the Facebook image hash returned from API
  error?: string;    // For storing error messages if upload fails
}

export type EditSection = 'objective' | 'audience' | 'placements' | 'budget' | 'creative' | null;
export type Gender = 'All' | 'Male' | 'Female';
export type CampaignTab = 'create' | 'review';
export type PreviewTab = 'instagram_stories' | 'settings';

export interface AdPlacements {
  instagram_stories: boolean;
}

export interface Location {
  country: string;
  region?: string;
  cities?: string[];
}

export interface TargetingFilter {
  id: string;
  name: string;
  type: string;
}

export interface AdCreativeText {
  ad_creative_title: string;
  ad_creative_description: string;
  ad_creative_name: string;
}

export interface LeadFormQuestion {
  type: string;
  label: string;
}

export interface LeadFormContent {
  headline: string;
  questions: LeadFormQuestion[];
}

export interface Creative {
  creative_id: string;
  preview_uuid: string;
  media_type: string;
  media_id: string;
  previews: {
    format: string;
    preview_url: string;
  }[];
}

export interface MasterFlowResponse {
  status: string;
  fb_account_id: string;
  campaign_flow_session_id: string;
  ad_creative_text: AdCreativeText;
  lead_form_content?: LeadFormContent;
  campaign_objective: string;
  selected_locations: Location[];
  is_location_exact_match: boolean;
  suggested_age_min: number;
  suggested_age_max: number;
  include_male_gender: boolean;
  include_female_gender: boolean;
  age_gender_decision_reason: string;
  suggested_targeting_filters: TargetingFilter[] | Record<string, any>;
  creatives_and_previews: {
    creatives: Creative[];
  };
}