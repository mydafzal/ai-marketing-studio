'use client'

import React, { useState, useCallback, useEffect, useRef } from 'react'
import { Country, Region, City } from '@/lib/types'
import debounce from 'lodash/debounce'
import { MapPin, Plus, X, Search, Loader2, Globe } from 'lucide-react'
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

interface AudienceLocationSelectorProps {
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

// Initial empty state placeholder
const initialEmptyLocation: GeoLocation = {
  country: null,
  region: null,
  cities: [],
  regionData: [],
  cityData: []
};


export default function AudienceLocationSelector({
  locations,
  setLocations
}: AudienceLocationSelectorProps) {
  // Removed isSubmitting state
  const [countryData, setCountryData] = useState<Country[]>([]);
  const [loading, setLoading] = useState(false);
    const [selectedGeoLocations, setSelectedGeoLocations] = useState<GeoLocation[]>([initialEmptyLocation]);

  const getCountryList = () => {
    const params = {
      type: 'adgeolocation',
      location_types: "['country']",
      limit: 300
    }
    console.log("Called in Country")
    fetch(`/api/fasty-bot/proxy-search${builQueryString(params)}`)
      .then(response => response.json())
      .then(data => {
        setCountryData((data?.data as Country[]) || [])
      })
      .catch(error => {
        console.error('Error fetching:', error)
      })
  }

  const getRegionList = useCallback(async (countryCode: string): Promise<Region[]> => {
    const params = {
      type: 'adgeolocation',
      location_types: "['region']",
      country_code: countryCode,
      limit: 300,
    }

    try {
      console.log("Called in region")
      const response = await fetch(`/api/fasty-bot/proxy-search${builQueryString(params)}`)
      const data = await response.json()
      return (data.data as Region[]) || []
    } catch (error) {
      console.error('Error fetching:', error)
      return []
    }
  }, []);

  const getCityList = async (regionId: string, q: string) => {
    const params = {
      type: 'adgeolocation',
      location_types: "['city']",
      region_id: regionId,
      q,
      limit: 10
    }
    try {
    console.log("Called in City")
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

  // Removed unused handlers: searchCity, handleSelectCity, handleRemoveCity, handleChangeKeyword, handleAddCountry, handleCountrySelect, handleRegionSelect

  const handleRemoveCountry = (indexToRemove: number) => {
    const updatedLocations = selectedGeoLocations.filter((_, i) => i !== indexToRemove);
    setSelectedGeoLocations(updatedLocations);
    // Update parent state after removal
    setLocations(formatLocationsForParent(updatedLocations));
  }

  // Search for locations (countries, regions, or cities)
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<Array<{
    type: 'country' | 'region' | 'city',
    data: any
  }>>([]);
  const [isSearching, setIsSearching] = useState(false);

  // Create a ref to track if the component is mounted
  const isMountedRef = React.useRef(true);

  // Set isMounted to false when component unmounts
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // Create a ref to store the previous search term to avoid duplicate searches
  const prevSearchTermRef = useRef<string>('');

  const searchLocations = useCallback(
    debounce(async (term: string) => {
      // Don't search if component is unmounted, term is too short, or term is the same as previous search
      if (!isMountedRef.current || !term || term.length < 2 || term === prevSearchTermRef.current) {
        if (!term || term.length < 2) {
          setSearchResults([]);
        }
        return;
      }

      // Store the current term as the previous term to avoid duplicate searches
      prevSearchTermRef.current = term;

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
        console.log("Called in sesarchLocations callback")

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
        if (isMountedRef.current) {
           setIsSearching(false);
        }
      }
    }, 500),
    []
  );

  // Handle the selection of a search result
  const handleSearchResultSelect = async (type: 'country' | 'region' | 'city', data: any) => {
    console.log("[TEMPORARY DEBUG] Search result selected:", type, data);

    // TODO: This logic needs to ADD to the existing selectedGeoLocations, not replace it.
    // It should also handle merging/updating if a country/region already exists.
    // And finally, call setLocations with the formatted result.

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

        // Filter out the initial empty placeholder *before* adding the new one
        const currentValidLocations = selectedGeoLocations.filter(loc => loc.country);
        const newLocations = [...currentValidLocations, newLocation];

        // Set state with the updated locations
        setSelectedGeoLocations(newLocations);
        // Update parent state
        setLocations(formatLocationsForParent(newLocations));
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

      // Check if this specific Country + Region combination already exists
      const existingLocationIndex = selectedGeoLocations.findIndex(loc =>
        loc.country?.country_code === countryCode &&
        loc.region && String(loc.region.key) === String(region.key) // Compare keys as strings
      );

      if (existingLocationIndex >= 0) {
        console.log("[TEMPORARY DEBUG] Exact Country+Region combination already selected. Doing nothing.");
      } else {
        // Combination doesn't exist, create a new entry for this specific Country+Region
        console.log("[TEMPORARY DEBUG] Country+Region combo not selected. Fetching data and adding new entry.");
        const countryParams = {
          type: 'adgeolocation',
          location_types: "['country']",
          country_code: countryCode,
          limit: 1
        };

        try {
          console.log("Called in Handle searchResultSelect")
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

            // Filter out the initial empty placeholder *before* adding the new one
            const currentValidLocations = selectedGeoLocations.filter(loc => loc.country);
            const newLocations = [...currentValidLocations, newLocation];

            // Set state with the updated locations directly
            setSelectedGeoLocations(newLocations);
            // Update parent state
            setLocations(formatLocationsForParent(newLocations));
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

            // Filter out the initial empty placeholder *before* adding the new one
            const currentValidLocations = selectedGeoLocations.filter(loc => loc.country);
            const newLocations = [...currentValidLocations, newLocation];

            // Set state with the updated locations directly
            setSelectedGeoLocations(newLocations);
            // Update parent state
            setLocations(formatLocationsForParent(newLocations));
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

             // Filter out the initial empty placeholder *before* adding the new one
            const currentValidLocations = selectedGeoLocations.filter(loc => loc.country);
            const newLocations = [...currentValidLocations, newLocation];
            setSelectedGeoLocations(newLocations);
            // Update parent state
            setLocations(formatLocationsForParent(newLocations));
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
          console.log("Called in Handle searchResultSelect:631" )
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

        // Step 3: Check if an entry for this specific Country + Region combination already exists
         const existingLocationIndex = selectedGeoLocations.findIndex(loc =>
            loc.country?.country_code === countryCode &&
            loc.region && String(loc.region.key) === String(region.key) // Compare keys as strings
         );

        if (existingLocationIndex >= 0) {
          // Exact Country+Region exists, add the city to this specific entry if it's not already there
          console.log("[TEMPORARY DEBUG] Found existing Country+Region entry at index:", existingLocationIndex);
          const existingEntry = selectedGeoLocations[existingLocationIndex];
          const cityExists = existingEntry.cities.some(c => String(c.key) === String(city.key)); // Compare keys as strings

          if (!cityExists) {
            console.log("[TEMPORARY DEBUG] Adding city to existing Country+Region entry:", city.name);
            // Create updated locations immutably
            const updatedLocations = selectedGeoLocations.map((loc, index) => {
              if (index === existingLocationIndex) {
                // Add the new city to the existing cities array
                return {
                  ...loc,
                  cities: [...loc.cities, city]
                };
              }
              return loc;
            });
            setSelectedGeoLocations(updatedLocations);
            setLocations(formatLocationsForParent(updatedLocations));
          } else {
            console.log("[TEMPORARY DEBUG] City already exists in this specific Country+Region entry. Not adding.");
          }
        } else {
          // Country+Region combo doesn't exist, create a new entry for it including this city
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

           // Filter out the initial empty placeholder *before* adding the new one
           const currentValidLocations = selectedGeoLocations.filter(loc => loc.country);
           const newLocations = [...currentValidLocations, newLocation];

          // Update state
          setSelectedGeoLocations(newLocations);
          // Update parent state
          setLocations(formatLocationsForParent(newLocations));
        }
      } catch (error) {
        console.error("Error in city selection handler:", error);
      }
    }

    // Clear search after selection
    setSearchTerm('');
    setSearchResults([]);
  };

  // Update search results ONLY when search term changes and is typed by user
  // This prevents unnecessary API calls when component mounts or re-renders
  const handleSearchTermChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTerm = e.target.value;
    setSearchTerm(newTerm);

    console.log("[TEMPORARY DEBUG] Search term changed:", newTerm);
    if (newTerm.length > 1) {
      console.log("[TEMPORARY DEBUG] Searching for:", newTerm);
      searchLocations(newTerm);
    } else {
      console.log("[TEMPORARY DEBUG] Search term too short, not searching");
      setSearchResults([]);
    }
  };

  // Remove the useEffect that was watching searchTerm changes
  // This prevents unnecessary API calls on component mount/render

  // This useEffect is specifically for debugging search results
  useEffect(() => {
    console.log("[TEMPORARY DEBUG] Search results updated:",
      searchResults.length > 0 ?
      `Found ${searchResults.length} results` :
      "No results");
  }, [searchResults]);

  // Removed handleSave function as saving is handled by the parent

  // Function to format GeoLocation[] (internal state) to LocationData[] (parent state)
  const formatLocationsForParent = (geoLocations: GeoLocation[]): LocationData => {
      const countryMap = new Map<string, LocationData[0]>();

      // Iterate through each selected GeoLocation entry
      geoLocations
          .filter(loc => loc.country) // Ensure there's a country
          .forEach(loc => {
              const countryCode = loc.country!.country_code;
              const countryName = loc.country!.name;

              // Get or create the entry for this country in the map
              if (!countryMap.has(countryCode)) {
                  countryMap.set(countryCode, {
                      country: { name: countryName, code: countryCode },
                      regions: [],
                  });
              }
              const countryEntry = countryMap.get(countryCode)!;

              // If this GeoLocation entry has a region, add it to the country's regions list
              if (loc.region) {
                  const regionKey = String(loc.region.key);
                  // Check if this region (by key) is already in the list for this country
                  const regionExists = countryEntry.regions.some(r => String(r.key) === regionKey);

                  if (!regionExists) {
                      // Add the new region and its cities
                      countryEntry.regions.push({
                          key: Number(regionKey) || 0, // Convert key back to number
                          name: loc.region.name,
                          cities: loc.cities.map(city => ({
                              key: Number(city.key) || 0, // Convert key back to number
                              name: city.name,
                          })),
                      });
                  }
                  // If region already exists, we assume cities were correctly added
                  // to the specific GeoLocation entry by handleSearchResultSelect
              }
          });

      // Convert the map values back to an array
      return Array.from(countryMap.values());
  };

  // Initialize with existing locations if provided
  useEffect(() => {
    getCountryList();
  }, []); // Only fetch country list once on mount

  // Effect to load locations from props
  useEffect(() => {
    if (countryData.length === 0) {
      console.log("[TEMPORARY DEBUG] Waiting for country data before loading locations...");
      return; // Exit if we don't have country data yet
    }

    // Define loadSavedLocations function here so it's accessible later
    const loadSavedLocations = async () => {
      console.log("[TEMPORARY DEBUG] loadSavedLocations called with locations prop:", locations);
      const initialInternalLocations: GeoLocation[] = [];

      for (const inputLocation of locations) {
        console.log("[TEMPORARY DEBUG] Processing input location:", inputLocation.country.name);

        // Validate the location format
        if (!inputLocation.country || !inputLocation.country.code || !inputLocation.country.name) {
          console.error("[TEMPORARY DEBUG] Invalid input location format - missing country data:", inputLocation);
          continue;
        }

        // Find country in the fetched data or create it
        let countryObj = countryData.find(c => c.country_code === inputLocation.country.code);
        console.log("[TEMPORARY DEBUG] Found country in fetched data:", countryObj?.name);

        // If country not found in fetched data, create it manually from prop data
        if (!countryObj) {
          countryObj = {
            country_code: inputLocation.country.code,
            key: inputLocation.country.code, // Use code as key if needed
            name: inputLocation.country.name,
            type: 'country', // Assume type
            supports_city: true, // Assume support
            supports_region: true // Assume support
          };
          console.log("[TEMPORARY DEBUG] Created manual country from prop:", countryObj.name);
        }

        // Fetch ALL regions for this country ONCE
        const allRegionsForCountry = await getRegionList(countryObj.country_code);
        console.log(`[TEMPORARY DEBUG] Fetched ${allRegionsForCountry.length} regions for ${countryObj.name}`);

        // If the input location has regions, create a separate internal entry for each
        if (inputLocation.regions && inputLocation.regions.length > 0) {
          console.log(`[TEMPORARY DEBUG] Processing ${inputLocation.regions.length} regions from prop for ${countryObj.name}`);
          for (const inputRegion of inputLocation.regions) {
            // Validate region format from prop
             if (typeof inputRegion.key !== 'number' && inputRegion.name) {
               console.warn("[TEMPORARY DEBUG] Invalid region key format from prop, trying to fix:", inputRegion);
               inputRegion.key = Number(inputRegion.key) || 0; // Attempt conversion
             }
             if (!inputRegion.name) {
               console.error("[TEMPORARY DEBUG] Invalid region format from prop - missing name:", inputRegion);
               continue; // Skip this invalid region
             }

            // Find the full region object from the fetched list
            let regionObj = allRegionsForCountry.find(r => String(r.key) === String(inputRegion.key));

            // If not found by key, try by name (less reliable)
            if (!regionObj) {
                regionObj = allRegionsForCountry.find(r => r.name === inputRegion.name);
                if(regionObj) console.warn(`[TEMPORARY DEBUG] Found region ${inputRegion.name} by name, not key.`);
            }

            // If still not found, create a minimal region object from prop data
            if (!regionObj) {
              regionObj = {
                key: String(inputRegion.key),
                name: inputRegion.name,
                country_code: countryObj.country_code,
                country_name: countryObj.name,
                type: 'region', // Assume type
                supports_city: true, // Assume support
                supports_region: true // Assume support
              };
              console.warn("[TEMPORARY DEBUG] Created manual region from prop data:", regionObj.name);
            }

            // Create City objects from prop data
            const citiesForThisRegion = (inputRegion.cities || []).map(inputCity => {
               if (typeof inputCity.key !== 'number' && inputCity.name) {
                 console.warn("[TEMPORARY DEBUG] Invalid city key format from prop, trying to fix:", inputCity);
                 inputCity.key = Number(inputCity.key) || 0; // Attempt conversion
               }
               if (!inputCity.name) {
                 console.error("[TEMPORARY DEBUG] Invalid city format from prop - missing name:", inputCity);
                 return null; // Skip invalid city
               }
               // Create a full City object structure
               return {
                 key: String(inputCity.key),
                 name: inputCity.name,
                 type: 'city', // Assume type
                 country_code: countryObj.country_code,
                 country_name: countryObj.name,
                 region: regionObj.name,
                 region_id: regionObj.key,
                 // Add other potential fields if needed, assuming defaults/true for support flags
                 supports_city: true,
                 supports_region: true
               };
            }).filter(city => city !== null) as City[];

            // Create a distinct internal GeoLocation entry for this Country+Region
            const internalEntry: GeoLocation = {
              country: countryObj,
              region: regionObj,
              cities: citiesForThisRegion,
              regionData: allRegionsForCountry, // Store all fetched regions for potential dropdowns later
              cityData: [] // City data is usually fetched on demand
            };
            initialInternalLocations.push(internalEntry);
            console.log(`[TEMPORARY DEBUG] Added internal entry for: ${countryObj.name} > ${regionObj.name} (${citiesForThisRegion.length} cities)`);
          }
        } else {
           // If input location has no regions, it represents just the country
           console.log(`[TEMPORARY DEBUG] Input location for ${countryObj.name} has no regions. Adding country-only entry.`);
           const internalEntry: GeoLocation = {
             country: countryObj,
             region: null,
             cities: [],
             regionData: allRegionsForCountry,
             cityData: []
           };
           initialInternalLocations.push(internalEntry);
        }
      } // End loop through input locations

      // Set the initial state based on the processed props
      if (initialInternalLocations.length > 0) {
        console.log("[TEMPORARY DEBUG] Setting initial internal state:", initialInternalLocations);
        setSelectedGeoLocations(initialInternalLocations);
      } else {
        console.log("[TEMPORARY DEBUG] No valid locations found in props, setting default empty internal state");

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

      // setHasLoadedLocations(true); // Removed this flag

      console.log("[TEMPORARY DEBUG] Finished loading locations from props");
    };

    // Define emptyLocation here so it's accessible later
    const emptyLocation = {
      country: null,
      region: null,
      cities: [],
      regionData: [],
      cityData: []
    };

    // If locations is an empty array, handle it properly
    console.log("[TEMPORARY DEBUG] Loading locations from props:", locations);

    // If locations is missing or empty, don't try to process it
    if (!locations || (Array.isArray(locations) && locations.length === 0)) {
      console.log("[TEMPORARY DEBUG] No locations to load, setting default empty location");
      setSelectedGeoLocations([emptyLocation]);
      // setHasLoadedLocations(true); // Removed this flag
      return;
    }

    console.log("[TEMPORARY DEBUG] About to call loadSavedLocations function");
    // Call the function to load locations from props
    loadSavedLocations();
  }, [countryData.length, locations, getRegionList]); // Removed hasLoadedLocations from dependencies

  return (
    <div className="space-y-6">
      <div className="space-y-2 mb-4">
        <h3 className="text-lg font-semibold text-white">Preferred Locations</h3>
        <p className="text-gray-400 text-sm">
          Select the locations where you frequently advertise. This helps our AI create more targeted campaigns.
        </p>
      </div>

      {/* Universal location search */}
      <div className="space-y-2 mb-6">
        <Label className="text-gray-300">Search Locations</Label>
        <div className="relative">
          <input
            type="text"
            value={searchTerm}
            onChange={handleSearchTermChange}
            placeholder="Search for countries, regions, or cities..."
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
          <div className="absolute z-10 mt-1 w-full bg-[#1A1D29] border border-gray-700 rounded-lg shadow-lg max-h-60 overflow-auto">
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

      {/* Removed detailed location cards */}

      {/* Removed Save Button as parent handles saving */}

      {/* Debug data is now hidden */}
    </div>
  )
}
