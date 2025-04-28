'use client'

import React, { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { X, Search, Plus, Target, Filter, Users, Loader2, AlertCircle } from 'lucide-react';
import type { LocalSearchResult } from '@/lib/data/targetingFiltersData'; // Keep type import

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

// Props for the component
interface AudienceTargetingSelectorProps {
  targetingFilters: AudienceTargeting | null;
  setTargetingFilters: React.Dispatch<React.SetStateAction<AudienceTargeting | null>>;
}

// Type for search results - now using the imported type
type SearchResult = LocalSearchResult;

// --- Component Implementation ---

export default function AudienceTargetingSelector({
  targetingFilters,
  setTargetingFilters
}: AudienceTargetingSelectorProps) {

  // Internal state to manage filters derived from props
  const [internalFilters, setInternalFilters] = useState<TargetingFilters>({});

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
      setInternalFilters({
        interest_filters: targetingFilters.filters.interest_filters || {},
        demographic_filters: targetingFilters.filters.demographic_filters || {},
        behaviour_filters: targetingFilters.filters.behaviour_filters || {},
      });
    } else {
       setInternalFilters({
         interest_filters: {},
         demographic_filters: {},
         behaviour_filters: {},
       });
    }
  }, [targetingFilters]);

  // --- Search Logic (using fetched data) ---
  const searchLocalFilters = (term: string, type: 'interest' | 'demographics' | 'behaviors') => {
    const searchTermLower = term.toLowerCase();
    const results: LocalSearchResult[] = [];
    const maxResults = 20;

    // Use the fetched data from state, return if not loaded or error
    const dataToSearch = allFiltersData;
    if (!dataToSearch || filtersError) {
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

    if (type === 'interest' && dataToSearch.interest_filters) {
      for (const category in dataToSearch.interest_filters) {
        dataToSearch.interest_filters[category]?.forEach(item => { // Add null check
          if (item.toLowerCase().includes(searchTermLower) && results.length < maxResults) {
            results.push({
              id: `interest:${category}:${item}`,
              name: item,
              type: 'interest',
              path: ['Interest', category]
            });
          }
        });
      }
      setInterestResults(results);
    } else if (type === 'demographics' && dataToSearch.demographic_filters) {
      const demoFilters = dataToSearch.demographic_filters;
      if (demoFilters.life_events) {
        for (const category in demoFilters.life_events) {
          demoFilters.life_events[category]?.forEach(item => { // Add null check
            if (item.toLowerCase().includes(searchTermLower) && results.length < maxResults) {
              results.push({ id: `demographics:life_events:${category}:${item}`, name: item, type: 'demographics', path: ['Demographics', 'Life Events', category] });
            }
          });
        }
      }
      if (demoFilters.family_statuses) {
        demoFilters.family_statuses?.forEach(item => { // Add null check
          if (item.toLowerCase().includes(searchTermLower) && results.length < maxResults) {
            results.push({ id: `demographics:family_statuses:${item}`, name: item, type: 'demographics', path: ['Demographics', 'Family Statuses'] });
          }
        });
      }
      if (demoFilters.industries) {
        demoFilters.industries?.forEach(item => { // Add null check
          if (item.toLowerCase().includes(searchTermLower) && results.length < maxResults) {
            results.push({ id: `demographics:industries:${item}`, name: item, type: 'demographics', path: ['Demographics', 'Industries'] });
          }
        });
      }
       if (demoFilters.income) {
         demoFilters.income?.forEach(item => { // Add null check
           if (item.toLowerCase().includes(searchTermLower) && results.length < maxResults) {
             results.push({ id: `demographics:income:${item}`, name: item, type: 'demographics', path: ['Demographics', 'Income'] });
           }
         });
       }
      setDemographicResults(results);
    } else if (type === 'behaviors' && dataToSearch.behaviour_filters) {
      for (const category in dataToSearch.behaviour_filters) {
        dataToSearch.behaviour_filters[category]?.forEach(item => { // Add null check
          if (item.toLowerCase().includes(searchTermLower) && results.length < maxResults) {
            results.push({
              id: `behaviors:${category}:${item}`,
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
    const filterTypeKey = `${filter.type}_filters` as keyof TargetingFilters;
    const filterName = filter.name;

    setInternalFilters(prevFilters => {
      const updatedCategory = {
        ...(prevFilters[filterTypeKey] || {}),
        [filterName]: {
          id: filter.id,
          name: filterName,
          type: filter.type,
          path: filter.path
        } as FilterDetail
      };
      const newState = { ...prevFilters, [filterTypeKey]: updatedCategory };
      setTargetingFilters({ type: "custom", filters: newState });
      return newState;
    });

    if (filter.type === 'interest') { setInterestSearchTerm(''); setInterestResults([]); }
    if (filter.type === 'demographics') { setDemographicSearchTerm(''); setDemographicResults([]); }
    if (filter.type === 'behaviors') { setBehaviorSearchTerm(''); setBehaviorResults([]); }
   };

   const removeFilter = (type: 'interest' | 'demographics' | 'behaviors', filterName: string) => {
    const filterTypeKey = `${type}_filters` as keyof TargetingFilters;
    setInternalFilters(prevFilters => {
      const categoryFilters = { ...(prevFilters[filterTypeKey] || {}) };
      delete categoryFilters[filterName];
      const newState = { ...prevFilters, [filterTypeKey]: categoryFilters };
      setTargetingFilters({ type: "custom", filters: newState });
      return newState;
    });
  };

  // --- Helper to render filter list ---
  const renderFilterList = (
    filters: { [key: string]: FilterDetail } | undefined,
    type: 'interest' | 'demographics' | 'behaviors'
  ) => {
    // Show loading/error state for the list area as well
    if (isLoadingFilters) return <p className="text-sm text-text-light-gray italic">Loading filters...</p>;
    if (filtersError && (!filters || Object.keys(filters).length === 0)) return <p className="text-sm text-coral italic">Could not load filters.</p>; // Show error if list is empty due to error

    if (!filters || Object.keys(filters).length === 0) {
      return <p className="text-sm text-text-light-gray italic">No {type} filters selected.</p>; // Changed from gray-500
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
     // Keep isLoadingFilters check here to prevent dropdown during initial load
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
      <h3 className="text-lg font-semibold text-primary-green border-b border-border-dark pb-2 mb-4">Audience Targeting Filters</h3>

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
             disabled={!allFiltersData} // Disable input if data isn't loaded (redundant due to main loading check, but safe)
           />
            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
              <Search className="size-4 text-text-light-gray" />
            </div>
            {renderSearchResults(interestResults, interestSearchTerm)}
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
             disabled={!allFiltersData}
           />
            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
              <Search className="size-4 text-text-light-gray" />
            </div>
            {renderSearchResults(demographicResults, demographicSearchTerm)}
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
             disabled={!allFiltersData}
           />
            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
              <Search className="size-4 text-text-light-gray" />
            </div>
            {renderSearchResults(behaviorResults, behaviorSearchTerm)}
         </div>
         {renderFilterList(internalFilters.behaviour_filters, 'behaviors')}
       </div>
    </div>
  );
}
