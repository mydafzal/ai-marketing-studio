'use client'

import { ToolContent } from 'ai';
import { readStreamableValue, useActions, useAIState, useUIState } from 'ai/rsc'
import * as React from 'react'
import { useState, useCallback, useContext, useEffect, useRef } from 'react'
import { Switch } from '@/components/ui/switch'
import { cn } from '@/lib/utils'
import { IconSpinner } from '@/components/ui/icons'
import { CampaignContext } from '@/components/contexts/campaign-context'
import { Adset, AdsetTargeting } from '@/lib/types'
import { targetPositions } from '@/lib/data'
import { type AI } from '@/lib/chat/actions'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { CheckCircle, XCircle, Facebook, Instagram, Info } from 'lucide-react'

interface TargetingUiProps {
  targeting: any
  success: boolean
}

interface PlacementTargetingProps {
  targetingUiProps?: TargetingUiProps
  toolCallId: string
  onPlacementUpdate?: (placementData: { facebook_positions: string[], instagram_positions: string[] }) => void
}

export function PlacementTargetingResult({
  targeting,
  success
}: TargetingUiProps) {
  const { submitUserMessage } = useActions()
  const [aiState] = useAIState()
  const [_, setMessages] = useUIState<typeof AI>()
  const hasTriggeredMessage = useRef(false)
  
  useEffect(() => {
    async function sendFollowUpMessage() {
      if (success && !hasTriggeredMessage.current) {
        hasTriggeredMessage.current = true
        
        const message = "Perfect! Now that we have set up where your ads will be shown, let's add your creative assets. 🎨 Could you please upload the images or videos you'd like to use for your ad? I can help you optimize them for the best performance across these placements."

        const responseMessage = await submitUserMessage(message, [], true)
        setMessages(currentMessages => [...currentMessages, responseMessage])
      }
    }

    sendFollowUpMessage()
  }, [success, submitUserMessage, setMessages])

  if (!success) return null
  
  return (
    <Card className="bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800">
      <CardContent className="p-6">
        <div className="flex items-center gap-3 mb-4">
          {success ? (
            <CheckCircle className="size-6 text-green-600 dark:text-green-500 shrink-0" />
          ) : (
            <XCircle className="size-6 text-red-600 dark:text-red-500 shrink-0" />
          )}
          <span className="text-lg font-semibold text-zinc-900 dark:text-zinc-200">
            {success ? 'Placement targeting updated successfully!' : 'Failed to update placement targeting'}
          </span>
        </div>
        
        {targeting.facebook_positions?.length > 0 && (
          <div className="flex items-start gap-3 mb-3">
            <Facebook className="size-5 text-blue-600 dark:text-blue-500 shrink-0 mt-1" />
            <div>
              <span className="font-medium text-zinc-800 dark:text-zinc-300">Facebook Placements:</span>{' '}
              <span className="text-zinc-600 dark:text-zinc-400">{targeting.facebook_positions?.join(', ')}</span>
            </div>
          </div>
        )}
        
        {targeting.instagram_positions?.length > 0 && (
          <div className="flex items-start gap-3">
            <Instagram className="size-5 text-pink-600 dark:text-pink-500 shrink-0 mt-1" />
            <div>
              <span className="font-medium text-zinc-800 dark:text-zinc-300">Instagram Placements:</span>{' '}
              <span className="text-zinc-600 dark:text-zinc-400">{targeting.instagram_positions?.join(', ')}</span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

interface TargetPositionOption {
  platform: string
  value: string
  parent?: string
  label: string
}

interface TargetPosition {
  platform: string
  parent?: string
  value: string
}

export function PlacementTargeting({
  targetingUiProps,
  toolCallId,
  onPlacementUpdate
}: PlacementTargetingProps) {
  const { adset, setAdset } = useContext(CampaignContext)
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false)
  const [aiState, setAIState] = useAIState()
  const { confirmUpdateAdset, syncMessages } = useActions()
  const [_, setMessages] = useUIState<typeof AI>()
  const [selectedPositions, setSelectedPositions] = useState<TargetPosition[]>([])
  const [targetingUI, setTargetingUI] = useState<null | React.ReactNode>(
    targetingUiProps ? <PlacementTargetingResult {...targetingUiProps} /> : null
  )

  useEffect(() => {
    setSelectedPositions([
      ...(adset?.targeting?.facebook_positions || []).map(position => ({
        value: position,
        platform: 'facebook',
        parent: targetPositions.find(
          p => p.platform === 'facebook' && p.value === position
        )?.parent
      })),
      ...(adset?.targeting?.instagram_positions || []).map(position => ({
        value: position,
        platform: 'instagram',
        parent: targetPositions.find(
          p => p.platform === 'instagram' && p.value === position
        )?.parent
      }))
    ])
  }, [adset])

  const renderSwitch = (target: TargetPositionOption) => (
    <div
      key={target.value}
      className={cn(
        'flex items-center p-2 rounded-lg transition-colors',
        target?.parent ? 'ml-4' : '',
        'hover:bg-zinc-100 dark:hover:bg-zinc-800'
      )}
    >
      <div className="relative">
        <Switch
          checked={!!selectedPositions.find(
            e => e.platform === target.platform && e.value === target.value
          )}
          onCheckedChange={checked => {
            if (checked) {
              if (
                !selectedPositions.find(
                  p => p.platform === target.platform && p.value === target.value
                )
              ) {
                let newPositions = [
                  ...selectedPositions,
                  {
                    platform: target.platform,
                    value: target.value,
                    parent: target.parent
                  }
                ]
                if (target?.parent) {
                  if (
                    !newPositions.find(
                      p =>
                        p.platform === target.platform &&
                        p.value === target?.parent
                    )
                  ) {
                    newPositions = [
                      ...newPositions,
                      { platform: target.platform, value: target?.parent }
                    ]
                  }
                }
                setSelectedPositions(newPositions)
              }
            } else {
              let newPositions = [
                ...selectedPositions.filter(
                  p => p.platform !== target.platform || p.value !== target.value
                )
              ].filter(
                p =>
                  p.platform !== target.platform ||
                  !p?.parent ||
                  p.parent !== target.value
              )
              setSelectedPositions(newPositions)
            }
          }}
          className="bg-zinc-200 dark:bg-zinc-700 data-[state=checked]:bg-blue-600 dark:data-[state=checked]:bg-blue-500"
        />
      </div>
      <span className="text-zinc-800 dark:text-zinc-300 pl-3 font-medium">{target.label}</span>
    </div>
  )

  async function handleUpdateAdset() {
    if (!adset) return
    setIsSubmitting(true)
    let newTargeting: AdsetTargeting = { ...adset.targeting }
    let publisherPlatforms: string[] = []

    let newFacebookPositions = selectedPositions
      .filter(e => e.platform === 'facebook')
      .map(e => e.value)
    let newInstagramPositions = selectedPositions
      .filter(e => e.platform === 'instagram')
      .map(e => e.value)

    if (newFacebookPositions.length > 0) {
      publisherPlatforms.push('facebook')
    }
    if (newInstagramPositions.length > 0) {
      publisherPlatforms.push('instagram')
    }
    
    newTargeting.facebook_positions = newFacebookPositions
    newTargeting.instagram_positions = newInstagramPositions
    newTargeting.publisher_platforms = publisherPlatforms

    const response = await confirmUpdateAdset(toolCallId, adset.id, {
      targeting: newTargeting
    }, 'placement')
    setMessages(currentMessages => [...currentMessages, response.newMessage])
    
    for await (const updatedAdset of readStreamableValue<Adset>(
      response.response
    )) {
      if (updatedAdset) {
        const messages = aiState.messages;
        const lastMessage = messages.slice(-1)[0];
        if (!lastMessage || lastMessage.id !== toolCallId) {
          return console.error('Exception: last message is empty or not matching to toolCallId in placement-targeting component.', lastMessage);
        }
        const content = (lastMessage.content as ToolContent)[0];
        if (content.type !== 'tool-result') {
          return console.error("Exception: content type is not tool-result in placement-targeting component.", lastMessage)
        }
        if (content.toolName !== 'showPlacementTargetingUI') {
          return console.error("Exception: tool name not matching in placement-targeting component.", lastMessage)
        }
        content.result = {
          ...(content.result as Object),
          uiProps: {
            success: true,
            targeting: updatedAdset.targeting
          }
        }
        setAIState({
          ...aiState,
          messages: [...messages]
        });
        setAdset(updatedAdset)
        setTargetingUI(
          <PlacementTargetingResult
            targeting={updatedAdset.targeting}
            success={true}
          />
        )
        await syncMessages();
        
        if (onPlacementUpdate) {
          onPlacementUpdate({
            facebook_positions: updatedAdset.targeting.facebook_positions || [],
            instagram_positions: updatedAdset.targeting.instagram_positions || []
          })
        }
      }
    }
    setIsSubmitting(false)
  }

  return (
    <PlacementTargetingTemplate adset={targetingUiProps ? ({} as Adset) : adset}>
      {targetingUI ? (
        targetingUI
      ) : (
        <div className="space-y-4">
          <Card className="bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800">
            <CardHeader>
              <CardTitle className="text-xl font-bold text-zinc-900 dark:text-zinc-200">
                Placement Targeting
              </CardTitle>
              <div className="flex items-center gap-2 mt-2 text-sm text-blue-800 dark:text-blue-200 bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg border border-blue-200 dark:border-blue-800">
                <Info className="size-4 shrink-0" />
                <p>Choose where your ads will appear across Facebook and Instagram platforms</p>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Facebook Section */}
                <Card className="bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800">
                  <CardHeader className="pb-3">
                    <div className="flex items-center gap-2">
                      <Facebook className="size-5 text-blue-600 dark:text-blue-500" />
                      <h3 className="font-semibold text-zinc-900 dark:text-zinc-200">Facebook Placements</h3>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-1">
                    {targetPositions
                      .filter(e => e.platform === 'facebook')
                      .map(target => renderSwitch(target))}
                  </CardContent>
                </Card>

                {/* Instagram Section */}
                <Card className="bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800">
                  <CardHeader className="pb-3">
                    <div className="flex items-center gap-2">
                      <Instagram className="size-5 text-pink-600 dark:text-pink-500" />
                      <h3 className="font-semibold text-zinc-900 dark:text-zinc-200">Instagram Placements</h3>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-1">
                    {targetPositions
                      .filter(e => e.platform === 'instagram')
                      .map(target => renderSwitch(target))}
                  </CardContent>
                </Card>
              </div>
              
              <button
                disabled={isSubmitting}
                className={cn(
                  'flex justify-center items-center w-full h-12 px-6',
                  'text-white font-semibold rounded-lg',
                  'bg-blue-600 hover:bg-blue-700 transition-colors',
                  'disabled:opacity-50 disabled:cursor-not-allowed',
                  'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2',
                  'dark:focus:ring-offset-zinc-900 focus:ring-offset-white'
                )}
                onClick={handleUpdateAdset}
              >
                {isSubmitting ? (
                  <IconSpinner className="size-5 animate-spin" />
                ) : (
                  'Confirm Placements'
                )}
              </button>
            </CardContent>
          </Card>
        </div>
      )}
    </PlacementTargetingTemplate>
  )
}

interface PlacementTargetingTemplateProps {
  children: React.ReactNode
  adset?: Adset
}

function PlacementTargetingTemplate({
  adset,
  children,
}: PlacementTargetingTemplateProps) {
  return adset ? (
    <div className="relative">
      <div className="rounded-xl">
        {children}
      </div>
    </div>
  ) : null
}

export default PlacementTargeting;