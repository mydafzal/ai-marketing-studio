import React from 'react';
import { CampaignTab } from '../types';

interface HeaderProps {
  activeTab: CampaignTab;
  setActiveTab: React.Dispatch<React.SetStateAction<CampaignTab>>;
  handleReviewTransition: () => void;
  isLoading: boolean;
  disableReview: boolean;
}

export function Header({ 
  activeTab, 
  setActiveTab, 
  handleReviewTransition, 
  isLoading, 
  disableReview 
}: HeaderProps) {
  return (
    <div className="flex items-center mb-6">
      <div className="flex space-x-2">
        <button
          className={`px-4 py-2 rounded-md ${
            activeTab === 'create'
              ? 'bg-gray-800 text-white font-medium'
              : 'text-gray-400'
          }`}
          onClick={() => setActiveTab('create')}
        >
          Create
        </button>
        <button
          className={`px-4 py-2 rounded-md ${
            activeTab === 'review'
              ? 'bg-gray-800 text-white font-medium'
              : 'text-gray-400'
          }`}
          onClick={() => handleReviewTransition()}
          disabled={disableReview || isLoading}
        >
          Review
        </button>
      </div>
    </div>
  );
}