// This is a replacement file that keeps original content but fixes the error
'use client';

import React, { useState, useRef, useEffect } from 'react';
import confetti from 'canvas-confetti';
import { useMediaUpload } from '../hooks/useMediaUpload';
import { CampaignTab, PreviewTab, Gender, AdPlacements, EditSection, MasterFlowResponse } from '../types';
import { Header } from './Header';
import { CreateTab } from './CreateTab';
import { ReviewScreen } from './ReviewScreen';
import { LoadingScreen } from './LoadingScreen';
import { CampaignSettingsModal } from './CampaignSettingsModal';

export function CreateCampaignForm() {
  // Media upload state
  const { mediaItems, setMediaItems, fileInputRef, handleFileUpload, removeMediaItem, campaignSessionId } = useMediaUpload();
  
  // Main states
  const [link, setLink] = useState('');
  const [budget, setBudget] = useState('');
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const [activeTab, setActiveTab] = useState<CampaignTab>('create');
  const [activePreviewTab, setActivePreviewTab] = useState<PreviewTab>('instagram_stories');
  const [currentEditSection, setCurrentEditSection] = useState<EditSection>(null);
  
  // Loading screen state
  const [isLoading, setIsLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);

  // Master flow API response state
  const [masterFlowData, setMasterFlowData] = useState<MasterFlowResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Objective
  const [campaignObjective, setCampaignObjective] = useState('Lead Generation');

  // Creative text
  const [adText, setAdText] = useState(
    "Struggling to manage your ad campaigns? Let AI do the heavy lifting! Reeply AI automates, optimizes, and scales your marketing—so you get better results with less effort. \n\n" +
    "✅ Automate your ads effortlessly\n" +
    "✅ Optimize campaigns with AI-driven precision\n" +
    "✅ Save time & scale your marketing\n" +
    "✅ Boost ROI with data-backed decisions\n\n" +
    "🚀 Elevate your business with Reeply AI today!"
  );
  const [adHeadline, setAdHeadline] = useState('Revolutionize Your Ads with AI!');
  

  // Audience settings
  const [ageRange, setAgeRange] = useState<[number, number]>([25, 45]);
  const [targetedLocations, setTargetedLocations] = useState(['United States']);
  const [newLocation, setNewLocation] = useState('');

  // Renamed from "Interests" to "Filters" but still storing in same arrays:
  const [targetedInterests, setTargetedInterests] = useState(['Technology', 'Innovation']);
  const [newInterest, setNewInterest] = useState('');
  const [gender, setGender] = useState<Gender>('All');

  // Additional filters - changed to string arrays instead of booleans
  const [behavioralFilters, setBehavioralFilters] = useState<string[]>(['Engaged Shoppers']);
  const [demographicFilters, setDemographicFilters] = useState<string[]>(['Small Business Owner']);

  // AI Guidance
  const [aiGuidance, setAiGuidance] = useState('');

  // Placements (only stories)
  const [adPlacements, setAdPlacements] = useState<AdPlacements>({
    instagram_stories: true
  });

  // Add event listener to file input ref to handle file uploads
  useEffect(() => {
    const currentFileInput = fileInputRef.current;
    if (currentFileInput) {
      const fileChangeHandler = (e: Event) => {
        handleFileUpload(e as unknown as React.ChangeEvent<HTMLInputElement>);
      };
      
      currentFileInput.addEventListener('change', fileChangeHandler);
      
      return () => {
        currentFileInput.removeEventListener('change', fileChangeHandler);
      };
    }
  }, [fileInputRef, handleFileUpload]);

  // Handle transition to review screen with loading sequence and API call
  const handleReviewTransition = async () => {
    if (mediaItems.length === 0 || !link || !budget) {
      return;
    }

    setIsLoading(true);
    setLoadingStep(0);
    setError(null);
    
    try {
      // Check for a valid campaign session ID
      let sessionId = campaignSessionId;
      if (!sessionId) {
        console.log('Campaign session ID not found directly, trying to extract from media items');
        // Try to get session ID from completed uploads
        const mediaWithHash = mediaItems.filter(item => item.progress === 100 && item.hash);
        if (mediaWithHash.length === 0) {
          throw new Error('No valid uploads found. Please upload media first.');
        }
        // Use the campaign_session_id from the API response stored with the first successful upload
        sessionId = mediaWithHash[0].hash || null;
        console.log('Using session ID from media:', sessionId);
      }
      
      // Prepare data for master flow API call
      const imageHashes = mediaItems
        .filter(item => item.type === 'image' && item.hash)
        .map(item => item.hash as string);
      
      const videoIds = mediaItems
        .filter(item => item.type === 'video' && item.hash)
        .map(item => item.hash as string);
      
      // Get user information for API call
      const userDetailResponse = await fetch('/api/kv/fetch-api-token');
      const userData = await userDetailResponse.json();
      
      if (!userData.success) {
        throw new Error('Failed to fetch user details');
      }
      
      // Prepare location data - hardcoded to Netherlands as requested
      const locationData = [
        {
          country: "Netherlands",
          region: "North Holland",
          cities: ["Amsterdam"]
        }
      ];
      
      console.log('Sending request to master flow endpoint with session ID:', sessionId);
      
      // Make the API call to master flow endpoint
      const response = await fetch('/api/master-flow-initiate-process', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'fb_api_key': '' // Empty to use internal API key
        },
        body: JSON.stringify({
          fb_account_id: userData.account?.fbAccountId || '',
          campaign_flow_session_id: sessionId,
          profile_data: userData.account?.defaultExtraDetails || '',
          location_data: locationData,
          website_link: link,
          preferred_language: 'en',
          privacy_policy_link: userData.account?.privacy_policy_link || '',
          page_id: userData.account?.fbPageId ? String(userData.account.fbPageId) : '',
          image_hashes: imageHashes,
          video_ids: videoIds
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create campaign flow');
      }
      
      // Store response data
      const data = await response.json();
      console.log('Master flow response:', data);
      setMasterFlowData(data);
      
      // Continue loading sequence
      const interval = setInterval(() => {
        setLoadingStep(prevStep => {
          if (prevStep >= 6) { // 7 steps (0-6)
            clearInterval(interval);
            setTimeout(() => {
              setIsLoading(false);
              setActiveTab('review');
            }, 1000);
            return prevStep;
          }
          return prevStep + 1;
        });
      }, 1000);
      
    } catch (error) {
      console.error('Error in master flow:', error);
      setError(typeof error === 'object' && error !== null && 'message' in error 
        ? (error as Error).message 
        : 'Failed to process campaign');
      setIsLoading(false);
    }
  };

  // Launch confetti on publish
  const handlePublish = () => {
    confetti({
      particleCount: 150,
      spread: 70,
      origin: { y: 0.6 }
    });
    setShowSuccessMessage(true);
    setTimeout(() => {
      setShowSuccessMessage(false);
    }, 3000);
  };

  // Open the edit modal for a section
  const openEditModal = (section: string) => {
    setCurrentEditSection(section as EditSection);
    setIsEditModalOpen(true);
  };

  // Generate targeted interests with array safety
  const getTargetedInterests = () => {
    if (!masterFlowData?.suggested_targeting_filters) {
      return targetedInterests;
    }
    
    if (!Array.isArray(masterFlowData.suggested_targeting_filters)) {
      return targetedInterests;
    }
    
    try {
      return masterFlowData.suggested_targeting_filters
        .filter(filter => filter && filter.type === 'interest')
        .map(filter => filter.name || 'Unknown');
    } catch (e) {
      console.error('Error processing targeting filters:', e);
      return targetedInterests;
    }
  };

  return (
    <div className="flex flex-col h-full bg-black text-white p-6 relative rounded-xl">
      {/* Success overlay */}
      {showSuccessMessage && (
        <div className="absolute inset-0 bg-black/80 flex items-center justify-center z-10 rounded-xl">
          <div className="text-center p-6">
            <div className="w-20 h-20 rounded-full bg-green-500 mx-auto flex items-center justify-center mb-4">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-10 w-10 text-white"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Thanks!</h3>
            <p className="text-gray-300">Your campaign has been launched.</p>
          </div>
        </div>
      )}

      {/* Error message */}
      {error && (
        <div className="absolute inset-0 bg-black/80 flex items-center justify-center z-10 rounded-xl">
          <div className="text-center p-6">
            <div className="w-20 h-20 rounded-full bg-red-500 mx-auto flex items-center justify-center mb-4">
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                className="h-10 w-10 text-white" 
                viewBox="0 0 20 20" 
                fill="currentColor"
              >
                <path 
                  fillRule="evenodd" 
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" 
                  clipRule="evenodd" 
                />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Error</h3>
            <p className="text-gray-300">{error}</p>
            <button 
              className="mt-4 px-4 py-2 bg-gray-700 rounded hover:bg-gray-600 transition-colors"
              onClick={() => setError(null)}
            >
              Close
            </button>
          </div>
        </div>
      )}

      <Header 
        activeTab={activeTab} 
        setActiveTab={setActiveTab}
        handleReviewTransition={handleReviewTransition}
        isLoading={isLoading}
        disableReview={mediaItems.length === 0 || !link || !budget}
      />

      {isLoading ? <LoadingScreen loadingStep={loadingStep} /> : (
        activeTab === 'create' ? (
          <CreateTab 
            mediaItems={mediaItems}
            setMediaItems={setMediaItems}
            fileInputRef={fileInputRef}
            campaignObjective={campaignObjective}
            setCampaignObjective={setCampaignObjective}
            link={link}
            setLink={setLink}
            budget={budget}
            setBudget={setBudget}
            aiGuidance={aiGuidance}
            setAiGuidance={setAiGuidance}
            handleReviewTransition={handleReviewTransition}
            isLoading={isLoading}
          />
        ) : (
          <ReviewScreen 
            activePreviewTab={activePreviewTab}
            setActivePreviewTab={setActivePreviewTab}
            mediaItems={mediaItems}
            campaignObjective={masterFlowData?.campaign_objective || campaignObjective}
            targetedLocations={masterFlowData?.selected_locations 
              ? masterFlowData.selected_locations.map(loc => loc.country) 
              : targetedLocations}
            ageRange={masterFlowData 
              ? [masterFlowData.suggested_age_min, masterFlowData.suggested_age_max] as [number, number] 
              : ageRange}
            gender={masterFlowData 
              ? (masterFlowData.include_male_gender && masterFlowData.include_female_gender 
                ? 'All' 
                : (masterFlowData.include_male_gender ? 'Male' : 'Female')) as Gender
              : gender}
            targetedInterests={getTargetedInterests()}
            behavioralFilters={behavioralFilters}
            demographicFilters={demographicFilters}
            adPlacements={adPlacements}
            budget={budget}
            adHeadline={masterFlowData?.ad_creative_text?.ad_creative_title || adHeadline}
            adText={masterFlowData?.ad_creative_text?.ad_creative_description || adText}
            openEditModal={openEditModal}
            handlePublish={handlePublish}
            masterFlowData={masterFlowData}
          />
        )
      )}

      {/* Settings Edit Modal */}
      <CampaignSettingsModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        currentEditSection={currentEditSection}
        campaignObjective={campaignObjective}
        setCampaignObjective={setCampaignObjective}
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
        gender={gender}
        setGender={setGender}
        adPlacements={adPlacements}
        setAdPlacements={setAdPlacements}
        budget={budget}
        setBudget={setBudget}
        adHeadline={adHeadline}
        setAdHeadline={setAdHeadline}
        adText={adText}
        setAdText={setAdText}
        mediaItems={mediaItems}
        setMediaItems={setMediaItems}
        fileInputRef={fileInputRef}
      />
    </div>
  );
}