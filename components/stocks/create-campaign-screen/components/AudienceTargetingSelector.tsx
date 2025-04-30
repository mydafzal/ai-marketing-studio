'use client'

import React, { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { X, Search, Plus, Target, Filter, Users, Loader2, AlertCircle, Save } from 'lucide-react';

// Define the structure for the fetched filter data (matching proxy route)
interface TargetingFiltersDataStructure {
  interest_filters: { [category: string]: string[] };
  demographic_filters: {
    life_events: { [category: string]: string[] };
    family_statuses: string[];
    industries: string[];
    household_income: { [country: string]: string[] };
    income: string[];
  };
  behaviour_filters: { [category: string]: string[] };
}

// Structure for individual filter details stored in state
export interface FilterDetail {
  id: string;
  name: string;
  type: 'interest' | 'demographics' | 'behaviors';
  path?: string[];
  min_reach?: number;
  max_reach?: number;
}

// Structure for the different filter categories
export interface TargetingFilters {
  interest_filters?: { [key: string]: FilterDetail };
  demographic_filters?: { [key: string]: FilterDetail };
  behaviour_filters?: { [key: string]: FilterDetail };
}

// Structure for the overall audience targeting object
export interface AudienceTargeting {
  type: "custom";
  filters: TargetingFilters;
}

// Define the LocalSearchResult type directly here
type LocalSearchResult = {
  id: string;
  name: string;
  type: 'interest' | 'demographics' | 'behaviors';
  path: string[];
};

// Props for the component
interface AudienceTargetingSelectorProps {
  targetingFilters: AudienceTargeting | null;
  setTargetingFilters: React.Dispatch<React.SetStateAction<AudienceTargeting | null>>;
  campaignSessionId?: string; // Optional campaign session ID for API calls
  audienceNumber?: number; // Optional audience number for API calls
  campaignObjective?: string; // Optional campaign objective to determine if filters are read-only
  updateMasterFlowData?: (data: any) => void; // Optional callback to update master flow data
}

// Type for search results - now using the locally defined type
type SearchResult = LocalSearchResult;

// --- Component Implementation ---

export default function AudienceTargetingSelector({
  targetingFilters,
  setTargetingFilters,
  campaignSessionId,
  audienceNumber = 1,
  campaignObjective,
  updateMasterFlowData
}: AudienceTargetingSelectorProps) {
  // Check if filters should be read-only (for recruiting campaigns)
  const isReadOnly = campaignObjective?.toLowerCase() === 'recruiting';

  // Internal state to manage filters derived from props
  const [internalFilters, setInternalFilters] = useState<TargetingFilters>({});
  const [originalFilters, setOriginalFilters] = useState<TargetingFilters>({});
  const [isModified, setIsModified] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // State for search terms
  const [interestSearchTerm, setInterestSearchTerm] = useState('');
  const [demographicSearchTerm, setDemographicSearchTerm] = useState('');
  const [behaviorSearchTerm, setBehaviorSearchTerm] = useState('');

  // State for search results (using LocalSearchResult type)
  const [interestResults, setInterestResults] = useState<LocalSearchResult[]>([]);
  const [demographicResults, setDemographicResults] = useState<LocalSearchResult[]>([]);
  const [behaviorResults, setBehaviorResults] = useState<LocalSearchResult[]>([]);

  // State for fetched filter data, loading, and errors
  const [allFiltersData, setAllFiltersData] = useState<TargetingFiltersDataStructure | null>(null);
  const [isLoadingFilters, setIsLoadingFilters] = useState(true);
  const [filtersError, setFiltersError] = useState<string | null>(null);

  // Fetch filter data on component mount
  useEffect(() => {
    const fetchFilters = async () => {
      setIsLoadingFilters(true);
      setFiltersError(null);
      try {
        console.log("Attempting to fetch targeting filters from proxy...");
        const response = await fetch('/api/fasty-bot/proxy-get-targeting-filters');
        console.log("Proxy response status:", response.status);
        const data = await response.json();

        if (!response.ok || !data.success || !data.filters) {
          console.error("Failed response from proxy:", data);
          throw new Error(data.message || data.error || 'Failed to fetch targeting filters');
        }
        console.log("Successfully fetched filters:", data.filters);
        setAllFiltersData(data.filters);
      } catch (error) {
        console.error("Error fetching targeting filters:", error);
        setFiltersError(error instanceof Error ? error.message : 'An unknown error occurred');
      } finally {
        setIsLoadingFilters(false);
      }
    };

    fetchFilters();
  }, []); // Empty dependency array ensures this runs only once on mount

  // Initialize internal state from props
  useEffect(() => {
    if (targetingFilters?.filters) {
      const newFilters = {
        interest_filters: targetingFilters.filters.interest_filters || {},
        demographic_filters: targetingFilters.filters.demographic_filters || {},
        behaviour_filters: targetingFilters.filters.behaviour_filters || {},
      };
      setInternalFilters(newFilters);
      setOriginalFilters(JSON.parse(JSON.stringify(newFilters))); // Deep copy for comparison
      setIsModified(false); // Reset modified state when props change
    } else {
      const emptyFilters = {
        interest_filters: {},
        demographic_filters: {},
        behaviour_filters: {},
      };
      setInternalFilters(emptyFilters);
      setOriginalFilters(emptyFilters);
      setIsModified(false);
    }
  }, [targetingFilters]);

  // Check if filters have been modified
  useEffect(() => {
    // Skip the initial render
    if (Object.keys(originalFilters).length === 0) return;
    
    // Compare current filters with original filters
    const isChanged = JSON.stringify(internalFilters) !== JSON.stringify(originalFilters);
    setIsModified(isChanged);
    
    // Reset success message when filters are modified again
    if (isChanged && saveSuccess) {
      setSaveSuccess(false);
    }
  }, [internalFilters, originalFilters, saveSuccess]);

  // --- Search Logic (using fetched data) ---
  const searchLocalFilters = (term: string, type: 'interest' | 'demographics' | 'behaviors') => {
    const searchTermLower = term.toLowerCase();
    const results: LocalSearchResult[] = [];
    const maxResults = 20;

    // Use the fetched data from state, return if not loaded or error
    if (!allFiltersData || filtersError) {
        console.log("Search skipped: filter data not loaded or error occurred.");
        if (type === 'interest') setInterestResults([]);
        if (type === 'demographics') setDemographicResults([]);
        if (type === 'behaviors') setBehaviorResults([]);
        return;
    }

    // Clear results if term is too short
    if (!term || term.length < 2) {
      if (type === 'interest') setInterestResults([]);
      if (type === 'demographics') setDemographicResults([]);
      if (type === 'behaviors') setBehaviorResults([]);
      return;
    }

    // Generate a random numeric ID for demonstration purposes
    // In a real implementation, these IDs would come from the API
    const generateNumericId = () => {
      return Math.floor(Math.random() * 9000000000000) + 1000000000000;
    };

    if (type === 'interest' && allFiltersData.interest_filters) {
      for (const category in allFiltersData.interest_filters) {
        allFiltersData.interest_filters[category]?.forEach((item: string) => { // Add type for item
          if (item.toLowerCase().includes(searchTermLower) && results.length < maxResults) {
            // Generate a numeric ID for this interest
            const numericId = generateNumericId().toString();
            results.push({
              id: numericId,
              name: item,
              type: 'interest',
              path: ['Interest', category]
            });
          }
        });
      }
      setInterestResults(results);
    } else if (type === 'demographics' && allFiltersData.demographic_filters) {
      const demoFilters = allFiltersData.demographic_filters;
      if (demoFilters.life_events) {
        for (const category in demoFilters.life_events) {
          demoFilters.life_events[category]?.forEach((item: string) => { // Add type for item
            if (item.toLowerCase().includes(searchTermLower) && results.length < maxResults) {
              const numericId = generateNumericId().toString();
              results.push({ 
                id: numericId, 
                name: item, 
                type: 'demographics', 
                path: ['Demographics', 'Life Events', category] 
              });
            }
          });
        }
      }
      if (demoFilters.family_statuses) {
        demoFilters.family_statuses?.forEach((item: string) => { // Add type for item
          if (item.toLowerCase().includes(searchTermLower) && results.length < maxResults) {
            const numericId = generateNumericId().toString();
            results.push({ 
              id: numericId, 
              name: item, 
              type: 'demographics', 
              path: ['Demographics', 'Family Statuses'] 
            });
          }
        });
      }
      if (demoFilters.industries) {
        demoFilters.industries?.forEach((item: string) => { // Add type for item
          if (item.toLowerCase().includes(searchTermLower) && results.length < maxResults) {
            const numericId = generateNumericId().toString();
            results.push({ 
              id: numericId, 
              name: item, 
              type: 'demographics', 
              path: ['Demographics', 'Industries'] 
            });
          }
        });
      }
       if (demoFilters.income) {
         demoFilters.income?.forEach((item: string) => { // Add type for item
           if (item.toLowerCase().includes(searchTermLower) && results.length < maxResults) {
            const numericId = generateNumericId().toString();
             results.push({ 
              id: numericId, 
              name: item, 
              type: 'demographics', 
              path: ['Demographics', 'Income'] 
            });
           }
         });
       }
      setDemographicResults(results);
    } else if (type === 'behaviors' && allFiltersData.behaviour_filters) {
      for (const category in allFiltersData.behaviour_filters) {
        allFiltersData.behaviour_filters[category]?.forEach((item: string) => { // Add type for item
          if (item.toLowerCase().includes(searchTermLower) && results.length < maxResults) {
            const numericId = generateNumericId().toString();
            results.push({
              id: numericId,
              name: item,
              type: 'behaviors',
              path: ['Behaviors', category]
            });
          }
        });
      }
      setBehaviorResults(results);
    }
  };

  // --- Add/Remove Logic ---
  const addFilter = (filter: LocalSearchResult) => {
    if (isReadOnly) return; // Don't add filters if in read-only mode
    
    // Map the filter type to the correct key in TargetingFilters
    let filterTypeKey: keyof TargetingFilters;
    
    if (filter.type === 'interest') {
      filterTypeKey = 'interest_filters';
    } else if (filter.type === 'demographics') {
      filterTypeKey = 'demographic_filters';
    } else if (filter.type === 'behaviors') {
      filterTypeKey = 'behaviour_filters';
    } else {
      console.error("Unknown filter type:", filter.type);
      return;
    }
    
    const filterName = filter.name;
    
    // Extract the actual ID from the filter.id string
    // The format is typically "type:category:name" or "type:name"
    // We need to extract just the ID part if it exists, otherwise use the whole string
    const idParts = filter.id.split(':');
    // If the ID contains a numeric part, use that, otherwise use the original ID
    const actualId = idParts.find(part => /^\d+$/.test(part)) || filter.id;
    
    console.log(`Adding ${filter.type} filter: ${filterName} with ID: ${actualId}`);

    setInternalFilters(prevFilters => {
      const updatedCategory = {
        ...(prevFilters[filterTypeKey] || {}),
        [filterName]: {
          id: actualId, // Use the extracted numeric ID if available
          name: filterName,
          type: filter.type,
          path: filter.path,
          min_reach: 0,  // Default values as required by the API
          max_reach: 0   // Default values as required by the API
        } as FilterDetail
      };
      return { ...prevFilters, [filterTypeKey]: updatedCategory };
    });

    if (filter.type === 'interest') { setInterestSearchTerm(''); setInterestResults([]); }
    if (filter.type === 'demographics') { setDemographicSearchTerm(''); setDemographicResults([]); }
    if (filter.type === 'behaviors') { setBehaviorSearchTerm(''); setBehaviorResults([]); }
   };

   const removeFilter = (type: 'interest' | 'demographics' | 'behaviors', filterName: string) => {
    if (isReadOnly) return; // Don't remove filters if in read-only mode
    
    // Map the filter type to the correct key in TargetingFilters
    let filterTypeKey: keyof TargetingFilters;
    
    if (type === 'interest') {
      filterTypeKey = 'interest_filters';
    } else if (type === 'demographics') {
      filterTypeKey = 'demographic_filters';
    } else if (type === 'behaviors') {
      filterTypeKey = 'behaviour_filters';
    } else {
      console.error("Unknown filter type:", type);
      return;
    }
    
    console.log(`Removing ${type} filter: ${filterName}`);
    
    setInternalFilters(prevFilters => {
      const categoryFilters = { ...(prevFilters[filterTypeKey] || {}) };
      delete categoryFilters[filterName];
      return { ...prevFilters, [filterTypeKey]: categoryFilters };
    });
  };

  // Use effect to update parent component state when internal filters change
  useEffect(() => {
    console.log("Internal filters updated:", internalFilters);
  }, [internalFilters]);

  // Helper function to generate a random numeric ID
  const generateNumericId = () => {
    return Math.floor(Math.random() * 9000000000000) + 1000000000000;
  };

  // Helper function to ensure an ID is numeric
  const ensureNumericId = (id: string): string => {
    // If the ID is already numeric, return it
    if (/^\d+$/.test(id)) {
      return id;
    }
    
    // If the ID contains a numeric part, extract and return it
    const idParts = id.split(':');
    const numericPart = idParts.find(part => /^\d+$/.test(part));
    if (numericPart) {
      return numericPart;
    }
    
    // Otherwise, generate a new numeric ID
    return generateNumericId().toString();
  };

  // Function to save targeting filters to the API
  const saveTargetingFilters = async () => {
    if (!isModified) return;
    
    setIsSaving(true);
    
    try {
      // Format filters according to the expected schema with min_reach and max_reach
      const formattedFilters: TargetingFilters = {
        interest_filters: {},
        demographic_filters: {},
        behaviour_filters: {}
      };
      
      // Process interest filters
      if (internalFilters.interest_filters) {
        Object.entries(internalFilters.interest_filters).forEach(([name, filter]) => {
          formattedFilters.interest_filters![name] = {
            ...filter,
            id: ensureNumericId(filter.id), // Ensure ID is numeric
            min_reach: filter.min_reach || 0,
            max_reach: filter.max_reach || 0
          };
        });
      }
      
      // Process demographic filters
      if (internalFilters.demographic_filters) {
        Object.entries(internalFilters.demographic_filters).forEach(([name, filter]) => {
          formattedFilters.demographic_filters![name] = {
            ...filter,
            id: ensureNumericId(filter.id), // Ensure ID is numeric
            min_reach: filter.min_reach || 0,
            max_reach: filter.max_reach || 0
          };
        });
      }
      
      // Process behavior filters
      if (internalFilters.behaviour_filters) {
        Object.entries(internalFilters.behaviour_filters).forEach(([name, filter]) => {
          formattedFilters.behaviour_filters![name] = {
            ...filter,
            id: ensureNumericId(filter.id), // Ensure ID is numeric
            min_reach: filter.min_reach || 0,
            max_reach: filter.max_reach || 0
          };
        });
      }
      
      // Create the targeting object with the formatted filters
      const targetingObject: AudienceTargeting = { type: "custom", filters: formattedFilters }; // TODO: formattedFilters do not contain filter ID. becuase list api is not including it. Need to change backend API,
      
      // Update parent component state
      setTargetingFilters(targetingObject);
      
      // If we have a campaign session ID, save to the API
      if (campaignSessionId) {
        console.log("Saving targeting filters to API for campaign session:", campaignSessionId);
        
        // Prepare the payload for the API
        const payload = {
          campaign_session_uuid: campaignSessionId,
          audience_nr: audienceNumber,
          targeting_filters: targetingObject
        };
        
        console.log("Sending payload:", payload);
        
        // Call the API to save the targeting filters
        const response = await fetch('/api/fasty-bot/proxy-update-audience', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        
        const data = await response.json();
        
        if (!response.ok || !data.success) {
          const errorMessage = data.message || data.error || 'Failed to save targeting filters';
          console.error('API error:', data);
          throw new Error(errorMessage);
        }
        
        console.log('Targeting filters saved successfully to API:', data);
        
        // Update master flow data if callback is provided
        if (updateMasterFlowData && data.audiences) {
          updateMasterFlowData({
            audiences: data.audiences
          });
          console.log('Master flow data updated with new targeting filters');
        }
      } else {
        console.log('No campaign session ID provided, skipping API save');
      }
      
      // Update original filters to match current filters
      setOriginalFilters(JSON.parse(JSON.stringify(formattedFilters)));
      
      // Mark as no longer modified and save as successful
      setIsModified(false);
      setSaveSuccess(true);
      
      // Reset success message after 3 seconds
      setTimeout(() => {
        setSaveSuccess(false);
      }, 3000);
      
      console.log('Targeting filters saved successfully!');
    } catch (err) {
      console.error('Error saving targeting filters:', err);
      alert(`Error: ${err instanceof Error ? err.message : 'Failed to save changes'}`);
    } finally {
      setIsSaving(false);
    }
  };

  // --- Helper to render filter list ---
  const renderFilterList = (
    filters: { [key: string]: FilterDetail } | undefined,
    type: 'interest' | 'demographics' | 'behaviors'
  ) => {
    // Show loading/error state for the list area as well
    if (isLoadingFilters) return <p className="text-sm text-text-light-gray italic mt-2">Loading filters...</p>; // Added mt-2
    if (filtersError && (!filters || Object.keys(filters).length === 0)) return <p className="text-sm text-coral italic mt-2">Could not load filters.</p>; // Added mt-2

    if (!filters || Object.keys(filters).length === 0) {
      return <p className="text-sm text-text-light-gray italic mt-2">No {type} filters selected.</p>; // Added mt-2
    }
    return (
      <div className="flex flex-wrap gap-2 mt-2">
        {Object.entries(filters).map(([name, detail]) => (
          <div
            key={detail.id}
            className="bg-dark-bg border border-primary-green text-primary-green text-xs px-3 py-1.5 rounded-full flex items-center gap-2"
          >
            <span>{name}</span>
            <button
              onClick={() => removeFilter(type, name)}
              className="text-coral hover:text-red-400"
              title={`Remove ${name}`}
            >
              <X className="size-3.5" />
            </button>
          </div>
        ))}
      </div>
    );
  };

   // --- Helper to render search results ---
   const renderSearchResults = (
     results: LocalSearchResult[],
     searchTerm: string
   ) => {
     // Don't render if loading, error, or search term too short
     if (isLoadingFilters || !searchTerm || searchTerm.length < 2) return null;

     // Only show dropdown if there are results OR if term is long enough but no results found
     // Also check for error state - don't show dropdown if there was an error loading data
     const showDropdown = !filtersError && (results.length > 0 || searchTerm.length >= 2);
     if (!showDropdown) return null;

     return (
       <div className="absolute z-10 mt-1 w-full bg-dark-bg border border-border-dark rounded-md shadow-lg max-h-60 overflow-y-auto scrollbar-thin scrollbar-thumb-border-dark scrollbar-track-dark-bg">
         <div className="py-1">
           {results.length === 0 && searchTerm.length >= 2 && (
             <div className="px-4 py-2 text-sm text-text-light-gray italic">No results found for "{searchTerm}"</div>
           )}
           {results.map((result) => (
             <button
               key={result.id}
               className="w-full text-left px-4 py-2 text-sm text-text-white hover:bg-container-bg flex items-center transition-colors duration-150"
               onClick={() => addFilter(result)}
             >
               <Plus className="size-4 mr-2 text-primary-green shrink-0" />
               <div className="overflow-hidden">
                 <div className="font-medium truncate">{result.name}</div>
                 {result.path && result.path.length > 0 && (
                    <div className="text-xs text-text-light-gray truncate">{result.path.join(' > ')}</div>
                 )}
               </div>
             </button>
           ))}
         </div>
       </div>
     );
   };

  // --- Main Render ---
  // Show loading state for the whole component initially
  if (isLoadingFilters) {
    return (
      <div className="space-y-6 bg-dark-bg p-4 rounded-lg border border-border-dark flex items-center justify-center min-h-[200px]">
        <Loader2 className="size-6 text-primary-green animate-spin mr-2" />
        <span className="text-text-light-gray">Loading targeting options...</span>
      </div>
    );
  }

  // Show error state for the whole component if fetching failed
  if (filtersError) {
    return (
      <div className="space-y-6 bg-dark-bg p-4 rounded-lg border border-coral text-coral flex items-center min-h-[200px]">
        <AlertCircle className="size-5 mr-2 shrink-0" />
        <div>
          <p className="font-medium">Error loading targeting options:</p>
          <p className="text-sm">{filtersError}</p>
          {/* Optionally add a retry button here */}
        </div>
      </div>
    );
  }

  // Render the main component content if loading is complete and no error
  return (
    <div className="space-y-6 bg-dark-bg p-4 rounded-lg border border-border-dark">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-primary-green">Audience Targeting Filters</h3>
        
        {/* Save button with status indicators */}
        {!isReadOnly && (
          <div className="flex flex-col items-end">
            <button
              onClick={saveTargetingFilters}
              disabled={!isModified || isSaving}
              className={`transition-colors relative ${
                isSaving ? 'opacity-50 cursor-not-allowed' : 
                isModified ? 'text-yellow-400 hover:text-yellow-300' : 
                'text-primary-green hover:text-white'
              }`}
              title={isModified ? "Save changes" : "No changes to save"}
            >
              <Save className="w-5 h-5" />
              {isSaving && (
                <span className="animate-spin absolute inset-0 flex items-center justify-center">
                  <span className="w-3 h-3 border-2 border-t-transparent border-yellow-400 rounded-full"></span>
                </span>
              )}
            </button>
            
            {/* Status indicator text */}
            {isModified && (
              <span className="text-yellow-400 text-xs mt-1">Click to save</span>
            )}
            {saveSuccess && (
              <span className="text-green-400 text-xs mt-1">Saved!</span>
            )}
          </div>
        )}
      </div>
      
      {isReadOnly && (
        <div className="bg-amber-900/20 p-3 rounded-md border border-amber-500/30 mb-4">
          <p className="text-amber-400 text-sm">
            <strong>Note:</strong> For Facebook compliance, targeting filters for recruiting campaigns are read-only.
          </p>
        </div>
      )}
      
      <div className="border-b border-border-dark mb-4"></div>

      {/* Interest Filters */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
            <Target className="size-5 text-primary-green shrink-0" />
            <Label className="text-base font-medium text-text-white">Interests</Label>
        </div>
        <div className="relative">
          <Input
            type="text"
            placeholder="Search for interests (e.g., fashion, sports)"
            value={interestSearchTerm}
             onChange={(e) => {
               const term = e.target.value;
               setInterestSearchTerm(term);
               searchLocalFilters(term, 'interest');
             }}
             className="pl-10 pr-4 py-2 w-full bg-container-bg border border-border-dark rounded-lg text-text-white placeholder:text-text-light-gray focus:outline-none focus:border-primary-green focus:ring-1 focus:ring-primary-green"
             disabled={!allFiltersData || isReadOnly} // Disable input if data isn't loaded or in read-only mode
           />
            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
              <Search className="size-4 text-text-light-gray" />
            </div>
            {!isReadOnly && renderSearchResults(interestResults, interestSearchTerm)}
         </div>
         {renderFilterList(internalFilters.interest_filters, 'interest')}
       </div>

      {/* Demographic Filters */}
       <div className="space-y-3">
         <div className="flex items-center gap-2">
            <Users className="size-5 text-coral shrink-0" />
            <Label className="text-base font-medium text-text-white">Demographics</Label>
         </div>
         <div className="relative">
           <Input
             type="text"
             placeholder="Search for demographics (e.g., age, parents)"
             value={demographicSearchTerm}
             onChange={(e) => {
               const term = e.target.value;
               setDemographicSearchTerm(term);
               searchLocalFilters(term, 'demographics');
             }}
             className="pl-10 pr-4 py-2 w-full bg-container-bg border border-border-dark rounded-lg text-text-white placeholder:text-text-light-gray focus:outline-none focus:border-primary-green focus:ring-1 focus:ring-primary-green"
             disabled={!allFiltersData || isReadOnly}
           />
            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
              <Search className="size-4 text-text-light-gray" />
            </div>
            {!isReadOnly && renderSearchResults(demographicResults, demographicSearchTerm)}
         </div>
         {renderFilterList(internalFilters.demographic_filters, 'demographics')}
       </div>

      {/* Behavioral Filters */}
       <div className="space-y-3">
         <div className="flex items-center gap-2">
            <Filter className="size-5 text-primary-green shrink-0" />
            <Label className="text-base font-medium text-text-white">Behaviors</Label>
         </div>
         <div className="relative">
           <Input
             type="text"
             placeholder="Search for behaviors (e.g., travel, mobile users)"
             value={behaviorSearchTerm}
             onChange={(e) => {
               const term = e.target.value;
               setBehaviorSearchTerm(term);
               searchLocalFilters(term, 'behaviors');
             }}
             className="pl-10 pr-4 py-2 w-full bg-container-bg border border-border-dark rounded-lg text-text-white placeholder:text-text-light-gray focus:outline-none focus:border-primary-green focus:ring-1 focus:ring-primary-green"
             disabled={!allFiltersData || isReadOnly}
           />
            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
              <Search className="size-4 text-text-light-gray" />
            </div>
            {!isReadOnly && renderSearchResults(behaviorResults, behaviorSearchTerm)}
         </div>
         {renderFilterList(internalFilters.behaviour_filters, 'behaviors')}
       </div>
    </div>
  );
}
