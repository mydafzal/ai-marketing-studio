'use client'

import * as React from 'react'
import { useEffect, useRef } from 'react'
import { FlexibleSpec } from '@/lib/types'
import { Card, CardContent } from '@/components/ui/card'
import { CheckCircle, X } from 'lucide-react'
import { useActions, useAIState, useUIState } from 'ai/rsc'
import { type AI } from '@/lib/chat/actions'

interface SuggestedFiltersProps {
  suggestedFilter: FlexibleSpec
  success: boolean
}

export function SuggestedFiltersResult({
  suggestedFilter,
  success
}: SuggestedFiltersProps) {
  const { submitUserMessage } = useActions()
  const [aiState] = useAIState()
  const [_, setMessages] = useUIState<typeof AI>()
  const hasTriggeredMessage = useRef(false)
  
  useEffect(() => {
    async function sendFollowUpMessage() {
      if (success && !hasTriggeredMessage.current) {
        hasTriggeredMessage.current = true
        
        const message = "Great! Now that we have set up your targeting filters, let's decide where your ads will be shown. 🎯 Would you like to proceed with setting up the ad placements on Facebook and Instagram platforms? We can place them in Stories, Reels, News Feed, and more."

        const responseMessage = await submitUserMessage(message, [], true)
        setMessages(currentMessages => [...currentMessages, responseMessage])
      }
    }

    sendFollowUpMessage()
  }, [success, submitUserMessage, setMessages])

  if (!success) {
    return (
      <Card className="bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800">
        <CardContent className="p-6">
          <div className="flex items-center gap-3">
            <X className="size-6 text-red-600 dark:text-red-500 shrink-0" />
            <div className="text-red-600 dark:text-red-400">
              Failed to update targeting filters. Please try again.
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800">
      <CardContent className="p-6">
        <div className="flex items-start gap-3">
          <CheckCircle className="size-6 text-green-600 dark:text-green-500 shrink-0 mt-0.5" />
          <div>
            <div className="text-zinc-900 dark:text-zinc-200 font-medium mb-4">
              Successfully updated targeting filters
            </div>
            <div className="text-zinc-600 dark:text-zinc-400">
              Selected interests: {suggestedFilter.interests.map((interest) => interest.name).join(', ')}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}