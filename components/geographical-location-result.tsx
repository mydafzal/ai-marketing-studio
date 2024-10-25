'use client'

import * as React from 'react'
import { Adset, AdsetTargeting, Country, Region, City } from '@/lib/types'

interface GeographicalLocationProps {
  locationData: {
    [key: string]: any
  }
  success: boolean
}

export function GeographicalLocationResult({
  locationData,
  success
}: GeographicalLocationProps) {
  let data = []
  if (locationData?.cities && locationData?.cities.length > 0) {
    data = locationData?.cities.map((city: City) => city.name)
  } else if (locationData?.regions && locationData?.regions.length > 0) {
    data = locationData?.regions.map((region: Region) => region.name)
  } else if (locationData?.countries && locationData?.countries.length > 0) {
    data = locationData?.countries.map((country: Country) => country.name)
  }

  return (
    <div className="p-6  border rounded-x">
      {success
        ? `You have selected the geographical area: ${data.join(', ')}`
        : `Failure update to geographical area: `}
    </div>
  )
}
