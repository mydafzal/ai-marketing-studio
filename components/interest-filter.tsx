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
  filterNames: string[]
  isReadOnly?: boolean
}

export function InterestFilter({
  toolCallId,
  filterNames,
  isReadOnly
}: InterestFilterProps) {
  const { adset, setAdset } = useContext(CampaignContext)
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false)
  const { confirmUpdateAdset } = useActions()
  const [_, setMessages] = useUIState<typeof AI>()

  // async function handleUpdateAdset() {
  //   if (!adset) return
  //   let newTargeting: AdsetTargeting = { ...adset.targeting }

  //   newTargeting.genders = genders
  //   newTargeting.age_min = ageMin
  //   newTargeting.age_max = ageMax

  //   const response = await confirmUpdateAdset(toolCallId, adset.id, {
  //     targeting: newTargeting
  //   })
  //   setMessages(currentMessages => [...currentMessages, response.newMessage])
  //   for await (const updatedAdset of readStreamableValue<Adset>(
  //     response.response
  //   )) {
  //     if (updatedAdset) {
  //       setAdset(updatedAdset)
  //       setIsSubmitting(false)
  //     }
  //   }
  //   setIsSubmitting(false)
  // }
  useEffect(() => {
    if (!isReadOnly) {
      // handleUpdateAdset()
    }
  }, [isReadOnly])

  return isReadOnly ? (
    <div className="p-6  border rounded-x">
      You have selected the filter: {filterNames.join(', ')}
    </div>
  ) : isSubmitting ? (
    <IconSpinner />
  ) : (
    <div className="p-6  border rounded-x">
      You have selected the filter: {filterNames.join(', ')}
    </div>
  )
}
