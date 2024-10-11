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
  fbAccountId?: string
  fbMarketingApiKey?:string
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
export interface FbCampaign {
  id: string
  name: string
  created_time: string
  status: string
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