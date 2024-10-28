'use client'

import * as React from 'react'
import { useState, useContext, useEffect } from 'react'
import { CampaignContext } from '@/components/contexts/campaign-context'
import { useActions, useUIState } from 'ai/rsc'
import { Adset, AdsetTargeting } from '@/lib/types'
import { readStreamableValue } from 'ai/rsc'
import { IconSpinner } from '@/components/ui/icons'

import { type AI } from '@/lib/chat/actions'
interface InterestFilterProps {
  toolCallId: string
  suggestedFitlers: string[][]
  isReadOnly?: boolean
}

export function InterestFilter({
  toolCallId,
  suggestedFitlers,
  isReadOnly
}: InterestFilterProps) {
  console.log("🚀 ~ suggestedFitlers:", suggestedFitlers)
  const { adset, setAdset } = useContext(CampaignContext)
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false)
  const { confirmUpdateAdset } = useActions()
  const [_, setMessages] = useUIState<typeof AI>()

  useEffect(() => {
    if (!isReadOnly) {
    }
  }, [isReadOnly])

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
