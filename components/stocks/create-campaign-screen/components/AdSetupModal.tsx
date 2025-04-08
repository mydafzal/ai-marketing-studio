import React, { useState, useEffect, useRef } from 'react';
import { Creative as LibCreative } from '@/lib/types';
import {
  Eye, Target, MapPin, Globe, Users, Calendar, Info, Filter, Settings,
  Layout, MessageSquare, FileText, Image, Cog, FolderHeart,
  File, Lock, ThumbsUp as CheckCircle, X, Save
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

// Extended interface with union from both LibCreative and our additional fields
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
  // States for editable headline/description
  const [editedHeadline, setEditedHeadline] = useState(
      masterFlowData?.ad_creative_text?.ad_creative_title || adHeadline
  );
  const [editedDescription, setEditedDescription] = useState(
      masterFlowData?.ad_creative_text?.ad_creative_description || adText
  );
  
  // Track original values to detect changes
  const [originalHeadline, setOriginalHeadline] = useState(
      masterFlowData?.ad_creative_text?.ad_creative_title || adHeadline
  );
  const [originalDescription, setOriginalDescription] = useState(
      masterFlowData?.ad_creative_text?.ad_creative_description || adText
  );
  
  // Track if text has been modified and needs saving
  const [isTextModified, setIsTextModified] = useState(false);
  
  // Track save operation state
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  
  // Track updated creatives from the API response
  const [updatedCreatives, setUpdatedCreatives] = useState<ExtendedCreative[]>([]);

  // Tab states
  const [activeSettingsTab, setActiveSettingsTab] = useState<string>("adtext");
  const [activeAdSetTab, setActiveAdSetTab] = useState<string>("objective");
  const [activeCreativeTab, setActiveCreativeTab] = useState<string>("creative-0");
  const [activeLeadFormTab, setActiveLeadFormTab] = useState<string>("step1");

  // Preview states
  const [adFormat, setAdFormat] = useState<string>("INSTAGRAM_STANDARD");
  const [previewHtml, setPreviewHtml] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const previewRef = useRef<HTMLDivElement>(null);

  // Check for text modifications
  useEffect(() => {
    // Check if either headline or description has changed
    const headlineChanged = editedHeadline !== originalHeadline;
    const descriptionChanged = editedDescription !== originalDescription;
    
    // Update the modified state based on changes
    setIsTextModified(headlineChanged || descriptionChanged);
    
    // Reset the save success message when text is modified again
    if (headlineChanged || descriptionChanged) {
      setSaveSuccess(false);
    }
  }, [editedHeadline, editedDescription, originalHeadline, originalDescription]);

  // Handler for headline changes
  const handleHeadlineChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEditedHeadline(e.target.value);
  };

  // Handler for description changes
  const handleDescriptionChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setEditedDescription(e.target.value);
  };

  // Handler for user clicking the "save" icon
  const handleSave = async () => {
    // Only proceed if text is actually modified
    if (!isTextModified) return;
    
    setIsSaving(true);
    
    try {
      // Get required fields from masterFlowData
      const campaign_session_id = masterFlowData?.campaign_flow_session_id;
      const fb_account_id = masterFlowData?.fb_account_id;
      
      // Validate required fields
      if (!campaign_session_id) {
        throw new Error('Missing campaign session ID');
      }
      
      if (!fb_account_id) {
        throw new Error('Missing Facebook account ID');
      }
      
      // Call the API to save the changes
      const response = await fetch('/api/fasty-bot/proxy-ad-creative-text-adjustment', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          campaign_session_id,
          fb_account_id,
          title: editedHeadline,
          message: editedDescription,
        }),
      });

      // Parse response
      const data = await response.json();
      
      if (!response.ok || !data.success) {
        const errorMessage = data.message || 'Failed to save ad text changes';
        console.error('API error:', data);
        throw new Error(errorMessage);
      }
      
      // Process the response to update the creatives with new data
      if (data.creatives && data.creatives.length > 0) {
        console.log('Updated creatives:', data.creatives);
        
        // Transform API response creatives to ExtendedCreative format
        const newCreatives: ExtendedCreative[] = data.creatives.map((creative: any) => ({
          creative_id: creative.creative_id,
          name: creative.name,
          preview_uuid: creative.preview_uuid,
          is_image: creative.is_image ?? false,
          is_video: creative.is_video ?? false,
          media_type: creative.is_video ? 'video' : 'image',
          previews: creative.previews || {},
          // Preserve any other fields from original creatives if needed
        }));
        
        // Update the creatives state with new data
        setUpdatedCreatives(newCreatives);
      }
      
      // Update original values to match current values
      setOriginalHeadline(editedHeadline);
      setOriginalDescription(editedDescription);
      
      // Mark as no longer modified and save as successful
      setIsTextModified(false);
      setSaveSuccess(true);
      
      // Reset success message after 3 seconds
      setTimeout(() => {
        setSaveSuccess(false);
      }, 3000);
      
      console.log('Ad text changes saved successfully!');
    } catch (err) {
      console.error('Error saving ad text:', err);
      // Show error message to user (could use a toast notification in a real app)
      alert(`Error: ${err instanceof Error ? err.message : 'Failed to save changes'}`);
    } finally {
      setIsSaving(false);
    }
  };

  // Update format based on creative type when tab changes
  useEffect(() => {
    // Use updated creatives if available, otherwise fall back to props
    const effectiveCreatives = updatedCreatives.length > 0 ? updatedCreatives : creatives;
    
    if (effectiveCreatives && effectiveCreatives.length > 0) {
      const creativeIndex = parseInt(activeCreativeTab.split('-')[1]) || 0;
      if (effectiveCreatives[creativeIndex]) {
        const creative = effectiveCreatives[creativeIndex] as ExtendedCreative;
        console.log('Setting format based on creative:', creative);
        
        // Set format based on media type
        if (creative.media_type === 'video' || creative.is_video) {
          setAdFormat("INSTAGRAM_STANDARD");
        } else {
          setAdFormat("INSTAGRAM_STANDARD");
        }
      }
    }
  }, [activeCreativeTab, creatives, updatedCreatives]);

  // Fetch preview HTML when a creative is selected
  useEffect(() => {
    const fetchPreview = async () => {
      // Determine which creatives array to use - use updated creatives if available, otherwise fall back to props
      const effectiveCreatives = updatedCreatives.length > 0 ? updatedCreatives : creatives;
      
      if (
          !effectiveCreatives ||
          effectiveCreatives.length === 0
      ) {
        return;
      }
      
      // Get the index of the current creative
      const creativeIndex = parseInt(activeCreativeTab.split('-')[1]) || 0;
      
      // Make sure the creative exists at this index
      if (!effectiveCreatives[creativeIndex]?.creative_id) {
        setError("Selected creative not found");
        return;
      }

      const creativeId = effectiveCreatives[creativeIndex].creative_id;
      console.log(`Fetching preview for creative ID: ${creativeId} with format: ${adFormat}`);

      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch(`/api/fasty-bot/proxy-get-ad-creative-preview?creative_id=${creativeId}&ad_format=${adFormat}`);
        if (!response.ok) {
          throw new Error(`Failed to fetch preview: ${response.statusText}`);
        }

        const data = await response.json();
        if (data.success && data.preview_html) {
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
  }, [isOpen, activeCreativeTab, adFormat, creatives, updatedCreatives]);

  // Modify iframes to be fixed size
  useEffect(() => {
    if (previewRef.current && !isLoading && previewHtml) {
      const iframes = previewRef.current.querySelectorAll('iframe');
      iframes.forEach(iframe => {
        iframe.setAttribute('scrolling', 'no');
        iframe.style.width = '313px';
        iframe.style.height = '534px';
        iframe.style.border = 'none';
        iframe.style.overflow = 'hidden';
        iframe.style.transform = 'none';
        iframe.style.transition = 'none';
        iframe.style.setProperty('-ms-overflow-style', 'none');
        iframe.style.scrollbarWidth = 'none';

        iframe.onload = () => {
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
    // Check for "Instagram Actor ID" error
    if (html.includes('Instagram Actor ID is required') || html.includes('Select an Instagram account')) {
      // Always use the most recent version of the text (edited values take precedence)
      const title = editedHeadline || masterFlowData?.ad_creative_text?.ad_creative_title || 'Ad Preview';
      const description = editedDescription || masterFlowData?.ad_creative_text?.ad_creative_description || 'Ad description will appear here';
      
      // Create a placeholder preview with the current text
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
              ${updatedCreatives.length > 0 ? '<div class="updated-badge">Updated</div>' : ''}
              <div class="ad-title">${title}</div>
              <div class="ad-text">
                ${description.substring(0, 100)}
                ${description.length > 100 ? '...' : ''}
              </div>
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
        .replace(
            /<head>/g,
            '<head><style>::-webkit-scrollbar{display:none;width:0;height:0;}body::-webkit-scrollbar{display:none;}</style>'
        );
  };

  // Safely render HTML content
  const renderHtml = () => {
    return { __html: previewHtml };
  };

  // Check for complex targeting filter structure
  const hasComplexTargetingStructure = () => {
    return (
        masterFlowData?.suggested_targeting_filters &&
        typeof masterFlowData.suggested_targeting_filters === 'object' &&
        !Array.isArray(masterFlowData.suggested_targeting_filters)
    );
  };

  // Get interest filters
  const getInterestFilters = () => {
    if (
        hasComplexTargetingStructure() &&
        (masterFlowData?.suggested_targeting_filters as any).targeting_filters &&
        (masterFlowData?.suggested_targeting_filters as any).targeting_filters.interest_filters
    ) {
      const interestFilters = (masterFlowData?.suggested_targeting_filters as any).targeting_filters.interest_filters;
      return Object.keys(interestFilters);
    }

    if (masterFlowData?.audiences?.audiences && masterFlowData.audiences.audiences.length > 0) {
      for (const audience of masterFlowData.audiences.audiences) {
        if (
            audience.targeting_filters &&
            audience.targeting_filters.filters &&
            audience.targeting_filters.filters.interest_filters
        ) {
          return Object.keys(audience.targeting_filters.filters.interest_filters);
        }
      }
    }

    if (masterFlowData?.suggested_targeting_filters && Array.isArray(masterFlowData.suggested_targeting_filters)) {
      return masterFlowData.suggested_targeting_filters
          .filter(filter => filter.type === 'interest')
          .map(filter => filter.name);
    }

    return targetedInterests;
  };

  // Get behavioral filters
  const getBehavioralFilters = () => {
    if (
        hasComplexTargetingStructure() &&
        (masterFlowData?.suggested_targeting_filters as any).targeting_filters &&
        (masterFlowData?.suggested_targeting_filters as any).targeting_filters.behaviour_filters
    ) {
      const behaviorFilters = (masterFlowData?.suggested_targeting_filters as any).targeting_filters.behaviour_filters;
      return Object.keys(behaviorFilters);
    }

    if (masterFlowData?.audiences?.audiences && masterFlowData.audiences.audiences.length > 0) {
      for (const audience of masterFlowData.audiences.audiences) {
        if (
            audience.targeting_filters &&
            audience.targeting_filters.filters &&
            audience.targeting_filters.filters.behaviour_filters
        ) {
          return Object.keys(audience.targeting_filters.filters.behaviour_filters);
        }
      }
    }

    if (masterFlowData?.suggested_targeting_filters && Array.isArray(masterFlowData.suggested_targeting_filters)) {
      return masterFlowData.suggested_targeting_filters
          .filter(filter => filter.type === 'behavior')
          .map(filter => filter.name);
    }

    return behavioralFilters;
  };

  // Get demographic filters
  const getDemographicFilters = () => {
    if (
        hasComplexTargetingStructure() &&
        (masterFlowData?.suggested_targeting_filters as any).targeting_filters &&
        (masterFlowData?.suggested_targeting_filters as any).targeting_filters.demographic_filters
    ) {
      const demographicFilters = (masterFlowData?.suggested_targeting_filters as any).targeting_filters.demographic_filters;
      return Object.keys(demographicFilters);
    }

    if (masterFlowData?.audiences?.audiences && masterFlowData.audiences.audiences.length > 0) {
      for (const audience of masterFlowData.audiences.audiences) {
        if (
            audience.targeting_filters &&
            audience.targeting_filters.filters &&
            audience.targeting_filters.filters.demographic_filters
        ) {
          return Object.keys(audience.targeting_filters.filters.demographic_filters);
        }
      }
    }

    if (masterFlowData?.suggested_targeting_filters && Array.isArray(masterFlowData.suggested_targeting_filters)) {
      return masterFlowData.suggested_targeting_filters
          .filter(filter => filter.type === 'demographic')
          .map(filter => filter.name);
    }

    return demographicFilters;
  };

  // Utility to display lists nicely
  const formatObjectsForDisplay = (arr: any[] | undefined) => {
    if (!arr || !Array.isArray(arr) || arr.length === 0) return "None";

    return arr
        .map(item => {
          if (typeof item === 'string') return item;
          if (item.name) return item.name;
          if (item.country) return `${item.country}${item.region ? ` (${item.region})` : ''}`;
          return JSON.stringify(item);
        })
        .join(', ');
  };

  const hasPlacementData = masterFlowData?.hasOwnProperty('placements');
  const hasLeadFormData = masterFlowData?.lead_form_content !== undefined;
  const leadFormContent = masterFlowData?.lead_form_content as any;

  // Extract lead form data
  const processLeadFormQuestions = () => {
    if (!leadFormContent) return [];

    if (leadFormContent.lead_form_questions && Array.isArray(leadFormContent.lead_form_questions)) {
      return leadFormContent.lead_form_questions.map((question: string) => {
        return {
          type: question,
          label: formatQuestionLabel(question)
        };
      });
    }
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

  const formatQuestionLabel = (questionKey: string): string => {
    if (!questionKey) return '';
    return questionKey
        .split('_')
        .map(word => word.charAt(0) + word.slice(1).toLowerCase())
        .join(' ');
  };

  const getLeadFormData = () => {
    if (!leadFormContent) return null;
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
                <TabsTrigger
                    value="adtext"
                    className={`data-[state=active]:bg-dark-bg data-[state=active]:text-primary-green ${
                        activeSettingsTab === 'adtext' ? 'border-b-2 border-primary-green' : ''
                    }`}
                >
                  <MessageSquare className="mr-2 size-4" />
                  Ad Text
                </TabsTrigger>
                <TabsTrigger
                    value="adSet"
                    className={`data-[state=active]:bg-dark-bg data-[state=active]:text-primary-green ${
                        activeSettingsTab === 'adSet' ? 'border-b-2 border-primary-green' : ''
                    }`}
                >
                  <Cog className="mr-2 size-4" />
                  Ad Set
                </TabsTrigger>
                <TabsTrigger
                    value="adCreative"
                    className={`data-[state=active]:bg-dark-bg data-[state=active]:text-primary-green ${
                        activeSettingsTab === 'adCreative' ? 'border-b-2 border-primary-green' : ''
                    }`}
                >
                  <Image className="mr-2 size-4" />
                  Ad Creatives
                </TabsTrigger>
                {hasLeadFormData && (
                    <TabsTrigger
                        value="leadForm"
                        className={`data-[state=active]:bg-dark-bg data-[state=active]:text-primary-green ${
                            activeSettingsTab === 'leadForm' ? 'border-b-2 border-primary-green' : ''
                        }`}
                    >
                      <FolderHeart className="mr-2 size-4" />
                      Lead Form
                    </TabsTrigger>
                )}
              </TabsList>

              {/* -------------------------------------------- */}
              {/*  A D   T E X T   T A B   (EDITABLE FIELDS)   */}
              {/* -------------------------------------------- */}
              <TabsContent value="adtext" className="space-y-4">
                <div className="bg-dark-bg rounded-lg p-4 border border-border-dark">
                  {/* Title row with "Save" icon on the right */}
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-lg font-medium text-primary-green">
                      Ad Creative Text
                    </h4>

                    {/* Save icon button with status indicators */}
                    <div className="flex flex-col items-end">
                      <button
                          onClick={handleSave}
                          disabled={!isTextModified || isSaving}
                          className={`transition-colors relative ${
                            isSaving ? 'opacity-50 cursor-not-allowed' : 
                            isTextModified ? 'text-yellow-400 hover:text-yellow-300' : 
                            'text-primary-green hover:text-white'
                          }`}
                          title={isTextModified ? "Save changes" : "No changes to save"}
                      >
                        <Save className="w-5 h-5" />
                        {isSaving && (
                          <span className="animate-spin absolute inset-0 flex items-center justify-center">
                            <span className="w-3 h-3 border-2 border-t-transparent border-yellow-400 rounded-full"></span>
                          </span>
                        )}
                      </button>
                      
                      {/* Status indicator text */}
                      {isTextModified && (
                        <span className="text-yellow-400 text-xs mt-1">Click to save</span>
                      )}
                      {saveSuccess && (
                        <span className="text-green-400 text-xs mt-1">Saved!</span>
                      )}
                    </div>
                  </div>

                  <div className="space-y-6">
                    {/* Editable Headline */}
                    <div>
                      <h5 className="font-medium text-text-white mb-2">Headline</h5>
                      <input
                          type="text"
                          value={editedHeadline}
                          onChange={handleHeadlineChange}
                          className={`w-full bg-container-bg p-3 rounded-lg border ${
                            editedHeadline !== originalHeadline 
                              ? 'border-yellow-400' 
                              : 'border-border-dark'
                          } text-text-white focus:outline-none focus:border-primary-green`}
                      />
                    </div>

                    {/* Editable Description */}
                    <div>
                      <h5 className="font-medium text-text-white mb-2">Description</h5>
                      <textarea
                          value={editedDescription}
                          onChange={handleDescriptionChange}
                          className={`w-full bg-container-bg p-3 rounded-lg border ${
                            editedDescription !== originalDescription 
                              ? 'border-yellow-400' 
                              : 'border-border-dark'
                          } text-text-white focus:outline-none focus:border-primary-green min-h-[80px]`}
                      />
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
                            <p className="text-text-white">{campaignName}</p>
                          </div>
                        </div>
                    )}
                  </div>
                </div>
              </TabsContent>

              {/* -------------------------------- */}
              {/*      A D   S E T   T A B         */}
              {/* -------------------------------- */}
              <TabsContent value="adSet" className="space-y-4">
                <Tabs
                    defaultValue="objective"
                    value={activeAdSetTab}
                    onValueChange={setActiveAdSetTab}
                    className="w-full"
                >
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

                  {/* Objective */}
                  <TabsContent value="objective" className="space-y-4">
                    <div className="bg-dark-bg rounded-lg p-4 border border-border-dark">
                      <div className="flex items-start">
                        <Globe className="size-5 text-coral mr-3 mt-1" />
                        <div>
                          <h4 className="font-medium text-text-white">Campaign Objective</h4>
                          <p className="text-text-light-gray">
                            {masterFlowData?.campaign_objective || campaignObjective}
                          </p>
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

                  {/* Budget */}
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

                  {/* Placements */}
                  <TabsContent value="placements" className="space-y-4">
                    <div className="bg-dark-bg rounded-lg p-4 border border-border-dark">
                      <div className="flex items-start">
                        <Layout className="size-5 text-primary-green mr-3 mt-1" />
                        <div>
                          <h4 className="font-medium text-text-white">Ad Placements</h4>
                          {hasPlacementData ? (
                              <p className="text-text-light-gray">Placements data from API</p>
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

                  {/* Targeting */}
                  <TabsContent value="targeting" className="space-y-4">
                    <div className="bg-dark-bg rounded-lg p-4 border border-border-dark">
                      <div className="flex items-start mb-3">
                        <MapPin className="size-5 text-primary-green mr-3 mt-1" />
                        <div>
                          <h4 className="font-medium text-text-white">Locations</h4>
                          <p className="text-text-light-gray">
                            {masterFlowData?.selected_locations
                                ? formatObjectsForDisplay(masterFlowData.selected_locations)
                                : targetedLocations.join(', ')}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-start mb-3">
                        <Users className="size-5 text-coral mr-3 mt-1" />
                        <div>
                          <h4 className="font-medium text-text-white">Demographics</h4>
                          <p className="text-text-light-gray">
                            Age: {masterFlowData?.suggested_age_min || ageRange[0]} -{' '}
                            {masterFlowData?.suggested_age_max || ageRange[1]}
                            <br />
                            Gender:{' '}
                            {masterFlowData
                                ? `${
                                    masterFlowData.include_male_gender ? 'Male ' : ''
                                }${masterFlowData.include_female_gender ? 'Female' : ''}`
                                : gender}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="bg-dark-bg rounded-lg p-4 border border-border-dark">
                      <div className="flex items-start mb-3">
                        <Target className="size-5 text-primary-green mr-3 mt-1" />
                        <div className="w-full">
                          <h4 className="font-medium text-text-white mb-2">Interest Targeting</h4>
                          <div className="flex flex-wrap gap-2">
                            {getInterestFilters().length > 0 ? (
                                getInterestFilters().map((filter, index) => (
                                    <span
                                        key={`interest-${index}`}
                                        className="px-2 py-1 bg-dark-bg border border-primary-green text-primary-green rounded-full text-xs"
                                    >
                                {filter}
                              </span>
                                ))
                            ) : (
                                <p className="text-text-light-gray">None</p>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-start mb-3">
                        <Filter className="size-5 text-primary-green mr-3 mt-1" />
                        <div className="w-full">
                          <h4 className="font-medium text-text-white mb-2">Behavioral Targeting</h4>
                          <div className="flex flex-wrap gap-2">
                            {getBehavioralFilters().length > 0 ? (
                                getBehavioralFilters().map((filter, index) => (
                                    <span
                                        key={`behavior-${index}`}
                                        className="px-2 py-1 bg-dark-bg border border-primary-green text-primary-green rounded-full text-xs"
                                    >
                                {filter}
                              </span>
                                ))
                            ) : (
                                <p className="text-text-light-gray">None</p>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-start">
                        <Users className="size-5 text-coral mr-3 mt-1" />
                        <div className="w-full">
                          <h4 className="font-medium text-text-white mb-2">Demographic Targeting</h4>
                          <div className="flex flex-wrap gap-2">
                            {getDemographicFilters().length > 0 ? (
                                getDemographicFilters().map((filter, index) => (
                                    <span
                                        key={`demographic-${index}`}
                                        className="px-2 py-1 bg-dark-bg border border-coral text-coral rounded-full text-xs"
                                    >
                                {filter}
                              </span>
                                ))
                            ) : (
                                <p className="text-text-light-gray">None</p>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    {masterFlowData?.age_gender_decision_reason && (
                        <div className="bg-dark-bg/80 rounded-lg p-4 border border-primary-green/30">
                          <div className="flex">
                            <Info className="size-5 text-primary-green mr-2 shrink-0" />
                            <p className="text-text-light-gray">
                              <span className="font-medium text-primary-green">Targeting Reasoning:</span>{' '}
                              {masterFlowData.age_gender_decision_reason}
                            </p>
                          </div>
                        </div>
                    )}
                  </TabsContent>
                </Tabs>
              </TabsContent>

              {/* -------------------------------- */}
              {/*   A D   C R E A T I V E S  T A B  */}
              {/* -------------------------------- */}
              <TabsContent value="adCreative" className="space-y-4">
                {/* Calculate effective creatives - use updated creatives if available */}
                {(() => {
                  // Use updated creatives if available, otherwise fall back to props
                  const effectiveCreatives = updatedCreatives.length > 0 ? updatedCreatives : creatives;
                  
                  // If updated creatives exist, show an indicator
                  const hasUpdatedCreatives = updatedCreatives.length > 0;
                  
                  return effectiveCreatives.length > 1 ? (
                    <Tabs
                        defaultValue="creative-0"
                        value={activeCreativeTab}
                        onValueChange={setActiveCreativeTab}
                        className="w-full"
                    >
                      {hasUpdatedCreatives && (
                        <div className="bg-green-800/20 p-2 rounded-md mb-3 text-sm border border-green-600/30">
                          <p className="text-green-400 flex items-center">
                            <span className="mr-2">●</span>
                            Using updated ad creatives with your text changes
                          </p>
                        </div>
                      )}
                    
                      <TabsList className="w-full bg-dark-bg text-text-light-gray mb-4 flex overflow-x-auto border border-border-dark rounded-lg">
                        {effectiveCreatives.map((_, index) => (
                            <TabsTrigger
                                key={`creative-tab-${index}`}
                                value={`creative-${index}`}
                                className={`data-[state=active]:bg-dark-bg data-[state=active]:text-primary-green ${
                                    activeCreativeTab === `creative-${index}` ? 'border-b-2 border-primary-green' : ''
                                }`}
                            >
                              Ad Creative {index + 1}
                            </TabsTrigger>
                        ))}
                      </TabsList>

                      {effectiveCreatives.map((creative, index) => (
                          <TabsContent key={`creative-content-${index}`} value={`creative-${index}`} className="space-y-4">
                            <div className="bg-dark-bg rounded-lg p-4 border border-border-dark">
                              <h4 className="text-lg font-medium mb-4 text-primary-green">
                                Ad Creative {index + 1} Details 
                                {hasUpdatedCreatives && <span className="text-xs text-green-400 ml-2">(Updated)</span>}
                              </h4>

                              {masterFlowData?.ad_creative_text?.ad_creative_name && index === 0 && (
                                  <div className="mb-4">
                                    <h5 className="font-medium text-text-white mb-2">Creative Name</h5>
                                    <div className="bg-container-bg p-3 rounded-lg border border-border-dark">
                                      <p className="text-text-white">
                                        {creative.name || masterFlowData.ad_creative_text.ad_creative_name}
                                      </p>
                                    </div>
                                  </div>
                              )}

                              <div className="space-y-4">
                                <div>
                                  <h5 className="font-medium text-text-white mb-2">Media Type</h5>
                                  <div className="bg-container-bg p-3 rounded-lg border border-border-dark">
                                    <p className="text-text-white">
                                      {(creative as ExtendedCreative).media_type === 'image' ||
                                      (creative as ExtendedCreative).is_image
                                          ? 'Image'
                                          : 'Video'}
                                    </p>
                                  </div>
                                </div>
                                
                                <div>
                                  <h5 className="font-medium text-text-white mb-2">Creative ID</h5>
                                  <div className="bg-container-bg p-3 rounded-lg border border-border-dark">
                                    <p className="text-text-white font-mono text-sm overflow-hidden text-ellipsis">
                                      {creative.creative_id}
                                    </p>
                                  </div>
                                </div>

                                {/* Ad Preview */}
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
                                      {((creative as ExtendedCreative)?.media_type === 'video' ||
                                          (creative as ExtendedCreative)?.is_video) && (
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
                                        <div className="text-red-400 p-4 text-center">{error}</div>
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
                      {hasUpdatedCreatives && (
                        <div className="bg-green-800/20 p-2 rounded-md mb-3 text-sm border border-green-600/30">
                          <p className="text-green-400 flex items-center">
                            <span className="mr-2">●</span>
                            Using updated ad creative with your text changes
                          </p>
                        </div>
                      )}
                      
                      <h4 className="text-lg font-medium mb-4 text-primary-green">
                        Ad Creative Details
                        {hasUpdatedCreatives && <span className="text-xs text-green-400 ml-2">(Updated)</span>}
                      </h4>

                      {masterFlowData?.ad_creative_text?.ad_creative_name && (
                          <div className="mb-4">
                            <h5 className="font-medium text-text-white mb-2">Creative Name</h5>
                            <div className="bg-container-bg p-3 rounded-lg border border-border-dark">
                              <p className="text-text-white">
                                {effectiveCreatives[0]?.name || masterFlowData.ad_creative_text.ad_creative_name}
                              </p>
                            </div>
                          </div>
                      )}

                      <div className="space-y-4">
                        <div>
                          <h5 className="font-medium text-text-white mb-2">Media Type</h5>
                          <div className="bg-container-bg p-3 rounded-lg border border-border-dark">
                            <p className="text-text-white">
                              {(effectiveCreatives[0] as ExtendedCreative)?.media_type === 'image' ||
                              (effectiveCreatives[0] as ExtendedCreative)?.is_image
                                  ? 'Image'
                                  : (effectiveCreatives[0] as ExtendedCreative)?.media_type === 'video' ||
                                  (effectiveCreatives[0] as ExtendedCreative)?.is_video
                                      ? 'Video'
                                      : 'Media'}
                            </p>
                          </div>
                        </div>
                        
                        <div>
                          <h5 className="font-medium text-text-white mb-2">Creative ID</h5>
                          <div className="bg-container-bg p-3 rounded-lg border border-border-dark">
                            <p className="text-text-white font-mono text-sm overflow-hidden text-ellipsis">
                              {effectiveCreatives[0]?.creative_id}
                            </p>
                          </div>
                        </div>

                        {/* Ad Preview */}
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
                              {((effectiveCreatives[0] as ExtendedCreative)?.media_type === 'video' ||
                                  (effectiveCreatives[0] as ExtendedCreative)?.is_video) && (
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
                                <div className="text-red-400 p-4 text-center">{error}</div>
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
                  )
                })()}
              </TabsContent>

              {/* -------------------------- */}
              {/*   L E A D   F O R M  T A B */}
              {/* -------------------------- */}
              {hasLeadFormData && (
                  <TabsContent value="leadForm" className="space-y-4">
                    <Tabs
                        defaultValue="step1"
                        value={activeLeadFormTab}
                        onValueChange={setActiveLeadFormTab}
                        className="w-full"
                    >
                      <TabsList className="w-full bg-[#f2f2f2] text-[#767676] mb-4 border border-[#d3d3d3] rounded-lg overflow-hidden">
                        <TabsTrigger
                            value="step1"
                            className={`data-[state=active]:bg-white data-[state=active]:text-[#4169e1] ${
                                activeLeadFormTab === 'step1' ? 'border-b-2 border-[#4169e1]' : ''
                            }`}
                        >
                          <File className="mr-2 size-4" />
                          Step 1: Form
                        </TabsTrigger>
                        <TabsTrigger
                            value="step2"
                            className={`data-[state=active]:bg-white data-[state=active]:text-[#4169e1] ${
                                activeLeadFormTab === 'step2' ? 'border-b-2 border-[#4169e1]' : ''
                            }`}
                        >
                          <CheckCircle className="mr-2 size-4" />
                          Step 2: Questions
                        </TabsTrigger>
                        <TabsTrigger
                            value="step3"
                            className={`data-[state=active]:bg-white data-[state=active]:text-[#4169e1] ${
                                activeLeadFormTab === 'step3' ? 'border-b-2 border-[#4169e1]' : ''
                            }`}
                        >
                          <Lock className="mr-2 size-4" />
                          Step 3: Privacy
                        </TabsTrigger>
                        <TabsTrigger
                            value="step4"
                            className={`data-[state=active]:bg-white data-[state=active]:text-[#4169e1] ${
                                activeLeadFormTab === 'step4' ? 'border-b-2 border-[#4169e1]' : ''
                            }`}
                        >
                          <CheckCircle className="mr-2 size-4" />
                          Step 4: Thank You
                        </TabsTrigger>
                      </TabsList>

                      {/* Step 1: Form */}
                      <TabsContent value="step1" className="space-y-4">
                        <div className="bg-white rounded-lg p-5 border border-[#d3d3d3] shadow-sm">
                          <h4 className="text-[22px] font-medium mb-5 text-[#292929]">Step 1: Lead Form</h4>

                          <div className="flex flex-col items-center">
                            {leadForm && (
                                <div className="w-full max-w-sm mx-auto">
                                  <div className="bg-white rounded-lg overflow-hidden shadow-lg">
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
                                      <h3 className="text-white text-[22px] font-bold">
                                        {leadForm.title || "Unlock the Power of AI"}
                                      </h3>
                                    </div>

                                    <div className="p-5 bg-white">
                                      <p className="text-[#292929] text-[16px] leading-relaxed mb-5">
                                        {leadForm.description || "Fill out this form to learn more about our services."}
                                      </p>

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
                                        This is step 1 of your lead form. Users will see your form title and description, and
                                        then be asked to provide information.
                                      </p>
                                    </div>
                                  </div>
                                </div>
                            )}
                          </div>
                        </div>
                      </TabsContent>

                      {/* Step 2: Questions */}
                      <TabsContent value="step2" className="space-y-4">
                        <div className="bg-white rounded-lg p-5 border border-[#d3d3d3] shadow-sm">
                          <h4 className="text-[22px] font-medium mb-5 text-[#292929]">Step 2: Questions</h4>
                          {leadForm && leadForm.questions && (
                              <div className="space-y-4">
                                {leadForm.questions.map((question: any, idx: number) => (
                                    <div
                                        key={`question-${idx}`}
                                        className="p-3 border border-[#d3d3d3] rounded bg-[#f2f2f2]"
                                    >
                                      <p className="font-medium text-[#292929]">{question.label}</p>
                                    </div>
                                ))}
                              </div>
                          )}
                        </div>
                      </TabsContent>

                      {/* Step 3: Privacy */}
                      <TabsContent value="step3" className="space-y-4">
                        <div className="bg-white rounded-lg p-5 border border-[#d3d3d3] shadow-sm">
                          <h4 className="text-[22px] font-medium mb-5 text-[#292929]">Privacy Policy</h4>
                          {leadForm && (
                              <div className="p-4 border border-[#d3d3d3] rounded bg-[#f2f2f2]">
                                <p className="text-[#292929]">
                                  {leadForm.disclaimerText || "Privacy policy information"}
                                </p>
                              </div>
                          )}
                        </div>
                      </TabsContent>

                      {/* Step 4: Thank You */}
                      <TabsContent value="step4" className="space-y-4">
                        <div className="bg-white rounded-lg p-5 border border-[#d3d3d3] shadow-sm">
                          <h4 className="text-[22px] font-medium mb-5 text-[#292929]">Thank You Page</h4>
                          {leadForm && (
                              <div className="text-center p-4 border border-[#d3d3d3] rounded bg-[#f2f2f2]">
                                <h5 className="text-xl font-bold mb-2 text-[#292929]">
                                  {leadForm.thankYouPageTitle || "Thank You!"}
                                </h5>
                                <p className="text-[#292929]">
                                  {leadForm.thankYouText || "Your form has been submitted successfully."}
                                </p>
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
