import { CoreMessage } from 'ai'

export type Message = CoreMessage & {
  id: string
  timestamp: string
}

export interface Chat extends Record<string, any> {
  id: string
  title: string
  createdAt: Date
  userId: string
  path: string
  messages: Message[]
  sharePath?: string
  fbAdsetId?: string
  fbCampaignId?: string
}

export type ServerActionResult<Result> = Promise<
  | Result
  | {
      error: string
    }
>

export interface Session {
  user: {
    id: string
    email: string
  }
}

export interface AuthResult {
  type: string
  message: string
}

export interface User extends Record<string, any> {
  id: string
  email: string
  password: string
  salt: string
  defaultExtraDetails?: string
  fbAccountId?: string
  fbMarketingApiKey?: string
  fbBusinessAccId?: string
  first_name?: string
  last_name?: string
  company_name?: string
  company_description?: string
  website_link?: string
  privacy_policy_link?: string
  website_data?: string
  preferred_language?: string
  goal?: string
  fbPageId?: string
}

export interface Campaign extends Record<string, any> {
  id: string
  title: string
  userId: string
  content: string
}

export interface AdText {
  id: number
  image: string
  date: string
  text: string
  headline: string
  fbAdId?: string
}
export interface VideoAdText {
  id: number
  date: string
  text: string
  video_id: string
  thumbnail?: string
  video: string
  headline: string
  fbAdId?: string
}
export interface FbCampaign {
  id: string
  name: string
  daily_budget: string
  created_time: string
  status: string
}

export interface FbVideoThumbnail {
  id: string
  height: number
  width: number
  uri: string
  is_preferred: boolean
}

export interface FbVideo {
  id: string
  permalink_url: string
  thumbnails?: {
    data: FbVideoThumbnail[]
  }
  source?: string
}

export interface FlexibleSpec {
  interests: {
    id: string
    name: string
  }[]
}

export interface AdsetTargeting {
  age_max: number
  age_min: number
  geo_locations: {
    countries?: string[]
    regions?: { key: string }[]
    cities?: { key: string; radius?: number; distance_unit?: string }[]
  }
  genders?: number[]
  flexible_spec?: FlexibleSpec[]
  publisher_platforms: string[]
  facebook_positions: string[]
  instagram_positions: string[]
  device_platforms: string[]
}
export interface ReachEstimate {
  estimate_ready: number
  users_lower_bound: number
  users_upper_bound: number
}
export interface ReachEstimateResult {
  result: ReachEstimate
  targeting_spec: AdsetTargeting
}

export interface Adset {
  id: string
  name: string
  campaign_id: string
  daily_budget: string
  billing_event: string
  optimization_goal: string
  targeting: AdsetTargeting
  promoted_object: {
    page_id: string
  }
  status: string
}

export interface AdCreative {
  id?: string
  name: string
  status: string
  thumbnail_url?: string
  object_type?: string
  object_story_spec: {
    page_id: string
    video_data?: {
      video_id: string
      title: string
      message: string
      call_to_action: {
        type: string
        value: {
          [key: string]: string
        }
      }
      image_url?: string
      image_hash?: string
    }
    link_data?: {
      link: string
      image_url: string
      name: string
      message: string
      call_to_action: {
        type: string
        value: {
          [key: string]: string
        }
      }
    }
  }
}

export interface QuestionOption {
  value: string
  label: string
  key: number
}
export interface Question {
  type: string
  key: string
  label?: string
  inline_context?: string
  options?: QuestionOption[]
}
export interface LeadgenFrom {
  name: string
  locale: string
  privacy_policy?: {
    url: string
    link_text: string
  }
  questions: Question[]
  thank_you_page?: {
    title: string
    body?: string
    button_type: string
    website_url?: string
    short_message?: string
    button_text?: string
    button_description?: string
    country_code?: string
  }
  context_card?: {
    title: string
    style: string
    content: string
  }
}

export interface Country {
  key: string
  country_code: string
  type: string
  name: string
  supports_city: boolean
  supports_region: boolean
}

export interface Region {
  key: string
  country_code: string
  country_name: string
  type: string
  name: string
  supports_city: boolean
  supports_region: boolean
}
export interface City {
  key: string
  name: string
  type: string
  country_code: string
  country_name: string
  region: string
  region_id: string
  supports_city: boolean
  supports_region: boolean
}

export interface CampaignCreationFormData {
  mediaFiles: FileInfo[]
  url: string
  budget: string
  description?: string
}

export interface FileInfo {
  file: File
  type: string
  url: string
  name: string
  dimensions: string
  size: number
}

export interface CampaignFormData {
  objective:
    | 'lead-generation'
    | 'recruitment'
    | 'conversions'
    | 'brand-awareness'
  audiences: Audience[]
  leadForm: LeadForm
  preview: PreviewData
}

export interface Audience {
  location: string
  ageRange: [number, number]
  targeting?: string[]
  advantage?: boolean
  placements: {
    facebookFeed: boolean
    instagramFeed: boolean
    facebookStories: boolean
    instagramStories: boolean
  }
  budget: string
  isExpanded?: boolean
}

export interface LeadForm {
  template: 'basic' | 'standard'
  title: string
  description: string
  thankYouText: string
  customQuestions: string[]
}

export interface PreviewData {
  description: string
  heading: string
  image?: string
}
