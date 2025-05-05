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
import { loadingSteps } from '../utils';
import { CampaignSettingsModal } from './CampaignSettingsModal';

export function CreateCampaignForm() {
  // Media upload state
  const { 
    mediaItems, 
    setMediaItems, 
    fileInputRef, 
    handleFileUpload, 
    removeMediaItem, 
    campaignSessionId,
    isUploading,
    cooldownActive,
    cooldownTimeRemaining
  } = useMediaUpload();
  
  // Main states
  const [link, setLink] = useState('');
  const [budget, setBudget] = useState('');
  const [selectedLeadFormId, setSelectedLeadFormId] = useState<string>("");
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  // URL validation to ensure all links have https:// but no www.
  const validateAndFixUrl = (url: string) => {
    if (!url || url.trim() === '') return url;
    
    // Remove www. if present
    let cleanUrl = url.replace(/^(https?:\/\/)?(www\.)/i, '');
    
    // Add https:// if not present
    if (!cleanUrl.match(/^https?:\/\//i)) {
      return `https://${cleanUrl}`;
    }
    
    return cleanUrl;
  };
  
  // Check if a URL is valid (has a TLD after adding https://)
  const isValidUrl = (url: string) => {
    if (!url || url.trim() === '') return false;
    
    try {
      // Ensure URL has protocol before checking
      const urlWithProtocol = url.match(/^https?:\/\//i) ? url : `https://${url}`;
      const urlObj = new URL(urlWithProtocol);
      
      // Check for a valid domain with at least one dot (to ensure there's a TLD)
      return urlObj.hostname.includes('.') && urlObj.hostname.split('.').pop()!.length > 0;
    } catch (e) {
      return false;
    }
  };

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
  const [targetedInterests, setTargetedInterests] = useState(['Advantage Plus']);
  const [newInterest, setNewInterest] = useState('');
  const [gender, setGender] = useState<Gender>('All');

  // Additional filters - changed to string arrays instead of booleans
  const [behavioralFilters, setBehavioralFilters] = useState<string[]>(['Advantage Plus']);
  const [demographicFilters, setDemographicFilters] = useState<string[]>(['Advantage Plus']);

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
    console.log('🔍 Starting review transition process');
    
    // Ensure link has https:// before submission
    if (link) {
      setLink(validateAndFixUrl(link));
    }
    
    // Check for required fields
    if (mediaItems.length === 0 || !link || !budget) {
      console.warn('⚠️ Missing required data:', {
        'Media items': mediaItems.length,
        'Link provided': !!link,
        'Budget provided': !!budget
      });
      return;
    }
    
    // Validate budget format - must be a number
    if (isNaN(parseFloat(budget))) {
      console.warn('⚠️ Invalid budget format:', budget);
      setError('Please enter a valid budget amount');
      return;
    }
    
    // Validate that link has a TLD
    if (link && !isValidUrl(link)) {
      console.warn('⚠️ Invalid URL format - missing TLD:', link);
      setError('Please enter a valid website URL with a domain extension (e.g. .com, .org)');
      return;
    }
    
    // Check if any videos are in the media items
    const videoItems = mediaItems.filter(item => item.type === 'video');
    if (videoItems.length > 0) {
      console.log('🎬 Videos detected in upload:', videoItems.length);
      
      // Set loading state first so UI updates immediately
      console.log('🔄 Setting loading state');
      setIsLoading(true);
      setLoadingStep(0);
      setError(null);
      
      // No need to wait for videos to process
      // We will handle errors properly if Facebook hasn't finished processing
      console.log('🎬 Video detected - proceeding without delay');
      console.log('ℹ️ If campaign creation fails due to video processing, user will get clear instructions');
      
      // Continue execution to the API call below
      // We don't return here as we want to proceed with the API call
    }

    console.log('🔄 Setting loading state');
    setIsLoading(true);
    setLoadingStep(0);
    setError(null);
    
    // Animation intervals for moving through loading state
    const maxSteps = loadingSteps ? loadingSteps.length - 1 : 6; // Default to 7 steps (0-6) if loadingSteps is undefined
    const loadingInterval = setInterval(() => {
      setLoadingStep(prev => {
        if (prev < maxSteps) {
          return prev + 1;
        }
        return prev;
      });
    }, 1500); // Show each loading step for 1.5 seconds (reduced from 3 seconds)
    
    try {
      // Log all input values to debug
      console.log('💰 Budget value being used:', budget, typeof budget);
      
      // Check for a valid campaign session ID
      let sessionId = campaignSessionId;
      console.log('🔑 Initial campaign session ID:', sessionId);
      
      if (!sessionId) {
        console.log('🔍 Campaign session ID not found directly, trying to extract from media items');
        // Try to get session ID from completed uploads
        const mediaWithHash = mediaItems.filter(item => item.progress === 100 && item.hash);
        console.log('📊 Media items with completed uploads:', mediaWithHash.length);
        
        if (mediaWithHash.length === 0) {
          console.error('❌ No valid uploads found');
          throw new Error('No valid uploads found. Please upload media first.');
        }
        // Use the campaign_session_id from the API response stored with the first successful upload
        sessionId = mediaWithHash[0].hash || null;
        console.log('🔑 Using session ID from media:', sessionId);
      }
      
      // Prepare data for master flow API call
      const imageHashes = mediaItems
        .filter(item => item.type === 'image' && item.hash)
        .map(item => item.hash as string);
      
      // Extract video IDs from video media items
      // IMPORTANT: These are the final video_ids from the last chunk responses
      // These are the definitive video_ids that FB API expects for campaign creation
      // They are different from the upload_session_ids
      const videoIds = mediaItems
        .filter(item => item.type === 'video' && item.hash)
        .map(item => {
          console.log(`🎬 Using video ID for campaign creation: ${item.hash}`);
          return item.hash as string;
        });
      
      console.log('📊 Prepared media data:', {
        'Image hashes': imageHashes,
        'Video IDs': videoIds
      });
      
      // Get user information for API call
      console.log('🔍 Fetching user details');
      const userDetailResponse = await fetch('/api/kv/fetch-api-token');
      console.log('📡 User details API response status:', userDetailResponse.status);
      
      const userData = await userDetailResponse.json();
      console.log('📊 User details response received:', 
        userData.success ? 'Success' : 'Failed', 
        userData.account ? 'Account data found' : 'No account data');
      
      if (!userData.success) {
        console.error('❌ Failed to fetch user details');
        throw new Error('Failed to fetch user details');
      }
      
      // Prepare location data based on targeted locations
      let locationData = [];
      
      // First check if user has saved locations from onboarding that are valid
      if (userData.account?.locations && 
          Array.isArray(userData.account.locations) && 
          userData.account.locations.length > 0) {
        
        // Validate that location data has proper country information
        const validLocations = userData.account.locations.filter((loc: any) => 
          loc && 
          loc.country && 
          typeof loc.country === 'object' &&
          loc.country.name && 
          loc.country.code
        );
        
        if (validLocations.length > 0) {
          console.log('📍 Using valid user saved locations:', validLocations.length);
          // User locations are in the correct format, use them directly
          locationData = validLocations;
        } else {
          console.warn('⚠️ User has locations but they are invalid or empty, falling back to default');
        }
      }
      
      // If no valid saved locations but we have targetedLocations, use those instead
      if (locationData.length === 0 && targetedLocations && targetedLocations.length > 0) {
        console.log('📍 Using predefined targeted locations from props:', targetedLocations);
        
        // Format location data according to API requirements
        locationData = targetedLocations.map(location => {
          // Simple case for just country names
          const countryCode = getCountryCode(location);
          console.log(`🗺️ Mapping location ${location} to code ${countryCode}`);
          return {
            country: {
              name: location,
              code: countryCode
            },
            regions: []
          };
        });
      } 
      
      // No valid locations at all, use default Netherlands
      if (locationData.length === 0) {
        console.log('📍 No valid locations available, using default (Netherlands)');
        // Default location if none provided
        locationData = [
          {
            country: {
              name: "Netherlands",
              code: "NL"
            },
            regions: []
          }
        ];
      }
      
      // Log the final location data for debugging
      console.log('📍 Original location data:', JSON.stringify(locationData, null, 2));
      
      // Make sure locations from the same country are preserved correctly
      // Some countries may have multiple regions that need to be preserved
      if (locationData && locationData.length > 0) {
        // Make sure all locations are included, even if they're from the same country
        console.log('📍 Locations count check:', locationData.length);
        // Log detailed location structure for each entry
        locationData.forEach((loc: any, index: number) => {
          console.log(`📍 Location ${index + 1}:`, {
            'Country': loc.country?.name,
            'Regions': loc.regions?.map((r: any) => r.name),
            'Has Cities': loc.regions?.some((r: any) => r.cities?.length > 0)
          });
        });
      }
      
      console.log('📍 Final location data:', JSON.stringify(locationData, null, 2));
      
      // Include AI guidance in profile data if provided
      let profileData = userData.account?.defaultExtraDetails || '';
      if (aiGuidance && aiGuidance.trim() !== '') {
        console.log('💬 Including AI guidance in profile data');
        profileData = profileData + "\n\nThe user explicitly stated that they want: " + aiGuidance;
      }
      
      const companyName = userData.account?.companyName;
      console.log('🏢 Using company name:', companyName);
      
      const pageId = userData.account?.fbPageId ? String(userData.account.fbPageId) : '';
      console.log('📱 Using page ID:', pageId || 'None provided');
      
      // No delay needed - removed for better UX
      console.log('🔄 Proceeding immediately with campaign creation');
      
      // Prepare request payload - based on exact API documentation format
      const requestPayload = {
        fb_account_id: userData.account?.fbAccountId || '',
        campaign_flow_session_id: sessionId,
        company_name: companyName, // Make sure company_name is always present
        profile_data: profileData,
        location_data: locationData,
        page_id: pageId,
        image_hashes: imageHashes,
        video_ids: videoIds,
        daily_campaign_budget: budget, // Use daily_campaign_budget as shown in documentation example
        website_link: link,
        preferred_language: userData.account?.preferred_language || "en",
        privacy_policy_link: userData.account?.privacy_policy_link || '',
        instagram_account_id: userData.account?.instagramAccountId || '',
        post_assessment_campaign_objective: 'auto',
        selected_lead_form_id: selectedLeadFormId

      };
      
      // Add post_assessment_campaign_objective parameter only if a specific objective is selected
      if (campaignObjective && ['recruitment', 'lead_generation', 'conversions', 'awareness'].includes(campaignObjective)) {
        console.log(`🎯 Adding specific campaign objective: ${campaignObjective}`);
        requestPayload.post_assessment_campaign_objective = campaignObjective;
      }

      console.log('📤 Sending request to master flow endpoint with payload:', JSON.stringify(requestPayload, null, 2));
      
      // Make the API call to master flow endpoint
      console.log('📡 Sending master flow request for session ID:', sessionId);
      console.log('📡 Using video IDs:', videoIds);
      
      const response = await fetch('/api/master-flow-initiate-process', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
          // No fb_api_key header - server will use internal API key
        },
        body: JSON.stringify(requestPayload)
      });
      
      console.log('📡 Master flow API response status:', response.status);
      
      if (!response.ok) {
        console.error('❌ Master flow API returned error status:', response.status);
        const errorData = await response.json();
        console.error('❌ Error data:', JSON.stringify(errorData, null, 2));
        
        // Provide more detailed error for video-related issues
        if (videoIds && videoIds.length > 0 && response.status === 500) {
          console.error('❌ Potential issue with video processing - check video IDs:', videoIds);
          
          // Check if this is a Facebook GraphMethodException (object doesn't exist error)
          if (errorData.details?.raw_error && errorData.details.raw_error.includes('Object with ID')) {
            console.error('❌ Facebook API error: Video object not found or has incorrect format');
            
            // Very specific and helpful error message about Facebook video processing
            throw new Error(
              `Facebook hasn't finished processing your video (ID: ${videoIds[0]}).` +
              ` Facebook needs to generate thumbnails and process videos before using them in ads (typically 5-10 minutes).` +
              ` Please wait a few minutes and try again with the exact same settings.` +
              ` This is a normal part of Facebook's video processing workflow.`
            );
          } else {
            throw new Error(
              `There was an issue creating your campaign with video.` +
              ` The most likely reason is that Facebook is still processing your video.` +
              ` Please wait 5-10 minutes and try again with the same settings.`
            );
          }
        } else {
          throw new Error(errorData.error || 'Failed to create campaign flow');
        }
      }
      
      // Store response data
      const data = await response.json();
      console.log('✅ Master flow response received successfully');
      console.log('📊 Master flow response data:', JSON.stringify(data, null, 2));
      setMasterFlowData(data);
      
      // No delay needed - removed for better UX
      console.log('🔄 Proceeding immediately to review screen');
      
      // Switch to review tab after API call and animation completes
      console.log('🔄 Switching to review tab');
      setIsLoading(false);
      setActiveTab('review');
      
    } catch (error) {
      console.error('❌ Exception in master flow process:', error);
      setError(typeof error === 'object' && error !== null && 'message' in error 
        ? (error as Error).message 
        : 'Failed to process campaign');
      setIsLoading(false);
    } finally {
      clearInterval(loadingInterval);
    }
  };
  
  // Helper function to get country code from country name
  const getCountryCode = (countryName: string): string => {
    const countryCodes: Record<string, string> = {
      'United States': 'US',
      'United States of America': 'US',
      'USA': 'US',
      'Canada': 'CA',
      'United Kingdom': 'GB',
      'UK': 'GB',
      'Australia': 'AU',
      'Germany': 'DE',
      'France': 'FR',
      'Italy': 'IT',
      'Spain': 'ES',
      'Netherlands': 'NL',
      'Sweden': 'SE',
      'Norway': 'NO',
      'Denmark': 'DK',
      'Finland': 'FI',
      'Japan': 'JP',
      'China': 'CN',
      'India': 'IN',
      'Brazil': 'BR'
    };
    
    return countryCodes[countryName] || 'US'; // Default to US if not found
  };

  // Launch confetti on publish and finalize the campaign with the API
  const handlePublish = async () => {
    console.log('🚀 Starting campaign publish process');
    
    if (!masterFlowData) {
      console.error('❌ No campaign data available');
      setError('No campaign data available. Please try again.');
      return;
    }
    
    console.log('📊 Master flow data available:', {
      'Campaign session ID': masterFlowData.campaign_flow_session_id,
      'Campaign name': masterFlowData.campaign_name,
      'Campaign objective': masterFlowData.campaign_objective
    });
    
    console.log('🔄 Setting loading state');
    setIsLoading(true);
    setLoadingStep(0);
    
    // Animation intervals for moving through loading state
    const maxSteps = loadingSteps ? loadingSteps.length - 1 : 6; // Default to 7 steps (0-6) if loadingSteps is undefined
    const loadingInterval = setInterval(() => {
      setLoadingStep(prev => {
        if (prev < maxSteps) {
          return prev + 1;
        }
        return prev;
      });
    }, 1500); // Show each loading step for 1.5 seconds (reduced from 3 seconds)
    
    try {
      // Get user information for API call
      console.log('🔍 Fetching user details');
      const userDetailResponse = await fetch('/api/kv/fetch-api-token');
      console.log('📡 User details API response status:', userDetailResponse.status);
      
      const userData = await userDetailResponse.json();
      console.log('📊 User details response received:', 
        userData.success ? 'Success' : 'Failed', 
        userData.account ? 'Account data found' : 'No account data');
      
      if (!userData.success) {
        console.error('❌ Failed to fetch user details');
        throw new Error('Failed to fetch user details');
      }
      
      // Get and validate required parameters
      const fbAccountId = userData.account?.fbAccountId || '';
      // Ensure account ID has act_ prefix (required by backend)
      const formattedFbAccountId = fbAccountId.startsWith('act_') ? fbAccountId : `act_${fbAccountId}`;
      
      const pageId = userData.account?.fbPageId ? String(userData.account.fbPageId) : '';
      const campaignFlowSessionId = masterFlowData.campaign_flow_session_id;
      
      // Validate all required fields are present
      if (!formattedFbAccountId) {
        console.error('❌ Missing Facebook Account ID');
        throw new Error('Facebook Account ID is required but missing');
      }
      
      if (!campaignFlowSessionId) {
        console.error('❌ Missing Campaign Flow Session ID');
        throw new Error('Campaign Flow Session ID is required but missing');
      }
      
      if (!pageId) {
        console.error('❌ Missing Page ID');
        throw new Error('Facebook Page ID is required but missing');
      }
      
      console.log('📊 Campaign finalization parameters:', {
        'FB Account ID': formattedFbAccountId,
        'Campaign Flow Session ID': campaignFlowSessionId,
        'Page ID': pageId
      });
      
      // Prepare request payload with correctly formatted parameters
      const requestPayload = {
        fb_account_id: formattedFbAccountId,
        campaign_flow_session_id: campaignFlowSessionId,
        page_id: pageId
      };
      
      console.log('📤 Sending request to finalize campaign with payload:', JSON.stringify(requestPayload, null, 2));
      
      // No delay needed - removed for better UX
      console.log('🔄 Proceeding immediately with campaign finalization');
      
      // Make the API call to finalize the campaign
      const response = await fetch('/api/fasty-bot/proxy-finalize-campaign', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
          // No fb_api_key header - server will use internal API key
        },
        body: JSON.stringify(requestPayload)
      });
      
      console.log('📡 Finalize campaign API response status:', response.status);
      
      if (!response.ok) {
        console.error('❌ Finalize campaign API returned error status:', response.status);
        const errorData = await response.json();
        console.error('❌ Error data:', JSON.stringify(errorData, null, 2));
        throw new Error(errorData.error || 'Failed to finalize campaign');
      }
      
      const finalizeData = await response.json();
      console.log('✅ Campaign finalized successfully');
      console.log('📊 Finalize response data:', JSON.stringify(finalizeData, null, 2));
      
      // No delay needed - removed for better UX
      console.log('🔄 Proceeding immediately to success state');
      
      // Show success animation
      console.log('🎉 Launching confetti animation');
      confetti({
        particleCount: 150,
        spread: 70,
        origin: { y: 0.6 }
      });
      
      // Send the AI reasoning to the chat if we have master flow data
      console.log('📝 Preparing AI reasoning message for chat');
      try {
        // Construct the reasoning message from the master flow data
        let reasoningMessage = '';
        
        if (masterFlowData.campaign_objective) {
          console.log('📋 Adding campaign objective to reasoning');
          reasoningMessage += `**Campaign Objective:** ${masterFlowData.campaign_objective}\n\n`;
        }
        
        if (masterFlowData.age_gender_decision_reason) {
          console.log('📋 Adding targeting recommendation to reasoning');
          reasoningMessage += `**Targeting Recommendation:** ${masterFlowData.age_gender_decision_reason}\n\n`;
        }
        
        // Format audience data if available
        if (masterFlowData.audiences && masterFlowData.audiences.audiences) {
          console.log('📋 Adding audience data to reasoning');
          reasoningMessage += `**Created Audiences:**\n`;
          masterFlowData.audiences.audiences.forEach((audience: any, index: number) => {
            reasoningMessage += `- Audience ${index + 1}: Budget $${audience.budget}/day, Age ${audience.min_age}-${audience.max_age}\n`;
          });
          reasoningMessage += `\n`;
        }
        
        // Format interest filters if available
        if (masterFlowData.suggested_targeting_filters && masterFlowData.suggested_targeting_filters.targeting_filters) {
          const interestFilters = masterFlowData.suggested_targeting_filters.targeting_filters.interest_filters;
          if (interestFilters && Object.keys(interestFilters).length > 0) {
            console.log('📋 Adding interest targeting to reasoning');
            reasoningMessage += `**Interest Targeting:**\n`;
            Object.keys(interestFilters).forEach(interest => {
              reasoningMessage += `- ${interest}\n`;
            });
            reasoningMessage += `\n`;
          }
        }
        
        // Add creative information
        if (masterFlowData.ad_creative_text) {
          console.log('📋 Adding ad creative details to reasoning');
          reasoningMessage += `**Ad Creative:**\n`;
          reasoningMessage += `- Title: ${masterFlowData.ad_creative_text.ad_creative_title}\n`;
          reasoningMessage += `- Description: ${masterFlowData.ad_creative_text.ad_creative_description.substring(0, 100)}...\n\n`;
        }
        
        // If we have any reasoning to send
        if (reasoningMessage) {
          console.log('📤 Sending AI reasoning to chat');
          const chatMessage = `I've created your campaign with the following details:\n\n${reasoningMessage}\nYour campaign is now live and will start running soon!`;
          
          // Call the API to submit the message to the chat
          const chatResponse = await fetch('/api/fasty-bot/proxy-submit-message', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              message: chatMessage,
              role: 'assistant'
            })
          });
          
          console.log('📡 Chat message API response status:', chatResponse.status);
          if (!chatResponse.ok) {
            console.warn('⚠️ Failed to send chat message, but continuing with success flow');
          } else {
            console.log('✅ Chat message sent successfully');
          }
        } else {
          console.log('ℹ️ No reasoning message to send to chat');
        }
      } catch (error) {
        console.error('❌ Error sending AI reasoning to chat:', error);
        console.log('ℹ️ Continuing with success flow despite chat error');
      }
      
      console.log('🔄 Showing success message');
      setShowSuccessMessage(true);
      
      console.log('⏱️ Setting timeout to hide success message after 2 seconds');
      setTimeout(() => {
        console.log('🔄 Hiding success message');
        setShowSuccessMessage(false);
      }, 2000); // Reduced from 3000ms to 2000ms for better user experience
      
    } catch (error) {
      console.error('❌ Exception in campaign finalization:', error);
      setError(typeof error === 'object' && error !== null && 'message' in error 
        ? (error as Error).message 
        : 'Failed to finalize campaign');
    } finally {
      console.log('🔄 Clearing loading state');
      clearInterval(loadingInterval);
      setIsLoading(false);
    }
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
    <div className="flex flex-col h-full bg-container-bg text-text-white p-6 relative rounded-xl border border-border-dark shadow-[0_4px_12px_rgba(0,0,0,0.1)]">
      {/* Success overlay */}
      {showSuccessMessage && (
        <div className="absolute inset-0 bg-dark-bg/90 flex items-center justify-center z-10 rounded-xl backdrop-blur-sm">
          <div className="text-center p-6">
            <div className="w-20 h-20 rounded-full bg-primary-green mx-auto flex items-center justify-center mb-4">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-10 w-10 text-deep-black"
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
            <h3 className="text-xl font-bold text-text-white mb-2">Thanks!</h3>
            <p className="text-text-light-gray">Your campaign has been launched.</p>
          </div>
        </div>
      )}

      {/* Error message */}
      {error && (
        <div className="absolute inset-0 bg-dark-bg/90 flex items-center justify-center z-10 rounded-xl backdrop-blur-sm">
          <div className="text-center p-6">
            <div className="w-20 h-20 rounded-full bg-red-500 mx-auto flex items-center justify-center mb-4">
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                className="h-10 w-10 text-text-white" 
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
            <h3 className="text-xl font-bold text-text-white mb-2">Error</h3>
            <p className="text-text-light-gray">{error}</p>
            <button 
              className="mt-4 px-4 py-2 bg-container-bg rounded-lg hover:bg-border-dark border border-border-dark transition-all duration-200"
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

      {isLoading ? (
        activeTab === 'create' 
          ? <LoadingScreen loadingStep={loadingStep} error={error} mode="initialize" />
          : <LoadingScreen loadingStep={loadingStep} error={error} mode="launch" />
      ) : (
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
            isUploading={isUploading}
            cooldownActive={cooldownActive}
            cooldownTimeRemaining={cooldownTimeRemaining}
            selectedLeadFormId={selectedLeadFormId}
            setSelectedLeadFormId={setSelectedLeadFormId}
          />
        ) : (
          <ReviewScreen 
            activePreviewTab={activePreviewTab}
            setActivePreviewTab={setActivePreviewTab}
            mediaItems={mediaItems}
            campaignObjective={masterFlowData?.campaign_objective ?? campaignObjective}
            targetedLocations={Array.isArray(masterFlowData?.selected_locations) 
              ? masterFlowData.selected_locations.map((loc: any) => loc.name) 
              : targetedLocations}
            ageRange={masterFlowData 
              ? [masterFlowData.suggested_age_min, masterFlowData.suggested_age_max] 
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
            link={link}
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