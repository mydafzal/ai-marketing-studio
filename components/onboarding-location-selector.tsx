'use client'

import React, { useState, useCallback, useEffect } from 'react'
import { useT } from '@/lib/i18n/context'
import { Country, Region, City } from '@/lib/types'
import debounce from 'lodash/debounce'
import { MapPin, X, Search, Loader2, Globe, AlertCircle } from 'lucide-react'
import { ComboBox } from '@/components/ui/combo-box'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem
} from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { builQueryString } from '@/lib/utils'

export type LocationData = {
  country: {
    name: string;
    code: string;
  };
  regions: Array<{
    key: number;
    name: string;
    cities: Array<{
      key: number;
      name: string;
    }>;
  }>;
}[]

interface OnboardingLocationSelectorProps {
  locations: LocationData;
  setLocations: React.Dispatch<React.SetStateAction<LocationData>>;
}

type GeoLocation = {
  country: Country | null;
  region: Region | null;
  cities: City[];
  regionData: Region[];
  cityData: City[];
}

export default function OnboardingLocationSelector({
  locations,
  setLocations
}: OnboardingLocationSelectorProps) {
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [countryData, setCountryData] = useState<Country[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedGeoLocations, setSelectedGeoLocations] = useState<GeoLocation[]>([
    {
      country: null,
      region: null,
      cities: [],
      regionData: [],
      cityData: []
    }
  ]);

  const getCountryList = () => {
    const params = {
      type: 'adgeolocation',
      location_types: "['country']",
      limit: 300
    }
    fetch(`/api/fasty-bot/proxy-search${builQueryString(params)}`)
      .then(response => response.json())
      .then(data => {
        setCountryData((data?.data as Country[]) || [])
      })
      .catch(error => {
        console.error('Error fetching:', error)
      })
  }

  const getRegionList = async (countryCode: string): Promise<Region[]> => {
    const params = {
      type: 'adgeolocation',
      location_types: "['region']",
      country_code: countryCode,
      limit: 300,
    }
  
    try {
      const response = await fetch(`/api/fasty-bot/proxy-search${builQueryString(params)}`)
      const data = await response.json()
      return (data.data as Region[]) || []
    } catch (error) {
      console.error('Error fetching:', error)
      return []
    }
  }

  const getCityList = async (regionId: string, q: string) => {
    const params = {
      type: 'adgeolocation',
      location_types: "['city']",
      region_id: regionId,
      q,
      limit: 10
    }
    try {
      const response = await fetch(
        `/api/fasty-bot/proxy-search${builQueryString(params)}`
      )
      const data = (await response.json()) as any
      const cities = data.data.filter((e: any) => e?.type === 'city') as City[]
      return cities
    } catch (error) {
      console.error('Error fetching results:', error)
    }
    return []
  }

  const searchCity = useCallback(
    debounce(async (index: number, regionId: string, searchTerm: string) => {
      setLoading(true)
      try {
        console.log("[TEMPORARY DEBUG] Searching for city in region:", regionId, "with term:", searchTerm);
        const cities = await getCityList(regionId, searchTerm)
        console.log("[TEMPORARY DEBUG] City search results:", cities?.length || 0, "cities found");
        
        setSelectedGeoLocations((prev) =>
          prev.map((item, i) =>
            i === index
              ? {
                  ...item,
                  cityData: cities
                }
              : item
          )
        )
      } catch (error) {
        console.error('Error fetching city results:', error)
        setSelectedGeoLocations((prev) =>
          prev.map((item, i) =>
            i === index
              ? {
                  ...item,
                  cityData: []
                }
              : item
          )
        )
      } finally {
        setLoading(false)
      }
    }, 500),
    []
  )

  const handleSelectCity = useCallback((index: number, value: string) => {
    console.log("[TEMPORARY DEBUG] Selecting city with key:", value, "for location", index);
    
    const city = selectedGeoLocations[index]?.cityData?.find((e) => e.key === value);
    const exist = selectedGeoLocations[index]?.cities?.find((e) => e.key === value);
  
    console.log("[TEMPORARY DEBUG] Found city:", city?.name, "Already exists:", !!exist);
    
    if (city && !exist) {
      setSelectedGeoLocations((prev) => {
        const updated = prev.map((item, i) =>
          i === index
            ? {
                ...item,
                cities: [...item.cities, city],
                cityData: []
              }
            : item
        );
        
        console.log("[TEMPORARY DEBUG] After adding city:", 
          updated.map(loc => ({
            country: loc.country?.name || "No country",
            region: loc.region?.name || "No region",
            cities: loc.cities.map(c => c.name)
          }))
        );
        
        return updated;
      });
    } else {
      setSelectedGeoLocations((prev) =>
        prev.map((item, i) =>
          i === index
            ? {
                ...item,
                cityData: []
              }
            : item
        )
      );
    }
  }, [selectedGeoLocations])

  const handleRemoveCity = useCallback((index: number, value: string) => {
    console.log("[TEMPORARY DEBUG] Removing city with key:", value, "from location", index);
    
    setSelectedGeoLocations((prev) => {
      const updated = prev.map((item, i) =>
        i === index
          ? {
              ...item,
              cities: item.cities.filter(city => city.key !== value)
            }
          : item
      );
      
      console.log("[TEMPORARY DEBUG] After removing city:", 
        updated.map(loc => ({
          country: loc.country?.name || "No country",
          region: loc.region?.name || "No region", 
          cities: loc.cities.map(c => c.name)
        }))
      );
      
      return updated;
    });
  }, [])

  const handleChangeKeyword = (index: number, regionSelected: Region, value: string) => {
    if (regionSelected && value.length > 0) {
      searchCity(index, regionSelected.key, value)
    }
  }


  const handleRemoveCountry = (index: number) => {
    setSelectedGeoLocations((prev) => prev.filter((_, i) => i !== index))
  }

  const handleCountrySelect = async (index: number, country: Country | null) => {
    let regionData: Region[] = []
    if (country) {
      regionData = await getRegionList(country.country_code)
    }
    setSelectedGeoLocations((prev) =>
      prev.map((item, i) =>
        i === index
          ? {
              ...item,
              country,
              region: null,
              cities: [],
              regionData: regionData,
              cityData: []
            }
          : item
      )
    )
  }

  const handleRegionSelect = (index: number, region: Region | null) => {
    console.log("[TEMPORARY DEBUG] Setting region for location", index, ":", region?.name);
    
    setSelectedGeoLocations((prev) => {
      const updated = prev.map((item, i) =>
        i === index
          ? {
              ...item,
              region: region,
              cities: []
            }
          : item
      );
      
      console.log("[TEMPORARY DEBUG] After region selection:", 
        updated.map(loc => ({
          country: loc.country?.name || "No country",
          region: loc.region?.name || "No region",
          cities: loc.cities.length
        }))
      );
      
      return updated;
    });
  }

  // Search for locations (countries, regions, or cities) 
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<Array<{
    type: 'country' | 'region' | 'city',
    data: any
  }>>([]);
  const [isSearching, setIsSearching] = useState(false);

  const searchLocations = useCallback(
    debounce(async (term: string) => {
      if (!term || term.length < 2) {
        setSearchResults([]);
        return;
      }
      
      setIsSearching(true);
      
      try {
        // Search for countries
        const countryParams = {
          type: 'adgeolocation',
          location_types: "['country']", 
          q: term,
          limit: 5
        };
        
        // Search for regions
        const regionParams = {
          type: 'adgeolocation',
          location_types: "['region']",
          q: term,
          limit: 5
        };
        
        // Search for cities
        const cityParams = {
          type: 'adgeolocation',
          location_types: "['city']",
          q: term,
          limit: 5
        };
        
        // Run all searches in parallel
        const [countryResponse, regionResponse, cityResponse] = await Promise.all([
          fetch(`/api/fasty-bot/proxy-search${builQueryString(countryParams)}`).then(res => res.json()),
          fetch(`/api/fasty-bot/proxy-search${builQueryString(regionParams)}`).then(res => res.json()),
          fetch(`/api/fasty-bot/proxy-search${builQueryString(cityParams)}`).then(res => res.json())
        ]);
        
        const results = [
          ...(countryResponse?.data || []).map((country: Country) => ({ 
            type: 'country' as const, 
            data: country 
          })),
          ...(regionResponse?.data || []).map((region: Region) => ({ 
            type: 'region' as const, 
            data: region 
          })),
          ...(cityResponse?.data || []).filter((item: any) => item.type === 'city').map((city: City) => ({ 
            type: 'city' as const, 
            data: city 
          }))
        ];
        
        console.log("[TEMPORARY DEBUG] Search results:", {
          term: term,
          countriesFound: countryResponse?.data?.length || 0,
          regionsFound: regionResponse?.data?.length || 0,
          citiesFound: cityResponse?.data?.filter((item: any) => item.type === 'city')?.length || 0,
          totalResults: results.length
        });
        
        setSearchResults(results);
      } catch (error) {
        console.error('Error searching locations:', error);
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 500),
    []
  );

  // Handle the selection of a search result
  const handleSearchResultSelect = async (type: 'country' | 'region' | 'city', data: any) => {
    console.log("[TEMPORARY DEBUG] Search result selected:", type, data);
    
    if (type === 'country') {
      // Add a new location with this country
      const country = data as Country;
      console.log("[TEMPORARY DEBUG] Selected country from search:", country.name);
      
      // Check if this country already exists
      const countryIndex = selectedGeoLocations.findIndex(loc => 
        loc.country && loc.country.country_code === country.country_code
      );
      
      console.log("[TEMPORARY DEBUG] Country already exists at index?", countryIndex);
      
      if (countryIndex >= 0) {
        // Country already exists - do nothing as we don't want to overwrite
        console.log("[TEMPORARY DEBUG] Country already exists, not adding duplicate");
      } else {
        // Country doesn't exist - create a new entry
        const regionData = await getRegionList(country.country_code);
        
        const newLocation: GeoLocation = {
          country,
          region: null,
          cities: [],
          regionData,
          cityData: []
        };
        
        console.log("[TEMPORARY DEBUG] Adding new country:", country.name);
        
        // Create a copy of the current state and add the new location
        const newLocations = [...selectedGeoLocations, newLocation];
        
        // Set state with the updated locations
        setSelectedGeoLocations(newLocations);
      }
      
    } else if (type === 'region') {
      // Find or add the country first
      const region = data as Region;
      const countryCode = region.country_code;
      
      console.log("[TEMPORARY DEBUG] Selected region:", region.name);
      console.log("[TEMPORARY DEBUG] Region details:", {
        region: region.name,
        country: region.country_name,
        countryCode
      });
      
      // Find if we already have this country
      const countryIndex = selectedGeoLocations.findIndex(loc => 
        loc.country && loc.country.country_code === countryCode
      );
      
      console.log("[TEMPORARY DEBUG] Search result - found existing country index:", countryIndex);
      
      if (countryIndex >= 0) {
        // Country exists, add/update the region
        console.log("[TEMPORARY DEBUG] Updating existing country with region");
        
        // Get a copy of the current locations
        const updatedLocations = [...selectedGeoLocations];
        
        // Update the specific location with the new region
        updatedLocations[countryIndex] = {
          ...updatedLocations[countryIndex],
          region: region,
          cities: [] // Clear cities when selecting a new region
        };
        
        // Set state with the updated locations
        setSelectedGeoLocations(updatedLocations);
      } else {
        // Country doesn't exist, need to fetch it first
        console.log("[TEMPORARY DEBUG] Country doesn't exist, fetching data");
        const countryParams = {
          type: 'adgeolocation',
          location_types: "['country']",
          country_code: countryCode,
          limit: 1
        };
        
        try {
          const response = await fetch(`/api/fasty-bot/proxy-search${builQueryString(countryParams)}`);
          const data = await response.json();
          const countries = data?.data as Country[];
          
          if (countries && countries.length > 0) {
            const country = countries[0];
            const regionData = await getRegionList(country.country_code);
            
            console.log("[TEMPORARY DEBUG] Found country for region:", country.name);
            
            const newLocation: GeoLocation = {
              country,
              region,
              cities: [],
              regionData,
              cityData: []
            };
            
            console.log("[TEMPORARY DEBUG] Creating new location with region:", {
              country: country.name,
              region: region.name
            });
            
            // Create a copy of the current state and add the new location
            const newLocations = [...selectedGeoLocations, newLocation];
            
            // Set state with the updated locations directly
            setSelectedGeoLocations(newLocations);
          } else {
            // If we can't find the country via API, create a minimal one based on region data
            console.log("[TEMPORARY DEBUG] Creating fallback country from region data");
            
            const country: Country = {
              country_code: countryCode,
              key: countryCode,
              name: region.country_name,
              type: 'country',
              supports_city: true,
              supports_region: true
            };
            
            const newLocation: GeoLocation = {
              country,
              region,
              cities: [],
              regionData: [region], // Include the region we know about
              cityData: []
            };
            
            console.log("[TEMPORARY DEBUG] Creating new location with fallback country:", {
              country: country.name,
              region: region.name
            });
            
            // Create a copy of the current state and add the new location
            const newLocations = [...selectedGeoLocations, newLocation];
            
            // Set state with the updated locations directly
            setSelectedGeoLocations(newLocations);
          }
        } catch (error) {
          console.error('Error fetching country:', error);
          
          // Even on error, try to create a minimal country from the region data
          if (region.country_name) {
            console.log("[TEMPORARY DEBUG] Creating emergency fallback country from region data");
            
            const country: Country = {
              country_code: countryCode,
              key: countryCode,
              name: region.country_name,
              type: 'country',
              supports_city: true,
              supports_region: true
            };
            
            const newLocation: GeoLocation = {
              country,
              region,
              cities: [],
              regionData: [region],
              cityData: []
            };
            
            const newLocations = [...selectedGeoLocations, newLocation];
            setSelectedGeoLocations(newLocations);
          }
        }
      }
      
    } else if (type === 'city') {
      // For city selection, automatically add the entire hierarchy
      const city = data as City;
      const countryCode = city.country_code;
      const regionId = city.region_id;
      
      console.log("[TEMPORARY DEBUG] Selected city:", city.name);
      console.log("[TEMPORARY DEBUG] City details:", {
        city: city.name,
        country: city.country_name,
        countryCode,
        region: city.region,
        regionId
      });
      
      try {
        // APPROACH: Always create the full hierarchy - country, region, city
        
        // Step 1: Create or find the country
        let country: Country;
        let regionData: Region[] = [];
        
        // Try to find the country in the API first
        const countryParams = {
          type: 'adgeolocation',
          location_types: "['country']",
          country_code: countryCode,
          limit: 1
        };
        
        try {
          const response = await fetch(`/api/fasty-bot/proxy-search${builQueryString(countryParams)}`);
          const data = await response.json();
          const countries = data?.data as Country[];
          
          if (countries && countries.length > 0) {
            country = countries[0];
            console.log("[TEMPORARY DEBUG] Found country via API:", country.name);
            
            // Fetch the regions for this country
            regionData = await getRegionList(country.country_code);
            console.log("[TEMPORARY DEBUG] Fetched regions for country:", regionData.length);
          } else {
            // Create a minimal country if not found
            country = {
              country_code: countryCode,
              key: countryCode,
              name: city.country_name,
              type: 'country',
              supports_city: true,
              supports_region: true
            };
            console.log("[TEMPORARY DEBUG] Created fallback country:", country.name);
          }
        } catch (error) {
          console.error("Error fetching country:", error);
          // Create a minimal country if there's an error
          country = {
            country_code: countryCode,
            key: countryCode,
            name: city.country_name,
            type: 'country',
            supports_city: true,
            supports_region: true
          };
          console.log("[TEMPORARY DEBUG] Created error fallback country:", country.name);
        }
        
        // Step 2: Find or create the region
        let region: Region;
        
        // Try to find the region in the fetched region data
        if (regionData.length > 0) {
          const foundRegion = regionData.find(r => String(r.key) === String(regionId));
          if (foundRegion) {
            region = foundRegion;
            console.log("[TEMPORARY DEBUG] Found region in fetched data:", region.name);
          } else {
            // Create a minimal region if not found in fetched data
            region = {
              key: String(regionId),
              name: city.region,
              country_code: countryCode,
              country_name: city.country_name,
              type: 'region',
              supports_city: true,
              supports_region: true // Add missing property
            };
            console.log("[TEMPORARY DEBUG] Created fallback region (not found in data):", region.name);
          }
        } else {
          // Create a minimal region if we have no region data
          region = {
            key: String(regionId),
            name: city.region,
            country_code: countryCode,
            country_name: city.country_name,
            type: 'region',
            supports_city: true,
            supports_region: true // Add missing property
          };
          console.log("[TEMPORARY DEBUG] Created fallback region (no region data):", region.name);
          // Add this region to the region data
          regionData = [region];
        }
        
        // Step 3: Check if we already have this country in our selections
        const countryIndex = selectedGeoLocations.findIndex(loc => 
          loc.country && loc.country.country_code === countryCode
        );
        
        if (countryIndex >= 0) {
          console.log("[TEMPORARY DEBUG] Found existing country at index:", countryIndex);
          const locationWithRegion = selectedGeoLocations[countryIndex];
          
          // Check if this country already has this specific region
          if (locationWithRegion.region && String(locationWithRegion.region.key) === String(regionId)) {
            console.log("[TEMPORARY DEBUG] Country has matching region - adding city");
            
            // Check if the city already exists
            const cityExists = locationWithRegion.cities.some(c => 
              String(c.key) === String(city.key)
            );
            
            if (!cityExists) {
              console.log("[TEMPORARY DEBUG] Adding city to existing country+region");
              
              // Create a copy of the current state
              const updatedLocations = [...selectedGeoLocations];
              
              // Update the location with the new city
              updatedLocations[countryIndex] = {
                ...updatedLocations[countryIndex],
                cities: [...updatedLocations[countryIndex].cities, city]
              };
              
              // Update state
              setSelectedGeoLocations(updatedLocations);
            } else {
              console.log("[TEMPORARY DEBUG] City already exists, not adding");
            }
          } else {
            // Country exists but with a different region - create a new location
            console.log("[TEMPORARY DEBUG] Country exists but with different region - creating full hierarchy");
            
            // Create a new location with full hierarchy
            const newLocation: GeoLocation = {
              country,
              region,
              cities: [city],
              regionData: regionData.length > 0 ? regionData : [region],
              cityData: []
            };
            
            // Create a copy of the current state and add the new location
            const newLocations = [...selectedGeoLocations, newLocation];
            
            // Update state
            setSelectedGeoLocations(newLocations);
          }
        } else {
          // Country doesn't exist in our selections - create a complete new location
          console.log("[TEMPORARY DEBUG] Country not found in selections - creating full hierarchy");
          
          // Create a new location with full hierarchy
          const newLocation: GeoLocation = {
            country,
            region,
            cities: [city],
            regionData: regionData.length > 0 ? regionData : [region],
            cityData: []
          };
          
          console.log("[TEMPORARY DEBUG] Created new location with hierarchy:", {
            country: country.name,
            region: region.name,
            city: city.name
          });
          
          // Create a copy of the current state and add the new location
          const newLocations = [...selectedGeoLocations, newLocation];
          
          // Update state
          setSelectedGeoLocations(newLocations);
        }
      } catch (error) {
        console.error("Error in city selection handler:", error);
      }
    }
    
    // Clear search after selection
    setSearchTerm('');
    setSearchResults([]);
  };

  // Update search results when search term changes
  useEffect(() => {
    console.log("[TEMPORARY DEBUG] Search term changed:", searchTerm);
    if (searchTerm.length > 1) {
      console.log("[TEMPORARY DEBUG] Searching for:", searchTerm);
      searchLocations(searchTerm);
    } else {
      console.log("[TEMPORARY DEBUG] Search term too short, not searching");
      setSearchResults([]);
    }
  }, [searchTerm, searchLocations]);

  // This useEffect is specifically for debugging search results
  useEffect(() => {
    console.log("[TEMPORARY DEBUG] Search results updated:", 
      searchResults.length > 0 ? 
      `Found ${searchResults.length} results` : 
      "No results");
  }, [searchResults]);

  // Reference to track the last formatted locations to prevent unnecessary updates
  const lastFormattedRef = React.useRef<any>(null);
  
  // Update the parent locations state whenever selectedGeoLocations changes
  useEffect(() => {
    console.log("[TEMPORARY DEBUG] Formatting locations from:", selectedGeoLocations);
    
    // If there are no selected locations, ensure we keep at least an empty array
    if (selectedGeoLocations.length === 0) {
      console.log("[TEMPORARY DEBUG] No selected locations, keeping existing:", locations);
      return; // Don't update if there are no locations
    }
    
    // Group locations by country to preserve all regions
    const locationsByCountry = new Map();
    
    // First filter out invalid locations
    const formattedLocations = selectedGeoLocations
      .filter(loc => {
        // Only include locations that have a valid country
        return loc.country && loc.country.name && loc.country.country_code;
      })
      .map(loc => {
        // Create a properly formatted location object with detailed debug logging
        console.log("[TEMPORARY DEBUG] Formatting location with:", {
          country: loc.country?.name,
          region: loc.region?.name,
          cities: loc.cities.length
        });
        
        const formattedLocation = {
          country: {
            name: loc.country?.name || '',
            code: loc.country?.country_code || ''
          },
          // Always include at least an empty regions array
          regions: [] as Array<{
            key: number;
            name: string;
            cities: Array<{
              key: number;
              name: string;
            }>;
          }>
        };
        
        // If a region is selected, add it to the regions array with its cities
        if (loc.region) {
          const citiesList = loc.cities.map(city => {
            // Ensure city keys are correctly converted to numbers
            const cityObj = {
              key: typeof city.key === 'string' ? Number(city.key) || 0 : city.key,
              name: city.name
            };
            console.log("[TEMPORARY DEBUG] Formatting city:", cityObj);
            return cityObj;
          });
          
          const regionObj = {
            key: typeof loc.region.key === 'string' ? Number(loc.region.key) || 0 : loc.region.key,
            name: loc.region.name,
            cities: citiesList
          };
          
          console.log("[TEMPORARY DEBUG] Formatting region with cities:", {
            region: regionObj.name,
            cities: citiesList.map(c => c.name)
          });
          
          formattedLocation.regions = [regionObj];
        }
        
        console.log("[TEMPORARY DEBUG] Formatted location:", formattedLocation);
        return formattedLocation;
      });
    
    // Make sure we don't return an empty array if we had locations before
    if (formattedLocations.length === 0 && locations && locations.length > 0) {
      console.log("[TEMPORARY DEBUG] Keeping existing locations instead of empty array");
      return; // Don't update with empty array
    }

    // Validate that the format matches the required schema
    const validFormat = formattedLocations.every(loc => 
      // Check country has name and code
      typeof loc.country.name === 'string' && 
      typeof loc.country.code === 'string' &&
      // Check regions is an array
      Array.isArray(loc.regions)
    );

    if (!validFormat) {
      console.error('Location data format does not match required schema!');
      return; // Don't save invalid format
    }
    
    // Compare with the last formatted locations to avoid unnecessary updates
    // this helps prevent flickering by avoiding re-renders when not needed
    const currentFormatted = JSON.stringify(formattedLocations);
    const lastFormatted = lastFormattedRef.current;
    
    if (lastFormatted === currentFormatted) {
      console.log("[TEMPORARY DEBUG] Skipping update - no changes to formatted locations");
      return;
    }
    
    // Update our ref with the new formatted locations
    lastFormattedRef.current = currentFormatted;
    
    console.log("[TEMPORARY DEBUG] Final formatted locations:", formattedLocations);
    
    // Direct state update - no timeout needed with the stringified comparison check
    setLocations(formattedLocations);
  }, [selectedGeoLocations, setLocations, locations]);

  // Initialize with existing locations if provided
  useEffect(() => {
    getCountryList();
  }, []); // Only fetch country list once on mount

  // Track if we've already loaded locations to prevent reloading
  const [hasLoadedLocations, setHasLoadedLocations] = useState(false);
  
  // Separate effect to handle loading saved locations
  useEffect(() => {
    if (countryData.length === 0) {
      return; // Exit if we don't have country data yet
    }
    
    // Skip if we already loaded locations once, to prevent reloading
    // and potentially losing user changes during the onboarding flow
    if (hasLoadedLocations) {
      console.log("[TEMPORARY DEBUG] Skipping location reload - already loaded once");
      return;
    }

    // If locations is an empty array, we still need to handle it properly
    console.log("[TEMPORARY DEBUG] Loading saved locations:", locations);
    
    // If locations is missing or empty, don't try to process it
    if (!locations || (Array.isArray(locations) && locations.length === 0)) {
      console.log("[TEMPORARY DEBUG] No locations to load, setting default empty location");
      
      // Create an empty location state (without default country)
      const emptyLocation = {
        country: null,
        region: null,
        cities: [],
        regionData: [],
        cityData: []
      };
      
      setSelectedGeoLocations([emptyLocation]);
      setHasLoadedLocations(true);
      return;
    }
    
    // Convert the locations data to the internal GeoLocation format
    const loadSavedLocations = async () => {
      console.log("[TEMPORARY DEBUG] loadSavedLocations called with locations:", locations);
      
      const initialLocations: GeoLocation[] = [];

      // Store processed locations by country code to prevent duplicates
      const processedCountries = new Set();
        
      for (const location of locations) {
        console.log("[TEMPORARY DEBUG] Processing location:", location);
        
        // Validate the location format matches our expected structure
        if (!location.country || !location.country.code || !location.country.name) {
          console.error("[TEMPORARY DEBUG] Invalid location format - missing country data:", location);
          continue;
        }
        
        // Skip duplicate countries - this is the key fix
        if (processedCountries.has(location.country.code)) {
          console.log("[TEMPORARY DEBUG] Skipping duplicate country:", location.country.code);
          continue;
        }
        
        // Mark this country as processed to avoid duplicates
        processedCountries.add(location.country.code);

        // Find country in the fetched data or create it
        let countryObj = countryData.find(c => c.country_code === location.country.code);
        console.log("[TEMPORARY DEBUG] Found country in data:", countryObj);
        
        // If country not found in fetched data, create it manually
        if (!countryObj) {
          countryObj = {
            country_code: location.country.code,
            key: location.country.code,
            name: location.country.name,
            type: 'country',
            supports_city: true,
            supports_region: true
          };
          console.log("[TEMPORARY DEBUG] Created manual country:", countryObj);
        }
          
        // Fetch regions for this country
        const regionData = await getRegionList(countryObj.country_code);
        console.log("[TEMPORARY DEBUG] Fetched regions for", countryObj.name, ":", regionData.length);
        
        const newLocation: GeoLocation = {
          country: countryObj,
          region: null,
          cities: [],
          regionData,
          cityData: []
        };

        // Process regions if they exist
        if (location.regions && location.regions.length > 0) {
          console.log("[TEMPORARY DEBUG] Processing regions:", location.regions);
          const region = location.regions[0];
          
          // Validate region format
          if (typeof region.key !== 'number' && region.name) {
            console.error("[TEMPORARY DEBUG] Invalid region key format, trying to fix:", region);
            region.key = Number(region.key) || 0;
          }
          
          if (!region.name) {
            console.error("[TEMPORARY DEBUG] Invalid region format - missing name:", region);
            initialLocations.push(newLocation);
            continue;
          }
          
          // Find region in the fetched region data
          let regionObj = regionData.find(r => String(r.key) === String(region.key));
          
          // If region not found by key, try to find by name as a fallback
          if (!regionObj) {
            regionObj = regionData.find(r => r.name === region.name);
          }
          
          // If still not found, create a manual region object
          if (!regionObj && region.name) {
            regionObj = {
              key: String(region.key),
              name: region.name,
              country_code: countryObj.country_code,
              country_name: countryObj.name,
              type: 'region',
              supports_city: true,
              supports_region: true // Add missing property
            };
            console.log("[TEMPORARY DEBUG] Created manual region:", regionObj);
          }
          
          if (regionObj) {
            newLocation.region = regionObj;
            
            // Process cities if they exist
            if (region.cities && region.cities.length > 0) {
              console.log("[TEMPORARY DEBUG] Processing cities:", region.cities);
              // Create city objects with the required structure
              newLocation.cities = region.cities.map(city => {
                // Validate city format and try to fix
                if (typeof city.key !== 'number' && city.name) {
                  console.log("[TEMPORARY DEBUG] Invalid city key format, trying to fix:", city);
                  city.key = Number(city.key) || 0;
                }
                
                if (!city.name) {
                  console.error("[TEMPORARY DEBUG] Invalid city format - missing name:", city);
                  return null;
                }
                
                const cityObj = {
                  key: String(city.key),
                  name: city.name,
                  type: 'city',
                  country_code: countryObj.country_code,
                  country_name: countryObj.name,
                  region: regionObj.name,
                  region_id: regionObj.key,
                  supports_city: true,
                  supports_region: true
                };
                console.log("[TEMPORARY DEBUG] Created city object:", cityObj);
                return cityObj;
              }).filter(city => city !== null) as City[];
            }
          }
        }
        
        // Add this location to our list
        initialLocations.push(newLocation);
        console.log("[TEMPORARY DEBUG] Added location to initialLocations:", {
          country: newLocation.country?.name,
          code: newLocation.country?.country_code
        });
      }

      if (initialLocations.length > 0) {
        console.log("[TEMPORARY DEBUG] Setting initial locations:", initialLocations);
        setSelectedGeoLocations(initialLocations);
      } else {
        console.log("[TEMPORARY DEBUG] No valid locations found to set, creating default empty location");
        
        // Create an empty location state (without default country)
        const emptyLocation = {
          country: null,
          region: null,
          cities: [],
          regionData: [],
          cityData: []
        };
        
        setSelectedGeoLocations([emptyLocation]);
      }
      
      // Mark that we've loaded locations once
      setHasLoadedLocations(true);
      
      console.log("[TEMPORARY DEBUG] Finished loading saved locations");
    };

    console.log("[TEMPORARY DEBUG] About to call loadSavedLocations function");
    // Call the function to load saved locations
    loadSavedLocations();
  }, [countryData.length, locations, getRegionList, hasLoadedLocations]);

  const t = useT();

  return (
    <div className="space-y-6">
      <div className="space-y-2 mb-4">
        <h3 className="text-lg font-semibold text-white">{t('onboarding.fields.preferredLocations')}</h3>
        <p className="text-gray-400 text-sm">
          {t('onboarding.fields.preferredLocationsDescription')}
        </p>
      </div>
      
      {/* Universal location search */}
      <div className="space-y-2 mb-6">
        <Label className="text-gray-300">{t('forms.searchLocations')}</Label>
        <div className="relative">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={t('forms.searchPlaceholder')}
            className="w-full px-3 py-2 pl-10 rounded-lg text-sm transition-colors duration-200 bg-[#151925] border border-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#4BF29C] dark:focus:ring-offset-[#0F1117]"
          />
          <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
            <Search className="size-4 text-gray-400" />
          </div>
          {isSearching && (
            <div className="absolute inset-y-0 right-0 flex items-center pr-3">
              <Loader2 className="size-4 text-gray-400 animate-spin" />
            </div>
          )}
        </div>
        
        {/* Search results dropdown - always show when user is typing */}
        {searchTerm.length > 1 && (
          <div
            className="absolute z-10 mt-1 w-full max-w-md min-w-[250px] bg-[#1A1D29] border border-gray-700 rounded-lg shadow-lg max-h-60 overflow-auto"
            style={{ right: 'auto' }}
          >
            <div className="py-1">
              {/* Show loading indicator while searching */}
              {isSearching && (
                <div className="px-4 py-2 text-sm text-gray-400 flex items-center">
                  <Loader2 className="size-4 mr-2 animate-spin" />
                  Searching...
                </div>
              )}
              
              {/* Show no results message when search is complete but no results found */}
              {!isSearching && searchResults.length === 0 && (
                <div className="px-4 py-2 text-sm text-gray-400">No results found</div>
              )}
              
              {/* Map through and display any results */}
              {searchResults.map((result, i) => {
                let icon;
                let label = '';
                let details = '';
                
                if (result.type === 'country') {
                  icon = <Globe className="size-4 text-[#4BF29C]" />;
                  label = result.data.name;
                } else if (result.type === 'region') {
                  icon = <MapPin className="size-4 text-[#4BF29C]" />;
                  label = result.data.name;
                  details = `${result.data.country_name}`;
                } else if (result.type === 'city') {
                  icon = <MapPin className="size-4 text-[#4BF29C]" />;
                  label = result.data.name;
                  details = `${result.data.region}, ${result.data.country_name}`;
                }
                
                return (
                  <button
                    type="button"
                    key={`${result.type}-${i}`}
                    className="w-full text-left px-4 py-2 text-sm hover:bg-[#2A2E3A] flex items-center text-white"
                    onClick={() => handleSearchResultSelect(result.type, result.data)}
                  >
                    <span className="mr-2">{icon}</span>
                    <div>
                      <div className="font-medium">{label}</div>
                      {details && <div className="text-xs text-gray-400">{details}</div>}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
      
      {/* Selected locations summary */}
      {selectedGeoLocations.filter(loc => loc.country).length > 0 && (
        <div className="mb-4">
          <Label className="text-gray-300 mb-2 block">Selected Locations</Label>
          <div className="flex flex-wrap gap-2">
            {selectedGeoLocations
              .filter(loc => loc.country)
              .map((loc, idx) => {
                let locationText = loc.country?.name || '';
                if (loc.region) {
                  locationText += ` › ${loc.region.name}`;
                  if (loc.cities.length > 0) {
                    locationText += ` (${loc.cities.length} ${loc.cities.length === 1 ? 'city' : 'cities'})`;
                  }
                }
                
                return (
                  <div 
                    key={idx} 
                    className="bg-[#1A1D29] border border-gray-700 text-white text-xs px-3 py-2 rounded-lg flex items-center gap-2"
                  >
                    <MapPin className="size-3 text-[#4BF29C]" />
                    <span>{locationText}</span>
                    <button 
                      type="button"
                      onClick={() => handleRemoveCountry(idx)}
                      className="text-gray-400 hover:text-white ml-1"
                    >
                      <X className="size-3" />
                    </button>
                  </div>
                );
              })}
          </div>
        </div>
      )}

      {/* Selected locations detail */}
      {selectedGeoLocations.filter(loc => loc.country).map((geoLocation, index) => (
        <Card key={index} className="bg-[#1A1D29] border-gray-700">
          <CardContent className="pt-6">
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <Label className="text-white">
                  {geoLocation.country?.name}
                  {geoLocation.region && ` › ${geoLocation.region.name}`}
                </Label>
                <Button
                  variant="ghost"
                  size="icon"
                  disabled={isSubmitting}
                  onClick={() => handleRemoveCountry(index)}
                  className="size-8 text-gray-400 hover:text-white"
                >
                  <X className="size-4" />
                </Button>
              </div>

              <div className="space-y-4">
                {geoLocation.cities.length > 0 && (
                  <div className="space-y-2">
                    <div className="flex flex-wrap gap-2 mt-2">
                      {geoLocation.cities.map(city => (
                        <div 
                          key={city.key} 
                          className="bg-[#2A2E3A] text-white text-xs px-2 py-1 rounded flex items-center gap-1"
                        >
                          <span>{city.name}</span>
                          <button 
                            type="button"
                            onClick={() => handleRemoveCity(index, city.key)}
                            className="text-gray-400 hover:text-white"
                          >
                            <X className="size-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      ))}

      {/* Debug data is now hidden */}
    </div>
  )
}