'use client'

import * as React from 'react'
import { FlexibleSpec } from '@/lib/types'

interface SuggestedFiltersProps {
  suggestedFilter: FlexibleSpec
  success: boolean
}

export function SuggestedFiltersResult({
  suggestedFilter,
  success
}: SuggestedFiltersProps) {

  return (
    <div className="p-6  border rounded-x">
      {success ? (
        <>
          <p >
            Filter updated to: <span className="font-semibold	">{suggestedFilter.interests.map((interest) => interest.name).join(', ')}</span>
          </p>
        </>
      ) : (
        <p>Failure update to filter</p>
      )}
    </div>
  )
}
