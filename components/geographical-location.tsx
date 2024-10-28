'use client'

import * as React from 'react'
import { useState, useCallback, useContext, useEffect } from 'react'
import debounce from 'lodash/debounce'
import { CampaignContext } from '@/components/contexts/campaign-context'
import { useActions, useAIState, useUIState } from 'ai/rsc'
import { Adset, AdsetTargeting, Country, Region, City } from '@/lib/types'
import { readStreamableValue } from 'ai/rsc'
import { IconSpinner } from '@/components/ui/icons'
import { builQueryString } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { ComboBox } from '@/components/ui/combo-box'
import { GeographicalLocationResult } from '@/components/geographical-location-result'
import { RangeSlider } from '@/components/range-slider'
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem
} from '@/components/ui/select'

import { Checkbox } from '@/components/ui/checkbox'

import { type AI } from '@/lib/chat/actions'
interface GeoGraphicalLocationProps {
  toolCallId: string
  locationUiProps?: {
    demographicData: {
      [key: string]: any
    }
    success: boolean
  }
  isReadOnly?: boolean
}

export function GeographicalLocation({
  toolCallId,
  locationUiProps,
  isReadOnly
}: GeoGraphicalLocationProps) {
  const { adset, setAdset } = useContext(CampaignContext)
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false)
  const { confirmUpdateAdset } = useActions()
  const [_, setMessages] = useUIState<typeof AI>()
  const [countryData, setCountryData] = useState<Country[]>([])
  const [countrySelected, setCountrySelected] = useState<Country>()
  const [regionData, setRegionData] = useState<Region[]>([])
  const [regionSelected, setRegionSelected] = useState<Region>()
  const [loading, setLoading] = useState(false)
  const [cityData, setCityData] = useState<City[]>([])
  const [citiesSelected, setCitiesSelected] = useState<City[]>([])
  const [isMale, setIsMale] = useState<boolean>(false)
  const [isFemale, setIsFemale] = useState<boolean>(false)

  const [ageMin, setAgeMin] = useState<number>(13)
  const [ageMax, setAgeMax] = useState<number>(65)

  const [graphicalLocationUI, setGraphicalLocationUI] =
    useState<null | React.ReactNode>(
      locationUiProps ? (
        <GeographicalLocationResult {...locationUiProps} />
      ) : null
    )

  async function handleUpdateAdset() {
    if (!adset || !countrySelected) return
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

    if (citiesSelected.length > 0) {
      newTargeting.geo_locations = {
        cities: citiesSelected.map(city => ({
          key: city.key
        }))
      }

      demographicData.cities = citiesSelected
    } else if (regionSelected) {
      newTargeting.geo_locations = {
        regions: [{ key: regionSelected?.key }]
      }
      demographicData.regions = [regionSelected]
    } else {
      newTargeting.geo_locations = {
        countries: [countrySelected?.country_code]
      }
      demographicData.countries = [countrySelected]
    }
    demographicData.age_min = ageMin
    demographicData.age_max = ageMax

    demographicData.genders = genders

    const response = await confirmUpdateAdset(
      toolCallId,
      adset.id,
      {
        targeting: newTargeting
      },
      demographicData
    )
    setMessages(currentMessages => [...currentMessages, response.newMessage])
    for await (const updatedAdset of readStreamableValue<Adset>(
      response.response
    )) {
      if (updatedAdset) {
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
  const getRegionList = (countryCode: string) => {
    const params = {
      type: 'adgeolocation',
      location_types: "['region']",
      country_code: countryCode,
      limit: 300
    }
    fetch(`/api/fasty-bot/proxy-search${builQueryString(params)}`)
      .then(response => response.json())
      .then(data => {
        setRegionData((data.data as Region[]) || [])
      })
      .catch(error => {
        console.error('Error fetching:', error)
      })
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
    } finally {
    }
    return []
  }
  const searchCity = useCallback(
    debounce(async (regionId: string, searchTerm: string) => {
      setLoading(true)
      try {
        const cities = await getCityList(regionId, searchTerm)
        setCityData(cities)
      } catch (error) {
        console.error('Error fetching results:', error)
        setCityData([])
      } finally {
        setLoading(false)
      }
    }, 500), // 500ms debounce time
    [getCityList, setCityData]
  )
  useEffect(() => {
    if (!isReadOnly) {
      getCountryList()
    }
  }, [isReadOnly])

  useEffect(() => {
    if (countrySelected) {
      getRegionList(countrySelected.country_code)
    }
  }, [countrySelected])

  const handleSelectCity = (value: string) => {
    const city = cityData.find(e => e.key === value)
    const exist = citiesSelected.find(e => e.key === value)
    if (city && !exist) {
      setCitiesSelected([...citiesSelected, city])
    }
    setCityData([])
  }
  const handleRemoveCity = (value: string) => {
    setCitiesSelected(citiesSelected.filter(city => city.key !== value))
  }
  const handleChangeKeyword = (value: string) => {
    if (regionSelected && value.length > 0) {
      searchCity(regionSelected.key, value)
    } else {
      setCityData([])
    }
  }
  const handleChangeAge = (min: number, max: number) => {
    setAgeMax(max)
    setAgeMin(min)
  }

  return graphicalLocationUI ? (
    graphicalLocationUI
  ) : (
    <div className="p-6  border rounded-x">
      <div className="text-lg font-medium text-gray-900 dark:text-zinc-300 mb-2">
        Let&apos;s select geographical area:
      </div>
      <div className="mb-4">
        <Label className="dark:text-zinc-200">Country</Label>
        <Select
          disabled={countryData.length === 0 || isReadOnly}
          value={countrySelected?.country_code}
          onValueChange={value => {
            setCountrySelected(countryData.find(e => e.key === value))
          }}
        >
          <SelectTrigger className="SelectTrigger" aria-label="Food">
            <SelectValue placeholder="Select a country" />
          </SelectTrigger>
          <SelectContent>
            {countryData.map((country: Country) => {
              return (
                <SelectItem key={country.key} value={country.key}>
                  {country.name}
                </SelectItem>
              )
            })}
          </SelectContent>
        </Select>
      </div>
      <div className="mb-4">
        <Label className="dark:text-zinc-200">Region</Label>
        <Select
          disabled={regionData.length === 0 || isReadOnly}
          onValueChange={value => {
            setRegionSelected(regionData.find(e => e.key === value))
          }}
        >
          <SelectTrigger className="SelectTrigger" aria-label="Food">
            <SelectValue placeholder="Select a region" />
          </SelectTrigger>
          <SelectContent>
            {regionData.map((region: Region) => {
              return (
                <SelectItem key={region.key} value={region.key}>
                  {region.name}
                </SelectItem>
              )
            })}
          </SelectContent>
        </Select>
      </div>
      <div className="mb-4">
        <Label className="dark:text-zinc-200">City</Label>
        <ComboBox
          disabled={!regionSelected || isReadOnly}
          selectedOptions={citiesSelected.map(city => ({
            label: city.name,
            value: city.key
          }))}
          onChangeKeyword={handleChangeKeyword}
          options={cityData.map(city => ({
            label: city.name,
            value: city.key
          }))}
          onSelect={handleSelectCity}
          onRemove={handleRemoveCity}
        />
      </div>
      <div className="mb-4">
        <Label className="dark:text-zinc-200">Age Range</Label>
        <RangeSlider
          min={13}
          max={65}
          step={1}
          priceCap={2}
          onChange={handleChangeAge}
        />
      </div>
      <div className="mb-4">
        <Label className="dark:text-zinc-200">Gender</Label>

        <div className="items-top flex space-x-2 my-4">
          <Checkbox
            id="male"
            checked={isMale}
            onCheckedChange={checked => {
              setIsMale(!isMale)
            }}
          />
          <div className="grid gap-1.5 leading-none">
            <label
              htmlFor="male"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              Male
            </label>
          </div>
        </div>
        <div className="items-top flex space-x-2 mb-4">
          <Checkbox
            id="female"
            checked={isFemale}
            onCheckedChange={checked => {
              setIsFemale(!isFemale)
            }}
          />
          <div className="grid gap-1.5 leading-none">
            <label
              htmlFor="female"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              Female
            </label>
          </div>
        </div>
      </div>
      <div className="flex mt-4 gap-4">
        <Button
          disabled={isSubmitting || !countrySelected}
          onClick={async () => {
            setIsSubmitting(true)
            await handleUpdateAdset()
          }}
          className="flex justify-center items-center flex-1 px-3 py-2 text-xs align-middle font-medium text-center"
        >
          {isSubmitting && <IconSpinner />}
          {!isSubmitting && 'Update'}
        </Button>
      </div>
    </div>
  )
}
