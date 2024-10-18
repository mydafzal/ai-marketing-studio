import { CoreMessage  } from 'ai'

export type Message = CoreMessage & {
  id: string,
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
  defaultExtraDetails?:string
  fbAccountId?: string
  fbMarketingApiKey?: string
  fbBusinessAccId?:string
  first_name?:string
  last_name?:string
  company_name?:string
  company_description?:string
  website_link?:string
  website_data?:string
  preferred_language?:string
  goal?:string
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

export interface AdsetTargeting {
  age_max: number
  age_min: number
  geo_locations: {
    countries: string[]
    location_types: string[]
  }
  publisher_platforms: string[]
  facebook_positions: string[]
  instagram_positions: string[]
  device_platforms: string[]
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
  },
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
  },
  context_card?: {
    title: string,
    style: string,
    content: string,
  }
}