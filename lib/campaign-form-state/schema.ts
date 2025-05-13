/**
 * Schema definition for campaign form state storage
 * Defines the structure of data to be stored in KV database
 */

import {
  MediaItem,
  Gender,
  AdPlacements,
  Location,
} from '../../components/stocks/create-campaign-screen/types';

/**
 * Contains all form state data for a campaign
 */
export interface CampaignFormState {
  // Unique identifier for this form state
  id: string;
  
  // User ID associated with this form state
  userId: string;
  
  // Timestamp when form was saved
  savedAt: number;
  
  // Optional name for this saved form state
  name?: string;
  
  // Media items (images/videos)
  mediaItems: MediaItem[];
  
  // Campaign session ID from uploads
  campaignSessionId?: string;
  
  // Basic campaign settings
  link: string;
  budget: string;
  campaignObjective: string;
  
  // Lead form settings
  selectedLeadFormId?: string;
  
  // Customer profile settings
  selectedCustomerProfileId?: string;
  selectedCustomerProfile?: Record<string, any>;
  
  // Creative text
  adText: string;
  adHeadline: string;
  
  // Audience settings
  ageRange: [number, number];
  targetedLocations: string[];
  targetedInterests: string[];
  gender: Gender;
  
  // Additional filters
  behavioralFilters: string[];
  demographicFilters: string[];
  
  // AI guidance
  aiGuidance: string;
  
  // Placements
  adPlacements: AdPlacements;
  
  // Enhanced location data
  locationData?: Location[];
  
  // Master flow API response state (if available)
  masterFlowData?: Record<string, any>;
}

/**
 * Type for a list of form states 
 */
export interface CampaignFormStateList {
  items: Array<{
    id: string;
    name?: string;
    savedAt: number;
  }>;
}

/**
 * Input for saving form state
 */
export interface SaveFormStateInput {
  // Form state data
  formState: Omit<CampaignFormState, 'id' | 'userId' | 'savedAt'>;
  
  // Optional name/label for this saved state
  name?: string;
}

/**
 * Response for form state operations
 */
export interface FormStateResponse {
  success: boolean;
  formStateId?: string;
  error?: string;
  message?: string;
}