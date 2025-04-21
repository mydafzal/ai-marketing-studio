'use client'

import { ToolContent } from 'ai';
import { readStreamableValue, useActions, useAIState, useUIState } from 'ai/rsc'
import debounce from 'lodash/debounce'
import * as React from 'react'
import { useState, useCallback, useContext, useEffect } from 'react'
import { toast } from 'sonner'
import { SearchableSelect } from '@/components/ui/searchable-select'
import { MapPin, Users, X, Plus, ChevronDown } from 'lucide-react'
import { CampaignContext } from '@/components/contexts/campaign-context'
import { GeographicalLocationResult } from '@/components/geographical-location-result'
import { IconSpinner } from '@/components/ui/icons'
import { builQueryString } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { ComboBox } from '@/components/ui/combo-box'
import { Label } from '@/components/ui/label'
import { RangeSlider } from '@/components/range-slider'
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem
} from '@/components/ui/select'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { type AI } from '@/lib/chat/AIManager'
import { Adset, AdsetTargeting, Country, Region, City, Message } from '@/lib/types'

interface GeoGraphicalLocationProps {
  toolCallId: string
  uiProps?: {
    demographicData: {
      [key: string]: any
    }
    success: boolean
  }
  isReadOnly?: boolean
}

type GeoLocation = {
  country: Country | null
  region: Region | null
  cities: City[]
  regionData: Region[]
  cityData: City[]
}

