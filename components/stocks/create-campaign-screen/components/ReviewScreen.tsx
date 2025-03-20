import React from 'react';
import { CampaignSettingsContent } from './CampaignSettingsContent';
import { MediaItem, Gender, PreviewTab, AdPlacements } from '../types';

interface ReviewScreenProps {
  activePreviewTab: PreviewTab;
  setActivePreviewTab: React.Dispatch<React.SetStateAction<PreviewTab>>;
  mediaItems: MediaItem[];
  campaignObjective: string;
  targetedLocations: string[];
  ageRange: [number, number];
  gender: Gender;
  targetedInterests: string[];
  behavioralFilters: string[];
  demographicFilters: string[];
  adPlacements: AdPlacements;
  budget: string;
  adHeadline: string;
  adText: string;
  openEditModal: (section: string) => void;
  handlePublish: () => void;
}

export function ReviewScreen({
  activePreviewTab,
  setActivePreviewTab,
  mediaItems,
  campaignObjective,
  targetedLocations,
  ageRange,
  gender,
  targetedInterests,
  behavioralFilters,
  demographicFilters,
  adPlacements,
  budget,
  adHeadline,
  adText,
  openEditModal,
  handlePublish
}: ReviewScreenProps) {
  return (
    <div className="flex flex-col h-full">
      <div className="mb-6">
        <h3 className="text-xl font-medium mb-4">Ad Preview</h3>

        <div className="mb-4">
          <div className="flex border-b border-gray-700 mb-6">
            <button
              className={`px-4 py-3 ${
                activePreviewTab === 'instagram_stories'
                  ? 'border-b-2 border-blue-500 font-medium'
                  : 'text-gray-400'
              }`}
              onClick={() => setActivePreviewTab('instagram_stories')}
            >
              Instagram Stories
            </button>
            <button
              className={`px-4 py-3 ${
                activePreviewTab === 'settings'
                  ? 'border-b-2 border-blue-500 font-medium'
                  : 'text-gray-400'
              }`}
              onClick={() => setActivePreviewTab('settings')}
            >
              Settings
            </button>
          </div>

          {/* Instagram Stories Preview */}
          {activePreviewTab === 'instagram_stories' && (
            <div className="w-[240px] h-[420px] bg-black mx-auto rounded-xl overflow-hidden relative shadow-xl">
              {mediaItems.length > 0 ? (
                <img
                  src={mediaItems[0].url}
                  alt="Ad preview"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-b from-purple-500 to-pink-500"></div>
              )}
              {/* Top-left brand & 'Advertisement' */}
              <div className="absolute top-3 left-3 flex flex-col text-white text-sm">
                <div className="flex items-center space-x-2">
                  <div className="w-6 h-6 bg-gray-200 rounded-full" />
                  <span className="font-semibold">YourBrand</span>
                </div>
                <span className="text-xs mt-1">Advertisement</span>
              </div>
              {/* Bottom center "Learn More" */}
              <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2">
                <button className="bg-white text-black font-medium py-2 px-4 rounded-full text-sm shadow">
                  Learn More
                </button>
              </div>
            </div>
          )}

          {/* Settings Tab */}
          {activePreviewTab === 'settings' && (
            <div className="bg-gray-900 rounded-lg max-h-[500px] overflow-y-auto shadow-lg border border-gray-800">
              <CampaignSettingsContent 
                campaignObjective={campaignObjective}
                targetedLocations={targetedLocations}
                ageRange={ageRange}
                gender={gender}
                targetedInterests={targetedInterests}
                behavioralFilters={behavioralFilters}
                demographicFilters={demographicFilters}
                adPlacements={adPlacements}
                budget={budget}
                mediaItems={mediaItems}
                adHeadline={adHeadline}
                adText={adText}
                openEditModal={openEditModal}
              />
            </div>
          )}
        </div>
      </div>

      <div className="mt-auto">
        <button
          className="w-full py-3 px-6 bg-[#743FC7] hover:bg-[#8B53DC] text-white font-medium rounded-md transition-colors shadow-lg text-base"
          onClick={handlePublish}
        >
          Launch Campaign
        </button>
      </div>
    </div>
  );
}