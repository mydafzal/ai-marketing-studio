// chat.tsx
'use client'

import { useActions, useAIState, useUIState } from 'ai/rsc' // Add useActions here
import React, { useCallback, useContext, useEffect, useState } from 'react'
import { toast } from 'sonner'

import {
  fetchChatFbAdsetId,
  fetchChatFbCampaignId,
  getFbFetchedObject,
  updateChatFbCampaignId,
  updateChatTitle
} from '@/app/actions'
import {
  CampaignContext,
  CampaignContextProvider
} from '@/components/contexts/campaign-context'
import { KvContextProvider } from '@/components/contexts/kv-context'
import { ChatList } from '@/components/chat-list'
import { ChatPanel } from '@/components/chat-panel'
import { EmptyScreen } from '@/components/empty-screen'
import { useLocalStorage } from '@/lib/hooks/use-local-storage'
import { useScrollAnchor } from '@/lib/hooks/use-scroll-anchor'
import { Chat as ChatType, Message, Session } from '@/lib/types'
import { cn } from '@/lib/utils'
import CampaignOverview from '@/components/stocks/campaign-overview-basic-ui'
import { getChatIdFromUrl } from '@/lib/api/fasty-bot/helpers/chat-id-from-url-helper'
import { nanoid } from 'nanoid'
import { UserMessage } from '@/components/stocks/message'
import { ImagePart, TextPart } from 'ai'
import { AI } from '@/lib/chat/AIManager'
import { isFeatureToggleEnabled } from '@/lib/helpers/feature-toggle/feature-toggle-manager'
import { CampaignCreationForm } from './stocks/campaign-creation-form'
import { CampaignCreationFeedDisplay } from './stocks/campaign-creation-feed-display'

interface FbFetchedObject {
  id: string
  name: string
  status: string
  daily_budget: string
  start_time: string
  campaign_id: string
  destination_type: string
  is_dynamic_creative: boolean
  targeting: {
    age_max: number
    age_min: number
    flexible_spec: Array<{
      interests: Array<{
        id: string
        name: string
      }>
    }>
    geo_locations: {
      countries: string[]
      location_types: string[]
    }
    publisher_platforms: string[]
    facebook_positions: string[]
    instagram_positions: string[]
    device_platforms: string[]
  }
}

export interface ChatProps extends React.ComponentProps<'div'> {
  initialMessages?: Message[]
  chat: ChatType | null
  id: string
  session?: Session
  missingKeys: string[]
}

