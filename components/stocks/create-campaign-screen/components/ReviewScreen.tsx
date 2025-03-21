import React from 'react';
import { CampaignSettingsContent } from './CampaignSettingsContent';
import { MediaItem, Gender, PreviewTab, AdPlacements, MasterFlowResponse } from '../types';
import Image from 'next/image';

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
  masterFlowData?: MasterFlowResponse | null;
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
  handlePublish,
  masterFlowData
}: ReviewScreenProps) {
  
  // Get preview URL from masterFlowData if available
  const getPreviewUrl = () => {
    if (masterFlowData?.creatives_and_previews?.creatives && 
        masterFlowData.creatives_and_previews.creatives.length > 0) {
      const creative = masterFlowData.creatives_and_previews.creatives[0];
      if (creative.previews?.length > 0) {
        return creative.previews[0].preview_url;
      }
    }
    return null;
  };
  
  const previewUrl = getPreviewUrl();
  
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
              {previewUrl ? (
                <iframe 
                  src={previewUrl} 
                  className="size-full" 
                  frameBorder="0"
                  title="Facebook Ad Preview"
                />
              ) : (
                <>
                  {mediaItems.length > 0 ? (
                    mediaItems[0].type === 'image' ? (
                      <Image
                        src={mediaItems[0].url}
                        alt="Ad preview"
                        className="size-full object-cover"
                        width={240}
                        height={420}
                      />
                    ) : (
                      <video
                        src={mediaItems[0].url}
                        className="size-full object-cover"
                        autoPlay
                        loop
                        muted
                        playsInline
                      />
                    )
                  ) : (
                    <div className="size-full bg-gradient-to-b from-purple-500 to-pink-500"></div>
                  )}
                  {/* Top-left brand & 'Advertisement' */}
                  <div className="absolute top-3 left-3 flex flex-col text-white text-sm">
                    <div className="flex items-center space-x-2">
                      <div className="size-6 bg-gray-200 rounded-full" />
                      <span className="font-semibold">YourBrand</span>
                    </div>
                    <span className="text-xs mt-1">Advertisement</span>
                  </div>
                  
                  {/* Bottom text box */}
                  <div className="absolute bottom-0 inset-x-0 p-4 bg-gradient-to-t from-black/80 to-transparent">
                    <h4 className="text-white font-bold text-sm mb-1">{adHeadline}</h4>
                    <p className="text-white text-xs line-clamp-3">{adText}</p>
                    <button className="mt-2 px-4 py-1 bg-white text-black rounded-full text-xs font-medium">Learn More</button>
                  </div>
                </>
              )}
            </div>
          )}

          {/* Settings preview tab */}
          {activePreviewTab === 'settings' && (
            <div className="bg-gray-800 rounded-lg p-6">
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
      
      {masterFlowData && (
        <div className="mb-6 bg-blue-900/20 p-4 rounded-lg">
          <h3 className="text-xl font-medium mb-2">AI Recommendations</h3>
          <div className="text-sm text-blue-300">
            <p className="mb-2">
              <span className="font-medium">Campaign Objective:</span> {masterFlowData.campaign_objective}
            </p>
            {masterFlowData.age_gender_decision_reason && (
              <p className="mb-2">
                <span className="font-medium">Targeting Recommendation:</span> {masterFlowData.age_gender_decision_reason}
              </p>
            )}
            {masterFlowData.suggested_targeting_filters && Array.isArray(masterFlowData.suggested_targeting_filters) && masterFlowData.suggested_targeting_filters.length > 0 && (
              <p>
                <span className="font-medium">Suggested Interest Filters:</span>{' '}
                {masterFlowData.suggested_targeting_filters.map(filter => filter.name).join(', ')}
              </p>
            )}
          </div>
        </div>
      )}

      <div className="mt-auto">
        <button 
          onClick={handlePublish}
          className="w-full py-3 bg-gradient-to-r from-purple-600 to-blue-500 text-white rounded-lg font-medium hover:from-purple-700 hover:to-blue-600 transition-colors"
        >
          Launch Campaign
        </button>
      </div>
    </div>
  );
}