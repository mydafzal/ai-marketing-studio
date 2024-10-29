'use client'

import * as React from 'react'
import { useState, useContext, useEffect } from 'react'
import { CampaignContext } from '@/components/contexts/campaign-context'
import { useActions, useUIState } from 'ai/rsc'
import { Adset, AdsetTargeting } from '@/lib/types'
import { readStreamableValue } from 'ai/rsc'
import { IconSpinner } from '@/components/ui/icons'
import { builQueryString } from '@/lib/utils'

import { type AI } from '@/lib/chat/actions'
interface SuggestedFiltersProps {
  toolCallId: string
  suggestedFitlers: string[][]
  isReadOnly?: boolean
}

export function SuggestedFilters({
  toolCallId,
  suggestedFitlers,
  isReadOnly
}: SuggestedFiltersProps) {

  const { adset, setAdset } = useContext(CampaignContext)
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false)
  const { confirmUpdateAdset } = useActions()
  const [_, setMessages] = useUIState<typeof AI>()
  console.log("🚀 ~ suggestedFitlers:", suggestedFitlers)
  console.log("🚀 ~ adset:", adset)
  const getReachEstimates = async ( targeting: any, filters: any) => {
    const params = {
      targeting_spec: JSON.stringify(targeting),
      filters: JSON.stringify(filters),
    }
    try {
      const response = await fetch(
        `/api/fasty-bot/proxy-reach-estimate${builQueryString(params)}`
      )
      const data = (await response.json()) as any
      console.log("🚀 ~ getReachEstimates ~ data:", data)

    } catch (error) {
      console.error('Error fetching results:', error)
    } finally {
    }
    return []
  }


  useEffect(() => {
    if (!isReadOnly && adset && suggestedFitlers.length > 0) {
      getReachEstimates(adset?.targeting, suggestedFitlers)
    }
  }, [isReadOnly, adset, suggestedFitlers])

  return isReadOnly ? (
    <div className="p-6  border rounded-x">
      You have selected the filter:
    </div>
  ) : isSubmitting ? (
    <IconSpinner />
  ) : (
    <div className="p-6  border rounded-x">
      You have selected the filter: 
    </div>
  )
}
