'use client'

import * as React from 'react'
import { useState, useCallback, useContext, useEffect } from 'react'
import { CampaignContext } from '@/components/contexts/campaign-context'
import { useActions, useAIState, useUIState } from 'ai/rsc'
import { targetPositions } from '@/lib/data'
import { Adset, AdsetTargeting } from '@/lib/types'
import { readStreamableValue } from 'ai/rsc'
import { IconSpinner } from '@/components/ui/icons'

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
  const [isSubmitting, setIsSubmitting] = useState<boolean>(true)
  const { confirmUpdateAdset } = useActions()
  const [_, setMessages] = useUIState<typeof AI>()

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
      handleUpdateAdset()
    }
  }, [isReadOnly])
  
  return isReadOnly ? (
    <div className="p-6  border rounded-x">
      You have selected the geographical locations:{' '}
      {countries?.map(country => country.name).join(', ')}
    </div>
  ) : isSubmitting ? (
    <IconSpinner />
  ) : (
    <div className="p-6  border rounded-x">
      You have selected the geographical locations:{' '}
      {countries?.map(country => country.name).join(', ')}
    </div>
  )
}
