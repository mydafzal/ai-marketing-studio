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
  const [activeLeadFormTab, setActiveLeadFormTab] = useState<string>("formBasics");
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
                                  {creative.media_type === 'image' ? 'Image' : 'Video'}
                                </p>
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
                                {creative.media_type === 'image' ? (
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
                  <Tabs defaultValue="formBasics" value={activeLeadFormTab} onValueChange={setActiveLeadFormTab} className="w-full">
                    <TabsList className="w-full bg-dark-bg text-text-light-gray mb-4 border border-border-dark rounded-lg overflow-hidden">
                      <TabsTrigger 
                        value="formBasics" 
                        className={`data-[state=active]:bg-dark-bg data-[state=active]:text-primary-green ${activeLeadFormTab === 'formBasics' ? 'border-b-2 border-primary-green' : ''}`}
                      >
                        <File className="mr-2 size-4" />
                        Form Basics
                      </TabsTrigger>
                      <TabsTrigger 
                        value="privacy" 
                        className={`data-[state=active]:bg-dark-bg data-[state=active]:text-primary-green ${activeLeadFormTab === 'privacy' ? 'border-b-2 border-primary-green' : ''}`}
                      >
                        <Lock className="mr-2 size-4" />
                        Privacy
                      </TabsTrigger>
                      <TabsTrigger 
                        value="thankYou" 
                        className={`data-[state=active]:bg-dark-bg data-[state=active]:text-primary-green ${activeLeadFormTab === 'thankYou' ? 'border-b-2 border-primary-green' : ''}`}
                      >
                        <CheckCircle className="mr-2 size-4" />
                        Thank You Page
                      </TabsTrigger>
                    </TabsList>

                    {/* Form Basics Tab */}
                    <TabsContent value="formBasics" className="space-y-4">
                      <div className="bg-dark-bg rounded-lg p-4 border border-border-dark">
                        <h4 className="text-lg font-medium mb-4 text-primary-green">Form Basics</h4>
                        
                        <div className="space-y-4">
                          {leadFormContent?.lead_form_name && (
                            <div>
                              <h5 className="font-medium text-text-white mb-2">Form Name</h5>
                              <div className="bg-container-bg p-3 rounded-lg border border-border-dark">
                                <p className="text-text-white">
                                  {leadFormContent.lead_form_name}
                                </p>
                              </div>
                            </div>
                          )}
                          
                          {leadFormContent?.headline && (
                            <div>
                              <h5 className="font-medium text-text-white mb-2">Headline</h5>
                              <div className="bg-container-bg p-3 rounded-lg border border-border-dark">
                                <p className="text-text-white text-lg">
                                  {leadFormContent.headline}
                                </p>
                              </div>
                            </div>
                          )}
                          
                          {leadFormContent?.lead_form_title && (
                            <div>
                              <h5 className="font-medium text-text-white mb-2">Form Title</h5>
                              <div className="bg-container-bg p-3 rounded-lg border border-border-dark">
                                <p className="text-text-white">
                                  {leadFormContent.lead_form_title}
                                </p>
                              </div>
                            </div>
                          )}
                          
                          {leadFormContent?.lead_form_description && (
                            <div>
                              <h5 className="font-medium text-text-white mb-2">Form Description</h5>
                              <div className="bg-container-bg p-3 rounded-lg border border-border-dark">
                                <p className="text-text-white">
                                  {leadFormContent.lead_form_description}
                                </p>
                              </div>
                            </div>
                          )}
                          
                          {leadFormContent?.questions && leadFormContent.questions.length > 0 && (
                            <div>
                              <h5 className="font-medium text-text-white mb-2">Form Questions</h5>
                              <div className="bg-container-bg p-3 rounded-lg space-y-2 border border-border-dark">
                                {leadFormContent.questions.map((question: any, index: number) => (
                                  <div key={`question-${index}`} className="border-b border-border-dark pb-2 last:border-0 last:pb-0">
                                    <p className="text-text-white">
                                      <span className="text-primary-green">{question.type}:</span> {question.label}
                                    </p>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </TabsContent>
                    
                    {/* Privacy Tab */}
                    <TabsContent value="privacy" className="space-y-4">
                      <div className="bg-dark-bg rounded-lg p-4 border border-border-dark">
                        <h4 className="text-lg font-medium mb-4 text-primary-green">Privacy Information</h4>
                        
                        <div className="space-y-4">
                          {leadFormContent?.privacy_policy_link_text && (
                            <div>
                              <h5 className="font-medium text-text-white mb-2">Privacy Policy Link Text</h5>
                              <div className="bg-container-bg p-3 rounded-lg border border-border-dark">
                                <p className="text-text-white">
                                  {leadFormContent.privacy_policy_link_text}
                                </p>
                              </div>
                            </div>
                          )}
                          
                          {leadFormContent?.lead_form_data_usage_disclaimer && (
                            <div>
                              <h5 className="font-medium text-text-white mb-2">Data Usage Disclaimer</h5>
                              <div className="bg-container-bg p-3 rounded-lg border border-border-dark">
                                <p className="text-text-white">
                                  {leadFormContent.lead_form_data_usage_disclaimer}
                                </p>
                              </div>
                            </div>
                          )}
                          
                          {leadFormContent?.lead_form_locale && (
                            <div>
                              <h5 className="font-medium text-text-white mb-2">Form Locale</h5>
                              <div className="bg-container-bg p-3 rounded-lg border border-border-dark">
                                <p className="text-text-white">
                                  {leadFormContent.lead_form_locale}
                                </p>
                              </div>
                            </div>
                          )}
                          
                          {leadFormContent?.company_name && (
                            <div>
                              <h5 className="font-medium text-text-white mb-2">Company Name</h5>
                              <div className="bg-container-bg p-3 rounded-lg border border-border-dark">
                                <p className="text-text-white">
                                  {leadFormContent.company_name}
                                </p>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </TabsContent>
                    
                    {/* Thank You Page Tab */}
                    <TabsContent value="thankYou" className="space-y-4">
                      <div className="bg-dark-bg rounded-lg p-4 border border-border-dark">
                        <h4 className="text-lg font-medium mb-4 text-primary-green">Thank You Page</h4>
                        
                        <div className="space-y-4">
                          {leadFormContent?.lead_form_thank_you_page_title && (
                            <div>
                              <h5 className="font-medium text-text-white mb-2">Thank You Page Title</h5>
                              <div className="bg-container-bg p-3 rounded-lg border border-border-dark">
                                <p className="text-text-white">
                                  {leadFormContent.lead_form_thank_you_page_title}
                                </p>
                              </div>
                            </div>
                          )}
                          
                          {leadFormContent?.lead_form_thank_you_text && (
                            <div>
                              <h5 className="font-medium text-text-white mb-2">Thank You Text</h5>
                              <div className="bg-container-bg p-3 rounded-lg border border-border-dark">
                                <p className="text-text-white">
                                  {leadFormContent.lead_form_thank_you_text}
                                </p>
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