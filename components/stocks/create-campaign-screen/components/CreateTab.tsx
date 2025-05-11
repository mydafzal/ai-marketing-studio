import React, { useState, useEffect } from 'react';
import { Upload, Info, XCircle, Loader2, Plus, ChevronDown, Settings, Clock, Info as InfoIcon } from 'lucide-react';
import { MediaItem } from '../types';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger,
  DialogClose,
  DialogFooter
} from '@/components/ui/dialog';
import { BudgetSettings } from './BudgetSettings';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { 
  LeadForm, 
  StoredLeadForm,
  getStoredLeadForm,
  saveLeadFormToLocalStorage,
  fetchAllLeadForms,
  searchFormsLocally
} from './lead-form';
import { CustomerProfileSelector } from './customer-profile';

interface CreateTabProps {
  mediaItems: MediaItem[];
  setMediaItems: React.Dispatch<React.SetStateAction<MediaItem[]>>;
  fileInputRef: React.RefObject<HTMLInputElement>;
  campaignObjective: string;
  setCampaignObjective: (objective: string) => void;
  link: string;
  setLink: React.Dispatch<React.SetStateAction<string>>;
  budget: string;
  setBudget: React.Dispatch<React.SetStateAction<string>>;
  aiGuidance: string;
  setAiGuidance: React.Dispatch<React.SetStateAction<string>>;
  handleReviewTransition: () => void;
  isLoading: boolean;
  isUploading?: boolean;
  cooldownActive?: boolean;
  cooldownTimeRemaining?: number;
  selectedLeadFormId: string;
  setSelectedLeadFormId: (id: string) => void;
  selectedCustomerProfileId?: string;
  setSelectedCustomerProfileId?: (id: string) => void;
}

type LeadFormBehavior = "automatic" | "existing";

