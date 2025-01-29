'use client'

import * as React from 'react'
import { useEffect, useRef } from 'react'
import { Country, Region, City, Message } from '@/lib/types'
import { Card, CardContent } from '@/components/ui/card'
import { CheckCircle, X, MapPin, Users, Calendar } from 'lucide-react'
import { useActions, useAIState, useUIState } from 'ai/rsc'
import { type AI } from '@/lib/chat/actions'
import { cn } from '@/lib/utils'

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
  const { submitUserMessage } = useActions()
  const [aiState] = useAIState()
  const [_, setMessages] = useUIState<typeof AI>()
  const hasTriggeredMessage = useRef(false)
  
  useEffect(() => {
    async function sendFollowUpMessage() {
      if (success && !hasTriggeredMessage.current) {
        hasTriggeredMessage.current = true
        
        // Check if we're in campaign creation mode by looking at recent messages
        const recentMessages = aiState.messages.slice(-10)
        const isInCampaignCreation = recentMessages.some((msg: Message) => 
          typeof msg.content === 'string' && 
          (msg.content.includes('create a campaign') || 
           msg.content.includes('campaign creation') ||
           msg.content.includes('Step 1:') ||
           msg.content.includes('Step 2:'))
        )

        const message = isInCampaignCreation
          ? "Great! Now that we have the geographical targeting set up, let me help you with interest targeting and filters to reach your ideal audience. I can suggest some filters based on your business and target demographics. Would you like me to do that? 🎯"
          : "I've updated the geographical targeting. Would you like to make any other changes to your campaign?"

        const responseMessage = await submitUserMessage(message, [], true) // Should be AI message.
        setMessages(currentMessages => [...currentMessages, responseMessage])
      }
    }

    sendFollowUpMessage()
  }, [success, submitUserMessage, setMessages, aiState.messages])

  let locationTexts = []
  if (demographicData?.cities && demographicData?.cities.length > 0) {
    locationTexts = demographicData?.cities.map((city: City) => city.name)
  } else if (demographicData?.regions && demographicData?.regions.length > 0) {
    locationTexts = demographicData?.regions.map((region: Region) => region.name)
  } else if (demographicData?.countries && demographicData?.countries.length > 0) {
    locationTexts = demographicData?.countries.map((country: Country) => country.name)
  }

  const genders = demographicData?.genders || []
  const genderLabels = genders.map((value: number) => {
    return value === 1 ? "Male" : value === 2 ? "Female" : null
  })

  if (!success) {
    return (
      <Card className="bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800">
        <CardContent className="p-6">
          <div className="flex items-center gap-3">
            <X className="size-6 text-red-600 dark:text-red-500 shrink-0" />
            <div className="text-red-600 dark:text-red-400">
              Failed to update demographic targeting. Please try again.
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800">
      <CardContent className="p-6">
        <div className="space-y-6">
          <div className="flex items-start gap-3">
            <CheckCircle className="size-6 text-green-600 dark:text-green-500 shrink-0 mt-0.5" />
            <div>
              <div className="text-zinc-900 dark:text-zinc-200 font-medium mb-4">
                Successfully updated targeting settings
              </div>
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-zinc-600 dark:text-zinc-400">
                  <MapPin className="size-4 shrink-0" />
                  <span>
                    {locationTexts.join(', ')}
                  </span>
                </div>
                {demographicData?.age_min && (
                  <div className="flex items-center gap-2 text-zinc-600 dark:text-zinc-400">
                    <Calendar className="size-4 shrink-0" />
                    <span>
                      Ages {demographicData.age_min} - {demographicData.age_max}
                    </span>
                  </div>
                )}
                {genderLabels.length > 0 && (
                  <div className="flex items-center gap-2 text-zinc-600 dark:text-zinc-400">
                    <Users className="size-4 shrink-0" />
                    <span>
                      {genderLabels.join(' & ')}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}