function ChatCore({ id, chat, className, session, missingKeys }: ChatProps) {
  const [aiState, setAIState] = useAIState()
  const [_, setNewChatId] = useLocalStorage('newChatId', id)
  const {
    id: campaignId,
    setId: setCampaignId,
    summary: campaignSummary
  } = useContext(CampaignContext)
  const [adsetId, setAdsetId] = useState<string | null>(null)
  const [adsetData, setAdsetData] = useState<FbFetchedObject | null>(null)
  const [isLoadingAdset, setIsLoadingAdset] = useState(false)
  const [messages, setMessages] = useUIState<typeof AI>()
  const { submitUserMessage } = useActions() // Get submitUserMessage from useActions
  const [showSteps, setShowSteps] = useState(false)

  // statically show campign initiator card
  let showCampaignInitiatorCard = true
  const isCampaignInitiatorCardEnabled =
    isFeatureToggleEnabled('campaignInitiatorCard') && showCampaignInitiatorCard

  // Add sendMessage function
  const sendMessage = React.useCallback(
    async (message: string, userContent?: (TextPart | ImagePart)[]) => {
      // Optimistically add user message UI
      setMessages(currentMessages => [
        ...currentMessages,
        {
          id: nanoid(),
          display: (
            <UserMessage userContent={userContent}>{message}</UserMessage>
          )
        }
      ])

      // Submit and get response message
      const responseMessage = await submitUserMessage(message, userContent)
      setMessages(currentMessages => [...currentMessages, responseMessage])
    },
    []
  )

  // Add handleShowMe that uses sendMessage
  const handleShowMe = useCallback(
    (message: string) => {
      sendMessage(message)
    },
    [sendMessage]
  )

  useEffect(() => {
    if (!aiState.messages.length) {
      setAIState((aiState: any) => ({
        ...aiState,
        messages: [
          {
            id: 'campaign-info-data',
            role: 'system',
            content:
              'No campaign is connected to this chat. You should always show UI to connect a campaign to the chat when user asks about one of "setting campaign budget", "changing campaign budget" "campaign result" and "campaign status".',
            timestamp: new Date().toISOString()
          },
          {
            id: 'adset-info-data',
            role: 'system',
            content:
              'No adset is selected to this chat. You should always show UI to select an adset for the chat when user asks to generate ad suggestion.',
            timestamp: new Date().toISOString()
          }
        ]
      }))
    }
  }, [])

  // Fetch campaign ID and update title
  useEffect(() => {
    if (!campaignId && id) {
      const fetch = async () => {
        const result = await fetchChatFbCampaignId(id)
        if (result.success) {
          setCampaignId(result.fbCampaignId as string)
        }
      }
      void fetch()
    }
  }, [campaignId, id])

  useEffect(() => {
    if (campaignSummary && campaignSummary.campaign_id !== '0') {
      const updateTitle = async () => {
        await updateChatTitle(aiState.chatId, campaignSummary.campaign_name)
        window.dispatchEvent(
          new CustomEvent('update-chat-title', {
            detail: {
              campaignId: campaignSummary.campaign_id,
              campaignName: campaignSummary.campaign_name
            }
          })
        )
      }

      if (chat?.title && chat.title !== campaignSummary.campaign_name) {
        void updateTitle()
      }
    }
  }, [campaignSummary, chat])

  // Fetch adset data
  useEffect(() => {
    const initializeAdsetId = async () => {
      const chatId = getChatIdFromUrl()
      if (chatId) {
        const result = await fetchChatFbAdsetId(chatId)
        if (result.success && typeof result.fbAdsetId === 'string') {
          setAdsetId(result.fbAdsetId)
        }
      }
    }

    initializeAdsetId()
  }, [])

  const fetchAdsetData = async (id: string) => {
    setIsLoadingAdset(true)
    try {
      const result = await getFbFetchedObject('adset', id)
      if (result.success && result.data && 'content' in result.data) {
        const content = result.data.content as Record<string, unknown>
        if (content && typeof content === 'object') {
          setAdsetData(content as unknown as FbFetchedObject)
        }
      }
    } catch (error) {
      console.error('Error fetching adset data:', error)
    } finally {
      setIsLoadingAdset(false)
    }
  }

  useEffect(() => {
    if (adsetId) {
      fetchAdsetData(adsetId)
    }
  }, [adsetId])

  useEffect(() => {
    setNewChatId(id)
  })

  useEffect(() => {
    missingKeys.map(key => {
      toast.error(`Missing ${key} environment variable!`)
    })
  }, [missingKeys])

  const { messagesRef, scrollRef, visibilityRef, isAtBottom, scrollToBottom } =
    useScrollAnchor()

  const handleCampaignCreated = useCallback(
    async (campaignId: string) => {
      setCampaignId(campaignId)
      await updateChatFbCampaignId(id, campaignId)
    },
    [id]
  )

  const handleRefreshAdset = () => {
    if (adsetId) {
      fetchAdsetData(adsetId)
    }
  }

  return (
    <div
      className={`group w-full pl-0 peer-[[data-state=open]]:lg:pl-[250px] peer-[[data-state=open]]:xl:pl-[300px] relative ${isCampaignInitiatorCardEnabled ? 'flex' : ''}`}
      ref={scrollRef}
    >
      <div className="overflow-auto h-full w-full flex flex-col items-center">
        <div
          className={cn('pb-[200px] pt-4 md:pt-10 relative', className)}
          ref={messagesRef}
        >
          <div>
            {messages.length ? (
              <ChatList
                messages={messages}
                isShared={false}
                session={session}
              />
            ) : (
              <EmptyScreen />
            )}
            <div className="w-full h-px" ref={visibilityRef} />
          </div>

          {isFeatureToggleEnabled('rightSideOverviewCard') && (
            <div
              className="hidden lg:block fixed top-20 right-10 w-[350px]"
              style={{
                position: 'fixed',
                zIndex: 40
              }}
            >
              <div
                className="campaign-overview-container"
                style={{
                  transform: 'scale(0.55)',
                  transformOrigin: 'top right',
                  width: '100%',
                  height: 'auto'
                }}
              >
                <CampaignOverview
                  campaignName={campaignSummary?.campaign_name}
                  campaignId={campaignId ?? null}
                  campaignBudget="to be implemented"
                  adsetData={adsetData}
                  adsetId={adsetId}
                  isLoading={isLoadingAdset}
                  onRefresh={handleRefreshAdset}
                  onShowMe={sendMessage}
                />
              </div>
            </div>
          )}
        </div>

        <div className="fixed bottom-0">
          <ChatPanel
            id={id}
            isAtBottom={isAtBottom}
            scrollToBottom={scrollToBottom}
            onCampaignCreate={handleCampaignCreated}
            campaignId={campaignId}
            isCampaignInitiatorCardEnabled={isCampaignInitiatorCardEnabled}
          />
        </div>
      </div>

      {isCampaignInitiatorCardEnabled && (
        <div className="w-[80%] border-l border-gray-200 dark:border-gray-800">
          {showSteps ? (
            <CampaignCreationFeedDisplay />
          ) : (
            <CampaignCreationForm onSubmit={() => setShowSteps(true)} />
          )}
        </div>
      )}
    </div>
  )
}

export const Chat = ({ ...chatProps }: ChatProps) => (
  <KvContextProvider chat={chatProps.chat}>
    <CampaignContextProvider>
      <ChatCore {...chatProps} />
    </CampaignContextProvider>
  </KvContextProvider>
)
