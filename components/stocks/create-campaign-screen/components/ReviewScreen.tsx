import React, { useState, useEffect } from 'react';
import { MediaItem, Gender, PreviewTab, AdPlacements, MasterFlowResponse } from '../types';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { 
  Eye, Target, MapPin, Globe, Users, Calendar, Info, Filter, Settings, 
  Layout, MessageSquare, FileText, Image, Cog, FolderHeart,
  File, Lock, ThumbsUp as CheckCircle
} from 'lucide-react';

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
  const [activeTab, setActiveTab] = useState<string>("preview");
  const [activeSettingsTab, setActiveSettingsTab] = useState<string>("adCreative");
  const [activeCreativeTab, setActiveCreativeTab] = useState<string>("creative-0");
  const [activeLeadFormTab, setActiveLeadFormTab] = useState<string>("step1");
  const [creativeId, setCreativeId] = useState<string>("");
  const [adFormat, setAdFormat] = useState<string>("INSTAGRAM_STANDARD");
  const [previewHtml, setPreviewHtml] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Extract the creative ID from master flow data if available
  useEffect(() => {
    if (masterFlowData?.creatives_and_previews?.creatives && 
        masterFlowData.creatives_and_previews.creatives.length > 0) {
      const creative = masterFlowData.creatives_and_previews.creatives[0];
      if (creative.creative_id) {
        setCreativeId(creative.creative_id);
      }
    }
  }, [masterFlowData]);

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
          setPreviewHtml(data.preview_html);
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

  // Type assertion for campaign_name that might not be in the interface
  const campaignName = (masterFlowData as any)?.campaign_name;

  // Safe access for lead form properties using type assertion
  const leadFormContent = masterFlowData?.lead_form_content as any;
  
  // Process the lead form questions if they exist
  const processLeadFormQuestions = () => {
    if (!leadFormContent) return [];
    
    // Check if we have questions in the lead_form_content
    if (leadFormContent.lead_form_questions && Array.isArray(leadFormContent.lead_form_questions)) {
      return leadFormContent.lead_form_questions.map((question: string) => {
        return {
          type: question, // e.g. FIRST_NAME, LAST_NAME, EMAIL, PHONE
          label: formatQuestionLabel(question) // Format the label for display
        };
      });
    }
    
    // Legacy format or data inside lead_form_data
    if (leadFormContent.lead_form_data && leadFormContent.lead_form_data.lead_form_questions) {
      return leadFormContent.lead_form_data.lead_form_questions.map((question: string) => {
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
    if (!leadFormContent) return null;
    
    // We need to handle two possible structures:
    // 1. Where properties are at the root of lead_form_content
    // 2. Where properties are nested inside lead_form_data
    
    const data = leadFormContent.lead_form_data || leadFormContent;
    
    return {
      name: data.lead_form_name,
      title: data.lead_form_title,
      description: data.lead_form_description,
      thankYouText: data.lead_form_thank_you_text,
      disclaimerText: data.lead_form_data_usage_disclaimer,
      thankYouPageTitle: data.lead_form_thank_you_page_title,
      locale: data.lead_form_locale,
      privacyPolicyText: data.privacy_policy_link_text,
      companyName: data.company_name,
      questions: processLeadFormQuestions()
    };
  };
  
  const leadForm = getLeadFormData();

  // Get all creatives - either from master flow data or media items
  const getCreatives = () => {
    if (masterFlowData?.creatives_and_previews?.creatives && 
        masterFlowData.creatives_and_previews.creatives.length > 0) {
      return masterFlowData.creatives_and_previews.creatives;
    }
    
    // If no creatives in master flow data, create mock creatives from media items
    return mediaItems.map((item, index) => ({
      creative_id: `media-${index}`,
      preview_uuid: '',
      media_type: item.type,
      media_id: item.id,
      media_url: item.url,
      previews: []
    }));
  };

  // Get creatives for tabs display
  const creatives = getCreatives();

  return (
    <div className="flex flex-col h-full bg-container-bg text-text-white rounded-xl border border-border-dark shadow-[0_4px_12px_rgba(0,0,0,0.1)]">
      <div className="mb-6 px-6 pt-6">
        <h3 className="text-xl font-medium mb-4 border-b border-border-dark pb-4">Campaign Review</h3>

        <Tabs defaultValue="preview" value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="w-full bg-dark-bg text-text-light-gray mb-4 border border-border-dark rounded-lg overflow-hidden">
            <TabsTrigger value="preview" className={`data-[state=active]:bg-dark-bg data-[state=active]:text-primary-green ${activeTab === 'preview' ? 'border-b-2 border-primary-green' : ''}`}>
              <Eye className="mr-2 size-4" />
              Ad Preview
            </TabsTrigger>
            <TabsTrigger value="adtext" className={`data-[state=active]:bg-dark-bg data-[state=active]:text-primary-green ${activeTab === 'adtext' ? 'border-b-2 border-primary-green' : ''}`}>
              <MessageSquare className="mr-2 size-4" />
              Ad Text
            </TabsTrigger>
            <TabsTrigger value="settings" className={`data-[state=active]:bg-dark-bg data-[state=active]:text-primary-green ${activeTab === 'settings' ? 'border-b-2 border-primary-green' : ''}`}>
              <Settings className="mr-2 size-4" />
              Settings
            </TabsTrigger>
          </TabsList>

          {/* Preview Tab */}
          <TabsContent value="preview" className="space-y-4">
            {creativeId ? (
              <div className="space-y-4">
                <div className="flex flex-wrap gap-2 mb-4">
                  <p className="text-sm font-medium text-text-white mb-1 w-full">Preview Format</p>
                  <Select value={adFormat} onValueChange={setAdFormat}>
                    <SelectTrigger className="w-full bg-dark-bg border-border-dark text-text-white">
                      <SelectValue placeholder="Select format" />
                    </SelectTrigger>
                    <SelectContent className="bg-dark-bg border-border-dark text-text-white">
                      <SelectItem value="INSTAGRAM_STANDARD">Instagram Feed</SelectItem>
                      <SelectItem value="INSTAGRAM_STORY">Instagram Story</SelectItem>
                      <SelectItem value="FACEBOOK_FEED">Facebook Feed</SelectItem>
                      <SelectItem value="FACEBOOK_RIGHT_COLUMN">Facebook Right Column</SelectItem>
                    </SelectContent>
                  </Select>
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
                      className="size-full flex items-center justify-center" 
                      dangerouslySetInnerHTML={renderHtml()} 
                    />
                  )}
                </div>
              </div>
            ) : (
              <div className="bg-dark-bg/20 border border-border-dark rounded-lg p-4 text-text-light-gray">
                No creative preview available. Make sure your media has been uploaded successfully.
              </div>
            )}
          </TabsContent>
          
          {/* Ad Text Tab */}
          <TabsContent value="adtext" className="space-y-4">
            <div className="bg-dark-bg rounded-lg p-4 border border-border-dark">
              <h4 className="text-lg font-medium mb-4 text-primary-green">Ad Creative Text</h4>
              
              <div className="space-y-4">
                <div>
                  <h5 className="font-medium text-text-white mb-2">Headline</h5>
                  <div className="bg-container-bg p-3 rounded-lg border border-border-dark">
                    <p className="text-text-white text-lg">
                      {masterFlowData?.ad_creative_text?.ad_creative_title || adHeadline}
                    </p>
                  </div>
                </div>
                
                <div>
                  <h5 className="font-medium text-text-white mb-2">Description</h5>
                  <div className="bg-container-bg p-3 rounded-lg border border-border-dark">
                    <p className="text-text-white whitespace-pre-wrap">
                      {masterFlowData?.ad_creative_text?.ad_creative_description || adText}
                    </p>
                  </div>
                </div>
                
                {masterFlowData?.ad_creative_text?.ad_creative_name && (
                  <div>
                    <h5 className="font-medium text-text-white mb-2">Creative Name</h5>
                    <div className="bg-container-bg p-3 rounded-lg border border-border-dark">
                      <p className="text-text-white">
                        {masterFlowData.ad_creative_text.ad_creative_name}
                      </p>
                    </div>
                  </div>
                )}
                
                {campaignName && (
                  <div>
                    <h5 className="font-medium text-text-white mb-2">Campaign Name</h5>
                    <div className="bg-container-bg p-3 rounded-lg border border-border-dark">
                      <p className="text-text-white">
                        {campaignName}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings" className="space-y-4">
            <Tabs 
              defaultValue="adCreative" 
              value={activeSettingsTab} 
              onValueChange={setActiveSettingsTab} 
              className="w-full"
            >
              <TabsList className="w-full bg-dark-bg text-text-light-gray mb-4 border border-border-dark rounded-lg overflow-hidden">
                <TabsTrigger 
                  value="adCreative" 
                  className={`data-[state=active]:bg-dark-bg data-[state=active]:text-primary-green ${activeSettingsTab === 'adCreative' ? 'border-b-2 border-primary-green' : ''}`}
                >
                  <Image className="mr-2 size-4" />
                  Ad Creatives
                </TabsTrigger>
                <TabsTrigger 
                  value="adSet" 
                  className={`data-[state=active]:bg-dark-bg data-[state=active]:text-primary-green ${activeSettingsTab === 'adSet' ? 'border-b-2 border-primary-green' : ''}`}
                >
                  <Cog className="mr-2 size-4" />
                  Ad Set
                </TabsTrigger>
                {hasLeadFormData && (
                  <TabsTrigger 
                    value="leadForm" 
                    className={`data-[state=active]:bg-dark-bg data-[state=active]:text-primary-green ${activeSettingsTab === 'leadForm' ? 'border-b-2 border-primary-green' : ''}`}
                  >
                    <FolderHeart className="mr-2 size-4" />
                    Lead Form
                  </TabsTrigger>
                )}
              </TabsList>

              {/* Ad Creatives Tab */}
              <TabsContent value="adCreative" className="space-y-4">
                {creatives.length > 1 ? (
                  <Tabs 
                    defaultValue="creative-0" 
                    value={activeCreativeTab} 
                    onValueChange={setActiveCreativeTab} 
                    className="w-full"
                  >
                    <TabsList className="w-full bg-dark-bg text-text-light-gray mb-4 flex overflow-x-auto border border-border-dark rounded-lg">
                      {creatives.map((creative, index) => (
                        <TabsTrigger 
                          key={`creative-tab-${index}`}
                          value={`creative-${index}`} 
                          className={`data-[state=active]:bg-dark-bg data-[state=active]:text-primary-green ${activeCreativeTab === `creative-${index}` ? 'border-b-2 border-primary-green' : ''}`}
                        >
                          Ad Creative {index + 1}
                        </TabsTrigger>
                      ))}
                    </TabsList>
                    
                    {creatives.map((creative, index) => (
                      <TabsContent key={`creative-content-${index}`} value={`creative-${index}`} className="space-y-4">
                        <div className="bg-dark-bg rounded-lg p-4 border border-border-dark">
                          <h4 className="text-lg font-medium mb-4 text-primary-green">Ad Creative {index + 1} Details</h4>
                          
                          {masterFlowData?.ad_creative_text?.ad_creative_name && index === 0 && (
                            <div className="mb-4">
                              <h5 className="font-medium text-text-white mb-2">Creative Name</h5>
                              <div className="bg-container-bg p-3 rounded-lg border border-border-dark">
                                <p className="text-text-white">
                                  {masterFlowData.ad_creative_text.ad_creative_name}
                                </p>
                              </div>
                            </div>
                          )}
                          
                          <div className="space-y-4">
                            <div>
                              <h5 className="font-medium text-text-white mb-2">Media Type</h5>
                              <div className="bg-container-bg p-3 rounded-lg border border-border-dark">
                                <p className="text-text-white">
                                {(creative as any).media_type === 'image' ? 'Image' : 'Video'}                                </p>
                              </div>
                            </div>

                            {creative.creative_id && (
                              <p className="text-xs text-text-light-gray mb-3 font-mono">
                                ID: {creative.creative_id}
                              </p>
                            )}

                            {/* Preview of the creative media */}
                            <div>
                              <h5 className="font-medium text-text-white mb-2">Media Preview</h5>
                              <div className="bg-container-bg p-3 rounded-lg flex justify-center border border-border-dark">
                                {(creative as any).media_type === 'image' ? (
                                  <img 
                                  src={(creative as any).media_url || mediaItems[index]?.url || '/placeholder-image.jpg'} 
                                  alt="Creative preview" 
                                  className="max-h-[200px] rounded-md"
                                />
                                ) : (
                                  <video 
                                    src={(creative as any).media_url || mediaItems[index]?.url} 
                                    controls 
                                    className="max-h-[200px] rounded-md"
                                  />
                                )}
                              </div>
                            </div>

                            {/* Ad Preview for this creative */}
                            <div>
                              <h5 className="font-medium text-text-white mb-2">Ad Preview</h5>
                              <div className="bg-container-bg p-3 rounded-lg flex justify-center border border-border-dark">
                                {isLoading ? (
                                  <div className="flex items-center justify-center w-full h-[200px]">
                                    <div className="animate-spin rounded-full size-12 border-b-2 border-primary-green"></div>
                                  </div>
                                ) : creative.creative_id === creativeId && previewHtml ? (
                                  <div 
                                    className="w-full max-h-[300px] overflow-auto" 
                                    dangerouslySetInnerHTML={{ __html: previewHtml }} 
                                  />
                                ) : (
                                  <div className="text-text-light-gray h-[200px] flex items-center justify-center">
                                    {creative.creative_id !== creativeId ? 
                                      "Click 'Ad Preview' tab to view this creative" : 
                                      "No preview available for this creative"}
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      </TabsContent>
                    ))}
                  </Tabs>
                ) : (
                  <div className="bg-dark-bg rounded-lg p-4 border border-border-dark">
                    <h4 className="text-lg font-medium mb-4 text-primary-green">Ad Creative Details</h4>
                    
                    {masterFlowData?.ad_creative_text?.ad_creative_name && (
                      <div className="mb-4">
                        <h5 className="font-medium text-text-white mb-2">Creative Name</h5>
                        <div className="bg-container-bg p-3 rounded-lg border border-border-dark">
                          <p className="text-text-white">
                            {masterFlowData.ad_creative_text.ad_creative_name}
                          </p>
                        </div>
                      </div>
                    )}
                    
                    <div className="space-y-4">
                      <div>
                        <h5 className="font-medium text-text-white mb-2">Media Type</h5>
                        <div className="bg-container-bg p-3 rounded-lg border border-border-dark">
                          <p className="text-text-white">
                            {mediaItems[0]?.type === 'image' ? 'Image' : 'Video'}
                          </p>
                        </div>
                      </div>
                      
                      {masterFlowData?.creatives_and_previews?.creatives && masterFlowData.creatives_and_previews.creatives.length > 0 && (
                        <p className="text-xs text-text-light-gray mb-3 font-mono">
                          ID: {masterFlowData.creatives_and_previews.creatives[0].creative_id}
                        </p>
                      )}
                      
                      {/* Preview of the creative media */}
                      {mediaItems.length > 0 && (
                        <div>
                          <h5 className="font-medium text-text-white mb-2">Media Preview</h5>
                          <div className="bg-container-bg p-3 rounded-lg flex justify-center border border-border-dark">
                            {mediaItems[0].type === 'image' ? (
                              <img 
                                src={mediaItems[0].url} 
                                alt="Creative preview" 
                                className="max-h-[200px] rounded-md"
                              />
                            ) : (
                              <video 
                                src={mediaItems[0].url} 
                                controls 
                                className="max-h-[200px] rounded-md"
                              />
                            )}
                          </div>
                        </div>
                      )}

                      {/* Ad Preview for single creative */}
                      <div>
                        <h5 className="font-medium text-text-white mb-2">Ad Preview</h5>
                        <div className="bg-container-bg p-3 rounded-lg flex justify-center border border-border-dark">
                          {isLoading ? (
                            <div className="flex items-center justify-center w-full h-[200px]">
                              <div className="animate-spin rounded-full size-12 border-b-2 border-primary-green"></div>
                            </div>
                          ) : previewHtml ? (
                            <div 
                              className="w-full max-h-[300px] overflow-auto" 
                              dangerouslySetInnerHTML={{ __html: previewHtml }} 
                            />
                          ) : (
                            <div className="text-text-light-gray h-[200px] flex items-center justify-center">
                              Click &apos;Ad Preview&apos; tab to view this creative
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </TabsContent>

              {/* Ad Set Tab */}
              <TabsContent value="adSet" className="space-y-4">
                <Tabs defaultValue="objective" className="w-full">
                  <TabsList className="w-full bg-dark-bg text-text-light-gray mb-4 border border-border-dark rounded-lg overflow-hidden">
                    <TabsTrigger 
                      value="objective" 
                      className="data-[state=active]:bg-dark-bg data-[state=active]:text-primary-green data-[state=active]:border-b-2 data-[state=active]:border-primary-green"
                    >
                      Objective
                    </TabsTrigger>
                    <TabsTrigger 
                      value="budget" 
                      className="data-[state=active]:bg-dark-bg data-[state=active]:text-primary-green data-[state=active]:border-b-2 data-[state=active]:border-primary-green"
                    >
                      Budget
                    </TabsTrigger>
                    <TabsTrigger 
                      value="placements" 
                      className="data-[state=active]:bg-dark-bg data-[state=active]:text-primary-green data-[state=active]:border-b-2 data-[state=active]:border-primary-green"
                    >
                      Placements
                    </TabsTrigger>
                    <TabsTrigger 
                      value="targeting" 
                      className="data-[state=active]:bg-dark-bg data-[state=active]:text-primary-green data-[state=active]:border-b-2 data-[state=active]:border-primary-green"
                    >
                      Targeting
                    </TabsTrigger>
                  </TabsList>

                  {/* Objective Sub-Tab */}
                  <TabsContent value="objective" className="space-y-4">
                    <div className="bg-dark-bg rounded-lg p-4 border border-border-dark">
                      <div className="flex items-start">
                        <Globe className="size-5 text-coral mr-3 mt-1" />
                        <div>
                          <h4 className="font-medium text-text-white">Campaign Objective</h4>
                          <p className="text-text-light-gray">{masterFlowData?.campaign_objective || campaignObjective}</p>
                        </div>
                      </div>
                      
                      {campaignName && (
                        <div className="flex items-start mt-4">
                          <Info className="size-5 text-primary-green mr-3 mt-1" />
                          <div>
                            <h4 className="font-medium text-text-white">Campaign Name</h4>
                            <p className="text-text-light-gray">{campaignName}</p>
                          </div>
                        </div>
                      )}
                      
                      <div className="flex items-start mt-4">
                        <Info className="size-5 text-primary-green mr-3 mt-1" />
                        <div>
                          <h4 className="font-medium text-text-white">Campaign Flow Status</h4>
                          <p className="text-text-light-gray">{masterFlowData?.status || "Pending"}</p>
                        </div>
                      </div>
                    </div>
                  </TabsContent>

                  {/* Budget Sub-Tab */}
                  <TabsContent value="budget" className="space-y-4">
                    <div className="bg-dark-bg rounded-lg p-4 border border-border-dark">
                      <div className="flex items-start">
                        <Calendar className="size-5 text-coral mr-3 mt-1" />
                        <div>
                          <h4 className="font-medium text-text-white">Budget</h4>
                          <p className="text-text-light-gray">Daily: ${budget} USD</p>
                        </div>
                      </div>
                    </div>
                  </TabsContent>

                  {/* Placements Sub-Tab */}
                  <TabsContent value="placements" className="space-y-4">
                    <div className="bg-dark-bg rounded-lg p-4 border border-border-dark">
                      <div className="flex items-start">
                        <Layout className="size-5 text-primary-green mr-3 mt-1" />
                        <div>
                          <h4 className="font-medium text-text-white">Ad Placements</h4>
                          {hasPlacementData ? (
                            <p className="text-text-light-gray">
                              {/* Display master flow placements here if available */}
                              Placements data from API
                            </p>
                          ) : (
                            <p className="text-text-light-gray">
                              {Object.entries(adPlacements)
                                .filter(([_, isEnabled]) => isEnabled)
                                .map(([placement]) => placement.replace('_', ' '))
                                .join(', ')}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  </TabsContent>

                  {/* Targeting Sub-Tab */}
                  <TabsContent value="targeting" className="space-y-4">
                    <div className="bg-dark-bg rounded-lg p-4 border border-border-dark">
                      <div className="flex items-start mb-3">
                        <MapPin className="size-5 text-primary-green mr-3 mt-1" />
                        <div>
                          <h4 className="font-medium text-text-white">Locations</h4>
                          <p className="text-text-light-gray">
                            {masterFlowData?.selected_locations ? 
                              formatObjectsForDisplay(masterFlowData.selected_locations) : 
                              targetedLocations.join(', ')}
                          </p>
                          {masterFlowData?.is_location_exact_match !== undefined && (
                            <p className="text-sm text-text-light-gray mt-1">
                              Exact match: {masterFlowData.is_location_exact_match ? 'Yes' : 'No'}
                            </p>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex items-start mb-3">
                        <Users className="size-5 text-coral mr-3 mt-1" />
                        <div>
                          <h4 className="font-medium text-text-white">Demographics</h4>
                          <p className="text-text-light-gray">
                            Age: {masterFlowData?.suggested_age_min || ageRange[0]} - {masterFlowData?.suggested_age_max || ageRange[1]}<br />
                            Gender: {masterFlowData ? 
                              `${masterFlowData.include_male_gender ? 'Male ' : ''}${masterFlowData.include_female_gender ? 'Female' : ''}` : 
                              gender}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Targeting Filters */}
                    <div className="bg-dark-bg rounded-lg p-4 border border-border-dark">
                      <div className="flex items-start mb-3">
                        <Target className="size-5 text-primary-green mr-3 mt-1" />
                        <div className="w-full">
                          <h4 className="font-medium text-text-white mb-2">Interest Targeting</h4>
                          <div className="flex flex-wrap gap-2">
                            {getInterestFilters().length > 0 ? 
                              getInterestFilters().map((filter, index) => (
                                <span key={`interest-${index}`} className="px-2 py-1 bg-dark-bg border border-primary-green text-primary-green rounded-full text-xs">
                                  {filter}
                                </span>
                              )) : 
                              <p className="text-text-light-gray">None</p>
                            }
                          </div>
                        </div>
                      </div>

                      {/* Behavioral Filters */}
                      <div className="flex items-start mb-3">
                        <Filter className="size-5 text-primary-green mr-3 mt-1" />
                        <div className="w-full">
                          <h4 className="font-medium text-text-white mb-2">Behavioral Targeting</h4>
                          <div className="flex flex-wrap gap-2">
                            {getBehavioralFilters().length > 0 ? 
                              getBehavioralFilters().map((filter, index) => (
                                <span key={`behavior-${index}`} className="px-2 py-1 bg-dark-bg border border-primary-green text-primary-green rounded-full text-xs">
                                  {filter}
                                </span>
                              )) : 
                              <p className="text-text-light-gray">None</p>
                            }
                          </div>
                        </div>
                      </div>

                      {/* Demographic Filters */}
                      <div className="flex items-start">
                        <Users className="size-5 text-coral mr-3 mt-1" />
                        <div className="w-full">
                          <h4 className="font-medium text-text-white mb-2">Demographic Targeting</h4>
                          <div className="flex flex-wrap gap-2">
                            {getDemographicFilters().length > 0 ? 
                              getDemographicFilters().map((filter, index) => (
                                <span key={`demographic-${index}`} className="px-2 py-1 bg-dark-bg border border-coral text-coral rounded-full text-xs">
                                  {filter}
                                </span>
                              )) : 
                              <p className="text-text-light-gray">None</p>
                            }
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {masterFlowData?.age_gender_decision_reason && (
                      <div className="bg-dark-bg/80 rounded-lg p-4 border border-primary-green/30">
                        <div className="flex">
                          <Info className="size-5 text-primary-green mr-2 shrink-0" />
                          <p className="text-text-light-gray">
                            <span className="font-medium text-primary-green">Targeting Reasoning:</span> {masterFlowData.age_gender_decision_reason}
                          </p>
                        </div>
                      </div>
                    )}
                  </TabsContent>
                </Tabs>
              </TabsContent>
              
              {/* Lead Form Tab - Only shown if hasLeadFormData is true */}
              {hasLeadFormData && (
                <TabsContent value="leadForm" className="space-y-4">
                  <Tabs defaultValue="step1" value={activeLeadFormTab} onValueChange={setActiveLeadFormTab} className="w-full">
                    <TabsList className="w-full bg-[#f2f2f2] text-[#767676] mb-4 border border-[#d3d3d3] rounded-lg overflow-hidden">
                      <TabsTrigger 
                        value="step1" 
                        className={`data-[state=active]:bg-white data-[state=active]:text-[#4169e1] ${activeLeadFormTab === 'step1' ? 'border-b-2 border-[#4169e1]' : ''}`}
                      >
                        <File className="mr-2 size-4" />
                        Step 1: Form
                      </TabsTrigger>
                      <TabsTrigger 
                        value="step2" 
                        className={`data-[state=active]:bg-white data-[state=active]:text-[#4169e1] ${activeLeadFormTab === 'step2' ? 'border-b-2 border-[#4169e1]' : ''}`}
                      >
                        <CheckCircle className="mr-2 size-4" />
                        Step 2: Questions
                      </TabsTrigger>
                      <TabsTrigger 
                        value="step3" 
                        className={`data-[state=active]:bg-white data-[state=active]:text-[#4169e1] ${activeLeadFormTab === 'step3' ? 'border-b-2 border-[#4169e1]' : ''}`}
                      >
                        <Lock className="mr-2 size-4" />
                        Step 3: Privacy
                      </TabsTrigger>
                      <TabsTrigger 
                        value="step4" 
                        className={`data-[state=active]:bg-white data-[state=active]:text-[#4169e1] ${activeLeadFormTab === 'step4' ? 'border-b-2 border-[#4169e1]' : ''}`}
                      >
                        <CheckCircle className="mr-2 size-4" />
                        Step 4: Thank You
                      </TabsTrigger>
                    </TabsList>

                    {/* Step 1: Form Tab */}
                    <TabsContent value="step1" className="space-y-4">
                      <div className="bg-white rounded-lg p-5 border border-[#d3d3d3] shadow-sm">
                        <h4 className="text-[22px] font-medium mb-5 text-[#292929]">Step 1: Lead Form</h4>
                        
                        <div className="flex flex-col items-center">
                          {/* Lead Form Preview */}
                          {leadForm && (
                            <div className="w-full max-w-sm mx-auto">
                              <div className="bg-white rounded-lg overflow-hidden shadow-lg">
                                {/* Form header */}
                                <div className="bg-[#333333] p-4">
                                  <div className="flex items-center justify-between mb-3">
                                    <div className="bg-white h-8 w-8 rounded-full flex items-center justify-center">
                                      <span className="text-[#4169e1] text-xl font-bold">R</span>
                                    </div>
                                    <div className="text-white text-sm">X</div>
                                  </div>
                                  <div className="bg-white rounded-md px-2 py-1 inline-block mb-2">
                                    <span className="text-xs font-medium text-[#4169e1]">Lead Form</span>
                                  </div>
                                  <h3 className="text-white text-[22px] font-bold">{leadForm.title || "Unlock the Power of AI"}</h3>
                                </div>
                                
                                {/* Form body */}
                                <div className="p-5 bg-white">
                                  <p className="text-[#292929] text-[16px] leading-relaxed mb-5">{leadForm.description || "Fill out this form to learn more about our services."}</p>
                                  
                                  {/* Basic form info for Step 1 */}
                                  <div className="space-y-4 text-[16px] text-[#292929]">
                                    <div className="flex justify-between items-center border-b border-[#f2f2f2] pb-2">
                                      <span className="font-medium">Form Name:</span>
                                      <span className="text-[#767676]">{leadForm.name}</span>
                                    </div>
                                    {leadFormContent?.headline && (
                                      <div className="flex justify-between items-center border-b border-[#f2f2f2] pb-2">
                                        <span className="font-medium">Headline:</span>
                                        <span className="text-[#767676]">{leadFormContent.headline}</span>
                                      </div>
                                    )}
                                    <div className="flex justify-between items-center border-b border-[#f2f2f2] pb-2">
                                      <span className="font-medium">Company:</span>
                                      <span className="text-[#767676]">{leadForm.companyName}</span>
                                    </div>
                                    <div className="flex justify-between items-center border-b border-[#f2f2f2] pb-2">
                                      <span className="font-medium">Language:</span>
                                      <span className="text-[#767676]">{leadForm.locale || "en_US"}</span>
                                    </div>
                                  </div>
                                  
                                  <p className="text-[14px] text-[#767676] mt-5 border-t border-[#f2f2f2] pt-4 leading-relaxed">
                                    This is step 1 of your lead form. Users will see your form title and description, and then be asked to provide information.
                                  </p>
                                </div>
                                
                                {/* Form footer */}
                                <div className="p-4 bg-[#f2f2f2] border-t border-[#d3d3d3]">
                                  <button className="w-full py-3 bg-[#4169e1] text-white rounded-md font-medium text-[16px] transition-all hover:bg-opacity-90">
                                    Continue
                                  </button>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </TabsContent>
                    
                    {/* Step 2: Questions Tab */}
                    <TabsContent value="step2" className="space-y-4">
                      <div className="bg-white rounded-lg p-5 border border-[#d3d3d3] shadow-sm">
                        <h4 className="text-[22px] font-medium mb-5 text-[#292929]">Step 2: Lead Form Questions</h4>
                        
                        <div className="flex flex-col items-center">
                          {/* Lead Form Questions Preview */}
                          {leadForm && (
                            <div className="w-full max-w-sm mx-auto">
                              <div className="bg-white rounded-lg overflow-hidden shadow-lg">
                                {/* Form header */}
                                <div className="bg-[#333333] p-4">
                                  <div className="flex items-center justify-between mb-3">
                                    <div className="bg-white h-8 w-8 rounded-full flex items-center justify-center">
                                      <span className="text-[#4169e1] text-xl font-bold">R</span>
                                    </div>
                                    <div className="text-white text-sm">X</div>
                                  </div>
                                  <div className="bg-white rounded-md px-2 py-1 inline-block mb-2">
                                    <span className="text-xs font-medium text-[#4169e1]">Lead Form</span>
                                  </div>
                                  <h3 className="text-white text-[22px] font-bold">{leadForm.title || "Unlock the Power of AI"}</h3>
                                </div>
                                
                                {/* Form body with questions */}
                                <div className="p-5 bg-white">
                                  <p className="text-[#292929] text-[16px] leading-relaxed mb-5">{leadForm.description || "Fill out this form to learn more about our services."}</p>
                                  
                                  {/* Form questions preview */}
                                  <div className="space-y-4">
                                    {leadForm.questions && leadForm.questions.length > 0 ? (
                                      leadForm.questions.map((question: any, index: number) => (
                                        <div key={`form-field-${index}`} className="border border-[#d3d3d3] rounded-md p-4 bg-[#f2f2f2]">
                                          <label className="block text-[#292929] text-[14px] font-medium mb-2">{question.label}</label>
                                          <div className="h-10 bg-white border border-[#d3d3d3] rounded w-full flex items-center px-3">
                                            <span className="text-[#767676] text-[16px]">Enter your {question.label.toLowerCase()}</span>
                                          </div>
                                        </div>
                                      ))
                                    ) : (
                                      <p className="text-center text-[#767676] italic p-4 bg-[#f2f2f2] rounded-md border border-[#d3d3d3]">No questions defined</p>
                                    )}
                                  </div>
                                  
                                  <p className="text-[14px] text-[#767676] mt-5 border-t border-[#f2f2f2] pt-4 leading-relaxed">
                                    This is step 2 of your lead form. Users will be asked to provide the information requested above.
                                  </p>
                                </div>
                                
                                {/* Form footer */}
                                <div className="p-4 bg-[#f2f2f2] border-t border-[#d3d3d3]">
                                  <button className="w-full py-3 bg-[#4169e1] text-white rounded-md font-medium text-[16px] transition-all hover:bg-opacity-90">
                                    Continue
                                  </button>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </TabsContent>
                    
                    {/* Step 3: Privacy Tab */}
                    <TabsContent value="step3" className="space-y-4">
                      <div className="bg-white rounded-lg p-5 border border-[#d3d3d3] shadow-sm">
                        <h4 className="text-[22px] font-medium mb-5 text-[#292929]">Step 3: Privacy Policy</h4>
                        
                        <div className="flex flex-col items-center">
                          {/* Privacy policy preview */}
                          {leadForm && (
                            <div className="w-full max-w-sm mx-auto">
                              <div className="bg-white rounded-lg overflow-hidden shadow-lg">
                                {/* Header */}
                                <div className="bg-[#333333] p-4">
                                  <div className="flex items-center justify-between mb-3">
                                    <div className="bg-white h-8 w-8 rounded-full flex items-center justify-center">
                                      <span className="text-[#4169e1] text-xl font-bold">R</span>
                                    </div>
                                    <div className="text-white text-sm">X</div>
                                  </div>
                                  <div className="bg-white rounded-md px-2 py-1 inline-block mb-2">
                                    <span className="text-xs font-medium text-[#4169e1]">Privacy Policy</span>
                                  </div>
                                </div>
                                
                                {/* Privacy content */}
                                <div className="p-6 bg-white">
                                  <div className="w-16 h-16 bg-[#f2f2f2] rounded-full mx-auto mb-4 flex items-center justify-center">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-[#4169e1]" viewBox="0 0 20 20" fill="currentColor">
                                      <path fillRule="evenodd" d="M18 8a6 6 0 01-7.743 5.743L10 14l-1 1-1 1H6v-1l1-1 1-1-1-1-2-2H3v-1l2.4-1.2a6 6 0 114.6 2.2h-.22L8 9l-1 1-1 1v1h2.5l.5-.5.5-.5H10v-1l-1-1-1-1-1-1H6v-1l1-1 1-1 1-1h1zm-9 6v1H4v-1h5z" clipRule="evenodd" />
                                    </svg>
                                  </div>
                                  
                                  <h3 className="text-[22px] font-bold text-[#292929] mb-4 text-center">
                                    {leadForm.companyName || "Company"} Privacy Policy
                                  </h3>
                                  
                                  <div className="text-[16px] text-[#292929] border-t border-[#f2f2f2] pt-4 space-y-4 leading-relaxed">
                                    <p>
                                      {leadForm.disclaimerText || "We will process your information in accordance with our privacy policy."}
                                    </p>
                                    
                                    <div className="mt-4 pt-4 border-t border-[#f2f2f2]">
                                      <a href="#" className="text-[#4169e1] font-medium underline text-[16px]">
                                        {leadForm.privacyPolicyText || "View Full Privacy Policy"}
                                      </a>
                                    </div>
                                    
                                    <p className="text-[14px] text-[#767676] mt-5 pt-3 border-t border-[#f2f2f2]">
                                      This is step 3 of your lead form. Users will see your privacy policy and must accept it to continue.
                                    </p>
                                  </div>
                                </div>
                                
                                {/* Footer with buttons */}
                                <div className="p-4 bg-[#f2f2f2] border-t border-[#d3d3d3] flex justify-between">
                                  <button className="px-6 py-3 bg-[#d3d3d3] text-[#292929] rounded-md font-medium transition-all hover:bg-opacity-90">
                                    Decline
                                  </button>
                                  <button className="px-6 py-3 bg-[#4169e1] text-white rounded-md font-medium transition-all hover:bg-opacity-90">
                                    Accept
                                  </button>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </TabsContent>
                    
                    {/* Step 4: Thank You Tab */}
                    <TabsContent value="step4" className="space-y-4">
                      <div className="bg-white rounded-lg p-5 border border-[#d3d3d3] shadow-sm">
                        <h4 className="text-[22px] font-medium mb-5 text-[#292929]">Step 4: Thank You Page</h4>
                        
                        <div className="flex flex-col items-center">
                          {/* Thank You Page Preview */}
                          {leadForm && (
                            <div className="w-full max-w-sm mx-auto">
                              <div className="bg-white rounded-lg overflow-hidden shadow-lg">
                                {/* Header */}
                                <div className="bg-[#333333] p-4">
                                  <div className="flex items-center justify-between mb-3">
                                    <div className="bg-white h-8 w-8 rounded-full flex items-center justify-center">
                                      <span className="text-[#4169e1] text-xl font-bold">R</span>
                                    </div>
                                    <div className="text-white text-sm">X</div>
                                  </div>
                                  <div className="bg-white rounded-md px-2 py-1 inline-block mb-2">
                                    <span className="text-xs font-medium text-[#4169e1]">Lead Form</span>
                                  </div>
                                </div>
                                
                                {/* Thank You content */}
                                <div className="p-6 bg-white text-center">
                                  <div className="w-20 h-20 bg-[#f2f2f2] rounded-full mx-auto mb-5 flex items-center justify-center">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-[#4169e1]" viewBox="0 0 20 20" fill="currentColor">
                                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                    </svg>
                                  </div>
                                  
                                  <h3 className="text-[22px] font-bold text-[#292929] mb-3">
                                    {leadForm.thankYouPageTitle || "Thank You!"}
                                  </h3>
                                  
                                  <p className="text-[16px] text-[#292929] mb-6 leading-relaxed">
                                    {leadForm.thankYouText || "Your information has been submitted successfully."}
                                  </p>
                                  
                                  <p className="text-[14px] text-[#767676] mt-5 border-t border-[#f2f2f2] pt-4 leading-relaxed">
                                    This is step 4 of your lead form. Users will see this confirmation page after submitting the form.
                                  </p>
                                  
                                  <button className="px-6 py-3 bg-[#4169e1] text-white rounded-md font-medium mt-5 transition-all hover:bg-opacity-90 text-[16px]">
                                    Done
                                  </button>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </TabsContent>
                  </Tabs>
                </TabsContent>
              )}
            </Tabs>
          </TabsContent>
        </Tabs>
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