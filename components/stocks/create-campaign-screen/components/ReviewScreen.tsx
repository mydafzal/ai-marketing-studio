import React, { useState, useEffect, useRef } from 'react';
import { MediaItem, Gender, PreviewTab, AdPlacements, MasterFlowResponse } from '../types';
import { Creative as LibCreative } from '@/lib/types';

// Create a combined interface that includes properties from both Creative interfaces
interface ExtendedCreative extends Partial<LibCreative> {
  creative_id: string;
  preview_uuid: string;
  is_image?: boolean;
  is_video?: boolean;
  previews: any;
  media_id?: string;
  media_url?: string;
  media_type?: 'video' | 'image';
}
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { 
  Eye, Target, MapPin, Globe, Users, Calendar, Info, Filter, Settings, 
  Layout, MessageSquare, FileText, Image, Cog, FolderHeart,
  File, Lock, ThumbsUp as CheckCircle, Settings2
} from 'lucide-react';
import { AdSetupModal } from './AdSetupModal';

// Instead of extending MasterFlowResponse, we'll use type assertion in the component
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
  link?: string; // Website URL
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
  link,
  openEditModal,
  handlePublish,
  masterFlowData
}: ReviewScreenProps) {
  // State to track updated creatives from any text edits
  const [updatedCreatives, setUpdatedCreatives] = useState<ExtendedCreative[]>([]);
  
  // State to track which creative is currently being viewed
  const [currentCreativeIndex, setCurrentCreativeIndex] = useState<number>(0);
  
  const [creativeId, setCreativeId] = useState<string>("");
  const [adFormat, setAdFormat] = useState<string>("INSTAGRAM_STANDARD");
  const [previewHtml, setPreviewHtml] = useState<string>("");  
  const previewRef = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [isAdSetupModalOpen, setIsAdSetupModalOpen] = useState(false);

  // Get all creatives - either from updatedCreatives, master flow data, or media items
  const getCreatives = (): ExtendedCreative[] => {
    // If we have updated creatives from text edits, use those
    if (updatedCreatives.length > 0) {
      return updatedCreatives;
    }
    
    // Otherwise use creatives from master flow data
    if (masterFlowData?.creatives_and_previews?.creatives && 
        masterFlowData.creatives_and_previews.creatives.length > 0) {
      return masterFlowData.creatives_and_previews.creatives as ExtendedCreative[];
    }
    
    // If no creatives in master flow data, create mock creatives from media items
    return mediaItems.map((item, index) => {
      const isVideo = item.type === 'video';
      return {
        creative_id: `media-${index}`,
        preview_uuid: '',
        media_type: item.type,
        is_video: isVideo,
        is_image: !isVideo,
        media_id: item.id,
        media_url: item.url,
        previews: []
      } as ExtendedCreative;
    });
  };
  
  // Get the creatives array
  const creatives = getCreatives();
  
  // Calculate total number of creatives
  const totalCreatives = creatives.length;
  
  // Navigate to previous creative
  const navigateToPrevCreative = () => {
    if (totalCreatives <= 1) return;
    setCurrentCreativeIndex(prev => (prev - 1 + totalCreatives) % totalCreatives);
  };
  
  // Navigate to next creative
  const navigateToNextCreative = () => {
    if (totalCreatives <= 1) return;
    setCurrentCreativeIndex(prev => (prev + 1) % totalCreatives);
  };

  // Update current creative ID when index changes or creatives array changes
  useEffect(() => {
    if (creatives.length === 0) return;
    
    // Make sure index is within bounds
    const safeIndex = Math.min(currentCreativeIndex, creatives.length - 1);
    
    const creative = creatives[safeIndex];
    if (creative?.creative_id) {
      setCreativeId(creative.creative_id);
      
      // Set a default format based on the creative type
      if (creative.media_type === 'video' || creative.is_video) {
        setAdFormat("INSTAGRAM_STANDARD");
      } else {
        setAdFormat("INSTAGRAM_STANDARD");
      }
    }
  }, [currentCreativeIndex, creatives]);

  // Fetch the creative preview HTML when creative ID or ad format changes
  useEffect(() => {
    const fetchPreview = async () => {
      if (!creativeId) return;

      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch(`/api/fasty-bot/proxy-get-ad-creative-preview?creative_id=${creativeId}&ad_format=${adFormat}`);
        if (!response.ok) {
          throw new Error(`Failed to fetch preview: ${response.statusText}`);
        }

        const data = await response.json();
        if (data.success && data.preview_html) {
          // Pre-process HTML to prevent scaling issues
          setPreviewHtml(processHtml(data.preview_html));
        } else {
          throw new Error("Preview data not available");
        }
      } catch (err) {
        console.error("Error fetching preview:", err);
        setError(err instanceof Error ? err.message : "Failed to load preview");
      } finally {
        setIsLoading(false);
      }
    };

    if (creativeId) {
      fetchPreview();
    }
  }, [creativeId, adFormat]);

  // Modify iframes to be fixed size
  useEffect(() => {
    if (previewRef.current && !isLoading && previewHtml) {
      const iframes = previewRef.current.querySelectorAll('iframe');
      iframes.forEach(iframe => {
        // Set fixed dimensions
        iframe.setAttribute('scrolling', 'no');
        iframe.style.width = '313px';
        iframe.style.height = '534px';
        iframe.style.border = 'none';
        iframe.style.overflow = 'hidden';
        iframe.style.transform = 'none';
        iframe.style.transition = 'none';
        // Add CSS to hide scrollbars
        iframe.style.setProperty('-ms-overflow-style', 'none'); // IE and Edge
        iframe.style.scrollbarWidth = 'none'; // Firefox
        
        // Handle load event to reapply styles
        iframe.onload = () => {
          // Force the iframe to maintain our dimensions
          iframe.style.width = '313px';
          iframe.style.height = '534px';
          iframe.style.transform = 'none';
          
          // Try to access iframe content if possible
          try {
            if (iframe.contentWindow && iframe.contentWindow.document) {
              const doc = iframe.contentWindow.document;
              const style = doc.createElement('style');
              style.textContent = `
                html, body { 
                  width: 313px !important; 
                  height: 534px !important; 
                  transform: none !important; 
                  zoom: 1 !important;
                  overflow: hidden !important;
                  -ms-overflow-style: none !important;
                  scrollbar-width: none !important;
                }
                ::-webkit-scrollbar {
                  display: none !important;
                  width: 0 !important;
                  height: 0 !important;
                }
              `;
              doc.head.appendChild(style);
            }
          } catch (e) {
            console.log("Couldn't access iframe content:", e);
          }
        };
      });
    }
  }, [previewHtml, isLoading]);

  // Process HTML to prevent auto-scaling/resizing and hide scrollbars
  const processHtml = (html: string) => {
    // First, check if the HTML contains the Instagram Actor ID error message and replace it with a blank preview
    if (html.includes('Instagram Actor ID is required') || html.includes('Select an Instagram account')) {
      // Get the current creative to display proper info if available
      const currentCreative = creatives[currentCreativeIndex];
      const isUpdated = updatedCreatives.length > 0;
      
      // Return a simple placeholder that won't show the error
      return `
        <html>
          <head>
            <style>
              body {
                margin: 0;
                display: flex;
                align-items: center;
                justify-content: center;
                height: 100vh;
                background-color: #1A1D29;
                color: white;
                font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
              }
              .preview-placeholder {
                width: 313px;
                height: 534px;
                display: flex;
                align-items: center;
                justify-content: center;
                flex-direction: column;
                text-align: center;
                padding: 1rem;
                position: relative;
              }
              .ad-title {
                font-size: 18px;
                font-weight: bold;
                margin-bottom: 8px;
              }
              .ad-text {
                font-size: 14px;
                color: #ccc;
              }
              .creative-indicator {
                position: absolute;
                top: 20px;
                left: 20px;
                background-color: rgba(255, 255, 255, 0.1);
                color: #ccc;
                font-size: 12px;
                padding: 2px 8px;
                border-radius: 12px;
              }
              .updated-badge {
                position: absolute;
                top: 20px;
                right: 20px;
                background-color: rgba(34, 197, 94, 0.2);
                color: rgb(74, 222, 128);
                font-size: 12px;
                padding: 2px 8px;
                border-radius: 12px;
                border: 1px solid rgba(34, 197, 94, 0.3);
              }
            </style>
          </head>
          <body>
            <div class="preview-placeholder">
              ${totalCreatives > 1 ? `<div class="creative-indicator">Creative ${currentCreativeIndex + 1} of ${totalCreatives}</div>` : ''}
              ${isUpdated ? '<div class="updated-badge">Updated</div>' : ''}
              <div class="ad-title">${adHeadline || 'Ad Preview'}</div>
              <div class="ad-text">${adText?.substring(0, 100) || 'Ad description will appear here'} ${adText?.length > 100 ? '...' : ''}</div>
            </div>
          </body>
        </html>
      `;
    }
    
    return html
      .replace(/(<iframe[^>]*)(width="[^"]*"|height="[^"]*")/g, '$1')
      .replace(/(<iframe[^>]*)(style="[^"]*")/g, (match, p1, p2) => {
        return p1 + 'style="width:313px;height:534px;border:none;overflow:hidden;-ms-overflow-style:none;scrollbar-width:none;"';
      })
      .replace(/(<iframe[^>]*)(scrolling="[^"]*")/g, '$1 scrolling="no"')
      .replace(/scale\([^)]*\)/g, 'scale(1)')
      .replace(/transform:[^;]*;/g, 'transform:none;')
      .replace(/zoom:[^;]*;/g, 'zoom:1;')
      // Add CSS to hide scrollbars
      .replace(/<head>/g, '<head><style>::-webkit-scrollbar{display:none;width:0;height:0;}body::-webkit-scrollbar{display:none;}</style>');
  };

  // Safely render HTML content
  const renderHtml = () => {
    return { __html: previewHtml };
  };

  // Check for complex targeting filter structure from master flow response
  const hasComplexTargetingStructure = () => {
    return masterFlowData?.suggested_targeting_filters && 
           typeof masterFlowData.suggested_targeting_filters === 'object' && 
           !Array.isArray(masterFlowData.suggested_targeting_filters) && 
           (masterFlowData.suggested_targeting_filters as any).targeting_filters !== undefined;
  };

  // Get interest filters from the complex structure
  const getInterestFilters = () => {
    if (hasComplexTargetingStructure()) {
      const targeting = (masterFlowData?.suggested_targeting_filters as any).targeting_filters;
      if (targeting?.interest_filters) {
        // Return all interest filter names (keys)
        return Object.keys(targeting.interest_filters);
      }
    } else if (masterFlowData?.suggested_targeting_filters && Array.isArray(masterFlowData.suggested_targeting_filters)) {
      return masterFlowData.suggested_targeting_filters
        .filter(filter => filter.type === 'interest')
        .map(filter => filter.name);
    }
    return [];
  };

  // Get behavioral filters from the complex structure
  const getBehavioralFilters = () => {
    if (hasComplexTargetingStructure()) {
      const targeting = (masterFlowData?.suggested_targeting_filters as any).targeting_filters;
      if (targeting?.behaviour_filters) {
        // Return all behavior filter names (keys)
        return Object.keys(targeting.behaviour_filters);
      }
    } else if (masterFlowData?.suggested_targeting_filters && Array.isArray(masterFlowData.suggested_targeting_filters)) {
      return masterFlowData.suggested_targeting_filters
        .filter(filter => filter.type === 'behavior')
        .map(filter => filter.name);
    }
    return [];
  };

  // Get demographic filters from the complex structure
  const getDemographicFilters = () => {
    if (hasComplexTargetingStructure()) {
      const targeting = (masterFlowData?.suggested_targeting_filters as any).targeting_filters;
      if (targeting?.demographic_filters) {
        // Return all demographic filter names (keys)
        return Object.keys(targeting.demographic_filters);
      }
    } else if (masterFlowData?.suggested_targeting_filters && Array.isArray(masterFlowData.suggested_targeting_filters)) {
      return masterFlowData.suggested_targeting_filters
        .filter(filter => filter.type === 'demographic')
        .map(filter => filter.name);
    }
    return [];
  };

  // Function to display a list of objects in a readable format
  const formatObjectsForDisplay = (arr: any[] | undefined) => {
    if (!arr || !Array.isArray(arr) || arr.length === 0) return "None";
    
    return arr.map(item => {
      if (typeof item === 'string') return item;
      if (item.name) return item.name;
      if (item.country) return `${item.country}${item.region ? ` (${item.region})` : ''}`;
      return JSON.stringify(item);
    }).join(', ');
  };

  // Check if master flow data has placement information
  const hasPlacementData = masterFlowData?.hasOwnProperty('placements');
  
  // Check for lead form data
  const hasLeadFormData = masterFlowData?.lead_form_content !== undefined;
  
  // Track updated lead form data
  const [updatedLeadFormData, setUpdatedLeadFormData] = useState<any>(null);

  // Type assertion for campaign_name that might not be in the interface
  const campaignName = (masterFlowData as any)?.campaign_name;

  // Safe access for lead form properties using type assertion
  const leadFormContent = masterFlowData?.lead_form_content as any;
  
  // Process the lead form questions if they exist
  const processLeadFormQuestions = () => {
    // Use updated lead form data if available, otherwise use the original data
    const effectiveLeadFormContent = updatedLeadFormData || leadFormContent;
    
    if (!effectiveLeadFormContent) return [];
    
    // Check if we have questions in the lead_form_content
    if (effectiveLeadFormContent.lead_form_questions && Array.isArray(effectiveLeadFormContent.lead_form_questions)) {
      return effectiveLeadFormContent.lead_form_questions.map((question: string) => {
        return {
          type: question, // e.g. FIRST_NAME, LAST_NAME, EMAIL, PHONE
          label: formatQuestionLabel(question) // Format the label for display
        };
      });
    }
    
    // Check for custom_questions from the updated lead form
    if (effectiveLeadFormContent.custom_questions && Array.isArray(effectiveLeadFormContent.custom_questions)) {
      return effectiveLeadFormContent.custom_questions.map((question: string) => {
        return {
          type: question,
          label: formatQuestionLabel(question)
        };
      });
    }
    
    // Legacy format or data inside lead_form_data
    if (effectiveLeadFormContent.lead_form_data && effectiveLeadFormContent.lead_form_data.lead_form_questions) {
      return effectiveLeadFormContent.lead_form_data.lead_form_questions.map((question: string) => {
        return {
          type: question,
          label: formatQuestionLabel(question)
        };
      });
    }
    
    return [];
  };
  
  // Helper to format question labels from keys like FIRST_NAME to "First Name"
  const formatQuestionLabel = (questionKey: string): string => {
    if (!questionKey) return '';
    
    // Convert FIRST_NAME to "First Name"
    return questionKey
      .split('_')
      .map(word => word.charAt(0) + word.slice(1).toLowerCase())
      .join(' ');
  };
  
  // Get the lead form data
  const getLeadFormData = () => {
    // Use updated lead form data if available, otherwise use the original data
    const effectiveLeadFormContent = updatedLeadFormData || leadFormContent;
    
    if (!effectiveLeadFormContent) return null;
    
    // We need to handle two possible structures:
    // 1. Where properties are at the root of lead_form_content
    // 2. Where properties are nested inside lead_form_data
    // 3. Where properties come from updated lead form with different field names
    
    const data = effectiveLeadFormContent.lead_form_data || effectiveLeadFormContent;
    
    return {
      name: data.lead_form_name || data.form_name,
      title: data.lead_form_title || data.form_title,
      description: data.lead_form_description || data.form_description,
      thankYouText: data.lead_form_thank_you_text || data.thank_you_text,
      disclaimerText: data.lead_form_data_usage_disclaimer || data.data_usage_notice,
      thankYouPageTitle: data.lead_form_thank_you_page_title || data.thank_you_page_title,
      locale: data.lead_form_locale || data.locale,
      privacyPolicyText: data.privacy_policy_link_text,
      companyName: data.company_name,
      questions: processLeadFormQuestions()
    };
  };
  
  const leadForm = getLeadFormData();
  
  // Handler for lead form updates from AdSetupModal
  const handleLeadFormUpdated = (updatedFields: any) => {
    console.log('Lead form updated with fields:', updatedFields);
    setUpdatedLeadFormData({
      ...leadFormContent,
      ...updatedFields,
    });
  };

  // Handle receiving updated creatives from AdSetupModal
  const handleUpdatedCreatives = (newCreatives: ExtendedCreative[]) => {
    if (newCreatives && newCreatives.length > 0) {
      setUpdatedCreatives(newCreatives);
      // Reset the current index to 0 when we get new creatives
      setCurrentCreativeIndex(0);
    }
  };

  return (
    <div className="flex flex-col h-full bg-container-bg text-text-white rounded-xl border border-border-dark shadow-[0_4px_12px_rgba(0,0,0,0.1)]">
      {/* Ad Setup Modal with callback to receive updated creatives */}
      <AdSetupModal 
        isOpen={isAdSetupModalOpen}
        onOpenChange={setIsAdSetupModalOpen}
        masterFlowData={masterFlowData}
        adHeadline={adHeadline}
        adText={adText}
        campaignName={campaignName}
        campaignObjective={campaignObjective}
        targetedLocations={targetedLocations}
        ageRange={ageRange}
        gender={gender}
        targetedInterests={targetedInterests}
        behavioralFilters={behavioralFilters}
        demographicFilters={demographicFilters}
        adPlacements={adPlacements}
        budget={budget}
        websiteUrl={link}
        creatives={updatedCreatives.length > 0 ? updatedCreatives : creatives}
        onCreativesUpdated={handleUpdatedCreatives}
        onLeadFormUpdated={handleLeadFormUpdated}
        currency={masterFlowData?.currency_code}
      />

      <div className="mb-6 px-6 pt-6">
        <h3 className="text-xl font-medium mb-4 border-b border-border-dark pb-4">Campaign Review</h3>

        {/* Ad Preview Section */}
        <div className="space-y-4">
          {creativeId ? (
            <div className="space-y-4">
              <div className="flex flex-wrap gap-2 mb-4">
                <p className="text-sm font-medium text-text-white mb-1 w-full">Preview Format</p>
                <select 
                  value={adFormat} 
                  onChange={(e) => setAdFormat(e.target.value)}
                  className="w-full bg-dark-bg border-border-dark text-text-white p-2 rounded-md"
                >
                  <option value="INSTAGRAM_STANDARD">Instagram Feed</option>
                  <option value="INSTAGRAM_STORY">Instagram Story</option>
                  <option value="INSTAGRAM_EXPLORE_GRID_HOME">Instagram Explore</option>
                  <option value="FACEBOOK_PROFILE_FEED_MOBILE">Facebook Feed</option>
                  <option value="FACEBOOK_STORY_MOBILE">Facebook Story</option>
                  {/* Using our ExtendedCreative interface */}
                  {((masterFlowData?.creatives_and_previews?.creatives?.[0] as ExtendedCreative)?.media_type === 'video' || 
                    (masterFlowData?.creatives_and_previews?.creatives?.[0] as ExtendedCreative)?.is_video) && (
                    <>
                      <option value="FACEBOOK_REELS_MOBILE">Facebook Reels</option>
                      <option value="INSTAGRAM_REELS">Instagram Reels</option>
                    </>
                  )}
                </select>
              </div>

              <div className="relative w-full bg-dark-bg rounded-lg overflow-hidden min-h-[400px] flex items-center justify-center border border-border-dark">
                {isLoading ? (
                  <div className="flex items-center justify-center size-full">
                    <div className="animate-spin rounded-full size-12 border-b-2 border-primary-green"></div>
                  </div>
                ) : error ? (
                  <div className="text-red-400 p-4 text-center">
                    {error}
                  </div>
                ) : (
                  <div 
                    ref={previewRef}
                    className="size-full flex items-center justify-center" 
                    dangerouslySetInnerHTML={renderHtml()} 
                    style={{ 
                      width: '313px',
                      height: '534px',
                      overflow: 'hidden',
                      transformOrigin: '0 0',
                      transform: 'none',
                      msOverflowStyle: 'none',
                      scrollbarWidth: 'none'
                    }}
                  />
                )}
              </div>
              
              {/* Navigation arrows and creative count indicator */}
              {totalCreatives > 1 && (
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm text-text-light-gray">
                    Creative {currentCreativeIndex + 1} of {totalCreatives}
                  </p>
                  
                  {updatedCreatives.length > 0 && (
                    <span className="text-xs bg-green-800/20 text-green-400 px-2 py-1 rounded border border-green-600/30">
                      Using updated creatives
                    </span>
                  )}
                </div>
              )}
              
              {/* Navigation buttons and View Ad Setup button */}
              <div className="flex space-x-2 mt-4">
                {totalCreatives > 1 ? (
                  <>
                    <button
                      onClick={navigateToPrevCreative}
                      className="w-1/2 py-2 bg-dark-bg hover:bg-[#212534] border border-border-dark text-white flex items-center justify-center"
                      disabled={totalCreatives <= 1}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      Prev
                    </button>
                    
                    <button
                      onClick={navigateToNextCreative}
                      className="w-1/2 py-2 bg-dark-bg hover:bg-[#212534] border border-border-dark text-white flex items-center justify-center"
                      disabled={totalCreatives <= 1}
                    >
                      Next
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                      </svg>
                    </button>
                  </>
                ) : (
                  <Button
                    onClick={() => setIsAdSetupModalOpen(true)}
                    className="w-full py-2 bg-dark-bg hover:bg-[#212534] border border-border-dark text-white flex items-center justify-center"
                  >
                    <Settings2 className="mr-2 size-4" />
                    View Ad Setup
                  </Button>
                )}
              </div>
              
              {/* Show Ad Setup button separately if we have multiple creatives */}
              {totalCreatives > 1 && (
                <Button
                  onClick={() => setIsAdSetupModalOpen(true)}
                  className="w-full mt-2 py-2 bg-dark-bg hover:bg-[#212534] border border-border-dark text-white flex items-center justify-center"
                >
                  <Settings2 className="mr-2 size-4" />
                  View Ad Setup
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              <div className="bg-dark-bg/20 border border-border-dark rounded-lg p-4 text-text-light-gray">
                No creative preview available. Make sure your media has been uploaded successfully.
              </div>
              
              {/* Navigation arrows and creative count indicator */}
              {totalCreatives > 1 && (
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm text-text-light-gray">
                    Creative {currentCreativeIndex + 1} of {totalCreatives}
                  </p>
                  
                  {updatedCreatives.length > 0 && (
                    <span className="text-xs bg-green-800/20 text-green-400 px-2 py-1 rounded border border-green-600/30">
                      Using updated creatives
                    </span>
                  )}
                </div>
              )}
              
              {/* Navigation buttons and View Ad Setup button */}
              <div className="flex space-x-2 mt-4">
                {totalCreatives > 1 ? (
                  <>
                    <button
                      onClick={navigateToPrevCreative}
                      className="w-1/2 py-2 bg-dark-bg hover:bg-[#212534] border border-border-dark text-white flex items-center justify-center"
                      disabled={totalCreatives <= 1}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      Prev
                    </button>
                    
                    <button
                      onClick={navigateToNextCreative}
                      className="w-1/2 py-2 bg-dark-bg hover:bg-[#212534] border border-border-dark text-white flex items-center justify-center"
                      disabled={totalCreatives <= 1}
                    >
                      Next
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                      </svg>
                    </button>
                  </>
                ) : (
                  <Button
                    onClick={() => setIsAdSetupModalOpen(true)}
                    className="w-full py-2 bg-dark-bg hover:bg-[#212534] border border-border-dark text-white flex items-center justify-center"
                  >
                    <Settings2 className="mr-2 size-4" />
                    View Ad Setup
                  </Button>
                )}
              </div>
              
              {/* Show Ad Setup button separately if we have multiple creatives */}
              {totalCreatives > 1 && (
                <Button
                  onClick={() => setIsAdSetupModalOpen(true)}
                  className="w-full mt-2 py-2 bg-dark-bg hover:bg-[#212534] border border-border-dark text-white flex items-center justify-center"
                >
                  <Settings2 className="mr-2 size-4" />
                  View Ad Setup
                </Button>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="mt-auto px-6 pb-6">
        <button 
          onClick={handlePublish}
          className="w-full py-3 bg-primary-green text-deep-black rounded-lg font-bold hover:bg-primary-green/90 transition-all duration-200 transform hover:scale-[1.02]"
        >
          Launch Campaign
        </button>
      </div>
    </div>
  );
}