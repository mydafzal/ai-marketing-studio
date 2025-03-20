// Define types used across components
export type AspectRatio = '1:1' | '16:9' | '9:16' | '4:3' | '3:4' | '2:3' | '3:2';

export interface MediaItem {
  id: string;
  type: 'image' | 'video';
  url: string;
  aspectRatio: AspectRatio;
  progress?: number;
}

export type EditSection = 'objective' | 'audience' | 'placements' | 'budget' | 'creative' | null;
export type Gender = 'All' | 'Male' | 'Female';
export type CampaignTab = 'create' | 'review';
export type PreviewTab = 'instagram_stories' | 'settings';

export interface AdPlacements {
  instagram_stories: boolean;
}