export function CreateTab({
  mediaItems,
  setMediaItems,
  fileInputRef,
  campaignObjective,
  setCampaignObjective,
  link,
  setLink,
  budget,
  setBudget,
  aiGuidance,
  setAiGuidance,
  handleReviewTransition,
  isLoading,
  isUploading = false,
  cooldownActive = false,
  cooldownTimeRemaining = 0,
  selectedLeadFormId,
  setSelectedLeadFormId,
  selectedCustomerProfileId = '',
  setSelectedCustomerProfileId = () => {},
}: CreateTabProps) {
  // Add state for showing/hiding lead form dropdown
  const [showLeadFormModal, setShowLeadFormModal] = useState<boolean>(false);
  // Add state for lead form behavior
  const [leadFormBehavior, setLeadFormBehavior] = useState<LeadFormBehavior>("automatic");
  // Add state for lead forms
  const [leadForms, setLeadForms] = useState<LeadForm[]>([]);
  // Add state for loading lead forms
  const [loadingLeadForms, setLoadingLeadForms] = useState<boolean>(false);
  // Add state for lead form errors
  const [leadFormError, setLeadFormError] = useState<string | null>(null);
  // Add state for form details dialog
  const [showFormDetails, setShowFormDetails] = useState<boolean>(false);
  // Add state for selected form details
  const [selectedFormDetails, setSelectedFormDetails] = useState<LeadForm | null>(null);
  // Add state for pagination cursor
  const [paginationCursor, setPaginationCursor] = useState<string | null>(null);
  // Add state for loading more forms
  const [loadingMore, setLoadingMore] = useState<boolean>(false);
  // Add state for search query
  const [searchQuery, setSearchQuery] = useState<string>('');
  // Add state for filtered forms
  const [filteredForms, setFilteredForms] = useState<LeadForm[]>([]);
  // Add state to track if we've loaded all forms
  const [hasLoadedAllForms, setHasLoadedAllForms] = useState<boolean>(false);
  // Add state to store all forms ever loaded
  const [allLoadedForms, setAllLoadedForms] = useState<LeadForm[]>([]);
  // Add state for previously selected lead form from local storage
  const [storedLeadForm, setStoredLeadForm] = useState<StoredLeadForm | null>(null);
  // Add state for temporarily selected form in modal
  const [tempSelectedFormId, setTempSelectedFormId] = useState<string>('');
  // Add state for form name display
  const [selectedFormName, setSelectedFormName] = useState<string>('');

  const objectives = [
    {
      value: "awareness",
      label: "Awareness",
      description: "Increase awareness of your brand, products, or services."
    },
    {
      value: "recruitment",
      label: "Recruitment",
      description: "Find potential candidates for job opportunities."
    },
    {
      value: "conversions",
      label: "Conversions",
      description: "Drive valuable actions on your website or app."
    },
    {
      value: "lead_generation",
      label: "Lead Generation",
      description: "Collect lead information from people interested in your business."
    }
  ];

  // Fetch lead forms when modal opens
  useEffect(() => {
    if (showLeadFormModal) {
      if (leadForms.length === 0 && !loadingLeadForms) {
        getFbLeadForms();
      }
      
      // Try to get previously selected form from local storage
      const fetchPageId = async () => {
        try {
          const response = await fetch('/api/kv/fetch-api-token');
          const userData = await response.json();
          
          if (userData.success && userData.account?.fbPageId) {
            const pageId = userData.account.fbPageId;
            const stored = getStoredLeadForm(pageId);
            
            if (stored) {
              setStoredLeadForm(stored);
              
              // If we have a stored form, handle both auto-selection and displaying in the UI
              if (stored.formId) {
                console.log('Found stored lead form:', stored.formId);
                
                // If no form is currently selected, automatically select the stored one
                if (!selectedLeadFormId) {
                  console.log('Setting previously stored lead form as selected:', stored.formId);
                  setSelectedLeadFormId(stored.formId);
                  setSelectedFormName(stored.displayName);
                  
                  // Set behavior to existing since we're selecting a stored form
                  setLeadFormBehavior("existing");
                }
              }
            }
          }
        } catch (error) {
          console.error('Error fetching page ID:', error);
        }
      };
      
      fetchPageId();
      
      // Set temporary selected form to current selection or stored one as fallback
      if (selectedLeadFormId) {
        setTempSelectedFormId(selectedLeadFormId);
      } else if (storedLeadForm) {
        setTempSelectedFormId(storedLeadForm.formId);
      }
    }
  }, [showLeadFormModal]);
  
  // Update filtered forms when search query changes
  useEffect(() => {
    if (searchQuery.trim() === '') {
      // When search query is empty, show all loaded forms
      setFilteredForms([]);
    } else if (allLoadedForms.length > 0) {
      // Only search if we have forms loaded
      const results = searchFormsLocally(allLoadedForms, searchQuery);
      setFilteredForms(results);
    }
  }, [searchQuery, allLoadedForms]);
  
  // Reset filtered forms when modal closes
  useEffect(() => {
    if (!showLeadFormModal) {
      setFilteredForms([]);
      setSearchQuery('');
    }
  }, [showLeadFormModal]);
  
  // Update selected form name when selectedLeadFormId changes
  useEffect(() => {
    if (selectedLeadFormId && allLoadedForms.length > 0) {
      const selectedForm = allLoadedForms.find(form => form.id === selectedLeadFormId);
      if (selectedForm) {
        setSelectedFormName(selectedForm.display_name);
        if (leadFormBehavior === "automatic") {
          setLeadFormBehavior("existing");
        }
      }
    } else if (leadFormBehavior === "existing" && !selectedLeadFormId) {
      // If existing is selected but no form is selected, reset to automatic
      setLeadFormBehavior("automatic");
    }
  }, [selectedLeadFormId, allLoadedForms]);
  
  // When the lead form behavior changes to automatic, clear the selected lead form ID
  useEffect(() => {
    if (leadFormBehavior === "automatic" && selectedLeadFormId) {
      console.log('Lead form behavior set to automatic, clearing selected lead form ID');
      setSelectedLeadFormId("");
    }
  }, [leadFormBehavior, selectedLeadFormId, setSelectedLeadFormId]);

  async function getFbLeadForms(afterCursor?: string | null) {
    // If we already have forms loaded and no cursor is provided, use cached forms
    if (!afterCursor && allLoadedForms.length > 0) {
      setLeadForms(allLoadedForms);
      return;
    }
    
    if (!afterCursor) {
      setLoadingLeadForms(true);
    } else {
      setLoadingMore(true);
    }
    setLeadFormError(null);
    
    try {
      // Skip fetching if we already loaded all forms
      if (hasLoadedAllForms) {
        setLoadingMore(false);
        setLoadingLeadForms(false);
        return;
      }
      
      const result = await fetchAllLeadForms(afterCursor);
      
      // Update pagination state
      setPaginationCursor(result.paginationCursor);
      
      // When pagination is null, we've loaded all forms
      if (!result.paginationCursor) {
        setHasLoadedAllForms(true);
      }
      
      // Update allLoadedForms with deduplication
      setAllLoadedForms(prevAll => {
        const existingIds = new Set(prevAll.map(form => form.id));
        const newForms = result.forms.filter(form => !existingIds.has(form.id));
        return [...prevAll, ...newForms];
      });
      
      // If loading more, append to existing forms, otherwise replace
      if (afterCursor) {
        setLeadForms(prev => {
          const existingIds = new Set(prev.map(form => form.id));
          const newForms = result.forms.filter(form => !existingIds.has(form.id));
          return [...prev, ...newForms];
        });
      } else {
        setLeadForms(result.forms);
      }
      
      // Update filtered forms if there's a search query
      if (searchQuery.trim() !== '') {
        const updatedAllForms = [...allLoadedForms, ...result.forms.filter(form => 
          !allLoadedForms.some(f => f.id === form.id)
        )];
        
        const results = searchFormsLocally(updatedAllForms, searchQuery);
        setFilteredForms(results);
      }
    } catch (error) {
      console.error('Error fetching lead forms:', error);
      setLeadFormError('Failed to fetch lead forms. Please try again.');
    } finally {
      setLoadingLeadForms(false);
      setLoadingMore(false);
    }
  }
  
  // Function to load all forms when search is activated
  async function loadAllForms() {
    if (hasLoadedAllForms) return;
    
    setLoadingMore(true);
    
    try {
      const result = await fetchAllLeadForms(paginationCursor);
      
      // Update pagination state and set hasLoadedAllForms
      setPaginationCursor(null);
      setHasLoadedAllForms(true);
      
      // Update allLoadedForms with deduplication
      setAllLoadedForms(prevAll => {
        const existingIds = new Set(prevAll.map(form => form.id));
        const newForms = result.forms.filter(form => !existingIds.has(form.id));
        return [...prevAll, ...newForms];
      });
      
      // Update leadForms as well
      setLeadForms(prevForms => {
        const existingIds = new Set(prevForms.map(form => form.id));
        const newForms = result.forms.filter(form => !existingIds.has(form.id));
        return [...prevForms, ...newForms];
      });
    } catch (error) {
      console.error('Error loading all forms:', error);
      setLeadFormError('Failed to load all forms. Please try again.');
    } finally {
      setLoadingMore(false);
    }
  }
  
  // Function to save form selection
  const saveFormSelection = async () => {
    if (!tempSelectedFormId) return;
    
    // Find the selected form in loaded forms or use stored form if available
    let selectedForm = allLoadedForms.find(form => form.id === tempSelectedFormId);
    
    // If the form isn't in allLoadedForms but matches storedLeadForm, use it anyway
    if (!selectedForm && storedLeadForm && tempSelectedFormId === storedLeadForm.formId) {
      // Create a LeadForm object from the stored form data
      selectedForm = {
        id: storedLeadForm.formId,
        name: storedLeadForm.formName,
        display_name: storedLeadForm.displayName,
        formatted_date: storedLeadForm.formattedDate,
        question_count: storedLeadForm.questionCount,
        collects: storedLeadForm.collects
      };
    }
    
    // If we still don't have a form, don't proceed
    if (!selectedForm) return;
    
    // Update the selected lead form ID and ensure behavior is set to "existing"
    setSelectedLeadFormId(tempSelectedFormId);
    setSelectedFormName(selectedForm.display_name);
    setLeadFormBehavior("existing");
    
    // Save to local storage
    try {
      const response = await fetch('/api/kv/fetch-api-token');
      const userData = await response.json();
      
      if (userData.success && userData.account?.fbPageId) {
        const pageId = userData.account.fbPageId;
        saveLeadFormToLocalStorage(selectedForm, pageId);
      }
    } catch (error) {
      console.error('Error saving form selection:', error);
    }
    
    // Close the modal
    setShowLeadFormModal(false);
  };

  // Remove showAdvancedSettings state since we're using Dialog now
  return (
    <>
      {/* Upload area - smaller height + immediate display */}
      <div className="mb-5">
        <div
          className={`relative flex flex-wrap items-center gap-3 p-3 w-full border-2 border-dashed ${
            isUploading || cooldownActive ? 'border-amber-500' : 'border-border-dark hover:border-primary-green'
          } rounded-lg transition-all duration-200 ${
            isUploading || cooldownActive ? 'cursor-not-allowed' : 'cursor-pointer'
          } h-auto min-h-20`}
          onClick={() => {
            if (!isUploading && !cooldownActive) {
              fileInputRef.current?.click();
            }
          }}
        >
          {/* Status bar for cooldown - no overlay for uploads to keep percentages visible */}
          {cooldownActive && (
            <div className="absolute inset-0 bg-dark-bg/90 rounded-lg flex items-center justify-center z-10">
              <div className="flex flex-col items-center text-amber-500">
                <Clock className="mb-2" size={24} />
                <span className="text-sm font-medium">Thank you! Let me take a moment to review this.</span>
                <span className="text-xs mt-1 text-text-light-gray">
                  Please wait {cooldownTimeRemaining} seconds before uploading the next creative
                </span>
              </div>
            </div>
          )}
          
          {/* Upload in progress banner instead of overlay */}
          {isUploading && !cooldownActive && (
            <div className="absolute top-0 inset-x-0 bg-amber-500/20 border-b border-amber-500 p-1 rounded-t-lg text-center">
              <div className="flex items-center justify-center text-amber-500 text-xs">
                <Loader2 className="animate-spin mr-1" size={12} />
                <span>Upload in progress - please wait</span>
              </div>
            </div>
          )}

          {mediaItems.length === 0 ? (
            <div className="flex flex-col items-center text-text-light-gray mx-auto">
              <Upload className="mb-1" size={20} />
              <span className="text-xs">Upload Media</span>
            </div>
          ) : (
            <>
              {mediaItems.map(item => (
                <div
                  key={item.id}
                  className="flex items-center space-x-2 bg-dark-bg rounded-lg p-2 border border-border-dark"
                >
                  {item.progress !== undefined && item.progress < 100 && item.progress >= 0 ? (
                    <Loader2 className="animate-spin text-primary-green" size={16} />
                  ) : item.progress === -1 ? (
                    <div className="w-4 h-4 rounded-full bg-red-500 flex items-center justify-center">
                      <span className="text-xs text-white">✗</span>
                    </div>
                  ) : item.progress === -2 ? (
                    <Loader2 className="animate-spin text-amber-500" size={16} />
                  ) : (
                    <div className="w-4 h-4 rounded-full bg-primary-green flex items-center justify-center">
                      <span className="text-xs text-deep-black">✓</span>
                    </div>
                  )}
                  <span className="text-sm text-text-white">
                    {item.type.toUpperCase()} ({item.aspectRatio})
                  </span>
                  <span className="text-xs text-text-light-gray">
                    {item.progress === -1 ? 'Failed' : 
                     item.progress === -2 ? (item.error || 'Retrying...') : 
                     `${item.progress ?? 0}%`}
                  </span>
                  <button
                    onClick={e => {
                      e.stopPropagation();
                      setMediaItems(prev => prev.filter(m => m.id !== item.id));
                    }}
                    disabled={isUploading}
                  >
                    <XCircle 
                      size={16} 
                      className={`${isUploading ? 'text-text-light-gray/50' : 'text-text-light-gray hover:text-red-500'} transition-colors`} 
                    />
                  </button>
                </div>
              ))}
              {!isUploading && !cooldownActive && (
                <div className="flex items-center space-x-2 bg-dark-bg rounded-lg p-2 border border-border-dark hover:border-primary-green transition-all duration-200">
                  <Plus size={16} className="text-text-light-gray" />
                  <span className="text-sm text-text-light-gray">Add more media</span>
                </div>
              )}
            </>
          )}
          <input
            type="file"
            ref={fileInputRef}
            className="hidden"
            accept="image/*,video/*"
            disabled={isUploading || cooldownActive}
          />
        </div>
        
        {/* Upload instructions */}
        <div className="mt-2 text-xs text-text-light-gray">
          <p>• Images must be under 4MB. Videos: recommended under 80MB, max 300MB.</p>
        </div>
      </div>

      {/* Link */}
      <div className="space-y-2 mt-5">
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium text-text-white flex items-center">
            Link
            <Info size={16} className="ml-2 text-text-light-gray" />
          </label>
        </div>
        <input
          type="text"
          value={link}
          onChange={e => setLink(e.target.value)}
          onBlur={(e) => {
            // Format URL: remove www. and add https:// if needed
            const formattedUrl = (() => {
              if (!link || link.trim() === '') return link;
              
              // Remove www. if present
              let cleanUrl = link.replace(/^(https?:\/\/)?(www\.)/i, '');
              
              // Add https:// if not present
              if (!cleanUrl.match(/^https?:\/\//i)) {
                return `https://${cleanUrl}`;
              }
              
              return cleanUrl;
            })();
            
            setLink(formattedUrl);

            // Check if URL has a valid format with TLD
            try {
              const urlObj = new URL(formattedUrl.match(/^https?:\/\//i) ? formattedUrl : `https://${formattedUrl}`);
              // Check if domain has a TLD (at least one dot in hostname)
              if (!urlObj.hostname.includes('.') || urlObj.hostname.split('.').pop()!.length === 0) {
                // Invalid domain
                e.currentTarget.classList.add('border-red-500', 'focus:ring-red-500', 'focus:border-red-500');
                e.currentTarget.title = "Please enter a valid URL with a domain extension (e.g. .com)";
              } else {
                e.currentTarget.classList.remove('border-red-500', 'focus:ring-red-500', 'focus:border-red-500');
                e.currentTarget.title = "";
              }
            } catch (error) {
              // Invalid URL
              if (formattedUrl.trim() !== '') {
                e.currentTarget.classList.add('border-red-500', 'focus:ring-red-500', 'focus:border-red-500');
                e.currentTarget.title = "Please enter a valid URL";
              }
            }
          }}
          placeholder="Enter the link to what you'd like to advertise"
          className="w-full px-3 py-2.5 bg-dark-bg border border-border-dark text-text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-green focus:border-primary-green placeholder:text-text-light-gray transition-all duration-200"
        />
      </div>

      {/* Budget with Currency and Minimum Budget Handling */}
      <div className="space-y-2 mt-5">
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium text-text-white flex items-center">
            Ad Budget (Daily)
            <Info size={16} className="ml-2 text-text-light-gray" />
          </label>
        </div>
        <BudgetSettings budget={budget} setBudget={setBudget} />
      </div>

      {/* Advanced Settings Dialog */}
      <div className="mt-5">
        <Dialog>
          <DialogTrigger asChild>
            <button 
              className="flex items-center text-sm font-medium text-text-white hover:text-primary-green transition-colors"
            >
              <Settings className="mr-1" size={16} />
              Advanced Settings
            </button>
          </DialogTrigger>
          <DialogContent className="bg-dark-bg border border-border-dark text-text-white">
            <DialogHeader>
              <DialogTitle className="text-text-white">Advanced Settings</DialogTitle>
            </DialogHeader>
            
            <div className="mt-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-text-white">Campaign Objective</label>
                
                <div className="space-y-3 mt-2">
                  {/* Auto Option */}
                  <div className="flex items-start space-x-2">
                    <div className="flex items-center h-5 mt-1">
                      <input
                        id="objective-auto"
                        type="radio"
                        value="auto"
                        checked={campaignObjective === "auto"}
                        onChange={() => setCampaignObjective("auto")}
                        className="w-4 h-4 border-border-dark focus:ring-primary-green accent-primary-green"
                      />
                    </div>
                    <div className="flex flex-col">
                      <label htmlFor="objective-auto" className="text-sm font-medium text-text-white">
                        Auto
                      </label>
                      <span className="text-xs text-text-light-gray">
                        Let AI automatically select the best objective for your campaign.
                      </span>
                    </div>
                  </div>
                  
                  {/* Other Objectives */}
                  {objectives.map(objective => (
                    <div key={objective.value} className="flex items-start space-x-2">
                      <div className="flex items-center h-5 mt-1">
                        <input
                          id={`objective-${objective.value}`}
                          type="radio"
                          value={objective.value}
                          checked={campaignObjective === objective.value}
                          onChange={() => setCampaignObjective(objective.value)}
                          className="w-4 h-4 border-border-dark focus:ring-primary-green accent-primary-green"
                        />
                      </div>
                      <div className="flex flex-col">
                        <label htmlFor={`objective-${objective.value}`} className="text-sm font-medium text-text-white">
                          {objective.label}
                        </label>
                        <span className="text-xs text-text-light-gray">
                          {objective.description}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="mt-6 pt-2 border-t border-border-dark">
                <h4 className="text-sm font-medium text-text-white mb-2">
                  Lead Form Behavior
                </h4>
                <p className="text-xs text-text-light-gray mb-3">
                  Use this if you would like to use an existing lead form instead of the AI generating a new one for your lead generation/recruiting campaign.
                </p>
                
                <div className="space-y-3">
                  <div className="flex items-start space-x-2">
                    <div className="flex items-center h-5 mt-1">
                      <input
                        id="automatic"
                        type="radio"
                        name="leadFormBehavior"
                        value="automatic"
                        checked={leadFormBehavior === "automatic"}
                        onChange={() => {
                          setLeadFormBehavior("automatic");
                          // Clear the selected lead form ID when switching to automatic
                          if (selectedLeadFormId) {
                            console.log('Switching to automatic lead form behavior, clearing selected lead form ID');
                            setSelectedLeadFormId("");
                          }
                        }}
                        className="w-4 h-4 border-border-dark focus:ring-primary-green accent-primary-green"
                      />
                    </div>
                    <div className="flex flex-col">
                      <label htmlFor="automatic" className="text-sm font-medium text-text-white">
                        Automatic - Create as needed
                      </label>
                      <span className="text-xs text-text-light-gray">
                        Let AI create a lead form automatically.
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-2">
                    <div className="flex items-center h-5 mt-1">
                      <input
                        id="existing"
                        type="radio"
                        name="leadFormBehavior"
                        value="existing"
                        checked={leadFormBehavior === "existing"}
                        onChange={() => setLeadFormBehavior("existing")}
                        className="w-4 h-4 border-border-dark focus:ring-primary-green accent-primary-green"
                      />
                    </div>
                    <div className="flex flex-col w-full">
                      <label htmlFor="existing" className="text-sm font-medium text-text-white mb-1">
                        Attach existing lead form
                      </label>
                      
                      <button
                        type="button"
                        className={`w-full bg-dark-bg border border-border-dark rounded-md py-2 px-3 text-left text-sm flex justify-between items-center ${leadFormBehavior === "existing" ? "text-text-white" : "text-text-light-gray"}`}
                        onClick={() => {
                          if (leadFormBehavior === "existing") {
                            setShowLeadFormModal(true);
                          } else {
                            setLeadFormBehavior("existing");
                            setTimeout(() => setShowLeadFormModal(true), 100);
                          }
                        }}
                        disabled={leadFormBehavior !== "existing"}
                      >
                        {selectedLeadFormId ? (
                          <span className="truncate">{selectedFormName}</span>
                        ) : (
                          <span>Select a lead form...</span>
                        )}
                        <ChevronDown size={16} className="text-text-light-gray ml-2 flex-shrink-0" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Customer Profile Selector */}
              <CustomerProfileSelector
                selectedProfileId={selectedCustomerProfileId}
                setSelectedProfileId={setSelectedCustomerProfileId}
              />
            </div>
            
            <div className="mt-6 flex justify-end">
              <DialogClose asChild>
                <button className="px-4 py-2 bg-primary-green text-deep-black font-medium rounded-md hover:bg-primary-green/90 transition-colors">
                  Done
                </button>
              </DialogClose>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Next Step: Preview & Review */}
      <div className="mt-8">
        <button
          className={`w-full bg-primary-green hover:bg-primary-green/90 text-deep-black font-bold py-3 px-4 rounded-lg transition-all duration-200 transform hover:scale-[1.02] ${mediaItems.length === 0 || !link || !budget || isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
          onClick={() => handleReviewTransition()}
          disabled={mediaItems.length === 0 || !link || !budget || isLoading}
        >
          Preview &amp; Review
        </button>
      </div>

      {/* Lead Form Selection Modal */}
      <Dialog open={showLeadFormModal} onOpenChange={setShowLeadFormModal}>
        <DialogContent className="bg-dark-bg border border-border-dark text-text-white max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-text-white">Select a Lead Form</DialogTitle>
          </DialogHeader>
          
          <div className="mt-2">
            {/* Search Bar */}
            <div className="p-2 border-b border-border-dark">
              <div className="flex items-center space-x-2">
                <input
                  type="text"
                  placeholder="Search lead forms..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="flex-1 px-3 py-1.5 text-sm bg-dark-bg border border-border-dark text-text-white rounded-md focus:outline-none focus:ring-1 focus:ring-primary-green"
                />
              </div>
            </div>

            {/* Previously Selected Form */}
            {storedLeadForm && (
              <div className="p-3 border-b border-border-dark bg-gray-800">
                <div className="mb-1 text-xs font-medium text-text-light-gray">Previously Selected Form</div>
                <div 
                  className={`p-2 border rounded-md bg-dark-bg cursor-pointer transition-colors ${tempSelectedFormId === storedLeadForm.formId ? 'border-primary-green' : 'border-border-dark hover:border-primary-green'}`}
                  onClick={() => setTempSelectedFormId(storedLeadForm.formId)}
                >
                  <div className="flex flex-col">
                    <span className="text-sm text-text-white font-medium">{storedLeadForm.displayName}</span>
                    <span className="text-xs text-text-light-gray">ID: {storedLeadForm.formName}</span>
                    <span className="text-xs text-text-light-gray">Created: {storedLeadForm.formattedDate}</span>
                    <span className="text-xs text-text-light-gray">Fields: {storedLeadForm.collects || `${storedLeadForm.questionCount} questions`}</span>
                  </div>
                  {tempSelectedFormId === storedLeadForm.formId && (
                    <div className="mt-1 text-xs text-primary-green">Selected</div>
                  )}
                </div>
              </div>
            )}

            {/* Main content area */}
            <div className="overflow-y-auto flex-grow max-h-[400px]">
              {loadingLeadForms ? (
                <div className="py-4 text-center">
                  <Loader2 className="animate-spin mx-auto mb-2" size={20} />
                  <p className="text-sm text-text-light-gray">Loading lead forms...</p>
                </div>
              ) : leadFormError ? (
                <div className="py-4 text-center">
                  <p className="text-sm text-red-500">{leadFormError}</p>
                  <button 
                    className="mt-2 text-xs text-primary-green hover:underline"
                    onClick={() => getFbLeadForms()}
                  >
                    Try again
                  </button>
                </div>
              ) : filteredForms.length > 0 ? (
                <div>
                  <div className="p-2 text-xs text-text-light-gray border-b border-border-dark">
                    Found {filteredForms.length} matching forms
                    <button 
                      className="ml-2 text-primary-green hover:underline"
                      onClick={() => {
                        setSearchQuery('');
                      }}
                    >
                      Clear search
                    </button>
                  </div>
                  <ul className="py-1">
                    {filteredForms.map(form => (
                      <li 
                        key={form.id}
                        className={`px-3 py-2 text-sm cursor-pointer hover:bg-gray-800 ${
                          tempSelectedFormId === form.id ? 'bg-gray-800 border-l-4 border-primary-green' : ''
                        }`}
                        onClick={() => setTempSelectedFormId(form.id)}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex flex-col">
                              <div className="flex items-center">
                                <span className="text-text-white font-medium">{form.display_name}</span>
                                {tempSelectedFormId === form.id && (
                                  <span className="ml-2 text-xs text-primary-green">✓ Selected</span>
                                )}
                              </div>
                              <span className="text-xs text-text-light-gray">ID: {form.name}</span>
                              <span className="text-xs text-text-light-gray">Created: {form.formatted_date}</span>
                              <span className="text-xs text-text-light-gray">Fields: {form.collects || `${form.question_count} questions`}</span>
                            </div>
                          </div>
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <button 
                                  className="p-1 ml-2 text-text-light-gray hover:text-primary-green"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedFormDetails(form);
                                    setShowFormDetails(true);
                                  }}
                                >
                                  <InfoIcon size={16} />
                                </button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p className="text-xs">View form details</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : searchQuery.trim() !== '' ? (
                <div className="py-4 text-center">
                  <p className="text-sm text-text-light-gray">No matching lead forms found</p>
                  <button 
                    className="mt-2 text-xs text-primary-green hover:underline"
                    onClick={() => {
                      setSearchQuery('');
                    }}
                  >
                    Clear search
                  </button>
                </div>
              ) : leadForms.length === 0 ? (
                <div className="py-4 text-center">
                  <p className="text-sm text-text-light-gray">No lead forms found</p>
                </div>
              ) : (
                <div>
                  <ul className="py-1">
                    {leadForms.map(form => (
                      <li 
                        key={form.id}
                        className={`px-3 py-2 text-sm cursor-pointer hover:bg-gray-800 ${
                          tempSelectedFormId === form.id ? 'bg-gray-800 border-l-4 border-primary-green' : ''
                        }`}
                        onClick={() => setTempSelectedFormId(form.id)}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex flex-col">
                              <div className="flex items-center">
                                <span className="text-text-white font-medium">{form.display_name}</span>
                                {tempSelectedFormId === form.id && (
                                  <span className="ml-2 text-xs text-primary-green">✓ Selected</span>
                                )}
                              </div>
                              <span className="text-xs text-text-light-gray">ID: {form.name}</span>
                              <span className="text-xs text-text-light-gray">Created: {form.formatted_date}</span>
                              <span className="text-xs text-text-light-gray">Fields: {form.collects || `${form.question_count} questions`}</span>
                            </div>
                          </div>
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <button 
                                  className="p-1 ml-2 text-text-light-gray hover:text-primary-green"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedFormDetails(form);
                                    setShowFormDetails(true);
                                  }}
                                >
                                  <InfoIcon size={16} />
                                </button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p className="text-xs">View form details</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
            
            {/* Load All Forms Button - shown at the bottom */}
            {!hasLoadedAllForms && !loadingLeadForms && (
              <div className="p-2 border-t border-border-dark">
                <button
                  className="w-full py-2 text-sm text-center text-primary-green hover:bg-gray-800 rounded-md transition-colors"
                  onClick={() => loadAllForms()}
                  disabled={loadingMore}
                >
                  {loadingMore ? (
                    <div className="flex items-center justify-center">
                      <Loader2 className="animate-spin mr-2" size={14} />
                      <span>Loading more forms...</span>
                    </div>
                  ) : searchQuery.trim() !== '' ? (
                    <span>Search Further</span>
                  ) : (
                    <span>Load All Forms</span>
                  )}
                </button>
              </div>
            )}
          </div>
          
          <DialogFooter className="flex justify-between">
            <button 
              className="px-4 py-2 text-text-white border border-border-dark rounded-md hover:bg-gray-800 transition-colors"
              onClick={() => setShowLeadFormModal(false)}
            >
              Cancel
            </button>
            <button 
              className={`px-4 py-2 bg-primary-green text-deep-black font-medium rounded-md transition-colors ${!tempSelectedFormId ? 'opacity-50 cursor-not-allowed' : 'hover:bg-primary-green/90'}`}
              onClick={saveFormSelection}
              disabled={!tempSelectedFormId}
            >
              Save
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Lead Form Details Dialog */}
      <Dialog open={showFormDetails} onOpenChange={setShowFormDetails}>
        <DialogContent className="bg-dark-bg border border-border-dark text-text-white max-w-md">
          <DialogHeader>
            <DialogTitle className="text-text-white">Lead Form Details</DialogTitle>
          </DialogHeader>
          
          {selectedFormDetails && (
            <div className="mt-4 space-y-4">
              <div>
                <h3 className="font-medium text-text-white">{selectedFormDetails.display_name}</h3>
                <p className="text-sm text-text-light-gray">Internal Name: {selectedFormDetails.name}</p>
                <p className="text-sm text-text-light-gray">ID: {selectedFormDetails.id}</p>
                <p className="text-sm text-text-light-gray">Created: {selectedFormDetails.formatted_date}</p>
                <p className="text-sm text-text-light-gray">Status: <span className={selectedFormDetails.status === 'ACTIVE' ? 'text-green-500' : 'text-amber-500'}>{selectedFormDetails.status}</span></p>
              </div>
              
              <div>
                <h4 className="text-sm font-medium text-text-white mb-2">Form Questions</h4>
                {selectedFormDetails.questions_preview && selectedFormDetails.questions_preview.length > 0 ? (
                  <div className="space-y-2">
                    {selectedFormDetails.questions_preview.map((question, index) => (
                      <div key={index} className="bg-gray-800 rounded-md p-3">
                        <p className="text-sm text-text-white">{question.label}</p>
                        <p className="text-xs text-text-light-gray">Type: {question.type}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-text-light-gray">This form collects: {selectedFormDetails.collects || `${selectedFormDetails.question_count} questions`}</p>
                )}
              </div>

              <div className="pt-4 flex justify-end">
                <button 
                  className="px-4 py-2 bg-primary-green text-deep-black font-medium rounded-md hover:bg-primary-green/90 transition-colors"
                  onClick={() => {
                    setTempSelectedFormId(selectedFormDetails.id);
                    setShowFormDetails(false);
                  }}
                >
                  Select This Form
                </button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}