export function GeographicalLocation({
  toolCallId,
  uiProps,
  isReadOnly
}: GeoGraphicalLocationProps) {
  const { adset, setAdset } = useContext(CampaignContext)
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false)
  const { confirmUpdateAdset, submitUserMessage, syncMessages } = useActions()
  const [aiState, setAIState] = useAIState()
  const [_, setMessages] = useUIState<typeof AI>()
  const [countryData, setCountryData] = useState<Country[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedGeoLocations, setSelectedGeoLocations] = useState<GeoLocation[]>([
    {
      country: null,
      region: null,
      cities: [],
      regionData: [],
      cityData: []
    }
  ])
  const [isMale, setIsMale] = useState<boolean>(false)
  const [isFemale, setIsFemale] = useState<boolean>(false)
  const [ageMin, setAgeMin] = useState<number>(18)
  const [ageMax, setAgeMax] = useState<number>(65)
  const [graphicalLocationUI, setGraphicalLocationUI] = useState<null | React.ReactNode>(
    uiProps ? <GeographicalLocationResult {...uiProps} /> : null
  )

  async function handleUpdateAdset() {
    if (!adset) {
      return toast.info('Adset is not set in this chat, please select adset first.')
    }
    if (!selectedGeoLocations[0].country) {
      return toast.info('You should select at least a country to set targeting.')
    }
    
    // Validate to prevent overlapping locations - but in a non-blocking way
    const hasCities = selectedGeoLocations.some(loc => loc.cities.length > 0);
    const hasRegions = selectedGeoLocations.some(loc => loc.region !== null && loc.cities.length === 0);
    const hasCountriesOnly = selectedGeoLocations.some(loc => loc.country !== null && loc.region === null && loc.cities.length === 0);
    
    // Show warnings for potentially problematic combinations, but don't block submission
    if (hasCities && (hasRegions || hasCountriesOnly)) {
      toast.warning('Your locations may overlap. The system will prioritize cities over regions and countries.');
    } else if (hasRegions && hasCountriesOnly) {
      toast.warning('Your locations may overlap. The system will prioritize regions over countries.');
    }
    
    setIsSubmitting(true)

    let newTargeting: AdsetTargeting = { ...adset.targeting }
    let demographicData: {
      [key: string]: any
    } = {}

    let genders = []
    if (isMale) {
      genders.push(1)
    }
    if (isFemale) {
      genders.push(2)
    }

    newTargeting.age_min = ageMin
    newTargeting.age_max = ageMax
    newTargeting.genders = genders

    // Structure location data in the format expected by the backend
    // Group locations by country to match the expected backend format
    const locationsByCountry = new Map<string, {
      country: Country,
      regions: Region[],
      cities: City[]
    }>();
    
    // Process all selected geo locations
    selectedGeoLocations.forEach(location => {
      if (!location.country) return;
      
      const countryCode = location.country.country_code;
      if (!locationsByCountry.has(countryCode)) {
        locationsByCountry.set(countryCode, {
          country: location.country,
          regions: [],
          cities: []
        });
      }
      
      const countryData = locationsByCountry.get(countryCode)!;
      
      // Add region if it exists
      if (location.region) {
        countryData.regions.push(location.region);
      }
      
      // Add cities if they exist
      if (location.cities.length > 0) {
        countryData.cities.push(...location.cities);
      }
    });
    
    // Build the geo_locations object in Facebook's format
    newTargeting.geo_locations = {};
    
    // Convert to format suitable for both backend and Facebook API
    if (locationsByCountry.size > 0) {
      // For Facebook targeting format (needed for immediate UI updates)
      const regionKeys = Array.from(locationsByCountry.values())
        .flatMap(data => data.regions)
        .map(region => ({ key: region.key }));
        
      const cityKeys = Array.from(locationsByCountry.values())
        .flatMap(data => data.cities)
        .map(city => ({ key: city.key }));
        
      const countryKeys = Array.from(locationsByCountry.values())
        .map(data => data.country.country_code)
        .filter(code => !!code);
      
      // Facebook doesn't allow targeting at multiple levels in the hierarchy
      // Prioritize the most specific locations (cities > regions > countries)
      newTargeting.geo_locations = {}; // Reset geo_locations object
      
      // Store original structure for debugging
      const originalStructure = {
        cities: cityKeys.length > 0 ? cityKeys : undefined,
        regions: regionKeys.length > 0 ? regionKeys : undefined,
        countries: countryKeys.length > 0 ? countryKeys : undefined
      };
      
      console.log('Original structure:', JSON.stringify(originalStructure));
      
      if (cityKeys.length > 0) {
        // Use only cities if available - most specific level
        newTargeting.geo_locations.cities = cityKeys;
        console.log('Target by cities only:', cityKeys);
      } else if (regionKeys.length > 0) {
        // Use only regions if no cities
        newTargeting.geo_locations.regions = regionKeys;
        console.log('Target by regions only:', regionKeys);
      } else if (countryKeys.length > 0) {
        // Use only countries if no cities or regions
        newTargeting.geo_locations.countries = countryKeys;
        console.log('Target by countries only:', countryKeys);
      }
      
      // Build simplified format for backend processing in demographicData
      demographicData.selected_locations = Array.from(locationsByCountry.values()).map(data => ({
        country: data.country.name,
        region: data.regions.map(r => r.name),
        cities: data.cities.map(c => c.name)
      }));
      
      // Also keep the original format for compatibility
      demographicData.countries = Array.from(locationsByCountry.values()).map(data => data.country);
      demographicData.regions = Array.from(locationsByCountry.values()).flatMap(data => data.regions);
      demographicData.cities = Array.from(locationsByCountry.values()).flatMap(data => data.cities);
    }
    
    // Log the created targeting for debugging
    console.log('📍 Generated geo_locations targeting:', JSON.stringify(newTargeting.geo_locations));
    console.log('📍 Backend-formatted location data:', JSON.stringify(demographicData.selected_locations));

    demographicData.age_min = ageMin
    demographicData.age_max = ageMax
    demographicData.genders = genders

    const response = await confirmUpdateAdset(
      toolCallId,
      adset.id,
      {
        targeting: newTargeting
      },
      'geographical',
      demographicData
    )

    setMessages(currentMessages => [...currentMessages, response.newMessage])

    for await (const updatedAdset of readStreamableValue<Adset>(response.response)) {
      if (updatedAdset) {
        setAIState({
          ...aiState,
          messages: aiState.messages.map((message: Message) => {
            if (message.id !== toolCallId) return message

            const content = (message.content as ToolContent)[0]
            if (content.type !== 'tool-result') {
              return console.error("Exception: content type is not tool-result in geographical-location component.", message)
            }
            if (content.toolName !== 'showGeographicalLocationUI') {
              return console.error("Exception: tool name not matching in geographical-location component.", message)
            }
            content.result = {
              ...(content.result as Object),
              uiProps: {
                success: true,
                targeting: updatedAdset.targeting,
                demographicData
              }
            }
            
            return message
          })
        })

        setAdset(updatedAdset)
        setIsSubmitting(false)
        setGraphicalLocationUI(
          <GeographicalLocationResult
            success={true}
            demographicData={demographicData}
          />
        )
        
      }
    }
    setIsSubmitting(false)
  }

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
        const cities = await getCityList(regionId, searchTerm)
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
        console.error('Error fetching results:', error)
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
    [getCityList]
  )

  const handleSelectCity = (index: number, value: string) => {
    const city = selectedGeoLocations[index]?.cityData?.find((e) => e.key === value)
    const exist = selectedGeoLocations[index]?.cities?.find((e) => e.key === value)
  
    if (city && !exist) {
      setSelectedGeoLocations((prev) =>
        prev.map((item, i) =>
          i === index
            ? {
                ...item,
                cities: [...item.cities, city],
                cityData: []
              }
            : item
        )
      )
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
      )
    }
  }

  const handleRemoveCity = (index: number, value: string) => {
    setSelectedGeoLocations((prev) =>
      prev.map((item, i) =>
        i === index
          ? {
              ...item,
              cities: item.cities.filter(city => city.key !== value)
            }
          : item
      )
    )
  }

  const handleChangeKeyword = (index: number, regionSelected: Region, value: string) => {
    if (regionSelected && value.length > 0) {
      searchCity(index, regionSelected.key, value)
    }
  }

  const handleChangeAge = (min: number, max: number) => {
    setAgeMax(max)
    setAgeMin(min)
  }

  const handleAddCountry = () => {
    setSelectedGeoLocations((prev) => [...prev, {
      country: null,
      region: null,
      cities: [],
      regionData: [],
      cityData: []
    }])
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
    setSelectedGeoLocations((prev) =>
      prev.map((item, i) =>
        i === index
          ? {
              ...item,
              region: region,
              cities: []
            }
          : item
      )
    )
  }

  useEffect(() => {
    if (!isReadOnly) {
      getCountryList()
    }
  }, [isReadOnly])

  return graphicalLocationUI ? (
    graphicalLocationUI
  ) : (
    <Card className="bg-white dark:bg-zinc-950 border-gray-200 dark:border-zinc-800">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-zinc-100">
          <MapPin className="h-5 w-5" />
          Geographical Targeting
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {selectedGeoLocations.map((geoLocation, index) => (
            <Card key={index} className="bg-gray-50 dark:bg-zinc-900 border-gray-200 dark:border-zinc-700">
              <CardContent className="pt-6">
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <Label className="text-gray-700 dark:text-zinc-200">Location {index + 1}</Label>
                    {selectedGeoLocations.length > 1 && (
                      <Button
                        variant="ghost"
                        size="icon"
                        disabled={isSubmitting}
                        onClick={() => handleRemoveCountry(index)}
                        className="h-8 w-8 text-gray-500 hover:text-gray-700 dark:text-zinc-400 dark:hover:text-zinc-100"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label className="text-gray-700 dark:text-zinc-300">Country</Label>
                    <SearchableSelect
                      disabled={countryData.length === 0 || isReadOnly}
                      value={geoLocation.country?.country_code}
                      onValueChange={value => {
                        handleCountrySelect(index, countryData.find(e => e.key === value) ?? null)
                      }}
                      options={countryData.map((country: Country) => ({
                        value: country.key,
                        label: country.name
                      }))}
                      placeholder="Select a country"
                    />

                    <Label className="text-gray-700 dark:text-zinc-300">Region</Label>
                    <SearchableSelect
                      disabled={geoLocation.regionData.length === 0 || isReadOnly}
                      value={geoLocation.region?.key}
                      onValueChange={value => {
                        handleRegionSelect(index, geoLocation.regionData.find(e => e.key === value) ?? null)
                      }}
                      options={geoLocation.regionData.map((region: Region) => ({
                        value: region.key,
                        label: region.name
                      }))}
                      placeholder="Select a region"
                    />

                    <Label className="text-gray-700 dark:text-zinc-300">Cities</Label>
<div className="bg-white dark:bg-zinc-800 text-gray-900 dark:text-zinc-100 rounded-md">
  <ComboBox
    disabled={!geoLocation.region || isReadOnly}
    selectedOptions={geoLocation.cities.map(city => ({
      label: city.name,
      value: city.key
    }))}
    onChangeKeyword={(value: string) => 
      geoLocation.region && handleChangeKeyword(index, geoLocation.region, value)
    }
    options={geoLocation.cityData.map(city => ({
      label: city.name,
      value: city.key
    }))}
    onSelect={(value) => handleSelectCity(index, value)}
    onRemove={(value) => handleRemoveCity(index, value)}
  />
</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}

          <Button
            variant="outline"
            disabled={isSubmitting}
            onClick={handleAddCountry}
            className="w-full bg-white hover:bg-gray-50 dark:bg-zinc-800 dark:hover:bg-zinc-700 border-gray-200 dark:border-zinc-700 text-gray-900 dark:text-zinc-200"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Location
          </Button>

          <Card className="bg-gray-50 dark:bg-zinc-900 border-gray-200 dark:border-zinc-700">
            <CardContent className="pt-6">
              <div className="space-y-6">
                <div>
                  <Label className="text-gray-700 dark:text-zinc-200 block mb-3">Age Range</Label>
                  <RangeSlider
                    min={18}
                    max={65}
                    step={1}
                    priceCap={2}
                    onChange={handleChangeAge}
                  />
                </div>

                <div>
                  <Label className="text-gray-700 dark:text-zinc-200 block mb-3">Gender</Label>
                  <div className="space-y-3">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="male"
                        checked={isMale}
                        onCheckedChange={() => setIsMale(!isMale)}
                        className="border-gray-300 dark:border-zinc-700 data-[state=checked]:bg-blue-600"
                      />
                      <label
                        htmlFor="male"
                        className="text-sm text-gray-700 dark:text-zinc-300"
                      >
                        Male
                      </label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="female"
                        checked={isFemale}
                        onCheckedChange={() => setIsFemale(!isFemale)}
                        className="border-gray-300 dark:border-zinc-700 data-[state=checked]:bg-blue-600"
                      />
                      <label
                        htmlFor="female"
                        className="text-sm text-gray-700 dark:text-zinc-300"
                      >
                        Female
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Button
            disabled={isSubmitting}
            onClick={handleUpdateAdset}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white"
          >
            {isSubmitting ? (
              <>
                <IconSpinner className="mr-2 h-4 w-4 animate-spin" />
                Updating...
              </>
            ) : (
              'Update Targeting'
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

export default GeographicalLocation;