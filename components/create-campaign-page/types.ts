// Define types used across step-by-step campaign creation components
export type AspectRatio = '1:1' | '16:9' | '9:16' | '4:3' | '3:4' | '2:3' | '3:2';

export interface StepByStepMediaItem {
  id: string;
  type: 'image' | 'video';
  url: string;
  aspectRatio: AspectRatio;
  progress?: number;
  hash?: string;     // Store the Facebook image hash or video ID returned from API
  error?: string;    // For storing error messages if upload fails.
}

export interface StepByStepCampaignData {
  mediaItems: StepByStepMediaItem[];
  link: string;
  budget: string;
  campaignObjective: string;
  selectedLeadFormId: string;
  selectedCustomerProfileId: string;
  campaignSessionId: string | null;
} 