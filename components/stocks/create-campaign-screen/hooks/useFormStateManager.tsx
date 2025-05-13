/**
 * Custom hook for managing campaign form state
 * Provides functions to prepare and load form state data
 */

'use client';

import { useState } from 'react';
import { MediaItem, Gender, AdPlacements } from '../types';

interface FormState {
  mediaItems?: MediaItem[];
  campaignSessionId?: string;
  link?: string;
  budget?: string;
  selectedLeadFormId?: string;
  selectedCustomerProfileId?: string;
  selectedCustomerProfile?: any;
  campaignObjective?: string;
  adText?: string;
  adHeadline?: string;
  ageRange?: [number, number];
  targetedLocations?: string[];
  targetedInterests?: string[];
  gender?: Gender;
  behavioralFilters?: string[];
  demographicFilters?: string[];
  aiGuidance?: string;
  adPlacements?: AdPlacements;
  masterFlowData?: any;
}

interface FormStateManagerParams {
  // State setter functions
  setMediaItems: (items: MediaItem[]) => void;
  setLink: (link: string) => void;
  setBudget: (budget: string) => void;
  setSelectedLeadFormId: (id: string) => void;
  setSelectedCustomerProfileId: (id: string) => void;
  setSelectedCustomerProfile: (profile: any) => void;
  setCampaignObjective: (objective: string) => void;
  setAdText: (text: string) => void;
  setAdHeadline: (headline: string) => void;
  setAgeRange: (range: [number, number]) => void;
  setTargetedLocations: (locations: string[]) => void;
  setTargetedInterests: (interests: string[]) => void;
  setGender: (gender: Gender) => void;
  setBehavioralFilters: (filters: string[]) => void;
  setDemographicFilters: (filters: string[]) => void;
  setAiGuidance: (guidance: string) => void;
  setAdPlacements: (placements: AdPlacements) => void;
  setMasterFlowData: (data: any) => void;
  
  // Current state values
  mediaItems: MediaItem[];
  campaignSessionId?: string;
  link: string;
  budget: string;
  selectedLeadFormId: string;
  selectedCustomerProfileId: string;
  selectedCustomerProfile: any;
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
  masterFlowData: any;
}

export function useFormStateManager({
  // State setter functions
  setMediaItems,
  setLink,
  setBudget,
  setSelectedLeadFormId,
  setSelectedCustomerProfileId,
  setSelectedCustomerProfile,
  setCampaignObjective,
  setAdText,
  setAdHeadline,
  setAgeRange,
  setTargetedLocations,
  setTargetedInterests,
  setGender,
  setBehavioralFilters,
  setDemographicFilters,
  setAiGuidance,
  setAdPlacements,
  setMasterFlowData,
  
  // Current state values
  mediaItems,
  campaignSessionId,
  link,
  budget,
  selectedLeadFormId,
  selectedCustomerProfileId,
  selectedCustomerProfile,
  campaignObjective,
  adText,
  adHeadline,
  ageRange,
  targetedLocations,
  targetedInterests,
  gender,
  behavioralFilters,
  demographicFilters,
  aiGuidance,
  adPlacements,
  masterFlowData
}: FormStateManagerParams) {
  const [loadingState, setLoadingState] = useState(false);
  
  /**
   * Get current form data for saving
   */
  const getCurrentFormData = () => {
    return {
      mediaItems,
      campaignSessionId,
      link,
      budget,
      selectedLeadFormId,
      selectedCustomerProfileId,
      selectedCustomerProfile,
      campaignObjective,
      adText,
      adHeadline,
      ageRange,
      targetedLocations,
      targetedInterests,
      gender,
      behavioralFilters,
      demographicFilters,
      aiGuidance,
      adPlacements,
      masterFlowData
    };
  };
  
  /**
   * Load saved form state
   */
  const loadFormState = (formState: FormState) => {
    setLoadingState(true);
    
    try {
      // Set media items if available
      if (formState.mediaItems && Array.isArray(formState.mediaItems)) {
        setMediaItems(formState.mediaItems);
      }
      
      // Set basic campaign info
      if (formState.link) setLink(formState.link);
      if (formState.budget) setBudget(formState.budget);
      if (formState.campaignObjective) setCampaignObjective(formState.campaignObjective);
      
      // Set lead form
      if (formState.selectedLeadFormId) setSelectedLeadFormId(formState.selectedLeadFormId);
      
      // Set customer profile
      if (formState.selectedCustomerProfileId) {
        setSelectedCustomerProfileId(formState.selectedCustomerProfileId);
      }
      if (formState.selectedCustomerProfile) {
        setSelectedCustomerProfile(formState.selectedCustomerProfile);
      }
      
      // Set creative text
      if (formState.adText) setAdText(formState.adText);
      if (formState.adHeadline) setAdHeadline(formState.adHeadline);
      
      // Set audience settings
      if (formState.ageRange) setAgeRange(formState.ageRange);
      if (formState.targetedLocations) setTargetedLocations(formState.targetedLocations);
      if (formState.targetedInterests) setTargetedInterests(formState.targetedInterests);
      if (formState.gender) setGender(formState.gender);
      
      // Set additional filters
      if (formState.behavioralFilters) setBehavioralFilters(formState.behavioralFilters);
      if (formState.demographicFilters) setDemographicFilters(formState.demographicFilters);
      
      // Set AI guidance
      if (formState.aiGuidance) setAiGuidance(formState.aiGuidance);
      
      // Set ad placements
      if (formState.adPlacements) setAdPlacements(formState.adPlacements);
      
      // Master flow data (if available)
      if (formState.masterFlowData) setMasterFlowData(formState.masterFlowData);
    } catch (error) {
      console.error('Error loading form state:', error);
    } finally {
      setLoadingState(false);
    }
  };
  
  return {
    getCurrentFormData,
    loadFormState,
    loadingState
  };
}