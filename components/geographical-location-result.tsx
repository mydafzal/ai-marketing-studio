'use client'

import * as React from 'react'
import { Country, Region, City } from '@/lib/types'

interface GeographicalLocationProps {
  demographicData: {
    [key: string]: any
  }
  success: boolean
}

export function GeographicalLocationResult({
  demographicData,
  success
}: GeographicalLocationProps) {

  let locationTexts = []
  if (demographicData?.cities && demographicData?.cities.length > 0) {
    locationTexts = demographicData?.cities.map((city: City) => city.name)
  } else if (demographicData?.regions && demographicData?.regions.length > 0) {
    locationTexts = demographicData?.regions.map((region: Region) => region.name)
  } else if (demographicData?.countries && demographicData?.countries.length > 0) {
    locationTexts = demographicData?.countries.map((country: Country) => country.name)
  }

  const genders = demographicData?.genders || []; 
  const genderLabels = genders.map((value: number) => {
    return value === 1 ? "Male" : value === 2 ? "Female" : null;
  });


  return (
    <div className="p-6  border rounded-x">
      {success ? (
        <>
          <p className="font-semibold	">You have selected</p>
          <p>Geographical area: {locationTexts.join(', ')}</p>
          {demographicData?.age_min && (
            <p>
              Age range: {demographicData?.age_min} - {demographicData?.age_max}
            </p>
          )}
          {genderLabels.length > 0 && <p>Genders: {genderLabels.join(', ')}</p>}
        </>
      ) : (
        <p>Failure update to demographic targeting</p>
      )}
    </div>
  )
}
