'use client'

import { ToolContent } from 'ai';
import { readStreamableValue, useActions, useAIState, useUIState } from 'ai/rsc'
import * as React from 'react'
import { useState, useCallback, useContext, useEffect } from 'react'
import { Switch } from '@/components/ui/switch'
import { cn } from '@/lib/utils'
import { IconSpinner } from '@/components/ui/icons'
import { CampaignContext } from '@/components/contexts/campaign-context'
import { Adset, AdsetTargeting } from '@/lib/types'
import { targetPositions } from '@/lib/data'
import { type AI } from '@/lib/chat/actions'

interface TargetingUiProps {
  targeting: any
  success: boolean
}
interface PlacementTargetingProps {
  targetingUiProps?: TargetingUiProps
  toolCallId: string
}

export function PlacementTargetingResult({
  targeting,
  success
}: TargetingUiProps) {
  if (!success) return
  return (
    <>
      {!success ? (
        <div className="p-6  border rounded-x">
          <div className="text-md mb-2 font-bold dark:text-zinc-300">
            Failed to update placement targeting. Please try again!
          </div>
        </div>
      ) : (
        <div className="p-6  border rounded-x">
          <div className="text-md mb-2 font-bold dark:text-zinc-300">
            Placement targeting has been updated successfully!
          </div>
          {targeting.facebook_positions?.length > 0 && (
            <div className="text-md mb-2">
              <span className="text-md font-bold dark:text-zinc-300">
                Facebook:{' '}
              </span>
              <span>
                {targeting.facebook_positions?.join(', ')}
              </span>
            </div>
          )}
          {targeting.facebook_positions?.length > 0 && (
            <div className="text-md">
              <span className="text-md font-bold dark:text-zinc-300">
                Instagram:{' '}
              </span>
              <span>
                {targeting.instagram_positions?.join(', ')}
              </span>
            </div>
          )}
        </div>
      )}
    </>
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
  toolCallId
}: PlacementTargetingProps) {
  const { id: campaignId, adset, setAdset } = useContext(CampaignContext)
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false)
  const [aiState, setAIState] = useAIState()
  const { confirmUpdateAdset, syncMessages } = useActions()
  const [_, setMessages] = useUIState<typeof AI>()

  const [selectedPositions, setSelectedPositions] = useState<TargetPosition[]>(
    []
  )
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
      className={cn('flex items-center mb-2', target?.parent ? 'ml-2' : '')}
    >
      <Switch
        checked={
          !!selectedPositions.find(
            e => e.platform === target.platform && e.value === target.value
          )
        }
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
      />
      <span className="text-white-500 pl-3">{target.label}</span>
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

    const response = await confirmUpdateAdset(adset.id, {
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
            success
          />
        )
        await syncMessages();
      }
    }
    setIsSubmitting(false)
  }
  return (
    <PlacementTargetingTemplate
      adset={targetingUiProps ? ({} as Adset) : adset}
    >
      {targetingUI ? (
        targetingUI
      ) : (
        <div className="p-6">
          <div className="text-lg font-bold dark:text-zinc-300">
            Placement Targeting
          </div>
          <div className="flex w-full flex-col my-2">
            <span className="text-white-700 mb-2">
              I recommend using the following placements for your campaign
            </span>
            <div className="flex">
              <div className="w-1/2  p-4">
                {targetPositions
                  .filter(e => e.platform === 'facebook')
                  .map(target => renderSwitch(target))}
              </div>
              <div className="w-1/2 p-4">
                {targetPositions
                  .filter(e => e.platform === 'instagram')
                  .map(target => renderSwitch(target))}
              </div>
            </div>
          </div>
          <button
            aria-disabled={isSubmitting}
            className="flex justify-center items-center flex-1 w-full h-10 px-4 py-2 mt-6 font-boldtext-center text-white bg-gray-700 rounded-lg hover:bg-gray-800 focus:ring-4 focus:outline-none focus:ring-gray-300 dark:bg-gray-600 dark:hover:bg-gray-700 dark:focus:ring-gray-800"
            onClick={handleUpdateAdset}
          >
            {isSubmitting && <IconSpinner />}
            {!isSubmitting && 'Confirm'}
          </button>
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
      <div className="rounded-xl border p-4">
        {children}
      </div>
    </div>
  ) : null;
}
