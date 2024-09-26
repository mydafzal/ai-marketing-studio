'use client'

import { readStreamableValue } from 'ai/rsc';
import * as React from 'react'
import { useState, useCallback, useContext, useEffect } from 'react'
import { Switch } from '@/components/ui/switch'
import { getAdsets } from '@/lib/api/fasty-bot/get-adsets'
import { getAdset } from '@/lib/api/fasty-bot/get-adset'
import { createAdset } from '@/lib/api/fasty-bot/create-adset'
import { cn } from '@/lib/utils'
import { IconSpinner } from '@/components/ui/icons'

import { CampaignContext } from '@/components/contexts/campaign-context'
import { Adset, AdsetTargeting, Message } from '@/lib/types'
import { useActions, useAIState, useUIState } from 'ai/rsc'
import { generateAdsetTemplate, targetPositions } from '@/lib/data'
import { type AI } from '@/lib/chat/actions'
import { fetchChatCampaignBudget } from '@/app/actions'

interface PlacementTargetingProps {
  targetingUiProps?: {
    targeting: any
    success: boolean
  }
  isActive?: boolean
}

export function PlacementTargetingResult({ ...props }) {
  console.log('props', props)
  return (
    <div className="p-6  border rounded-x">
      Placement targeting has been updated,<br/>success: {props.success ? 'Yes' : 'No'}<br/>
      facebook positions: {props.targeting.facebook_positions.join(', ')}<br/>
      instagram positions: {props.targeting.instagram_positions.join(', ')}
    </div>
  )
}
interface TargetPositionOption {
  platform: string
  value: string
  label: string
}
interface TargetPosition {
  platform: string
  value: string
}

