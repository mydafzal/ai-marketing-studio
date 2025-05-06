import React, { useState, useEffect } from 'react';
import { Upload, Info, XCircle, Loader2, Plus, ChevronDown, ChevronRight, Settings, Clock, Info as InfoIcon } from 'lucide-react';
import { MediaItem } from '../types';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger,
  DialogClose
} from '@/components/ui/dialog';
import { BudgetSettings } from './BudgetSettings';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface LeadFormQuestion {
  label: string;
  type: string;
}

interface LeadForm {
  id: string;
  name: string;
  display_name: string;
  formatted_date: string;
  question_count: number;
  questions_preview?: LeadFormQuestion[];
  collects?: string;
  status?: string;
  page_id?: string;
}

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
}

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
}: CreateTabProps) {
  // Add state for showing/hiding lead form dropdown
  const [showLeadFormDropdown, setShowLeadFormDropdown] = useState<boolean>(false);
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
  // Add state for search in progress
  const [searching, setSearching] = useState<boolean>(false);
  // Add state to track if we've loaded all forms
  const [hasLoadedAllForms, setHasLoadedAllForms] = useState<boolean>(false);
  // Add state to store all pagination cursors we've seen
  const [allCursors, setAllCursors] = useState<string[]>([]);

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

  // Fetch lead forms when dialog opens
  useEffect(() => {
    if (showLeadFormDropdown && leadForms.length === 0 && !loadingLeadForms) {
      getFbLeadForms();
    }
  }, [showLeadFormDropdown]);
  
  // Reset filtered forms when dropdown closes
  useEffect(() => {
    if (!showLeadFormDropdown) {
      setFilteredForms([]);
      setSearchQuery('');
    }
  }, [showLeadFormDropdown]);

  async function getFbLeadForms(afterCursor?: string | null) {
    if (!afterCursor) {
      setLoadingLeadForms(true);
    } else {
      setLoadingMore(true);
    }
    setLeadFormError(null);
    
    try {
      // Add pagination cursor if provided
      const url = afterCursor 
        ? `/api/fasty-bot/proxy-get-facebook-lead-forms?after=${afterCursor}`
        : '/api/fasty-bot/proxy-get-facebook-lead-forms';
      
      const response = await fetch(url, {
        method: 'GET',
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch lead forms');
      }
      
      const data = await response.json();
      
      // Handle the new response structure with forms and pagination
      if (!data.forms) {
        throw new Error('Invalid response format from server');
      }
      
      // Save pagination cursor for next page if available
      if (data.pagination?.cursors?.after) {
        setPaginationCursor(data.pagination.cursors.after);
        
        // Store the cursor for search pagination
        if (!allCursors.includes(data.pagination.cursors.after)) {
          setAllCursors(prev => [...prev, data.pagination.cursors.after]);
        }
      } else {
        setPaginationCursor(null);
        setHasLoadedAllForms(true);
      }
      
      // Use the full data structure from the API
      const formattedLeadForms: LeadForm[] = data.forms.map((form: any) => ({
        id: form.id || form.form_id,
        name: form.name || form.form_name,
        display_name: form.display_name || form.name || 'Unnamed Form',
        formatted_date: form.formatted_date || new Date(form.created_time).toLocaleDateString(),
        question_count: form.question_count || 0,
        questions_preview: form.questions_preview || [],
        collects: form.collects || '',
        status: form.status || 'UNKNOWN',
        page_id: form.page_id || ''
      }));
      
      // If loading more, append to existing forms, otherwise replace
      if (afterCursor) {
        setLeadForms(prev => [...prev, ...formattedLeadForms]);
      } else {
        setLeadForms(formattedLeadForms);
      }
      
      return formattedLeadForms;
    } catch (error) {
      console.error('Error fetching lead forms:', error);
      setLeadFormError('Failed to fetch lead forms. Please try again.');
      return [];
    } finally {
      if (!afterCursor) {
        setLoadingLeadForms(false);
      } else {
        setLoadingMore(false);
      }
    }
  }
  
  // Function to search lead forms by name or ID
  async function searchLeadForms(query: string) {
    if (!query.trim()) {
      setFilteredForms([]);
      return;
    }
    
    setSearching(true);
    
    try {
      const lowercaseQuery = query.toLowerCase();
      
      // First search in already loaded forms
      let matchingForms = leadForms.filter(form => 
        form.name.toLowerCase().includes(lowercaseQuery) || 
        form.display_name.toLowerCase().includes(lowercaseQuery) || 
        form.id.toLowerCase().includes(lowercaseQuery)
      );
      
      if (matchingForms.length > 0) {
        setFilteredForms(matchingForms);
        setSearching(false);
        return;
      }
      
      // If no results, try to load more (up to 5 paginations)
      const maxPaginations = 5;
      let paginationCount = 0;
      let currentCursor = paginationCursor;
      
      while (currentCursor && paginationCount < maxPaginations && !hasLoadedAllForms) {
        // Load the next page
        const newForms = await getFbLeadForms(currentCursor);
        paginationCount++;
        
        // Search in the new forms
        matchingForms = newForms.filter(form => 
          form.name.toLowerCase().includes(lowercaseQuery) || 
          form.display_name.toLowerCase().includes(lowercaseQuery) || 
          form.id.toLowerCase().includes(lowercaseQuery)
        );
        
        if (matchingForms.length > 0) {
          setFilteredForms(matchingForms);
          break;
        }
        
        // Update cursor for next iteration
        currentCursor = paginationCursor;
        
        // If we reached the end, stop
        if (!currentCursor || hasLoadedAllForms) {
          break;
        }
      }
      
      // If we still don't have matches but have more cursors, try them sequentially
      if (matchingForms.length === 0 && allCursors.length > 0 && !hasLoadedAllForms) {
        for (const cursor of allCursors) {
          if (paginationCount >= maxPaginations) break;
          
          // Skip cursors we've already checked
          if (cursor === currentCursor) continue;
          
          // Load the next page
          const newForms = await getFbLeadForms(cursor);
          paginationCount++;
          
          // Search in the new forms
          matchingForms = newForms.filter(form => 
            form.name.toLowerCase().includes(lowercaseQuery) || 
            form.display_name.toLowerCase().includes(lowercaseQuery) || 
            form.id.toLowerCase().includes(lowercaseQuery)
          );
          
          if (matchingForms.length > 0) {
            setFilteredForms(matchingForms);
            break;
          }
        }
      }
      
      // If still no matches, show an empty result
      if (matchingForms.length === 0) {
        setFilteredForms([]);
      }
    } catch (error) {
      console.error('Error searching lead forms:', error);
      setLeadFormError('Failed to search lead forms. Please try again.');
    } finally {
      setSearching(false);
    }
  }

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

      {/* Optional AI guidance */}
      {/*<div className="space-y-2 mt-5">*/}
      {/*  <label className="text-sm font-medium text-text-white flex items-center">*/}
      {/*    AI Guidance (Optional)*/}
      {/*    <Info size={16} className="ml-2 text-text-light-gray" />*/}
      {/*  </label>*/}
      {/*  <textarea*/}
      {/*    value={aiGuidance}*/}
      {/*    onChange={e => setAiGuidance(e.target.value)}*/}
      {/*    placeholder="Type any notes or instructions for the AI..."*/}
      {/*    className="w-full px-3 py-2.5 bg-dark-bg border border-border-dark text-text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-green focus:border-primary-green placeholder:text-text-light-gray transition-all duration-200 min-h-[80px] resize-none"*/}
      {/*  />*/}
      {/*</div>*/}

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
              
              <div className="mt-4 pt-2">
                <h4 className="text-sm font-medium text-text-white mb-3">
                  Select Lead Form
                </h4>
                
                {/* Custom Dropdown */}
                <div className="relative">
                  <button
                    type="button"
                    className="w-full bg-dark-bg border border-border-dark rounded-md py-2 px-3 text-left text-sm text-text-white flex justify-between items-center"
                    onClick={() => setShowLeadFormDropdown(!showLeadFormDropdown)}
                  >
                    {selectedLeadFormId && leadForms.find(form => form.id === selectedLeadFormId) ? (
                      <div className="flex flex-col overflow-hidden">
                        <span className="truncate">
                          {leadForms.find(form => form.id === selectedLeadFormId)?.display_name}
                        </span>
                        <span className="text-xs text-text-light-gray truncate">
                          ID: {leadForms.find(form => form.id === selectedLeadFormId)?.name}
                        </span>
                        <span className="text-xs text-text-light-gray truncate">
                          Created: {leadForms.find(form => form.id === selectedLeadFormId)?.formatted_date}
                        </span>
                      </div>
                    ) : (
                      <span>Select a lead form...</span>
                    )}
                    <ChevronDown size={16} className="text-text-light-gray ml-2 flex-shrink-0" />
                  </button>
                  
                  {/* Dropdown content */}
                  {showLeadFormDropdown && (
                    <div className="absolute z-10 mt-1 w-full bg-dark-bg rounded-md shadow-lg border border-border-dark">
                      {/* Search Bar */}
                      <div className="p-2 border-b border-border-dark">
                        <div className="flex items-center space-x-2">
                          <input
                            type="text"
                            placeholder="Search lead forms..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="flex-1 px-3 py-1.5 text-sm bg-dark-bg border border-border-dark text-text-white rounded-md focus:outline-none focus:ring-1 focus:ring-primary-green"
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                searchLeadForms(searchQuery);
                              }
                            }}
                          />
                          <button
                            className="px-3 py-1.5 text-sm bg-primary-green text-deep-black rounded-md hover:bg-primary-green/90 transition-colors"
                            onClick={() => searchLeadForms(searchQuery)}
                            disabled={searching || !searchQuery.trim()}
                          >
                            {searching ? (
                              <Loader2 className="animate-spin" size={14} />
                            ) : (
                              'Search'
                            )}
                          </button>
                        </div>
                      </div>
                      
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
                      ) : searching ? (
                        <div className="py-4 text-center">
                          <Loader2 className="animate-spin mx-auto mb-2" size={20} />
                          <p className="text-sm text-text-light-gray">Searching for lead forms...</p>
                        </div>
                      ) : filteredForms.length > 0 ? (
                        <div>
                          <div className="p-2 text-xs text-text-light-gray">
                            Found {filteredForms.length} matching forms
                            <button 
                              className="ml-2 text-primary-green hover:underline"
                              onClick={() => {
                                setFilteredForms([]);
                                setSearchQuery('');
                              }}
                            >
                              Clear search
                            </button>
                          </div>
                          <ul className="py-1 max-h-60 overflow-auto">
                            {filteredForms.map(form => (
                              <li 
                                key={form.id}
                                className={`px-3 py-2 text-sm cursor-pointer hover:bg-gray-800 ${
                                  selectedLeadFormId === form.id ? 'bg-gray-800' : ''
                                }`}
                              >
                                <div className="flex items-center justify-between">
                                  <div 
                                    className="flex-1"
                                    onClick={() => {
                                      setSelectedLeadFormId(form.id);
                                      setShowLeadFormDropdown(false);
                                    }}
                                  >
                                    <div className="flex flex-col">
                                      <span className="text-text-white font-medium">{form.display_name}</span>
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
                      ) : searchQuery.trim() !== '' && !searching ? (
                        <div className="py-4 text-center">
                          <p className="text-sm text-text-light-gray">No matching lead forms found</p>
                          <button 
                            className="mt-2 text-xs text-primary-green hover:underline"
                            onClick={() => {
                              setFilteredForms([]);
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
                          <ul className="py-1 max-h-60 overflow-auto">
                            {leadForms.map(form => (
                              <li 
                                key={form.id}
                                className={`px-3 py-2 text-sm cursor-pointer hover:bg-gray-800 ${
                                  selectedLeadFormId === form.id ? 'bg-gray-800' : ''
                                }`}
                              >
                                <div className="flex items-center justify-between">
                                  <div 
                                    className="flex-1"
                                    onClick={() => {
                                      setSelectedLeadFormId(form.id);
                                      setShowLeadFormDropdown(false);
                                    }}
                                  >
                                    <div className="flex flex-col">
                                      <span className="text-text-white font-medium">{form.display_name}</span>
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
                          
                          {/* Load More Button */}
                          {paginationCursor && !searchQuery.trim() && (
                            <div className="p-2 border-t border-border-dark">
                              <button
                                className="w-full py-2 text-sm text-center text-primary-green hover:bg-gray-800 rounded-md transition-colors"
                                onClick={() => getFbLeadForms(paginationCursor)}
                                disabled={loadingMore}
                              >
                                {loadingMore ? (
                                  <div className="flex items-center justify-center">
                                    <Loader2 className="animate-spin mr-2" size={14} />
                                    <span>Loading more...</span>
                                  </div>
                                ) : (
                                  <span>Load more forms</span>
                                )}
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
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
                    setSelectedLeadFormId(selectedFormDetails.id);
                    setShowFormDetails(false);
                  }}
                >
                  Use This Form
                </button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
