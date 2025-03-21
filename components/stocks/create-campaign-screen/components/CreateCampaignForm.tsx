'use client';

import React, { useState, useRef, useEffect } from 'react';
import confetti from 'canvas-confetti';
import { useMediaUpload } from '../hooks/useMediaUpload';
import { CampaignTab, PreviewTab, Gender, AdPlacements, EditSection } from '../types';
import { Header } from './Header';
import { CreateTab } from './CreateTab';
import { ReviewScreen } from './ReviewScreen';
import { LoadingScreen } from './LoadingScreen';
import { CampaignSettingsModal } from './CampaignSettingsModal';

export function CreateCampaignForm() {
  // Media upload state
  const { mediaItems, setMediaItems, fileInputRef, handleFileUpload, removeMediaItem } = useMediaUpload();
  
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

  // Handle transition to review screen with loading sequence
  const handleReviewTransition = () => {
    setIsLoading(true);
    setLoadingStep(0);
    
    // Simulate the AI thinking process with timed steps
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
    }, 1800);
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
            campaignObjective={campaignObjective}
            targetedLocations={targetedLocations}
            ageRange={ageRange}
            gender={gender}
            targetedInterests={targetedInterests}
            behavioralFilters={behavioralFilters}
            demographicFilters={demographicFilters}
            adPlacements={adPlacements}
            budget={budget}
            adHeadline={adHeadline}
            adText={adText}
            openEditModal={openEditModal}
            handlePublish={handlePublish}
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