export function PlacementTargeting({
  targetingUiProps,
  isActive
}: PlacementTargetingProps) {
  const { id: campaignId } = useContext(CampaignContext)
  const [isActivated, activate] = useState(!!isActive || !!targetingUiProps)
  const [adset, setAdset] = useState<Adset>()
  const { confirmUpdateAdset } = useActions()
  const [_, setMessages] = useUIState<typeof AI>()
  const [aiState, setAIState] = useAIState()

  const [selectedPositions, setSelectedPositions] = useState<TargetPosition[]>(
    []
  );
  const targetingUI = targetingUiProps ? <PlacementTargetingResult {...targetingUiProps} /> : null;

  useEffect(() => {
    if (!targetingUiProps && campaignId && isActivated) {
      const fetchAsets = async () => {
        try {
          const adsets = await getAdsets(campaignId)
          if (adsets.length > 0) {
            const res = await getAdset(adsets[0].id)
            if (res) setAdset(res)
          } else {
            const budget = await fetchChatCampaignBudget(aiState.chatId)
            let adsetUpdate = {
              ...generateAdsetTemplate(),
              campaign_id: campaignId
            } as any
            if (budget.error) {
              adsetUpdate = { ...adsetUpdate, daily_budget: 100 }
            }
            console.log('create adset')
            const res = await createAdset(campaignId, adsetUpdate)
            if (res) setAdset(res)
          }
        } catch (error) {
          console.error('Error fetching fetchAsets data:', error)
        }
      }
      void fetchAsets()
    }
  }, [campaignId, isActivated, targetingUiProps])

  useEffect(() => {
    setSelectedPositions([
      ...(adset?.targeting?.facebook_positions || []).map(position => ({
        value: position,
        platform: 'facebook'
      })),
      ...(adset?.targeting?.instagram_positions || []).map(position => ({
        value: position,
        platform: 'instagram'
      }))
    ])
  }, [adset])
  const renderSwitch = (target: TargetPositionOption) => (
    <div key={target.value} className="flex items-center mb-2">
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
              setSelectedPositions([
                ...selectedPositions,
                { platform: target.platform, value: target.value }
              ])
            }
          } else {
            setSelectedPositions([
              ...selectedPositions.filter(
                p => p.platform !== target.platform || p.value !== target.value
              )
            ])
          }
        }}
      />
      <span className="text-white-500 pl-3">{target.label}</span>
    </div>
  )
  const refresh = useCallback(() => {
    activate(true)
  }, [])
  return (
    <PlacementTargetingTemplate
      adset={targetingUiProps ? {} as Adset : adset}
      isActivated={isActivated}
      refresh={refresh}
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
              Optimize Your Campaign by Choosing the Right Placement Targeting
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
            className="w-full px-4 py-2 mt-6 font-boldtext-center text-white bg-gray-700 rounded-lg hover:bg-gray-800 focus:ring-4 focus:outline-none focus:ring-gray-300 dark:bg-gray-600 dark:hover:bg-gray-700 dark:focus:ring-gray-800"
            onClick={async () => {
              if (adset) {
                let newTargeting: AdsetTargeting = { ...adset.targeting }
                let publisher_platforms: string[] = []

                let newFacebookPositions = selectedPositions
                  .filter(e => e.platform === 'facebook')
                  .map(e => e.value)
                let newInstagramPositions = selectedPositions
                  .filter(e => e.platform === 'instagram')
                  .map(e => e.value)

                if (newFacebookPositions.length > 0) {
                  publisher_platforms.push('facebook')
                }
                if (newInstagramPositions.length > 0) {
                  publisher_platforms.push('instagram')
                }
                newTargeting.facebook_positions = newFacebookPositions
                newTargeting.instagram_positions = newInstagramPositions
                newTargeting.publisher_platforms = publisher_platforms

                const response = await confirmUpdateAdset(adset.id, {
                  targeting: newTargeting
                });
                setMessages(currentMessages => [...currentMessages, response.newMessage]);
                for await (const updatedAdset of readStreamableValue<Adset>(response.response)) {
                  console.log('response', updatedAdset);
                  if (updatedAdset) {
                    setAdset(updatedAdset);
                    setTimeout(() => {
                      setAIState({
                        ...aiState,
                        messages: [
                          ...aiState.messages.map((message: Message, index: number) => {
                            if (/* index > aiState.messages.length - 3 && */ message.role === 'tool') {
                              const content = message.content[0]
                              console.log('content', content);
                              if (
                                content.type === 'tool-result' &&
                                content.toolName === 'showPlacementTargetingUI'
                              ) {
                                content.result = {
                                  ...(content.result as Object),
                                  targetingUiProps: (
                                    content.result as { targetingUiProps: object }
                                  ).targetingUiProps ?? {
                                    success: true,
                                    targeting: newTargeting
                                  },
                                }
                              }
                            }
                            return {...message}
                          })
                        ]
                      })
                    }, 0);
                  } else {

                  }
                }
              }
            }}
          >
            Confirm
          </button>
        </div>
      )}
    </PlacementTargetingTemplate>
  )
}

interface PlacementTargetingTemplateProps {
  isActivated: boolean
  children: React.ReactNode
  adset?: Adset
  refresh: () => void
}

function PlacementTargetingTemplate({
  adset,
  children,
  isActivated,
  refresh
}: PlacementTargetingTemplateProps) {
  return (
    <div className="relative">
      <div
        className={cn(
          'rounded-xl border  p-4 ',
          !adset ? 'pointer-events-none blur' : ''
        )}
      >
        {children}
      </div>
      <div
        className={cn(
          'absolute text-center top-[50%] w-full',
          isActivated && adset ? 'hidden' : ''
        )}
      >
        {isActivated ? (
          <IconSpinner className="m-auto animate-spin" />
        ) : (
          <>
            <div className=" mb-3">
              To view the Placement targeting settings again. Click the button
              below.
            </div>
            <button
              className="px-4 py-2 rounded-lg bg-green-600"
              onClick={refresh}
            >
              Refresh
            </button>
          </>
        )}
      </div>
    </div>
  )
}
