'use client'

import * as React from 'react'
import { useState, useCallback, useContext, useEffect } from 'react'
import { CampaignContext } from '@/components/contexts/campaign-context'
import { useActions, useAIState, useUIState } from 'ai/rsc'
import { Adset, AdsetTargeting, Country, Region, City } from '@/lib/types'
import { readStreamableValue } from 'ai/rsc'
import { IconSpinner } from '@/components/ui/icons'
import { builQueryString } from '@/lib/utils'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ComboBox } from '@/components/ui/combo-box'

import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem
} from '@/components/ui/select'

import { type AI } from '@/lib/chat/actions'
interface GeoGraphicalLocationProps {
  toolCallId: string
  countries?: {
    name: string
    code: string
  }[]
  isReadOnly?: boolean
}

export function GeographicalLocation({
  toolCallId,
  countries,
  isReadOnly
}: GeoGraphicalLocationProps) {
  const { id: campaignId, adset, setAdset } = useContext(CampaignContext)
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false)
  const { confirmUpdateAdset } = useActions()
  const [_, setMessages] = useUIState<typeof AI>()
  const [countryData, setCountryData] = useState<Country[]>([])
  const [countrySelected, setCountrySelected] = useState<Country>()
  const [regionData, setRegionData] = useState<Region[]>([])
  const [regionSelected, setRegionSelected] = useState<Region>()

  async function handleUpdateAdset() {
    if (!adset) return
    let newTargeting: AdsetTargeting = { ...adset.targeting }

    newTargeting.geo_locations.countries =
      countries?.map(country => country.code) ||
      newTargeting.geo_locations.countries

    const response = await confirmUpdateAdset(toolCallId, adset.id, {
      targeting: newTargeting
    })
    setMessages(currentMessages => [...currentMessages, response.newMessage])
    for await (const updatedAdset of readStreamableValue<Adset>(
      response.response
    )) {
      if (updatedAdset) {
        setAdset(updatedAdset)
        setIsSubmitting(false)
      }
    }
    setIsSubmitting(false)
  }
  useEffect(() => {
    if (!isReadOnly) {
    }
  }, [isReadOnly])

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
        console.log('🚀 ~ getRegionList ~ data:', data.data)
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
      limit: 300
    }
    try {
      const response = await fetch(
        `/api/fasty-bot/proxy-search${builQueryString(params)}`
      )
      const data = response.json() as any
      const citys = data.data.filter((e: any) => e?.type === 'city') as City[]
      console.log('🚀 ~ getCityList ~ citys:', citys)
    } catch (error) {
      console.error('Error fetching results:', error)
    } finally {
    }
  }
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

  useEffect(() => {
    if (regionSelected) {
      getCityList(regionSelected.key, 'los')
    }
  }, [regionSelected])

  const options = ['1', '2']

  const handleSelect = (value: string) => {
    console.log('Selected value:', value)
  }

  return isReadOnly ? (
    <div className="p-6  border rounded-x">
      You have selected the geographical area:{' '}
      {countries?.map(country => country.name).join(', ')}
    </div>
  ) : isSubmitting ? (
    <IconSpinner />
  ) : (
    <div className="p-6  border rounded-x">
      <div className="text-lg font-medium text-gray-900 dark:text-zinc-300 mb-2">
        Let&apos;s select geographical area:
      </div>
      <div className="mb-4">
        <Label className="dark:text-zinc-200">Country</Label>
        <Select
          disabled={countryData.length === 0}
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
          disabled={regionData.length === 0}
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
        <Label className="dark:text-zinc-200">City:</Label>
        <ComboBox options={options} onSelect={handleSelect} />
      </div>
    </div>
  )
}
