'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  X, Upload, Info, XCircle,
  Loader2, Pencil
} from 'lucide-react';
import { useActiveUI } from '@/components/stocks/active-ui-context';
import confetti from 'canvas-confetti';

// Define the AspectRatio type
type AspectRatio = '1:1' | '16:9' | '9:16' | '4:3' | '3:4' | '2:3' | '3:2';

// Define our media type
interface MediaItem {
  id: string;
  type: 'image' | 'video';
  url: string;
  aspectRatio: AspectRatio;
  progress?: number;
}

export function CreateCampaignScreen() {
  const { setActiveUI } = useActiveUI();

  useEffect(() => {
    // Create the component for the side panel
    const campaignFormPanel = (
      <div className="flex flex-col h-full">
        <CreateCampaignForm />
      </div>
    );
    // Register it with the side panel
    setActiveUI(campaignFormPanel, 'createCampaignScreen', 'Create Campaign');
  }, [setActiveUI]);

  // Render nothing here (the side panel content is above)
  return null;
}

function CreateCampaignForm() {
  // Main states
  const [link, setLink] = useState('');
  const [budget, setBudget] = useState('');
  const [mediaItems, setMediaItems] = useState<MediaItem[]>([]);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const [activeTab, setActiveTab] = useState<'create' | 'review'>('create');
  const [activePreviewTab, setActivePreviewTab] =
    useState<'instagram_stories' | 'settings'>('instagram_stories');
  const [currentEditSection, setCurrentEditSection] = useState<string | null>(null);
  
  // Loading screen state
  const [isLoading, setIsLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);
  const loadingSteps = [
    "I am analyzing your website link...",
    "Understanding your advertising goal...",
    "Researching the best possible targeting...",
    "Identifying ideal audience demographics...",
    "Selecting optimal platform placements...",
    "Optimizing creative elements...",
    "Finalizing campaign settings..."
  ];

  // Objective
  const [campaignObjective, setCampaignObjective] = useState('Brand Awareness');

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
  const [gender, setGender] = useState<'All' | 'Male' | 'Female'>('All');

  // Additional filters - changed to string arrays instead of booleans
  const [behavioralFilters, setBehavioralFilters] = useState<string[]>(['Engaged Shoppers']);
  const [demographicFilters, setDemographicFilters] = useState<string[]>(['Small Business Owner']);

  // AI Guidance
  const [aiGuidance, setAiGuidance] = useState('');

  // Placements (only stories)
  const [adPlacements, setAdPlacements] = useState({
    instagram_stories: true
  });

  // File input ref
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Function to determine actual aspect ratio of an image
  const calculateAspectRatio = (file: File): Promise<AspectRatio> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const width = img.width;
        const height = img.height;
        const ratio = width / height;
        
        // Determine which aspect ratio the image is closest to
        if (ratio > 0.9 && ratio < 1.1) {
          resolve('1:1'); // Square
        } else if (ratio > 1.7 && ratio < 1.8) {
          resolve('16:9'); // Landscape wide
        } else if (ratio > 0.55 && ratio < 0.6) {
          resolve('9:16'); // Portrait tall
        } else if (ratio > 1.3 && ratio < 1.35) {
          resolve('4:3'); // Standard landscape
        } else if (ratio > 0.74 && ratio < 0.76) {
          resolve('3:4'); // Standard portrait
        } else if (ratio > 0.65 && ratio < 0.68) {
          resolve('2:3'); // Portrait
        } else if (ratio > 1.45 && ratio < 1.55) {
          resolve('3:2'); // Landscape
        } else if (ratio <= 0.65) {
          // Default to 9:16 for very tall images
          resolve('9:16');
        } else {
          // Default to 16:9 for very wide images
          resolve('16:9');
        }
      };
      img.src = URL.createObjectURL(file);
    });
  };

  // Handle transition to review screen with loading sequence
  const handleReviewTransition = () => {
    setIsLoading(true);
    setLoadingStep(0);
    
    // Simulate the AI thinking process with timed steps
    const interval = setInterval(() => {
      setLoadingStep(prevStep => {
        if (prevStep >= loadingSteps.length - 1) {
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

  // Handle file upload
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      
      // Calculate the actual aspect ratio
      const detectedRatio = await calculateAspectRatio(file);
      
      const newMedia: MediaItem = {
        id: Math.random().toString(36).substring(7),
        type: file.type.includes('video') ? 'video' : 'image',
        url: URL.createObjectURL(file),
        aspectRatio: detectedRatio, // Use the detected ratio
        progress: 30
      };

      setMediaItems(prev => [...prev, newMedia]);

      // Simulate upload progress
      setTimeout(() => {
        setMediaItems(prev =>
          prev.map(item =>
            item.id === newMedia.id ? { ...item, progress: 60 } : item
          )
        );
        setTimeout(() => {
          setMediaItems(prev =>
            prev.map(item =>
              item.id === newMedia.id ? { ...item, progress: 100 } : item
            )
          );
        }, 2000);
      }, 1500);
    }
  };

  // Manage locations
  const addLocation = () => {
    if (newLocation && !targetedLocations.includes(newLocation)) {
      setTargetedLocations(prev => [...prev, newLocation]);
      setNewLocation('');
    }
  };
  const removeLocation = (loc: string) => {
    setTargetedLocations(prev => prev.filter(l => l !== loc));
  };

  // Manage filters (the typed ones)
  const addFilter = () => {
    if (newInterest && !targetedInterests.includes(newInterest)) {
      setTargetedInterests(prev => [...prev, newInterest]);
      setNewInterest('');
    }
  };
  const removeFilter = (f: string) => {
    setTargetedInterests(prev => prev.filter(fl => fl !== f));
  };

  // Manage behavioral filters
  const removeBehavioralFilter = (filter: string) => {
    setBehavioralFilters(prev => prev.filter(f => f !== filter));
  };

  // Manage demographic filters
  const removeDemographicFilter = (filter: string) => {
    setDemographicFilters(prev => prev.filter(f => f !== filter));
  };

  // Open the edit modal for a section
  const openEditModal = (section: string) => {
    setCurrentEditSection(section);
    setIsEditModalOpen(true);
  };

  // Tabs Header
  const renderHeader = () => (
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
          disabled={mediaItems.length === 0 || !link || !budget || isLoading}
        >
          Review
        </button>
      </div>
    </div>
  );

  // AI Loading Screen
  const renderLoadingScreen = () => (
    <div className="flex flex-col items-center justify-center h-full">
      <div className="w-20 h-20 flex items-center justify-center mb-8">
        <div className="relative">
          <div className="w-16 h-16 border-4 border-blue-200 border-t-[#743FC7] rounded-full animate-spin"></div>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-10 h-10 bg-black rounded-full flex items-center justify-center">
              <span className="text-lg font-bold bg-gradient-to-r from-[#743FC7] to-blue-500 text-transparent bg-clip-text">AI</span>
            </div>
          </div>
        </div>
      </div>
      
      <div className="text-center mb-8">
        <h3 className="text-xl font-bold mb-5 bg-gradient-to-r from-[#743FC7] to-blue-500 text-transparent bg-clip-text">
          AI Campaign Assistant
        </h3>
        <div className="relative h-12 min-h-12">
          {loadingSteps.map((step, index) => (
            <p key={index} className={`text-lg font-medium absolute left-0 right-0 transition-all duration-500 ${
              loadingStep === index ? "opacity-100 transform translate-y-0" : 
              loadingStep > index ? "opacity-0 transform -translate-y-8" : 
              "opacity-0 transform translate-y-8"
            }`}>
              {step}
            </p>
          ))}
        </div>
      </div>
      
      <div className="w-64 h-2 bg-gray-700 rounded-full overflow-hidden">
        <div 
          className="h-full bg-gradient-to-r from-[#743FC7] to-blue-500 transition-all duration-500"
          style={{ width: `${(loadingStep + 1) / loadingSteps.length * 100}%` }}
        ></div>
      </div>
      <p className="text-sm text-gray-400 mt-3">
        Please wait while I optimize your campaign...
      </p>
    </div>
  );

  // CREATE TAB
  const renderCreateScreen = () => (
    <>
      {/* Upload area - smaller height + immediate display */}
      <div className="mb-4">
        <div
          className="relative flex flex-wrap items-center gap-3 p-2 w-full border-2 border-dashed border-gray-600 rounded-lg hover:border-gray-400 transition-colors cursor-pointer h-20"
          onClick={() => fileInputRef.current?.click()}
        >
          {mediaItems.length === 0 ? (
            <div className="flex flex-col items-center text-gray-400 mx-auto">
              <Upload className="mb-1" size={20} />
              <span className="text-xs">Upload Media</span>
            </div>
          ) : (
            mediaItems.map(item => (
              <div
                key={item.id}
                className="flex items-center space-x-2 bg-gray-800 rounded p-2"
              >
                {item.progress !== undefined && item.progress < 100 ? (
                  <Loader2 className="animate-spin" size={16} />
                ) : (
                  <div className="w-4 h-4 rounded-full bg-green-500 flex items-center justify-center">
                    <span className="text-xs text-white">✓</span>
                  </div>
                )}
                <span className="text-sm text-gray-200">
                  {item.type.toUpperCase()} ({item.aspectRatio})
                </span>
                <span className="text-xs text-gray-400">
                  {item.progress ?? 0}%
                </span>
                <button
                  onClick={e => {
                    e.stopPropagation();
                    setMediaItems(prev => prev.filter(m => m.id !== item.id));
                  }}
                >
                  <XCircle size={16} className="text-gray-400 hover:text-red-500" />
                </button>
              </div>
            ))
          )}
          <input
            type="file"
            ref={fileInputRef}
            className="hidden"
            accept="image/*,video/*"
            onChange={handleFileUpload}
          />
        </div>
      </div>

      {/* Campaign Objective */}
      <div className="mt-2">
        <h3 className="text-sm font-medium mb-1">Campaign Objective</h3>
        <div className="space-y-1">
          <label className="flex items-center p-2 border border-gray-700 rounded-md cursor-pointer bg-gray-800 hover:bg-gray-750 transition-colors">
            <input
              type="radio"
              className="h-4 w-4 mr-2 accent-blue-500"
              checked={campaignObjective === 'Brand Awareness'}
              onChange={() => setCampaignObjective('Brand Awareness')}
            />
            <span className="text-sm">Brand Awareness</span>
          </label>
          <label className="flex items-center p-2 border border-gray-700 rounded-md cursor-pointer bg-gray-800 hover:bg-gray-750 transition-colors">
            <input
              type="radio"
              className="h-4 w-4 mr-2 accent-blue-500"
              checked={campaignObjective === 'Recruitment'}
              onChange={() => setCampaignObjective('Recruitment')}
            />
            <span className="text-sm">Recruitment</span>
          </label>
          <label className="flex items-center p-2 border border-gray-700 rounded-md cursor-pointer bg-gray-800 hover:bg-gray-750 transition-colors">
            <input
              type="radio"
              className="h-4 w-4 mr-2 accent-blue-500"
              checked={campaignObjective === 'Conversions'}
              onChange={() => setCampaignObjective('Conversions')}
            />
            <span className="text-sm">Conversions</span>
          </label>
          <label className="flex items-center p-2 border border-gray-700 rounded-md cursor-pointer bg-gray-800 hover:bg-gray-750 transition-colors">
            <input
              type="radio"
              className="h-4 w-4 mr-2 accent-blue-500"
              checked={campaignObjective === 'Lead Generation'}
              onChange={() => setCampaignObjective('Lead Generation')}
            />
            <span className="text-sm">Lead Generation</span>
          </label>
        </div>
      </div>

      {/* Link */}
      <div className="space-y-2 mt-4">
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium flex items-center">
            Link
            <Info size={16} className="ml-2 text-gray-500" />
          </label>
        </div>
        <input
          type="text"
          value={link}
          onChange={e => setLink(e.target.value)}
          placeholder="Enter the link to what you'd like to advertise"
          className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Budget */}
      <div className="space-y-2 mt-4">
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium flex items-center">
            Ad Budget (Daily)
            <Info size={16} className="ml-2 text-gray-500" />
          </label>
        </div>
        <div className="relative">
          <input
            type="text"
            value={budget}
            onChange={e => setBudget(e.target.value)}
            placeholder="Enter daily budget"
            className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 pr-16"
          />
          <div className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 pointer-events-none">
            <span>USD</span>
          </div>
        </div>
      </div>

      {/* Optional AI guidance */}
      <div className="space-y-2 mt-4">
        <label className="text-sm font-medium flex items-center">
          AI Guidance (Optional)
          <Info size={16} className="ml-2 text-gray-500" />
        </label>
        <textarea
          value={aiGuidance}
          onChange={e => setAiGuidance(e.target.value)}
          placeholder="Type any notes or instructions for the AI..."
          className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 h-16 resize-none"
        />
      </div>

      {/* Next Step: Preview & Review */}
      <div className="mt-6">
        <button
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md transition-colors shadow-lg"
          onClick={() => handleReviewTransition()}
          disabled={mediaItems.length === 0 || !link || !budget || isLoading}
        >
          Preview &amp; Review
        </button>
      </div>
    </>
  );

  // REVIEW TAB
  const renderReviewScreen = () => (
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
              <CampaignSettingsContent />
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

  // SETTINGS TAB CONTENT
  const CampaignSettingsContent = () => (
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

  // Objective Settings (edit modal)
  const ObjectiveSettings = () => (
    <div className="space-y-3">
      <h3 className="font-medium">Campaign Objective</h3>
      <div className="space-y-2">
        <label className="flex items-center p-2 border border-gray-700 rounded-md cursor-pointer bg-gray-800 hover:bg-gray-750 transition-colors">
          <input
            type="radio"
            className="h-4 w-4 mr-2 accent-blue-500"
            checked={campaignObjective === 'Brand Awareness'}
            onChange={() => setCampaignObjective('Brand Awareness')}
          />
          <span>Brand Awareness</span>
        </label>
        <label className="flex items-center p-2 border border-gray-700 rounded-md cursor-pointer bg-gray-800 hover:bg-gray-750 transition-colors">
          <input
            type="radio"
            className="h-4 w-4 mr-2 accent-blue-500"
            checked={campaignObjective === 'Recruitment'}
            onChange={() => setCampaignObjective('Recruitment')}
          />
          <span>Recruitment</span>
        </label>
        <label className="flex items-center p-2 border border-gray-700 rounded-md cursor-pointer bg-gray-800 hover:bg-gray-750 transition-colors">
          <input
            type="radio"
            className="h-4 w-4 mr-2 accent-blue-500"
            checked={campaignObjective === 'Conversions'}
            onChange={() => setCampaignObjective('Conversions')}
          />
          <span>Conversions</span>
        </label>
        <label className="flex items-center p-2 border border-gray-700 rounded-md cursor-pointer bg-gray-800 hover:bg-gray-750 transition-colors">
          <input
            type="radio"
            className="h-4 w-4 mr-2 accent-blue-500"
            checked={campaignObjective === 'Brand Awareness'}
            onChange={() => setCampaignObjective('Brand Awareness')}
          />
          <span>Brand Awareness</span>
        </label>
      </div>
    </div>
  );

  // Audience Settings (edit modal)
  const AudienceSettings = () => (
    <div className="space-y-6">
      <h3 className="font-medium mb-2">Audience Settings</h3>

      {/* Locations */}
      <div>
        <label className="block text-sm mb-2">Location</label>
        <div className="space-y-2">
          {targetedLocations.map((loc, i) => (
            <div
              key={i}
              className="flex items-center justify-between bg-gray-800 p-2 rounded"
            >
              <span>{loc}</span>
              <XCircle
                size={16}
                className="cursor-pointer text-gray-400 hover:text-red-500"
                onClick={() => removeLocation(loc)}
              />
            </div>
          ))}
          <div className="flex">
            <input
              type="text"
              placeholder="Add location"
              value={newLocation}
              onChange={e => setNewLocation(e.target.value)}
              className="flex-grow px-3 py-2 bg-gray-900 border border-gray-700 rounded-l-md"
              onKeyDown={e => e.key === 'Enter' && addLocation()}
            />
            <button
              className="bg-blue-600 px-4 rounded-r-md"
              onClick={addLocation}
            >
              Add
            </button>
          </div>
        </div>
      </div>

      {/* Age Range */}
      <div>
        <label className="block text-sm mb-2">Age Range</label>
        <div className="px-2">
          <div className="relative h-2 bg-gray-700 rounded-full">
            <div
              className="absolute h-2 bg-blue-600 rounded-full"
              style={{
                left: `${((ageRange[0] - 18) * 100) / (65 - 18)}%`,
                width: `${((ageRange[1] - ageRange[0]) * 100) / (65 - 18)}%`
              }}
            ></div>
            <div
              className="absolute w-4 h-4 bg-white rounded-full -mt-1 -ml-2 cursor-pointer"
              style={{
                left: `${((ageRange[0] - 18) * 100) / (65 - 18)}%`
              }}
            ></div>
            <div
              className="absolute w-4 h-4 bg-white rounded-full -mt-1 -ml-2 cursor-pointer"
              style={{
                left: `${((ageRange[1] - 18) * 100) / (65 - 18)}%`
              }}
            ></div>
          </div>
          <div className="flex justify-between mt-2 text-xs text-gray-400">
            <span>18</span>
            <span>65+</span>
          </div>
          <div className="text-center text-sm mt-1">
            {ageRange[0]} - {ageRange[1]}
          </div>
          <div className="flex justify-between mt-3">
            <button
              className="px-2 py-1 bg-gray-800 text-sm rounded"
              onClick={() =>
                setAgeRange([
                  Math.max(18, ageRange[0] - 5),
                  ageRange[1]
                ])
              }
              disabled={ageRange[0] <= 18}
            >
              Younger
            </button>
            <button
              className="px-2 py-1 bg-gray-800 text-sm rounded"
              onClick={() =>
                setAgeRange([
                  ageRange[0],
                  Math.min(65, ageRange[1] + 5)
                ])
              }
              disabled={ageRange[1] >= 65}
            >
              Older
            </button>
          </div>
        </div>
      </div>

      {/* All Filters in one place with different colors */}
      <div>
        <label className="block text-sm mb-2">Filters</label>
        <div className="space-y-2">
          {/* Show all filters in one place but with different colors */}
          <div className="flex flex-wrap gap-2">
            {/* Regular filters */}
            {targetedInterests.map((f, i) => (
              <div key={i} className="flex items-center bg-gray-800 px-3 py-1 rounded">
                <span className="mr-2">{f}</span>
                <XCircle
                  size={14}
                  className="cursor-pointer text-gray-400 hover:text-red-500"
                  onClick={() => removeFilter(f)}
                />
              </div>
            ))}
            
            {/* Behavioral filters with blue color */}
            {behavioralFilters.map((f, i) => (
              <div key={`beh-${i}`} className="flex items-center bg-blue-900 px-3 py-1 rounded">
                <span className="mr-2 text-blue-300">{f}</span>
                <XCircle
                  size={14}
                  className="cursor-pointer text-blue-400 hover:text-red-500"
                  onClick={() => removeBehavioralFilter(f)}
                />
              </div>
            ))}
            
            {/* Demographic filters with green color */}
            {demographicFilters.map((f, i) => (
              <div key={`dem-${i}`} className="flex items-center bg-green-900 px-3 py-1 rounded">
                <span className="mr-2 text-green-300">{f}</span>
                <XCircle
                  size={14}
                  className="cursor-pointer text-green-400 hover:text-red-500"
                  onClick={() => removeDemographicFilter(f)}
                />
              </div>
            ))}
          </div>
          
          <div className="flex">
            <input
              type="text"
              placeholder="Add filter"
              value={newInterest}
              onChange={e => setNewInterest(e.target.value)}
              className="flex-grow px-3 py-2 bg-gray-900 border border-gray-700 rounded-l-md"
              onKeyDown={e => e.key === 'Enter' && addFilter()}
            />
            <button className="bg-blue-600 px-4 rounded-r-md" onClick={addFilter}>
              Add
            </button>
          </div>
        </div>
      </div>

      {/* Gender */}
      <div>
        <label className="block text-sm mb-2">Gender</label>
        <div className="flex space-x-4">
          <label className="flex items-center cursor-pointer">
            <input
              type="radio"
              className="h-4 w-4 mr-2 accent-blue-500"
              checked={gender === 'All'}
              onChange={() => setGender('All')}
            />
            <span>All</span>
          </label>
          <label className="flex items-center cursor-pointer">
            <input
              type="radio"
              className="h-4 w-4 mr-2 accent-blue-500"
              checked={gender === 'Male'}
              onChange={() => setGender('Male')}
            />
            <span>Male</span>
          </label>
          <label className="flex items-center cursor-pointer">
            <input
              type="radio"
              className="h-4 w-4 mr-2 accent-blue-500"
              checked={gender === 'Female'}
              onChange={() => setGender('Female')}
            />
            <span>Female</span>
          </label>
        </div>
      </div>
    </div>
  );

  // Placement Settings
  const PlacementSettings = () => (
    <div className="space-y-6">
      <h3 className="font-medium mb-3">Ad Placements</h3>
      <div className="space-y-2">
        <label className="block text-sm mb-2">Instagram Placements</label>
        <div className="space-y-2">
          <label className="flex items-center p-2 bg-gray-800 rounded cursor-pointer">
            <input
              type="checkbox"
              className="h-4 w-4 mr-2 accent-blue-500"
              checked={adPlacements.instagram_stories}
              onChange={() =>
                setAdPlacements(prev => ({
                  ...prev,
                  instagram_stories: !prev.instagram_stories
                }))
              }
            />
            <span className="text-sm">Instagram Stories</span>
          </label>
        </div>
      </div>
    </div>
  );

  // Budget Settings
  const BudgetSettings = () => (
    <div className="space-y-6">
      <h3 className="font-medium mb-3">Budget Settings</h3>
      <div>
        <label className="block text-sm mb-2">Daily Budget</label>
        <div className="relative">
          <input
            type="text"
            value={budget}
            onChange={e => setBudget(e.target.value)}
            placeholder="Enter daily budget"
            className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-md pr-16"
          />
          <div className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 pointer-events-none">
            <span>USD</span>
          </div>
        </div>
      </div>
      <div className="space-y-2">
        <label className="block text-sm mb-2">Campaign Duration</label>
        <div className="flex space-x-2">
          <button className="flex-1 py-2 bg-gray-800 rounded-md">
            Ongoing
          </button>
          <button className="flex-1 py-2 bg-gray-800 rounded-md">
            Set End Date
          </button>
        </div>
      </div>
    </div>
  );

  // Creative Settings
  const CreativeSettings = () => (
    <div className="space-y-6">
      <h3 className="font-medium mb-3">Creative Settings</h3>
      <div>
        <label className="text-sm mb-1 block">Headline</label>
        <input
          type="text"
          value={adHeadline}
          onChange={e => setAdHeadline(e.target.value)}
          className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div>
        <label className="text-sm mb-1 block">Description</label>
        <textarea
          value={adText}
          onChange={e => setAdText(e.target.value)}
          className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 h-32"
        />
      </div>

      <div>
        <label className="text-sm mb-1 block">Media</label>
        <div
          className="flex items-center justify-center h-24 w-full border-2 border-dashed border-gray-600 rounded-lg hover:border-gray-400 transition-colors cursor-pointer"
          onClick={() => fileInputRef.current?.click()}
        >
          <div className="flex flex-col items-center text-gray-400">
            <Upload className="mb-1" size={20} />
            <span className="text-xs">Upload Additional Media</span>
          </div>
        </div>

        {mediaItems.length > 0 && (
          <div className="mt-3 flex gap-2 overflow-x-auto pb-2">
            {mediaItems.map(item => (
              <div key={item.id} className="relative w-20 h-20 flex-shrink-0">
                <img
                  src={item.url}
                  alt="Media preview"
                  className="w-full h-full object-cover rounded-md"
                />
                <button
                  className="absolute -top-2 -right-2 bg-gray-800 rounded-full p-1"
                  onClick={() =>
                    setMediaItems(prev => prev.filter(m => m.id !== item.id))
                  }
                >
                  <XCircle size={16} className="text-red-500" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  // Campaign Settings Modal
  const CampaignSettingsModal = ({
    isOpen,
    onClose
  }: {
    isOpen: boolean;
    onClose: () => void;
  }) => {
    if (!isOpen) return null;

    const renderSettingsContent = () => {
      switch (currentEditSection) {
        case 'objective':
          return <ObjectiveSettings />;
        case 'audience':
          return <AudienceSettings />;
        case 'placements':
          return <PlacementSettings />;
        case 'budget':
          return <BudgetSettings />;
        case 'creative':
          return <CreativeSettings />;
        default:
          return null;
      }
    };

    return (
      <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center">
        <div className="bg-gray-900 rounded-xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
          <div className="p-4 border-b border-gray-700 flex justify-between">
            <h2 className="text-xl font-medium">
              {currentEditSection === 'objective' && 'Campaign Objective'}
              {currentEditSection === 'audience' && 'Audience Settings'}
              {currentEditSection === 'placements' && 'Ad Placements'}
              {currentEditSection === 'budget' && 'Budget Settings'}
              {currentEditSection === 'creative' && 'Creative Settings'}
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

      {renderHeader()}

      {isLoading ? renderLoadingScreen() : (
        activeTab === 'create' ? renderCreateScreen() : renderReviewScreen()
      )}

      {/* Settings Edit Modal */}
      <CampaignSettingsModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
      />
    </div>
  );
}

export default CreateCampaignScreen;