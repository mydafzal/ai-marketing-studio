/**
 * Form State Extractor
 * 
 * Utility to extract form state from UI components
 * Provides methods to capture form state from CreateCampaignForm
 */

import {
  CampaignFormState,
  SaveFormStateInput
} from './schema';
import {
  MediaItem,
  Gender,
  AdPlacements
} from '../../components/stocks/create-campaign-screen/types';

/**
 * Extract form state from CreateCampaignForm component props
 */
export function extractFormState(formData: {
  mediaItems: MediaItem[];
  campaignSessionId?: string;
  link: string;
  budget: string;
  selectedLeadFormId?: string;
  selectedCustomerProfileId?: string;
  selectedCustomerProfile?: any;
  campaignObjective: string;
  adText: string;
  adHeadline: string;
  ageRange: [number, number];
  targetedLocations: string[];
  targetedInterests: string[];
  gender: Gender;
  behavioralFilters: string[];
  demographicFilters: string[];
  aiGuidance: string;
  adPlacements: AdPlacements;
  masterFlowData?: any;
  name?: string;
}): SaveFormStateInput {
  // Extract core form fields
  const formState: Omit<CampaignFormState, 'id' | 'userId' | 'savedAt'> = {
    mediaItems: formData.mediaItems,
    campaignSessionId: formData.campaignSessionId,
    link: formData.link,
    budget: formData.budget,
    selectedLeadFormId: formData.selectedLeadFormId,
    selectedCustomerProfileId: formData.selectedCustomerProfileId,
    selectedCustomerProfile: formData.selectedCustomerProfile,
    campaignObjective: formData.campaignObjective,
    adText: formData.adText,
    adHeadline: formData.adHeadline,
    ageRange: formData.ageRange,
    targetedLocations: formData.targetedLocations,
    targetedInterests: formData.targetedInterests,
    gender: formData.gender,
    behavioralFilters: formData.behavioralFilters,
    demographicFilters: formData.demographicFilters,
    aiGuidance: formData.aiGuidance,
    adPlacements: formData.adPlacements,
    masterFlowData: formData.masterFlowData,
  };
  
  return {
    formState,
    name: formData.name
  };
}

/**
 * Convert form state to UI props
 * This transforms a stored form state into props that can be used to 
 * initialize a CreateCampaignForm component
 */
export function formStateToUIProps(formState: CampaignFormState): Record<string, any> {
  return {
    mediaItems: formState.mediaItems,
    campaignSessionId: formState.campaignSessionId,
    link: formState.link,
    budget: formState.budget,
    selectedLeadFormId: formState.selectedLeadFormId,
    selectedCustomerProfileId: formState.selectedCustomerProfileId,
    selectedCustomerProfile: formState.selectedCustomerProfile,
    campaignObjective: formState.campaignObjective,
    adText: formState.adText,
    adHeadline: formState.adHeadline,
    ageRange: formState.ageRange,
    targetedLocations: formState.targetedLocations,
    targetedInterests: formState.targetedInterests,
    gender: formState.gender,
    behavioralFilters: formState.behavioralFilters,
    demographicFilters: formState.demographicFilters,
    aiGuidance: formState.aiGuidance,
    adPlacements: formState.adPlacements,
    masterFlowData: formState.masterFlowData,
  };
}