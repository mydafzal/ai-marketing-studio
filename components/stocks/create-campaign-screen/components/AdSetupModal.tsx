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
import { Gender, MasterFlowResponse, AdPlacements, LocationsFullDetails } from '../types';
import AudienceLocationSelector from '@/components/audience-locations-selector';

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
  onCreativesUpdated?: (creatives: ExtendedCreative[]) => void;
  onLeadFormUpdated?: (updatedFields: any) => void;
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
                               creatives,
                               onCreativesUpdated,
                               onLeadFormUpdated
                             }: AdSetupModalProps) {
  // States for editable headline/description
  const [editedHeadline, setEditedHeadline] = useState(
      masterFlowData?.ad_creative_text?.ad_creative_title || adHeadline
  );
  const [editedDescription, setEditedDescription] = useState(
      masterFlowData?.ad_creative_text?.ad_creative_description || adText
  );

  // Initialize with empty array if data is not present
  // console.log("This is second ", masterFlowData?.audiences?.[1])
  const [audienceOneLocations, setAudienceOneLocations] = useState<LocationsFullDetails>(
    masterFlowData?.audiences.audiences?.[0]?.location_full_details || []
  );
  const [audienceTwoLocations, setAudienceTwoLocations] = useState<LocationsFullDetails>(
    masterFlowData?.audiences?.audiences?.[1]?.location_full_details || []
  );

  useEffect(()=>{console.log("\n\n\n\n\nUdpated",audienceOneLocations)},[audienceOneLocations])
  
  // Function to save audience locations to the API
  const saveAudienceLocations = async () => {
    setIsSubmitting(true);
    
    try {
      // Get required fields from masterFlowData
      const campaign_session_id = masterFlowData?.campaign_flow_session_id;
      
      if (!campaign_session_id) {
        throw new Error('Missing campaign session ID');
      }
      
      console.log("[TEMPORARY DEBUG] Saving audience locations for both audiences using data:", audienceOneLocations);

      // --- Call API for Audience 1 ---
      const payloadAudience1 = {
        campaign_session_uuid: campaign_session_id, // API expects campaign_session_uuid
        audience_nr: 1,
        locations: audienceOneLocations // API expects 'locations'
        // TODO: Add other optional fields like age, gender if needed from masterFlowData?.audiences.audiences?.[0]
      };
      console.log("[TEMPORARY DEBUG] Sending payload for Audience 1:", payloadAudience1);

      const response1 = await fetch('/api/fasty-bot/proxy-update-audience', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payloadAudience1),
      });
      const data1 = await response1.json();

      if (!response1.ok || !data1.success) {
        const errorMessage = data1.message || data1.error || 'Failed to save locations for Audience 1';
        console.error('API error (Audience 1):', data1);
        throw new Error(errorMessage);
      }
      console.log('Audience 1 locations saved successfully!', data1);

      // --- Call API for Audience 2 ---
       const payloadAudience2 = {
        campaign_session_uuid: campaign_session_id, // API expects campaign_session_uuid
        audience_nr: 2,
        locations: audienceOneLocations // Use the same locations for Audience 2
         // TODO: Add other optional fields like age, gender if needed from masterFlowData?.audiences.audiences?.[1]
      };
      console.log("[TEMPORARY DEBUG] Sending payload for Audience 2:", payloadAudience2);

      const response2 = await fetch('/api/fasty-bot/proxy-update-audience', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payloadAudience2),
      });
      const data2 = await response2.json();

      if (!response2.ok || !data2.success) {
        const errorMessage = data2.message || data2.error || 'Failed to save locations for Audience 2';
        console.error('API error (Audience 2):', data2);
        throw new Error(errorMessage);
      }
      console.log('Audience 2 locations saved successfully!', data2);

      // Show success message after both calls succeed
      alert('Locations saved successfully for both audiences!');
      
    } catch (err) {
      console.error('Error saving audience locations:', err);
      alert(`Error: ${err instanceof Error ? err.message : 'Failed to save locations'}`);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  
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
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Track updated creatives from the API response
  const [updatedCreatives, setUpdatedCreatives] = useState<ExtendedCreative[]>([]);
  
  // Safe access for lead form properties using type assertion 
  const leadFormContent = masterFlowData?.lead_form_content as any;
  
  // Debug the lead form content structure
  useEffect(() => {
    if (leadFormContent) {
      console.log('Lead form content structure:', leadFormContent);
    }
  }, [leadFormContent]);
  
  // Handle the nested structure of lead form data
  const getLeadFormValue = (field: string) => {
    if (!leadFormContent) return "";
    
    // Try directly on leadFormContent
    if (leadFormContent[field] !== undefined) {
      return leadFormContent[field];
    }
    
    // Try nested within lead_form_data
    if (leadFormContent.lead_form_data && leadFormContent.lead_form_data[field] !== undefined) {
      return leadFormContent.lead_form_data[field];
    }
    
    return "";
  };
  
  // Available locales for the form
  const locales = [
    { value: "ar_AR", label: "Arabic" },
    { value: "cs_CZ", label: "Czech" },
    { value: "da_DK", label: "Danish" },
    { value: "de_DE", label: "German" },
    { value: "el_GR", label: "Greek" },
    { value: "en_GB", label: "English (UK)" },
    { value: "en_US", label: "English (US)" },
    { value: "es_ES", label: "Spanish (Spain)" },
    { value: "es_LA", label: "Spanish (Latin America)" },
    { value: "fi_FI", label: "Finnish" },
    { value: "fr_FR", label: "French" },
    { value: "he_IL", label: "Hebrew" },
    { value: "hi_IN", label: "Hindi" },
    { value: "hu_HU", label: "Hungarian" },
    { value: "id_ID", label: "Indonesian" },
    { value: "it_IT", label: "Italian" },
    { value: "ja_JP", label: "Japanese" },
    { value: "ko_KR", label: "Korean" },
    { value: "nb_NO", label: "Norwegian" },
    { value: "nl_NL", label: "Dutch" },
    { value: "pl_PL", label: "Polish" },
    { value: "pt_BR", label: "Portuguese (Brazil)" },
    { value: "pt_PT", label: "Portuguese (Portugal)" },
    { value: "ro_RO", label: "Romanian" },
    { value: "ru_RU", label: "Russian" },
    { value: "sv_SE", label: "Swedish" },
    { value: "th_TH", label: "Thai" },
    { value: "tr_TR", label: "Turkish" },
    { value: "vi_VN", label: "Vietnamese" },
    { value: "zh_CN", label: "Chinese (Simplified)" },
    { value: "zh_HK", label: "Chinese (Hong Kong)" },
    { value: "zh_TW", label: "Chinese (Taiwan)" }
  ];

  // States for editable lead form fields
  const [editedFormTitle, setEditedFormTitle] = useState(
    getLeadFormValue("lead_form_title") || getLeadFormValue("form_title") || ""
  );
  const [editedFormDescription, setEditedFormDescription] = useState(
    getLeadFormValue("lead_form_description") || getLeadFormValue("form_description") || ""
  );
  const [editedThankYouText, setEditedThankYouText] = useState(
    getLeadFormValue("lead_form_thank_you_text") || getLeadFormValue("thank_you_text") || ""
  );
  const [editedThankYouPageTitle, setEditedThankYouPageTitle] = useState(
    getLeadFormValue("lead_form_thank_you_page_title") || getLeadFormValue("thank_you_page_title") || ""
  );
  const [editedDataUsageNotice, setEditedDataUsageNotice] = useState(
    getLeadFormValue("lead_form_data_usage_disclaimer") || getLeadFormValue("data_usage_notice") || ""
  );
  const [editedPrivacyPolicyLinkText, setEditedPrivacyPolicyLinkText] = useState(
    getLeadFormValue("privacy_policy_link_text") || ""
  );
  const [editedCompanyName, setEditedCompanyName] = useState(
    getLeadFormValue("company_name") || ""
  );
  const [editedFollowUpUrl, setEditedFollowUpUrl] = useState(
    getLeadFormValue("follow_up_url") || ""
  );
  const [editedLocale, setEditedLocale] = useState(
    getLeadFormValue("lead_form_locale") || getLeadFormValue("locale") || "en_US"
  );
  const [editedCustomQuestions, setEditedCustomQuestions] = useState<string[]>([]);
  const [newCustomQuestion, setNewCustomQuestion] = useState("");
  
  // Add state for validation errors
  const [formTitleError, setFormTitleError] = useState<string | null>(null);
  const [formDescriptionError, setFormDescriptionError] = useState<string | null>(null);
  const [thankYouTextError, setThankYouTextError] = useState<string | null>(null);
  const [customQuestionError, setCustomQuestionError] = useState<string | null>(null);
  
  // Utility function to get custom questions from various possible locations
  const getCustomQuestionsFromData = () => {
    if (!leadFormContent) return [];
    
    // Try different properties that might contain custom questions
    if (leadFormContent.custom_questions && Array.isArray(leadFormContent.custom_questions)) {
      return leadFormContent.custom_questions;
    }
    
    if (leadFormContent.lead_form_questions && Array.isArray(leadFormContent.lead_form_questions)) {
      // Default questions that are always there and should not be considered custom
      const defaultQuestions = ["FIRST_NAME", "LAST_NAME", "EMAIL", "PHONE"];
      return leadFormContent.lead_form_questions.filter((q: string) => !defaultQuestions.includes(q));
    }
    
    if (leadFormContent.lead_form_data && 
        leadFormContent.lead_form_data.lead_form_questions && 
        Array.isArray(leadFormContent.lead_form_data.lead_form_questions)) {
      const defaultQuestions = ["FIRST_NAME", "LAST_NAME", "EMAIL", "PHONE"];
      return leadFormContent.lead_form_data.lead_form_questions.filter((q: string) => !defaultQuestions.includes(q));
    }
    
    return [];
  };
  
  // Initialize custom questions from data
  useEffect(() => {
    const customQuestionsFromData = getCustomQuestionsFromData();
    if (customQuestionsFromData.length > 0) {
      setEditedCustomQuestions(customQuestionsFromData);
    }
  }, [leadFormContent]);
  
  // Track original values for lead form fields
  const [originalFormTitle, setOriginalFormTitle] = useState(
    getLeadFormValue("lead_form_title") || getLeadFormValue("form_title") || ""
  );
  const [originalFormDescription, setOriginalFormDescription] = useState(
    getLeadFormValue("lead_form_description") || getLeadFormValue("form_description") || ""
  );
  const [originalThankYouText, setOriginalThankYouText] = useState(
    getLeadFormValue("lead_form_thank_you_text") || getLeadFormValue("thank_you_text") || ""
  );
  const [originalThankYouPageTitle, setOriginalThankYouPageTitle] = useState(
    getLeadFormValue("lead_form_thank_you_page_title") || getLeadFormValue("thank_you_page_title") || ""
  );
  const [originalDataUsageNotice, setOriginalDataUsageNotice] = useState(
    getLeadFormValue("lead_form_data_usage_disclaimer") || getLeadFormValue("data_usage_notice") || ""
  );
  const [originalPrivacyPolicyLinkText, setOriginalPrivacyPolicyLinkText] = useState(
    getLeadFormValue("privacy_policy_link_text") || ""
  );
  const [originalCompanyName, setOriginalCompanyName] = useState(
    getLeadFormValue("company_name") || ""
  );
  const [originalFollowUpUrl, setOriginalFollowUpUrl] = useState(
    getLeadFormValue("follow_up_url") || ""
  );
  const [originalLocale, setOriginalLocale] = useState(
    getLeadFormValue("lead_form_locale") || getLeadFormValue("locale") || "en_US"
  );
  const [originalCustomQuestions, setOriginalCustomQuestions] = useState<string[]>(
    getCustomQuestionsFromData()
  );
  
  // Track if lead form has been modified and needs saving
  const [isLeadFormModified, setIsLeadFormModified] = useState(false);
  
  // Track lead form save operation state
  const [isLeadFormSaving, setIsLeadFormSaving] = useState(false);
  const [leadFormSaveSuccess, setLeadFormSaveSuccess] = useState(false);

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
  
  // Helper to compare custom questions arrays
  const areCustomQuestionsChanged = (): boolean => {
    if (editedCustomQuestions.length !== originalCustomQuestions.length) {
      return true;
    }
    
    for (let i = 0; i < editedCustomQuestions.length; i++) {
      if (editedCustomQuestions[i] !== originalCustomQuestions[i]) {
        return true;
      }
    }
    
    return false;
  };
  
  // Check for lead form modifications
  useEffect(() => {
    // Check if any lead form field has changed
    const titleChanged = editedFormTitle !== originalFormTitle;
    const descriptionChanged = editedFormDescription !== originalFormDescription;
    const thankYouTextChanged = editedThankYouText !== originalThankYouText;
    const thankYouPageTitleChanged = editedThankYouPageTitle !== originalThankYouPageTitle;
    const dataUsageNoticeChanged = editedDataUsageNotice !== originalDataUsageNotice;
    const privacyPolicyLinkTextChanged = editedPrivacyPolicyLinkText !== originalPrivacyPolicyLinkText;
    const companyNameChanged = editedCompanyName !== originalCompanyName;
    const followUpUrlChanged = editedFollowUpUrl !== originalFollowUpUrl;
    const localeChanged = editedLocale !== originalLocale;
    const customQuestionsChanged = areCustomQuestionsChanged();
    
    // Update the modified state based on changes
    setIsLeadFormModified(
      titleChanged || 
      descriptionChanged || 
      thankYouTextChanged || 
      thankYouPageTitleChanged || 
      dataUsageNoticeChanged || 
      privacyPolicyLinkTextChanged || 
      companyNameChanged || 
      followUpUrlChanged ||
      localeChanged ||
      customQuestionsChanged
    );
    
    // Reset the save success message when form is modified again
    if (titleChanged || 
        descriptionChanged || 
        thankYouTextChanged || 
        thankYouPageTitleChanged || 
        dataUsageNoticeChanged || 
        privacyPolicyLinkTextChanged || 
        companyNameChanged || 
        followUpUrlChanged ||
        localeChanged ||
        customQuestionsChanged) {
      setLeadFormSaveSuccess(false);
    }
  }, [
    editedFormTitle, originalFormTitle,
    editedFormDescription, originalFormDescription,
    editedThankYouText, originalThankYouText,
    editedThankYouPageTitle, originalThankYouPageTitle,
    editedDataUsageNotice, originalDataUsageNotice,
    editedPrivacyPolicyLinkText, originalPrivacyPolicyLinkText,
    editedCompanyName, originalCompanyName,
    editedFollowUpUrl, originalFollowUpUrl,
    editedLocale, originalLocale,
    editedCustomQuestions
  ]);

  // Handler for headline changes
  const handleHeadlineChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEditedHeadline(e.target.value);
  };

  // Handler for description changes
  const handleDescriptionChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setEditedDescription(e.target.value);
  };
  
  // Helper function to check for commas
  const hasComma = (value: string): boolean => {
    return value.includes(',');
  };
  
  // Handle keydown to prevent comma entry
  const handleKeyDown = (e: React.KeyboardEvent) => {
    console.log("Key pressed:", e.key);
    // If the key pressed is a comma, prevent the default action
    if (e.key === ',') {
      console.log("Comma key blocked");
      e.preventDefault();
      // Show appropriate error message based on the input field
      if ((e.target as HTMLElement).id === 'form-title') {
        setFormTitleError("Facebook lead forms don't allow commas in title fields");
      } else if ((e.target as HTMLElement).id === 'form-description') {
        setFormDescriptionError("Facebook lead forms don't allow commas in description fields");
      } else if ((e.target as HTMLElement).id === 'thank-you-text') {
        setThankYouTextError("Facebook lead forms don't allow commas in thank you text");
      }
      
      // Clear error after 3 seconds
      setTimeout(() => {
        setFormTitleError(null);
        setFormDescriptionError(null);
        setThankYouTextError(null);
      }, 3000);
    }
  };

  // Handlers for lead form field changes
  const handleFormTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    console.log("Form title changed to:", newValue);
    console.log("Has comma?", newValue.includes(','));
    
    // Check for commas directly with includes
    if (newValue.includes(',')) {
      console.log("Comma detected in form title, removing it");
      // Replace commas with empty string and set error message
      const cleanValue = newValue.replace(/,/g, '');
      console.log("Clean value:", cleanValue);
      
      setEditedFormTitle(cleanValue);
      setFormTitleError("Facebook lead forms don't allow commas in title fields");
      
      // Clear error after 3 seconds
      setTimeout(() => {
        setFormTitleError(null);
      }, 3000);
    } else {
      setEditedFormTitle(newValue);
      setFormTitleError(null);
    }
  };
  
  const handleFormDescriptionChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    console.log("Description changed to:", newValue);
    console.log("Has comma?", hasComma(newValue));
    
    // Check for commas - let's debug the comma detection logic
    if (newValue.includes(',')) {
      console.log("Comma detected in description, removing it");
      // Replace commas with empty string and set error message
      const cleanValue = newValue.replace(/,/g, '');
      console.log("Clean value:", cleanValue);
      
      setEditedFormDescription(cleanValue);
      setFormDescriptionError("Facebook lead forms don't allow commas in description fields");
      
      // Clear error after 3 seconds
      setTimeout(() => {
        setFormDescriptionError(null);
      }, 3000);
    } else {
      setEditedFormDescription(newValue);
      setFormDescriptionError(null);
    }
  };
  
  const handleThankYouTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    console.log("Thank you text changed to:", newValue);
    console.log("Has comma?", newValue.includes(','));
    
    // Check for commas directly with includes rather than the helper function
    if (newValue.includes(',')) {
      console.log("Comma detected in thank you text, removing it");
      // Replace commas with empty string and set error message
      const cleanValue = newValue.replace(/,/g, '');
      console.log("Clean value:", cleanValue);
      
      setEditedThankYouText(cleanValue);
      setThankYouTextError("Facebook lead forms don't allow commas in thank you text");
      
      // Clear error after 3 seconds
      setTimeout(() => {
        setThankYouTextError(null);
      }, 3000);
    } else {
      setEditedThankYouText(newValue);
      setThankYouTextError(null);
    }
  };
  
  const handleThankYouPageTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    
    // For consistency, also prevent commas in thank you page title
    if (hasComma(newValue)) {
      setEditedThankYouPageTitle(newValue.replace(/,/g, ''));
    } else {
      setEditedThankYouPageTitle(newValue);
    }
  };
  
  const handleDataUsageNoticeChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setEditedDataUsageNotice(e.target.value);
  };
  
  const handlePrivacyPolicyLinkTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEditedPrivacyPolicyLinkText(e.target.value);
  };
  
  const handleCompanyNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEditedCompanyName(e.target.value);
  };
  
  const handleFollowUpUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEditedFollowUpUrl(e.target.value);
  };
  
  // Handler for locale change
  const handleLocaleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setEditedLocale(e.target.value);
  };
  
  // Handler for new custom question input
  const handleCustomQuestionChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewCustomQuestion(e.target.value);
  };
  
  // Handler for keydown in custom question input
  const handleCustomQuestionKeyDown = (e: React.KeyboardEvent) => {
    console.log("Key pressed in custom question:", e.key);
    // If the key pressed is a comma, prevent the default action
    if (e.key === ',') {
      console.log("Comma key blocked in custom question");
      e.preventDefault();
      setCustomQuestionError("Facebook lead forms don't allow commas in questions");
      setTimeout(() => setCustomQuestionError(null), 3000);
    }
  };
  
  // Add new custom question to the list
  const addCustomQuestion = () => {
    if (!newCustomQuestion.trim()) {
      return; // Don't add empty questions
    }
    
    if (newCustomQuestion.includes(',')) {
      setCustomQuestionError("Facebook lead forms don't allow commas in questions");
      setTimeout(() => setCustomQuestionError(null), 3000);
      setNewCustomQuestion(newCustomQuestion.replace(/,/g, ''));
      return;
    }
    
    setEditedCustomQuestions([...editedCustomQuestions, newCustomQuestion.trim()]);
    setNewCustomQuestion(""); // Clear the input field
  };
  
  // Remove a custom question
  const removeCustomQuestion = (index: number) => {
    const updatedQuestions = [...editedCustomQuestions];
    updatedQuestions.splice(index, 1);
    setEditedCustomQuestions(updatedQuestions);
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
        
        // Call the onCreativesUpdated callback if provided
        if (onCreativesUpdated) {
          onCreativesUpdated(newCreatives);
        }
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
  
  // Handler for saving lead form changes
  const handleSaveLeadForm = async () => {
    // Only proceed if lead form is actually modified
    if (!isLeadFormModified) return;
    
    // Additional validation to catch any commas before saving
    if (hasComma(editedFormTitle)) {
      setFormTitleError("Facebook lead forms don't allow commas in title fields");
      return;
    }
    
    if (hasComma(editedFormDescription)) {
      setFormDescriptionError("Facebook lead forms don't allow commas in description fields");
      return;
    }
    
    if (hasComma(editedThankYouText)) {
      setThankYouTextError("Facebook lead forms don't allow commas in thank you text");
      return;
    }
    
    setIsLeadFormSaving(true);
    
    try {
      // Get required fields from masterFlowData
      const campaign_session_id = masterFlowData?.campaign_flow_session_id;
      
      // Validate required fields
      if (!campaign_session_id) {
        throw new Error('Missing campaign session ID');
      }
      
      // Get the form name from existing data or generate one
      const formName = leadFormContent?.lead_form_name || leadFormContent?.form_name || `${campaignName?.replace(/\s+/g, '_').toLowerCase() || 'leadform'}_${Date.now().toString(36)}`;
      
      // Default questions that are always there and should not be submitted as custom questions
      const defaultQuestions = ["FIRST_NAME", "LAST_NAME", "EMAIL", "PHONE"];
      
      // Use our edited custom questions for the request
      const customQuestions = editedCustomQuestions;
      
      console.log("Updating lead form for campaign session:", campaign_session_id);
      // Privacy policy link is already configured and should not be changed
      // This is intentionally commented out to avoid sending this field to the API
      
      console.log("Lead form data:", {
        form_name: formName,
        form_title: editedFormTitle,
        custom_questions: customQuestions,
        excluded_default_questions: defaultQuestions
      });
      
      // Prepare payload with only required fields and those we want to update
      // Note: form_name, form_template_name, privacy_policy_link are not updatable
      // follow_up_url should only be included if changed
      const payload: any = {
        campaign_creation_flow_session_id: campaign_session_id,
      };
      
      // Only include fields that have actually changed
      if (editedFormTitle !== originalFormTitle) {
        payload.form_title = editedFormTitle;
      }
      
      if (editedFormDescription !== originalFormDescription) {
        payload.form_description = editedFormDescription;
      }
      
      if (editedThankYouText !== originalThankYouText) {
        payload.thank_you_text = editedThankYouText;
      }
      
      if (editedThankYouPageTitle !== originalThankYouPageTitle) {
        payload.thank_you_page_title = editedThankYouPageTitle;
      }
      
      if (editedDataUsageNotice !== originalDataUsageNotice) {
        payload.data_usage_notice = editedDataUsageNotice;
      }
      
      if (editedLocale !== originalLocale) {
        payload.locale = editedLocale;
      }
      
      if (editedCompanyName !== originalCompanyName) {
        payload.company_name = editedCompanyName;
      }
      
      // Only include follow_up_url if it has been explicitly changed
      if (editedFollowUpUrl !== originalFollowUpUrl) {
        payload.follow_up_url = editedFollowUpUrl;
      }
      
      // Only include custom_questions if we actually have custom questions (not default ones)
      if (customQuestions.length > 0) {
        payload.custom_questions = customQuestions;
      }
      
      console.log("Final payload being sent:", payload);
      
      // Call the API to save the changes
      const response = await fetch('/api/fasty-bot/proxy-update-lead-form', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      
      // Parse response
      const data = await response.json();
      
      if (!response.ok || !data.success) {
        const errorMessage = data.error || 'Failed to save lead form changes';
        console.error('API error:', data);
        throw new Error(errorMessage);
      }
      
      console.log('Lead form update response:', data);
      
      // Update original values to match current values
      setOriginalFormTitle(editedFormTitle);
      setOriginalFormDescription(editedFormDescription);
      setOriginalThankYouText(editedThankYouText);
      setOriginalThankYouPageTitle(editedThankYouPageTitle);
      setOriginalDataUsageNotice(editedDataUsageNotice);
      setOriginalPrivacyPolicyLinkText(editedPrivacyPolicyLinkText);
      setOriginalCompanyName(editedCompanyName);
      setOriginalFollowUpUrl(editedFollowUpUrl);
      setOriginalLocale(editedLocale);
      setOriginalCustomQuestions([...editedCustomQuestions]);
      
      // Mark as no longer modified and save as successful
      setIsLeadFormModified(false);
      setLeadFormSaveSuccess(true);
      
      // Reset success message after 3 seconds
      setTimeout(() => {
        setLeadFormSaveSuccess(false);
      }, 3000);
      
      // Create the updated fields data based on what was actually changed
      // Only include fields that were modified
      const updatedFields: any = {};
      
      if (editedFormTitle !== originalFormTitle) {
        updatedFields.form_title = editedFormTitle;
      }
      
      if (editedFormDescription !== originalFormDescription) {
        updatedFields.form_description = editedFormDescription;
      }
      
      if (editedThankYouText !== originalThankYouText) {
        updatedFields.thank_you_text = editedThankYouText;
      }
      
      if (editedThankYouPageTitle !== originalThankYouPageTitle) {
        updatedFields.thank_you_page_title = editedThankYouPageTitle;
      }
      
      if (editedDataUsageNotice !== originalDataUsageNotice) {
        updatedFields.data_usage_notice = editedDataUsageNotice;
      }
      
      if (editedLocale !== originalLocale) {
        updatedFields.locale = editedLocale;
      }
      
      if (editedCompanyName !== originalCompanyName) {
        updatedFields.company_name = editedCompanyName;
      }
      
      if (editedFollowUpUrl !== originalFollowUpUrl) {
        updatedFields.follow_up_url = editedFollowUpUrl;
      }
      
      // Only include custom questions if they've changed
      if (areCustomQuestionsChanged()) {
        updatedFields.custom_questions = editedCustomQuestions;
      }
      
      // Merge with API response data if available
      if (data.updated_fields) {
        Object.assign(updatedFields, data.updated_fields);
      }
      
      // Call the callback with the updated fields if provided
      if (onLeadFormUpdated) {
        onLeadFormUpdated(updatedFields);
      }
      
      console.log('Lead form changes saved successfully!');
    } catch (err) {
      console.error('Error saving lead form:', err);
      alert(`Error: ${err instanceof Error ? err.message : 'Failed to save changes'}`);
    } finally {
      setIsLeadFormSaving(false);
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

  // Extract lead form data
  const processLeadFormQuestions = () => {
    if (!leadFormContent) return [];

    // Check for different possible locations of questions data
    
    // Option 1: Top-level lead_form_questions array
    if (leadFormContent.lead_form_questions && Array.isArray(leadFormContent.lead_form_questions)) {
      return leadFormContent.lead_form_questions.map((question: string) => {
        return {
          type: question,
          label: formatQuestionLabel(question)
        };
      });
    }
    
    // Option 2: Questions in lead_form_data nested structure
    if (leadFormContent.lead_form_data && leadFormContent.lead_form_data.lead_form_questions) {
      return leadFormContent.lead_form_data.lead_form_questions.map((question: string) => {
        return {
          type: question,
          label: formatQuestionLabel(question)
        };
      });
    }
    
    // Option 3: New format custom_questions array
    if (leadFormContent.custom_questions && Array.isArray(leadFormContent.custom_questions)) {
      return leadFormContent.custom_questions.map((question: string) => {
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
    
    // Use both old and new field names to support both formats
    return {
      name: data.lead_form_name || data.form_name,
      title: data.lead_form_title || data.form_title || editedFormTitle,
      description: data.lead_form_description || data.form_description || editedFormDescription,
      thankYouText: data.lead_form_thank_you_text || data.thank_you_text || editedThankYouText,
      disclaimerText: data.lead_form_data_usage_disclaimer || data.data_usage_notice || editedDataUsageNotice,
      thankYouPageTitle: data.lead_form_thank_you_page_title || data.thank_you_page_title || editedThankYouPageTitle,
      locale: data.lead_form_locale || data.locale,
      privacyPolicyText: data.privacy_policy_link_text || editedPrivacyPolicyLinkText,
      companyName: data.company_name || editedCompanyName,
      followUpUrl: data.follow_up_url || editedFollowUpUrl,
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
                                <span className="font-medium">Instagram:</span> Stories, Feed, Explore Home, Explore, Reels (for videos)
                                <br />
                                <span className="font-medium">Facebook:</span> Feed, Right Hand Column, Stories, Reels (for videos)
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
                          {audienceOneLocations && (
                            <div className="mt-4">
                              <AudienceLocationSelector locations={audienceOneLocations} setLocations={setAudienceOneLocations}/>
                              <div className="mt-4 flex justify-end">
                                <button
                                  onClick={saveAudienceLocations}
                                  disabled={isSubmitting}
                                  className="px-4 py-2 bg-[#4BF29C] text-[#151925] font-medium rounded-lg hover:bg-[#3ad889] transition-colors flex items-center gap-2"
                                >
                                  {isSubmitting ? (
                                    <>
                                      <span className="animate-spin h-4 w-4 border-2 border-[#151925] border-t-transparent rounded-full"></span>
                                      Saving...
                                    </>
                                  ) : (
                                    <>
                                      <Save className="size-4" />
                                      Save Locations
                                    </>
                                  )}
                                </button>
                              </div>
                            </div>
                          )}
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
                          <div className="flex items-center justify-between mb-4">
                            <h4 className="text-[22px] font-medium text-[#292929]">Step 1: Lead Form</h4>
                            
                            {/* Save button with status indicators */}
                            <div className="flex flex-col items-end">
                              <button
                                onClick={handleSaveLeadForm}
                                disabled={!isLeadFormModified || isLeadFormSaving}
                                className={`transition-colors relative ${
                                  isLeadFormSaving ? 'opacity-50 cursor-not-allowed' : 
                                  isLeadFormModified ? 'text-yellow-400 hover:text-yellow-300' : 
                                  'text-primary-green hover:text-white'
                                }`}
                                title={isLeadFormModified ? "Save changes" : "No changes to save"}
                              >
                                <Save className="w-5 h-5" />
                                {isLeadFormSaving && (
                                  <span className="animate-spin absolute inset-0 flex items-center justify-center">
                                    <span className="w-3 h-3 border-2 border-t-transparent border-yellow-400 rounded-full"></span>
                                  </span>
                                )}
                              </button>
                              
                              {/* Status indicator text */}
                              {isLeadFormModified && (
                                <span className="text-yellow-400 text-xs mt-1">Click to save</span>
                              )}
                              {leadFormSaveSuccess && (
                                <span className="text-green-400 text-xs mt-1">Saved!</span>
                              )}
                            </div>
                          </div>

                          <div className="space-y-5">
                            {/* Form Title */}
                            <div>
                              <label className="font-medium text-[#292929] mb-2 block">Form Title</label>
                              <input
                                id="form-title"
                                type="text"
                                value={editedFormTitle}
                                onChange={handleFormTitleChange}
                                onKeyDown={handleKeyDown}
                                onPaste={(e) => {
                                  // Check if pasted text contains comma
                                  const pastedText = e.clipboardData.getData('text');
                                  if (pastedText.includes(',')) {
                                    e.preventDefault();
                                    // Paste without commas
                                    const cleanText = pastedText.replace(/,/g, '');
                                    setEditedFormTitle(editedFormTitle + cleanText);
                                    setFormTitleError("Facebook lead forms don't allow commas in title fields");
                                    setTimeout(() => setFormTitleError(null), 3000);
                                  }
                                }}
                                className={`w-full bg-white p-3 rounded-lg border ${
                                  formTitleError ? 'border-red-500' :
                                  editedFormTitle !== originalFormTitle 
                                    ? 'border-yellow-400' 
                                    : 'border-[#d3d3d3]'
                                } text-[#292929] focus:outline-none focus:border-[#4169e1]`}
                                placeholder="Enter a compelling form title"
                              />
                              {formTitleError && (
                                <p className="text-red-500 text-xs mt-1">{formTitleError}</p>
                              )}
                            </div>
                            
                            {/* Form Description */}
                            <div>
                              <label className="font-medium text-[#292929] mb-2 block">Form Description</label>
                              <textarea
                                id="form-description"
                                value={editedFormDescription}
                                onChange={handleFormDescriptionChange}
                                onKeyDown={handleKeyDown}
                                onPaste={(e) => {
                                  // Check if pasted text contains comma
                                  const pastedText = e.clipboardData.getData('text');
                                  if (pastedText.includes(',')) {
                                    e.preventDefault();
                                    // Paste without commas
                                    const cleanText = pastedText.replace(/,/g, '');
                                    setEditedFormDescription(editedFormDescription + cleanText);
                                    setFormDescriptionError("Facebook lead forms don't allow commas in description fields");
                                    setTimeout(() => setFormDescriptionError(null), 3000);
                                  }
                                }}
                                className={`w-full bg-white p-3 rounded-lg border ${
                                  formDescriptionError ? 'border-red-500' :
                                  editedFormDescription !== originalFormDescription 
                                    ? 'border-yellow-400' 
                                    : 'border-[#d3d3d3]'
                                } text-[#292929] focus:outline-none focus:border-[#4169e1] min-h-[80px]`}
                                placeholder="Add description text to explain the purpose of your form"
                              />
                              {formDescriptionError && (
                                <p className="text-red-500 text-xs mt-1">{formDescriptionError}</p>
                              )}
                            </div>
                            
                            {/* Company Name */}
                            <div>
                              <label className="font-medium text-[#292929] mb-2 block">Company Name</label>
                              <input
                                type="text"
                                value={editedCompanyName}
                                onChange={handleCompanyNameChange}
                                className={`w-full bg-white p-3 rounded-lg border ${
                                  editedCompanyName !== originalCompanyName 
                                    ? 'border-yellow-400' 
                                    : 'border-[#d3d3d3]'
                                } text-[#292929] focus:outline-none focus:border-[#4169e1]`}
                                placeholder="Enter your company name"
                              />
                            </div>
                            
                            {/* Form Locale (editable dropdown) */}
                            <div>
                              <label className="font-medium text-[#292929] mb-2 block">Form Locale</label>
                              <select
                                value={editedLocale}
                                onChange={handleLocaleChange}
                                className={`w-full bg-white p-3 rounded-lg border ${
                                  editedLocale !== originalLocale 
                                    ? 'border-yellow-400' 
                                    : 'border-[#d3d3d3]'
                                } text-[#292929] focus:outline-none focus:border-[#4169e1]`}
                              >
                                {locales.map(locale => (
                                  <option key={locale.value} value={locale.value}>
                                    {locale.label} ({locale.value})
                                  </option>
                                ))}
                              </select>
                            </div>
                            
                            {/* Form Preview */}
                            <div className="mt-8 bg-white rounded-lg overflow-hidden shadow-lg border border-[#d3d3d3]">
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
                                  {editedFormTitle || "Enter Your Form Title"}
                                </h3>
                              </div>

                              <div className="p-5 bg-white">
                                <p className="text-[#292929] text-[16px] leading-relaxed mb-5">
                                  {editedFormDescription || "Add a description to explain what this form is for."}
                                </p>

                                <div className="text-[#767676] text-[14px] mt-5 border-t border-[#f2f2f2] pt-4 leading-relaxed">
                                  <span className="font-medium text-[#292929]">Preview:</span> This is how users will see your form title and description before they provide their information.
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </TabsContent>

                      {/* Step 2: Questions */}
                      <TabsContent value="step2" className="space-y-4">
                        <div className="bg-white rounded-lg p-5 border border-[#d3d3d3] shadow-sm">
                          <div className="flex items-center justify-between mb-4">
                            <h4 className="text-[22px] font-medium text-[#292929]">Step 2: Questions</h4>
                            
                            {/* Save button for tab consistency */}
                            <div className="flex flex-col items-end">
                              <button
                                onClick={handleSaveLeadForm}
                                disabled={!isLeadFormModified || isLeadFormSaving}
                                className={`transition-colors relative ${
                                  isLeadFormSaving ? 'opacity-50 cursor-not-allowed' : 
                                  isLeadFormModified ? 'text-yellow-400 hover:text-yellow-300' : 
                                  'text-primary-green hover:text-white'
                                }`}
                                title={isLeadFormModified ? "Save changes" : "No changes to save"}
                              >
                                <Save className="w-5 h-5" />
                                {isLeadFormSaving && (
                                  <span className="animate-spin absolute inset-0 flex items-center justify-center">
                                    <span className="w-3 h-3 border-2 border-t-transparent border-yellow-400 rounded-full"></span>
                                  </span>
                                )}
                              </button>
                              
                              {isLeadFormModified && (
                                <span className="text-yellow-400 text-xs mt-1">Click to save</span>
                              )}
                              {leadFormSaveSuccess && (
                                <span className="text-green-400 text-xs mt-1">Saved!</span>
                              )}
                            </div>
                          </div>
                          
                          <div className="mb-6">
                            <h5 className="font-medium text-[#292929] mb-2">Default Questions</h5>
                            <p className="text-[#767676] mb-4">
                              These default questions are always included and cannot be modified.
                            </p>
                            
                            <div className="space-y-2 mb-6">
                              <div className="p-3 border border-[#d3d3d3] rounded bg-[#f9f9f9]">
                                <p className="font-medium text-[#292929]">First Name</p>
                              </div>
                              <div className="p-3 border border-[#d3d3d3] rounded bg-[#f9f9f9]">
                                <p className="font-medium text-[#292929]">Last Name</p>
                              </div>
                              <div className="p-3 border border-[#d3d3d3] rounded bg-[#f9f9f9]">
                                <p className="font-medium text-[#292929]">Email</p>
                              </div>
                              <div className="p-3 border border-[#d3d3d3] rounded bg-[#f9f9f9]">
                                <p className="font-medium text-[#292929]">Phone</p>
                              </div>
                            </div>
                          </div>
                          
                          <div>
                            <h5 className="font-medium text-[#292929] mb-2">Custom Questions</h5>
                            <p className="text-[#767676] mb-4">
                              Add custom questions to collect additional information from your leads.
                            </p>
                            
                            {/* Input field to add new custom questions */}
                            <div className="flex gap-2 mb-4">
                              <div className="flex-1">
                                <input
                                  id="custom-question-input"
                                  type="text"
                                  value={newCustomQuestion}
                                  onChange={handleCustomQuestionChange}
                                  onKeyDown={handleCustomQuestionKeyDown}
                                  onPaste={(e) => {
                                    // Check if pasted text contains comma
                                    const pastedText = e.clipboardData.getData('text');
                                    if (pastedText.includes(',')) {
                                      e.preventDefault();
                                      // Paste without commas
                                      const cleanText = pastedText.replace(/,/g, '');
                                      setNewCustomQuestion(newCustomQuestion + cleanText);
                                      setCustomQuestionError("Facebook lead forms don't allow commas in questions");
                                      setTimeout(() => setCustomQuestionError(null), 3000);
                                    }
                                  }}
                                  placeholder="Enter your custom question here"
                                  className={`w-full bg-white p-3 rounded-lg border ${
                                    customQuestionError ? 'border-red-500' : 'border-[#d3d3d3]'
                                  } text-[#292929] focus:outline-none focus:border-[#4169e1]`}
                                />
                                {customQuestionError && (
                                  <p className="text-red-500 text-xs mt-1">{customQuestionError}</p>
                                )}
                              </div>
                              <button
                                onClick={addCustomQuestion}
                                className="px-4 py-3 bg-[#4169e1] hover:bg-[#3152b3] text-white font-medium rounded-lg transition-colors"
                                disabled={!newCustomQuestion.trim()}
                              >
                                Add
                              </button>
                            </div>
                            
                            {/* Display existing custom questions */}
                            {editedCustomQuestions.length > 0 ? (
                              <div className="space-y-2">
                                {editedCustomQuestions.map((question, idx) => (
                                  <div 
                                    key={`custom-${idx}`}
                                    className="p-3 border border-[#d3d3d3] rounded bg-[#f2f2f2] flex justify-between items-center"
                                  >
                                    <p className="font-medium text-[#292929]">{question}</p>
                                    <button 
                                      onClick={() => removeCustomQuestion(idx)}
                                      className="text-red-500 hover:text-red-700"
                                    >
                                      <X size={18} />
                                    </button>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <p className="text-[#767676] italic">No custom questions added yet</p>
                            )}
                          </div>
                        </div>
                      </TabsContent>

                      {/* Step 3: Privacy */}
                      <TabsContent value="step3" className="space-y-4">
                        <div className="bg-white rounded-lg p-5 border border-[#d3d3d3] shadow-sm">
                          <div className="flex items-center justify-between mb-4">
                            <h4 className="text-[22px] font-medium text-[#292929]">Step 3: Privacy Policy</h4>
                            
                            {/* Save button for tab consistency */}
                            <div className="flex flex-col items-end">
                              <button
                                onClick={handleSaveLeadForm}
                                disabled={!isLeadFormModified || isLeadFormSaving}
                                className={`transition-colors relative ${
                                  isLeadFormSaving ? 'opacity-50 cursor-not-allowed' : 
                                  isLeadFormModified ? 'text-yellow-400 hover:text-yellow-300' : 
                                  'text-primary-green hover:text-white'
                                }`}
                                title={isLeadFormModified ? "Save changes" : "No changes to save"}
                              >
                                <Save className="w-5 h-5" />
                                {isLeadFormSaving && (
                                  <span className="animate-spin absolute inset-0 flex items-center justify-center">
                                    <span className="w-3 h-3 border-2 border-t-transparent border-yellow-400 rounded-full"></span>
                                  </span>
                                )}
                              </button>
                              
                              {isLeadFormModified && (
                                <span className="text-yellow-400 text-xs mt-1">Click to save</span>
                              )}
                              {leadFormSaveSuccess && (
                                <span className="text-green-400 text-xs mt-1">Saved!</span>
                              )}
                            </div>
                          </div>
                          
                          <div className="space-y-5">
                            {/* Data Usage Notice */}
                            <div>
                              <label className="font-medium text-[#292929] mb-2 block">Data Usage Notice</label>
                              <textarea
                                value={editedDataUsageNotice}
                                onChange={handleDataUsageNoticeChange}
                                className={`w-full bg-white p-3 rounded-lg border ${
                                  editedDataUsageNotice !== originalDataUsageNotice 
                                    ? 'border-yellow-400' 
                                    : 'border-[#d3d3d3]'
                                } text-[#292929] focus:outline-none focus:border-[#4169e1] min-h-[80px]`}
                                placeholder="Explain how you will use the collected data"
                              />
                            </div>
                            
                            {/* Privacy Policy Link Text */}
                            <div>
                              <label className="font-medium text-[#292929] mb-2 block">Privacy Policy Link Text</label>
                              <input
                                type="text"
                                value={editedPrivacyPolicyLinkText}
                                onChange={handlePrivacyPolicyLinkTextChange}
                                className={`w-full bg-white p-3 rounded-lg border ${
                                  editedPrivacyPolicyLinkText !== originalPrivacyPolicyLinkText 
                                    ? 'border-yellow-400' 
                                    : 'border-[#d3d3d3]'
                                } text-[#292929] focus:outline-none focus:border-[#4169e1]`}
                                placeholder="Enter your privacy policy URL"
                              />
                            </div>
                            
                            {/* Privacy Policy Preview */}
                            <div className="mt-5 p-4 border border-[#d3d3d3] rounded bg-[#f2f2f2]">
                              <h5 className="font-medium text-[#292929] mb-2">Preview:</h5>
                              <p className="text-[#292929]">
                                {editedDataUsageNotice || "Add a data usage notice to inform users about how their data will be processed."}
                              </p>
                              
                              {editedPrivacyPolicyLinkText && (
                                <p className="text-[#4169e1] mt-2 underline">
                                  {editedPrivacyPolicyLinkText}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      </TabsContent>

                      {/* Step 4: Thank You */}
                      <TabsContent value="step4" className="space-y-4">
                        <div className="bg-white rounded-lg p-5 border border-[#d3d3d3] shadow-sm">
                          <div className="flex items-center justify-between mb-4">
                            <h4 className="text-[22px] font-medium text-[#292929]">Step 4: Thank You Page</h4>
                            
                            {/* Save button for tab consistency */}
                            <div className="flex flex-col items-end">
                              <button
                                onClick={handleSaveLeadForm}
                                disabled={!isLeadFormModified || isLeadFormSaving}
                                className={`transition-colors relative ${
                                  isLeadFormSaving ? 'opacity-50 cursor-not-allowed' : 
                                  isLeadFormModified ? 'text-yellow-400 hover:text-yellow-300' : 
                                  'text-primary-green hover:text-white'
                                }`}
                                title={isLeadFormModified ? "Save changes" : "No changes to save"}
                              >
                                <Save className="w-5 h-5" />
                                {isLeadFormSaving && (
                                  <span className="animate-spin absolute inset-0 flex items-center justify-center">
                                    <span className="w-3 h-3 border-2 border-t-transparent border-yellow-400 rounded-full"></span>
                                  </span>
                                )}
                              </button>
                              
                              {isLeadFormModified && (
                                <span className="text-yellow-400 text-xs mt-1">Click to save</span>
                              )}
                              {leadFormSaveSuccess && (
                                <span className="text-green-400 text-xs mt-1">Saved!</span>
                              )}
                            </div>
                          </div>
                          
                          <div className="space-y-5">
                            {/* Thank You Page Title */}
                            <div>
                              <label className="font-medium text-[#292929] mb-2 block">Thank You Page Title</label>
                              <input
                                type="text"
                                value={editedThankYouPageTitle}
                                onChange={handleThankYouPageTitleChange}
                                className={`w-full bg-white p-3 rounded-lg border ${
                                  editedThankYouPageTitle !== originalThankYouPageTitle 
                                    ? 'border-yellow-400' 
                                    : 'border-[#d3d3d3]'
                                } text-[#292929] focus:outline-none focus:border-[#4169e1]`}
                                placeholder="Enter a thank you page title"
                              />
                            </div>
                            
                            {/* Thank You Text */}
                            <div>
                              <label className="font-medium text-[#292929] mb-2 block">Thank You Message</label>
                              <textarea
                                id="thank-you-text"
                                value={editedThankYouText}
                                onChange={handleThankYouTextChange}
                                onKeyDown={handleKeyDown}
                                onPaste={(e) => {
                                  // Check if pasted text contains comma
                                  const pastedText = e.clipboardData.getData('text');
                                  if (pastedText.includes(',')) {
                                    e.preventDefault();
                                    // Paste without commas
                                    const cleanText = pastedText.replace(/,/g, '');
                                    setEditedThankYouText(editedThankYouText + cleanText);
                                    setThankYouTextError("Facebook lead forms don't allow commas in thank you text");
                                    setTimeout(() => setThankYouTextError(null), 3000);
                                  }
                                }}
                                className={`w-full bg-white p-3 rounded-lg border ${
                                  thankYouTextError ? 'border-red-500' :
                                  editedThankYouText !== originalThankYouText 
                                    ? 'border-yellow-400' 
                                    : 'border-[#d3d3d3]'
                                } text-[#292929] focus:outline-none focus:border-[#4169e1] min-h-[80px]`}
                                placeholder="Enter a thank you message for your leads"
                              />
                              {thankYouTextError && (
                                <p className="text-red-500 text-xs mt-1">{thankYouTextError}</p>
                              )}
                            </div>
                            
                            {/* Follow Up URL */}
                            <div>
                              <label className="font-medium text-[#292929] mb-2 block">Follow Up URL (Optional)</label>
                              <input
                                type="text"
                                value={editedFollowUpUrl}
                                onChange={handleFollowUpUrlChange}
                                className={`w-full bg-white p-3 rounded-lg border ${
                                  editedFollowUpUrl !== originalFollowUpUrl 
                                    ? 'border-yellow-400' 
                                    : 'border-[#d3d3d3]'
                                } text-[#292929] focus:outline-none focus:border-[#4169e1]`}
                                placeholder="Enter a URL to redirect users after form submission"
                              />
                            </div>
                            
                            {/* Thank You Preview */}
                            <div className="mt-5 text-center p-4 border border-[#d3d3d3] rounded bg-[#f2f2f2]">
                              <h5 className="text-xl font-bold mb-2 text-[#292929]">
                                {editedThankYouPageTitle || "Thank You!"}
                              </h5>
                              <p className="text-[#292929] mb-3">
                                {editedThankYouText || "Your form has been submitted successfully."}
                              </p>
                              {editedFollowUpUrl && (
                                <div className="mt-3 p-2 bg-[#4169e1] text-white rounded inline-block">
                                  Continue to website
                                </div>
                              )}
                            </div>
                          </div>
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
