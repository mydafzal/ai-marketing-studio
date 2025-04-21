import React from 'react';
import { X } from 'lucide-react';
import { EditSection } from '../types';
import { AudienceSettings } from './AudienceSettings';
import { PlacementSettings } from './PlacementSettings';
import { BudgetSettings } from './BudgetSettings';
import { CreativeSettings } from './CreativeSettings';
import { ObjectiveSettings } from './ObjectiveSettings';

interface CampaignSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentEditSection: EditSection;
  // Props needed for various sections
  campaignObjective: string;
  setCampaignObjective: (objective: string) => void;
  targetedLocations: string[];
  setTargetedLocations: React.Dispatch<React.SetStateAction<string[]>>;
  newLocation: string;
  setNewLocation: React.Dispatch<React.SetStateAction<string>>;
  ageRange: [number, number];
  setAgeRange: React.Dispatch<React.SetStateAction<[number, number]>>;
  targetedInterests: string[];
  setTargetedInterests: React.Dispatch<React.SetStateAction<string[]>>;
  newInterest: string;
  setNewInterest: React.Dispatch<React.SetStateAction<string>>;
  behavioralFilters: string[];
  setBehavioralFilters: React.Dispatch<React.SetStateAction<string[]>>;
  demographicFilters: string[];
  setDemographicFilters: React.Dispatch<React.SetStateAction<string[]>>;
  gender: string;
  setGender: React.Dispatch<React.SetStateAction<any>>;
  adPlacements: { instagram_stories: boolean };
  setAdPlacements: React.Dispatch<React.SetStateAction<{ instagram_stories: boolean }>>;
  budget: string;
  setBudget: React.Dispatch<React.SetStateAction<string>>;
  adHeadline: string;
  setAdHeadline: React.Dispatch<React.SetStateAction<string>>;
  adText: string;
  setAdText: React.Dispatch<React.SetStateAction<string>>;
  mediaItems: any[];
  setMediaItems: React.Dispatch<React.SetStateAction<any[]>>;
  fileInputRef: React.RefObject<HTMLInputElement>;
}

export function CampaignSettingsModal({
  isOpen,
  onClose,
  currentEditSection,
  campaignObjective,
  setCampaignObjective,
  targetedLocations,
  setTargetedLocations,
  newLocation,
  setNewLocation,
  ageRange,
  setAgeRange,
  targetedInterests,
  setTargetedInterests,
  newInterest,
  setNewInterest,
  behavioralFilters,
  setBehavioralFilters,
  demographicFilters,
  setDemographicFilters,
  gender,
  setGender,
  adPlacements,
  setAdPlacements,
  budget,
  setBudget,
  adHeadline,
  setAdHeadline,
  adText,
  setAdText,
  mediaItems,
  setMediaItems,
  fileInputRef
}: CampaignSettingsModalProps) {
  if (!isOpen) return null;

  const renderSettingsContent = () => {
    switch (currentEditSection) {
      case 'audience':
        return (
          <AudienceSettings
            targetedLocations={targetedLocations}
            setTargetedLocations={setTargetedLocations}
            newLocation={newLocation}
            setNewLocation={setNewLocation}
            ageRange={ageRange}
            setAgeRange={setAgeRange}
            targetedInterests={targetedInterests}
            setTargetedInterests={setTargetedInterests}
            newInterest={newInterest}
            setNewInterest={setNewInterest}
            behavioralFilters={behavioralFilters}
            setBehavioralFilters={setBehavioralFilters}
            demographicFilters={demographicFilters}
            setDemographicFilters={setDemographicFilters}
            gender={gender as any}
            setGender={setGender}
          />
        );
      case 'placements':
        return <PlacementSettings adPlacements={adPlacements} setAdPlacements={setAdPlacements} />;
      case 'budget':
        return <BudgetSettings budget={budget} setBudget={setBudget} />;
      case 'creative':
        return (
          <CreativeSettings
            adHeadline={adHeadline}
            setAdHeadline={setAdHeadline}
            adText={adText}
            setAdText={setAdText}
            mediaItems={mediaItems}
            setMediaItems={setMediaItems}
            fileInputRef={fileInputRef}
          />
        );
      case 'advanced':
        return <ObjectiveSettings campaignObjective={campaignObjective} setCampaignObjective={setCampaignObjective} />;
      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center">
      <div className="bg-gray-900 rounded-xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
        <div className="p-4 border-b border-gray-700 flex justify-between">
          <h2 className="text-xl font-medium">
            {currentEditSection === 'audience' && 'Audience Settings'}
            {currentEditSection === 'placements' && 'Ad Placements'}
            {currentEditSection === 'budget' && 'Budget Settings'}
            {currentEditSection === 'creative' && 'Creative Settings'}
            {currentEditSection === 'advanced' && 'Advanced Settings'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white"
          >
            <X size={24} />
          </button>
        </div>
        <div className="overflow-y-auto p-6 flex-grow">
          {renderSettingsContent()}
        </div>
        <div className="p-4 border-t border-gray-700">
          <button
            className="w-full bg-[#743FC7] text-white py-2 rounded-md hover:bg-[#8B53DC] transition-colors"
            onClick={onClose}
          >
            Save Settings
          </button>
        </div>
      </div>
    </div>
  );
}