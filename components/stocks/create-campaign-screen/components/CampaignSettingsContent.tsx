import React from 'react';
import { Pencil } from 'lucide-react';
import { Gender, AdPlacements, MediaItem } from '../types';

interface CampaignSettingsContentProps {
  campaignObjective: string;
  targetedLocations: string[];
  ageRange: [number, number];
  gender: Gender;
  targetedInterests: string[];
  behavioralFilters: string[];
  demographicFilters: string[];
  adPlacements: AdPlacements;
  budget: string;
  mediaItems: MediaItem[];
  adHeadline: string;
  adText: string;
  openEditModal: (section: string) => void;
}

export function CampaignSettingsContent({
  campaignObjective,
  targetedLocations,
  ageRange,
  gender,
  targetedInterests,
  behavioralFilters,
  demographicFilters,
  adPlacements,
  budget,
  mediaItems,
  adHeadline,
  adText,
  openEditModal
}: CampaignSettingsContentProps) {
  // Count media by type for display
  const imageCount = mediaItems.filter(item => item.type === 'image').length;
  const videoCount = mediaItems.filter(item => item.type === 'video').length;
  
  return (
    <div className="space-y-4 p-4">
      {/* Campaign Objective */}
      <div className="flex items-start justify-between p-3 rounded-lg bg-gray-800 hover:bg-gray-750 transition-colors">
        <div className="flex items-start gap-2">
          <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center mt-0.5">
            <span className="text-xs text-white">✓</span>
          </div>
          <div>
            <h4 className="font-medium">Campaign Objective</h4>
            <p className="text-sm text-gray-300">{campaignObjective}</p>
          </div>
        </div>
        <Pencil
          size={16}
          className="text-gray-400 hover:text-white cursor-pointer"
          onClick={() => openEditModal('objective')}
        />
      </div>

      {/* Audience */}
      <div className="flex items-start justify-between p-3 rounded-lg bg-gray-800 hover:bg-gray-750 transition-colors">
        <div className="flex items-start gap-2">
          <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center mt-0.5">
            <span className="text-xs text-white">✓</span>
          </div>
          <div>
            <h4 className="font-medium">Audience</h4>
            <p className="text-sm text-gray-300">
              Locations: {targetedLocations.join(', ')}
            </p>
            <p className="text-sm text-gray-300">
              Age Range: {ageRange[0]} - {ageRange[1]}, Gender: {gender}
            </p>
            <p className="text-sm text-gray-300">
              Filters: {targetedInterests.join(', ')}
              {behavioralFilters.length > 0 && ', '}
              {behavioralFilters.map((filter, idx) => (
                <span key={`behavioral-${idx}`} className="text-blue-400">
                  {filter}{idx < behavioralFilters.length - 1 ? ', ' : ''}
                </span>
              ))}
              {demographicFilters.length > 0 && ', '}
              {demographicFilters.map((filter, idx) => (
                <span key={`demographic-${idx}`} className="text-green-400">
                  {filter}{idx < demographicFilters.length - 1 ? ', ' : ''}
                </span>
              ))}
            </p>
          </div>
        </div>
        <Pencil
          size={16}
          className="text-gray-400 hover:text-white cursor-pointer"
          onClick={() => openEditModal('audience')}
        />
      </div>

      {/* Ad Placements */}
      <div className="flex items-start justify-between p-3 rounded-lg bg-gray-800 hover:bg-gray-750 transition-colors">
        <div className="flex items-start gap-2">
          <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center mt-0.5">
            <span className="text-xs text-white">✓</span>
          </div>
          <div>
            <h4 className="font-medium">Ad Placements</h4>
            {adPlacements.instagram_stories && (
              <p className="text-sm text-gray-300">Instagram Stories</p>
            )}
          </div>
        </div>
        <Pencil
          size={16}
          className="text-gray-400 hover:text-white cursor-pointer"
          onClick={() => openEditModal('placements')}
        />
      </div>

      {/* Budget */}
      <div className="flex items-start justify-between p-3 rounded-lg bg-gray-800 hover:bg-gray-750 transition-colors">
        <div className="flex items-start gap-2">
          <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center mt-0.5">
            <span className="text-xs text-white">✓</span>
          </div>
          <div>
            <h4 className="font-medium">Budget</h4>
            <p className="text-sm text-gray-300">Daily: ${budget} USD</p>
          </div>
        </div>
        <Pencil
          size={16}
          className="text-gray-400 hover:text-white cursor-pointer"
          onClick={() => openEditModal('budget')}
        />
      </div>

      {/* Creative */}
      <div className="flex items-start justify-between p-3 rounded-lg bg-gray-800 hover:bg-gray-750 transition-colors">
        <div className="flex items-start gap-2">
          <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center mt-0.5">
            <span className="text-xs text-white">✓</span>
          </div>
          <div>
            <h4 className="font-medium">Creative</h4>
            <p className="text-sm text-gray-300">
              Media: {mediaItems.length} uploaded 
              {imageCount > 0 && ` (${imageCount} image${imageCount > 1 ? 's' : ''}`}
              {videoCount > 0 && `${imageCount > 0 ? ', ' : ' ('}${videoCount} video${videoCount > 1 ? 's' : ''}`}
              {(imageCount > 0 || videoCount > 0) && ')'}
            </p>
            <p className="text-sm text-gray-300">
              Headline: {adHeadline}
            </p>
            <p className="text-sm text-gray-300">
              Description: {adText.substring(0, 60)}...
            </p>
          </div>
        </div>
        <Pencil
          size={16}
          className="text-gray-400 hover:text-white cursor-pointer"
          onClick={() => openEditModal('creative')}
        />
      </div>
    </div>
  );
}