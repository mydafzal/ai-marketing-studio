// Define types used across components
export type AspectRatio = '1:1' | '16:9' | '9:16' | '4:3' | '3:4' | '2:3' | '3:2';

export interface MediaItem {
  id: string;
  type: 'image' | 'video';
  url: string;
  aspectRatio: AspectRatio;
  progress?: number;
  hash?: string;     // Store the Facebook image hash or video ID returned from API
  error?: string;    // For storing error messages if upload fails.
}

export type EditSection = 'objective' | 'audience' | 'placements' | 'budget' | 'creative' | null;
export type Gender = 'All' | 'Male' | 'Female';
export type CampaignTab = 'create' | 'review';
export type PreviewTab = 'instagram_stories' | 'settings';

export interface AdPlacements {
  instagram_stories: boolean;
}

export interface Location {
  country: {
    name: string;
    code: string;
  };
  regions: {
    key: number;
    name: string;
    cities?: {
      key: number;
      name: string;
    }[];
  }[];
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

export interface AudienceFilterData {
  id: string;
  min_reach?: number;
  max_reach?: number;
}

export interface AudienceCombinedReach {
  min_reach: number;
  max_reach: number;
}

export interface AudienceFilters {
  interest_filters?: Record<string, AudienceFilterData>;
  demographic_filters?: Record<string, AudienceFilterData>;
  behaviour_filters?: Record<string, AudienceFilterData>;
  combined_reach?: AudienceCombinedReach;
}

export interface TargetingFiltersData {
  targeting_filters: {
    interest_filters?: Record<string, AudienceFilterData>;
    demographic_filters?: Record<string, AudienceFilterData>;
    behaviour_filters?: Record<string, AudienceFilterData>;
    combined_reach?: AudienceCombinedReach;
  };
}

export interface AudiencePlacement {
  adset_level_placements: string[];
  ad_creative_level_overrides: Record<string, any>;
}

export interface AudienceLocations {
  regions: { key: string }[];
}

export interface Audience {
  audience_nr: number;
  budget: number;
  min_age: number;
  max_age: number;
  male: boolean;
  female: boolean;
  targeting_filters: {
    type: string;
    filters?: AudienceFilters;
  };
  placements: AudiencePlacement;
  locations: AudienceLocations;
}

export interface Audiences {
  success: boolean;
  audiences: Audience[];
  message: string;
}

export interface LeadFormData {
  lead_form_name: string;
  lead_form_title: string;
  lead_form_description: string;
  lead_form_thank_you_text: string;
  lead_form_data_usage_disclaimer: string;
  lead_form_thank_you_page_title: string;
  lead_form_locale: string;
  privacy_policy_link_text: string;
  company_name: string;
}

export interface LeadFormContent {
  lead_form_data: LeadFormData;
  lead_form_template: string;
  lead_form_questions: string[];
  privacy_policy_link: string;
}

export interface Preview {
  success: boolean;
  preview_html: string;
  preview_url: string;
  error: null | string;
}

export interface Creative {
  creative_id: string;
  name: string;
  success: boolean;
  preview_uuid: string;
  is_image: boolean;
  is_video: boolean;
  previews: Record<string, Preview>;
}

export interface MasterFlowResponse {
  status: string;
  fb_account_id: string;
  campaign_flow_session_id: string;
  ad_creative_text: AdCreativeText;
  lead_form_content?: LeadFormContent;
  campaign_name: string;
  campaign_objective: string;
  selected_locations: Location[];
  is_location_exact_match: boolean;
  suggested_age_min: number;
  suggested_age_max: number;
  include_male_gender: boolean;
  include_female_gender: boolean;
  age_gender_decision_reason: string;
  suggested_targeting_filters: TargetingFiltersData;
  creatives_and_previews: {
    success: boolean;
    creatives: Creative[];
  };
  audiences: Audiences;
}

export interface AudienceUpdateRequest {
  campaign_session_uuid: string;
  audience_nr: number;
  min_age?: number;
  max_age?: number;
  male?: boolean;
  female?: boolean;
  budget?: number;
  locations?: Location[];
}

export interface AudienceUpdateResponse {
  success: boolean;
  campaign_session_uuid: string;
  audience_nr: number;
  updated_fields: {
    min_age?: number;
    max_age?: number;
    male?: boolean;
    female?: boolean;
    locations?: {
      countries?: string[];
      regions?: { key: string }[];
      cities?: { key: string }[];
    };
    budget?: number;
  };
  message: string;
}

export interface LeadFormUpdateRequest {
  campaign_creation_flow_session_id: string;
  form_template_name?: string;
  form_name?: string;
  form_title?: string;
  form_description?: string;
  thank_you_text?: string;
  thank_you_page_title?: string;
  data_usage_notice?: string;
  custom_questions?: string[];
  privacy_policy_link?: string;
  privacy_policy_link_text?: string;
  locale?: string;
  company_name?: string;
  follow_up_url?: string;
}

export interface LeadFormUpdateResponse {
  success: boolean;
  campaign_creation_flow_session_id: string;
  updated_fields: {
    form_template_name?: string;
    form_name?: string;
    form_title?: string;
    form_description?: string;
    thank_you_text?: string;
    thank_you_page_title?: string;
    data_usage_notice?: string;
    custom_questions?: string[];
    privacy_policy_link?: string;
    privacy_policy_link_text?: string;
    locale?: string;
    company_name?: string;
    follow_up_url?: string;
  };
  message: string;
}