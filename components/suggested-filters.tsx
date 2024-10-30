'use client'

import { ToolContent } from 'ai';
import { readStreamableValue, useActions, useAIState, useUIState } from 'ai/rsc'
import * as React from 'react'
import { useState, useContext, useEffect } from 'react'
import { CampaignContext } from '@/components/contexts/campaign-context'
import {
  Adset,
  FlexibleSpec,
  ReachEstimateResult,
} from '@/lib/types'
import { IconSpinner } from '@/components/ui/icons'
import { builQueryString } from '@/lib/utils'
import { SuggestedFiltersResult } from './suggested-filters-result'

import { type AI } from '@/lib/chat/actions'
interface SuggestedFiltersProps {
  toolCallId: string
  suggestedFitlers: string[][]
  uiProps?: {
    suggestedFilter: FlexibleSpec
    success: boolean
  }
  isReadOnly?: boolean
}

export function SuggestedFilters({
  toolCallId,
  suggestedFitlers,
  isReadOnly,
  uiProps
}: SuggestedFiltersProps) {
  const { adset, setAdset } = useContext(CampaignContext)
  const [isLoading, setLoading] = useState<boolean>(false)
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false)
  const { confirmUpdateAdset, syncMessages } = useActions()
  const [aiState, setAIState] = useAIState()
  const [_, setMessages] = useUIState<typeof AI>()

  const [suggestedFiltersUI, setSuggestedFiltersUI] =
    useState<null | React.ReactNode>(
      uiProps ? <SuggestedFiltersResult {...uiProps} /> : null
    )

  const handleUpdateAdset = async (estimateResult: ReachEstimateResult[]) => {
    if (!adset || estimateResult.length === 0) return
    setIsSubmitting(true)
    const response = await confirmUpdateAdset(
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

        const messages = aiState.messages;
        const lastMessage = messages.slice(-1)[0];
        if (!lastMessage || lastMessage.id !== toolCallId) {
          return console.error('Exception: last message is empty or not matching to toolCallId in suggested-filters component.', lastMessage);
        }
        const content = (lastMessage.content as ToolContent)[0];
        if (content.type !== 'tool-result') {
          return console.error("Exception: content type is not tool-result in suggested-filters component.", lastMessage)
        }
        if (content.toolName !== 'showSuggestedFilters') {
          return console.error("Exception: tool name not matching in suggested-filters component.", lastMessage)
        }
        content.result = {
          ...(content.result as Object),
          uiProps: {
            success: true,
            targeting: updatedAdset.targeting,
            suggestedFilter: updatedAdset.targeting.flexible_spec?.[0]
          }
        }
        setAIState({
          ...aiState,
          messages: [...messages]
        });
        setAdset(updatedAdset)
        setSuggestedFiltersUI(
          <SuggestedFiltersResult
            success={true}
            suggestedFilter={flexible_spec[0]}
          />
        )
        await syncMessages();
      }
    }
    setIsSubmitting(false)
  }
  const getReachEstimates = async (targeting: any, filters: any) => {
    const params = {
      targeting_spec: JSON.stringify(targeting),
      filters: JSON.stringify(filters)
    }
    console.log('reach estimate result', params)
    try {
      const response = await fetch(
        `/api/fasty-bot/proxy-reach-estimate${builQueryString(params)}`
      )
      const data = (await response.json()) as ReachEstimateResult[]
      console.log('reach estimate result', data)
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
  }, [isReadOnly, adset, isLoading, suggestedFitlers])

  return suggestedFiltersUI ? (
    suggestedFiltersUI
  ) : isLoading ? (
    <IconSpinner />
  ) : (
    <div className="p-6  border rounded-x"></div>
  )
}
