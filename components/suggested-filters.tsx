'use client'

import * as React from 'react'
import { useState, useContext, useEffect } from 'react'
import { CampaignContext } from '@/components/contexts/campaign-context'
import { useActions, useUIState } from 'ai/rsc'
import {
  Adset,
  FlexibleSpec,
  ReachEstimateResult,
} from '@/lib/types'
import { readStreamableValue } from 'ai/rsc'
import { IconSpinner } from '@/components/ui/icons'
import { builQueryString } from '@/lib/utils'
import { SuggestedFiltersResult } from './suggested-filters-result'

import { type AI } from '@/lib/chat/actions'
interface SuggestedFiltersProps {
  toolCallId: string
  suggestedFitlers: string[][]
  suggestedUiProps?: {
    suggestedFilter: FlexibleSpec
    success: boolean
  }
  isReadOnly?: boolean
}

export function SuggestedFilters({
  toolCallId,
  suggestedFitlers,
  isReadOnly,
  suggestedUiProps
}: SuggestedFiltersProps) {
  const { adset, setAdset } = useContext(CampaignContext)
  const [isLoading, setLoading] = useState<boolean>(false)
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false)
  const { confirmUpdateAdset } = useActions()
  const [_, setMessages] = useUIState<typeof AI>()

  const [suggestedFiltersUI, setSuggestedFiltersUI] =
    useState<null | React.ReactNode>(
      suggestedUiProps ? <SuggestedFiltersResult {...suggestedUiProps} /> : null
    )

  const handleUpdateAdset = async (estimateResult: ReachEstimateResult[]) => {
    if (!adset || estimateResult.length === 0) return
    setIsSubmitting(true)
    const response = await confirmUpdateAdset(
      toolCallId,
      adset.id,
      {
        targeting: adset.targeting
      },
      'suggested_filters',
      estimateResult
    )
    setMessages(currentMessages => [...currentMessages, response.newMessage])
    for await (const updatedAdset of readStreamableValue<Adset>(
      response.response
    )) {
      if (updatedAdset) {
        const flexible_spec = updatedAdset?.targeting
          ?.flexible_spec as FlexibleSpec[]
        setAdset(updatedAdset)
        setSuggestedFiltersUI(
          <SuggestedFiltersResult
            success={true}
            suggestedFilter={flexible_spec[0]}
          />
        )
      }
    }
    setIsSubmitting(false)
  }
  const getReachEstimates = async (targeting: any, filters: any) => {
    const params = {
      targeting_spec: JSON.stringify(targeting),
      filters: JSON.stringify(filters)
    }
    try {
      const response = await fetch(
        `/api/fasty-bot/proxy-reach-estimate${builQueryString(params)}`
      )
      const data = (await response.json()) as ReachEstimateResult[]
      await handleUpdateAdset(data)
    } catch (error) {
      console.error('Error fetching results:', error)
    } finally {
    }
    return []
  }

  useEffect(() => {
    if (!isReadOnly && adset && suggestedFitlers.length > 0 && !isLoading) {
      setLoading(true)
      getReachEstimates(adset?.targeting, suggestedFitlers)
    }
  }, [isReadOnly, adset, suggestedFitlers])

  return suggestedFiltersUI ? (
    suggestedFiltersUI
  ) : isLoading ? (
    <IconSpinner />
  ) : (
    <div className="p-6  border rounded-x"></div>
  )
}
