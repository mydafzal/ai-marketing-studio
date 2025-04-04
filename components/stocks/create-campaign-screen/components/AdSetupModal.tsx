import React, { useState, useEffect, useRef } from 'react';
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
import { 
  Eye, Target, MapPin, Globe, Users, Calendar, Info, Filter, Settings, 
  Layout, MessageSquare, FileText, Image, Cog, FolderHeart,
  File, Lock, ThumbsUp as CheckCircle, X 
} from 'lucide-react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogFooter
} from '@/components/ui/dialog';
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Gender, MasterFlowResponse, AdPlacements } from '../types';

interface AdSetupModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  masterFlowData?: MasterFlowResponse | null;
  adHeadline: string;
  adText: string;
  campaignName?: string;
  campaignObjective: string;
  targetedLocations: string[];
  ageRange: [number, number];
  gender: Gender;
  targetedInterests: string[];
  behavioralFilters: string[];
  demographicFilters: string[];
  adPlacements: AdPlacements;
  budget: string;
  creatives: any[];
}

export function AdSetupModal({
  isOpen,
  onOpenChange,
  masterFlowData,
  adHeadline,
  adText,
  campaignName,
  campaignObjective,
  targetedLocations,
  ageRange,
  gender,
  targetedInterests,
  behavioralFilters,
  demographicFilters,
  adPlacements,
  budget,
  creatives
}: AdSetupModalProps) {
  const [activeSettingsTab, setActiveSettingsTab] = useState<string>("adtext");
  const [activeAdSetTab, setActiveAdSetTab] = useState<string>("objective");
  const [activeCreativeTab, setActiveCreativeTab] = useState<string>("creative-0");
  const [activeLeadFormTab, setActiveLeadFormTab] = useState<string>("step1");
  
  // Preview states
  const [adFormat, setAdFormat] = useState<string>("INSTAGRAM_STANDARD");
  
  // Update format based on creative type when tab changes
  useEffect(() => {
    if (creatives && creatives.length > 0) {
      const creativeIndex = parseInt(activeCreativeTab.split('-')[1]) || 0;
      if (creatives[creativeIndex]) {
        // Set appropriate default format
        // Using our ExtendedCreative interface
        const creative = creatives[creativeIndex] as ExtendedCreative;
        if (creative.media_type === 'video' || creative.is_video) {
          setAdFormat("INSTAGRAM_STANDARD");
        } else {
          setAdFormat("INSTAGRAM_STANDARD");
        }
      }
    }
  }, [activeCreativeTab, creatives]);
  const [previewHtml, setPreviewHtml] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const previewRef = useRef<HTMLDivElement>(null);
  
  // Fetch preview HTML when a creative is selected
  useEffect(() => {
    const fetchPreview = async () => {
      if (!creatives || creatives.length === 0 || !creatives[parseInt(activeCreativeTab.split('-')[1])]?.creative_id) {
        return;
      }
      
      const creativeId = creatives[parseInt(activeCreativeTab.split('-')[1])].creative_id;
      
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
    
    if (isOpen) {
      fetchPreview();
    }
  }, [isOpen, activeCreativeTab, adFormat, creatives]);

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
            </style>
          </head>
          <body>
            <div class="preview-placeholder">
              <div class="ad-title">${masterFlowData?.ad_creative_text?.ad_creative_title || adHeadline || 'Ad Preview'}</div>
              <div class="ad-text">${masterFlowData?.ad_creative_text?.ad_creative_description?.substring(0, 100) || adText?.substring(0, 100) || 'Ad description will appear here'} ${(masterFlowData?.ad_creative_text?.ad_creative_description?.length ?? 0) > 100 || (adText?.length ?? 0) > 100 ? '...' : ''}</div>
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
           !Array.isArray(masterFlowData.suggested_targeting_filters);
  };

  // Get interest filters from the complex structure
  const getInterestFilters = () => {
    // First, try the direct targeting_filters approach
    if (hasComplexTargetingStructure() && 
        (masterFlowData?.suggested_targeting_filters as any).targeting_filters && 
        (masterFlowData?.suggested_targeting_filters as any).targeting_filters.interest_filters) {
      const interestFilters = (masterFlowData?.suggested_targeting_filters as any).targeting_filters.interest_filters;
      return Object.keys(interestFilters);
    } 
    
    // Next, check if we have interest filters in the audience data which is common in masterbranch response
    if (masterFlowData?.audiences?.audiences && 
        masterFlowData.audiences.audiences.length > 0) {
      // Try to find an audience with interest filters
      for (const audience of masterFlowData.audiences.audiences) {
        if (audience.targeting_filters && 
            audience.targeting_filters.filters && 
            audience.targeting_filters.filters.interest_filters) {
          return Object.keys(audience.targeting_filters.filters.interest_filters);
        }
      }
    }
    
    // Legacy approach
    if (masterFlowData?.suggested_targeting_filters && Array.isArray(masterFlowData.suggested_targeting_filters)) {
      return masterFlowData.suggested_targeting_filters
        .filter(filter => filter.type === 'interest')
        .map(filter => filter.name);
    }
    
    return targetedInterests;
  };

  // Get behavioral filters from the complex structure
  const getBehavioralFilters = () => {
    // First, try the direct targeting_filters approach
    if (hasComplexTargetingStructure() && 
        (masterFlowData?.suggested_targeting_filters as any).targeting_filters && 
        (masterFlowData?.suggested_targeting_filters as any).targeting_filters.behaviour_filters) {
      const behaviorFilters = (masterFlowData?.suggested_targeting_filters as any).targeting_filters.behaviour_filters;
      return Object.keys(behaviorFilters);
    }
    
    // Next, check if we have behavior filters in the audience data
    if (masterFlowData?.audiences?.audiences && 
        masterFlowData.audiences.audiences.length > 0) {
      // Try to find an audience with behavior filters
      for (const audience of masterFlowData.audiences.audiences) {
        if (audience.targeting_filters && 
            audience.targeting_filters.filters && 
            audience.targeting_filters.filters.behaviour_filters) {
          return Object.keys(audience.targeting_filters.filters.behaviour_filters);
        }
      }
    }
    
    // Legacy approach
    if (masterFlowData?.suggested_targeting_filters && Array.isArray(masterFlowData.suggested_targeting_filters)) {
      return masterFlowData.suggested_targeting_filters
        .filter(filter => filter.type === 'behavior')
        .map(filter => filter.name);
    }
    
    return behavioralFilters;
  };

  // Get demographic filters from the complex structure
  const getDemographicFilters = () => {
    // First, try the direct targeting_filters approach
    if (hasComplexTargetingStructure() && 
        (masterFlowData?.suggested_targeting_filters as any).targeting_filters && 
        (masterFlowData?.suggested_targeting_filters as any).targeting_filters.demographic_filters) {
      const demographicFilters = (masterFlowData?.suggested_targeting_filters as any).targeting_filters.demographic_filters;
      return Object.keys(demographicFilters);
    }
    
    // Next, check if we have demographic filters in the audience data
    if (masterFlowData?.audiences?.audiences && 
        masterFlowData.audiences.audiences.length > 0) {
      // Try to find an audience with demographic filters
      for (const audience of masterFlowData.audiences.audiences) {
        if (audience.targeting_filters && 
            audience.targeting_filters.filters && 
            audience.targeting_filters.filters.demographic_filters) {
          return Object.keys(audience.targeting_filters.filters.demographic_filters);
        }
      }
    }
    
    // Legacy approach
    if (masterFlowData?.suggested_targeting_filters && Array.isArray(masterFlowData.suggested_targeting_filters)) {
      return masterFlowData.suggested_targeting_filters
        .filter(filter => filter.type === 'demographic')
        .map(filter => filter.name);
    }
    
    return demographicFilters;
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

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="bg-[#1A1D29] text-text-white border-[#2A2E3A] max-w-4xl w-full max-h-[90vh] overflow-hidden">
        <DialogHeader className="border-b border-[#2A2E3A] pb-4">
          <DialogTitle>Ad Campaign Setup</DialogTitle>
        </DialogHeader>
        <div className="overflow-y-auto max-h-[calc(90vh-120px)] pr-2">
          <Tabs defaultValue="adtext" value={activeSettingsTab} onValueChange={setActiveSettingsTab} className="w-full mt-4">
            <TabsList className="w-full bg-dark-bg text-text-light-gray mb-4 border border-border-dark rounded-lg overflow-hidden">
              <TabsTrigger value="adtext" className={`data-[state=active]:bg-dark-bg data-[state=active]:text-primary-green ${activeSettingsTab === 'adtext' ? 'border-b-2 border-primary-green' : ''}`}>
                <MessageSquare className="mr-2 size-4" />
                Ad Text
              </TabsTrigger>
              <TabsTrigger value="adSet" className={`data-[state=active]:bg-dark-bg data-[state=active]:text-primary-green ${activeSettingsTab === 'adSet' ? 'border-b-2 border-primary-green' : ''}`}>
                <Cog className="mr-2 size-4" />
                Ad Set
              </TabsTrigger>
              <TabsTrigger value="adCreative" className={`data-[state=active]:bg-dark-bg data-[state=active]:text-primary-green ${activeSettingsTab === 'adCreative' ? 'border-b-2 border-primary-green' : ''}`}>
                <Image className="mr-2 size-4" />
                Ad Creatives
              </TabsTrigger>
              {hasLeadFormData && (
                <TabsTrigger value="leadForm" className={`data-[state=active]:bg-dark-bg data-[state=active]:text-primary-green ${activeSettingsTab === 'leadForm' ? 'border-b-2 border-primary-green' : ''}`}>
                  <FolderHeart className="mr-2 size-4" />
                  Lead Form
                </TabsTrigger>
              )}
            </TabsList>

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

            {/* Ad Set Tab */}
            <TabsContent value="adSet" className="space-y-4">
              <Tabs defaultValue="objective" value={activeAdSetTab} onValueChange={setActiveAdSetTab} className="w-full">
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
                        {/* Exact match comment hidden as requested */}
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
                                {/* Using ExtendedCreative interface */}
                                {(creative as ExtendedCreative).media_type === 'image' || (creative as ExtendedCreative).is_image ? 'Image' : 'Video'}
                              </p>
                            </div>
                          </div>

                          {/* Creative ID hidden as requested */}

                          {/* Preview of the creative */}
                          <div>
                            <h5 className="font-medium text-text-white mb-2">Ad Preview</h5>
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
                                {/* Using ExtendedCreative interface */}
                                {((creatives[parseInt(activeCreativeTab.split('-')[1])] as ExtendedCreative)?.media_type === 'video' || 
                                  (creatives[parseInt(activeCreativeTab.split('-')[1])] as ExtendedCreative)?.is_video) && (
                                  <>
                                    <option value="FACEBOOK_REELS_MOBILE">Facebook Reels</option>
                                    <option value="INSTAGRAM_REELS">Instagram Reels</option>
                                  </>
                                )}
                              </select>
                            </div>
                            
                            <div className="relative w-full bg-dark-bg rounded-lg overflow-hidden min-h-[400px] flex items-center justify-center border border-border-dark">
                              {isLoading ? (
                                <div className="flex items-center justify-center w-full h-full">
                                  <div className="animate-spin rounded-full size-12 border-b-2 border-primary-green"></div>
                                </div>
                              ) : error ? (
                                <div className="text-red-400 p-4 text-center">
                                  {error}
                                </div>
                              ) : previewHtml ? (
                                <div 
                                  ref={previewRef}
                                  className="w-full h-full flex items-center justify-center" 
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
                              ) : (
                                <div className="text-text-light-gray text-center p-4">
                                  No preview available for this creative
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
                          {/* Using ExtendedCreative interface */}
                          {(creatives[0] as ExtendedCreative)?.media_type === 'image' || (creatives[0] as ExtendedCreative)?.is_image ? 'Image' : 
                           (creatives[0] as ExtendedCreative)?.media_type === 'video' || (creatives[0] as ExtendedCreative)?.is_video ? 'Video' : 'Media'}
                        </p>
                      </div>
                    </div>
                    
                    {/* Creative ID hidden as requested */}
                    
                    {/* Preview of the creative */}
                    <div>
                      <h5 className="font-medium text-text-white mb-2">Ad Preview</h5>
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
                          {/* Using ExtendedCreative interface */}
                          {((creatives[0] as ExtendedCreative)?.media_type === 'video' || (creatives[0] as ExtendedCreative)?.is_video) && (
                            <>
                              <option value="FACEBOOK_REELS_MOBILE">Facebook Reels</option>
                              <option value="INSTAGRAM_REELS">Instagram Reels</option>
                            </>
                          )}
                        </select>
                      </div>
                      
                      <div className="relative w-full bg-dark-bg rounded-lg overflow-hidden min-h-[400px] flex items-center justify-center border border-border-dark">
                        {isLoading ? (
                          <div className="flex items-center justify-center w-full h-full">
                            <div className="animate-spin rounded-full size-12 border-b-2 border-primary-green"></div>
                          </div>
                        ) : error ? (
                          <div className="text-red-400 p-4 text-center">
                            {error}
                          </div>
                        ) : previewHtml ? (
                          <div 
                            ref={previewRef}
                            className="w-full h-full flex items-center justify-center" 
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
                        ) : (
                          <div className="text-text-light-gray text-center p-4">
                            No preview available for this creative
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </TabsContent>

            {/* Lead Form Tab */}
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
                        {/* Lead Form Preview. */}
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
                                
                                <p className="text-[#767676] text-[14px] mt-5 border-t border-[#f2f2f2] pt-4 leading-relaxed">
                                  This is step 1 of your lead form. Users will see your form title and description, and then be asked to provide information.
                                </p>
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
                      <h4 className="text-[22px] font-medium mb-5 text-[#292929]">Step 2: Questions</h4>
                      {leadForm && leadForm.questions && (
                        <div className="space-y-4">
                          {leadForm.questions.map((question: any, idx: number) => (
                            <div key={`question-${idx}`} className="p-3 border border-[#d3d3d3] rounded bg-[#f2f2f2]">
                              <p className="font-medium text-[#292929]">{question.label}</p>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </TabsContent>
                  
                  {/* Step 3: Privacy Tab */}
                  <TabsContent value="step3" className="space-y-4">
                    <div className="bg-white rounded-lg p-5 border border-[#d3d3d3] shadow-sm">
                      <h4 className="text-[22px] font-medium mb-5 text-[#292929]">Privacy Policy</h4>
                      {leadForm && (
                        <div className="p-4 border border-[#d3d3d3] rounded bg-[#f2f2f2]">
                          <p className="text-[#292929]">{leadForm.disclaimerText || "Privacy policy information"}</p>
                        </div>
                      )}
                    </div>
                  </TabsContent>
                  
                  {/* Step 4: Thank You Tab */}
                  <TabsContent value="step4" className="space-y-4">
                    <div className="bg-white rounded-lg p-5 border border-[#d3d3d3] shadow-sm">
                      <h4 className="text-[22px] font-medium mb-5 text-[#292929]">Thank You Page</h4>
                      {leadForm && (
                        <div className="text-center p-4 border border-[#d3d3d3] rounded bg-[#f2f2f2]">
                          <h5 className="text-xl font-bold mb-2 text-[#292929]">{leadForm.thankYouPageTitle || "Thank You!"}</h5>
                          <p className="text-[#292929]">{leadForm.thankYouText || "Your form has been submitted successfully."}</p>
                        </div>
                      )}
                    </div>
                  </TabsContent>
                </Tabs>
              </TabsContent>
            )}
          </Tabs>
        </div>
        <DialogFooter className="border-t border-[#2A2E3A] pt-4">
          <button 
            className="py-2 px-4 bg-[#1A1D29] text-white border border-[#2A2E3A] rounded-md hover:bg-[#212534] transition-colors"
            onClick={() => onOpenChange(false)}
          >
            Close
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}