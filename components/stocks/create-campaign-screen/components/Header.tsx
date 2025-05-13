import React from 'react';
import { CampaignTab } from '../types';
import { FormStateManager } from './FormStateManager';

interface HeaderProps {
  activeTab: CampaignTab;
  setActiveTab: React.Dispatch<React.SetStateAction<CampaignTab>>;
  handleReviewTransition: () => void;
  isLoading: boolean;
  disableReview: boolean;
  formData: any;
  onLoadFormState: (formState: any) => void;
}

export function Header({ 
  activeTab, 
  setActiveTab, 
  handleReviewTransition, 
  isLoading, 
  disableReview,
  formData,
  onLoadFormState
}: HeaderProps) {
  return (
    <div className="flex items-center justify-between mb-6 border-b border-border-dark pb-5">
      <div className="flex space-x-3">
        <button
          className={`px-5 py-2.5 rounded-lg transition-all duration-200 ${
            activeTab === 'create'
              ? 'bg-dark-bg border border-primary-green text-primary-green font-medium'
              : 'text-text-light-gray border border-border-dark hover:bg-dark-bg hover:text-text-white'
          }`}
          onClick={() => setActiveTab('create')}
        >
          Create
        </button>
        <button
          className={`px-5 py-2.5 rounded-lg transition-all duration-200 ${
            activeTab === 'review'
              ? 'bg-dark-bg border border-primary-green text-primary-green font-medium'
              : 'text-text-light-gray border border-border-dark hover:bg-dark-bg hover:text-text-white'
          } ${(disableReview || isLoading) ? 'opacity-50 cursor-not-allowed' : ''}`}
          onClick={() => handleReviewTransition()}
          disabled={disableReview || isLoading}
        >
          Review
        </button>
      </div>
      
      {/* Template Save/Load Manager */}
      {activeTab === 'create' && (
        <FormStateManager 
          formData={formData}
          onLoadFormState={onLoadFormState}
        />
      )}
    </div>
  );
}