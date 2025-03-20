// chat.tsx
'use client'

import { useActions, useAIState, useUIState } from 'ai/rsc' // Add useActions here
import React, { useCallback, useContext, useEffect, useState } from 'react'
import { toast } from 'sonner'

import {
  fetchChatFbAdsetId,
  fetchChatFbCampaignId,
  getFbFetchedObject,
  getSubscriptionInfo,
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
import { HomePageInfoCard } from '@/components/account-not-connected-screen'
import useAccountStore from '@/app/store/useAccountStore'
import { useRouter } from 'next/navigation'
import { IconSpinner } from '@/components/ui/icons'
import {subscriptionBypassList} from "@/app/subscription/subscription-bypass-list";

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

  const { isFbAccountConnected, checkFbAccountConnection } = useAccountStore()
  useEffect(() => {
    checkFbAccountConnection()
  }, [])

  const [subStatus, setSubStatus] = useState<string | undefined>(undefined)
  const [subbedPackage, setSubbedPackage] = useState<string | undefined>(
    undefined
  )
  const [isFetchingSub, setIsFetchingSub] = useState(true)

  const router = useRouter()

  useEffect(() => {
    const fetchSubscription = async () => {
      setIsFetchingSub(true);

      try {
        const result = await getSubscriptionInfo();

        if (result && result.success) { // Ensure result is not null before accessing properties
          setSubStatus(result.sub_status ?? ""); // Default to empty string if missing
          setSubbedPackage(result.sub_offer ?? ""); // Default to empty string if missing
        } else {
          setSubStatus(""); // Default if result is null
          setSubbedPackage("");
        }
      } catch (error) {
        console.error("Error fetching subscription info:", error);
        setSubStatus(""); // Handle errors gracefully
        setSubbedPackage("");
      }

      setIsFetchingSub(false);
    };

    fetchSubscription();
  }, []);


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

  useEffect(() => {
    if (isFetchingSub) return; // Avoid running while fetching

    let email = session?.user?.email ?? ""; // Ensure email is always a string

    if (subStatus !== 'active' && !subscriptionBypassList.includes(email)) {
      router.replace('/subscription'); // Redirects only non-bypassed users
    } else {
      setSubStatus('active'); // Mark as active for bypassed users
    }
  }, [isFetchingSub, subStatus, session?.user?.email, router]);

  const renderContent = () => {
    if (isFetchingSub) {
      return (
        <div className="flex items-center justify-center h-screen w-full">
          <IconSpinner />
        </div>
      )
    }

    if (subStatus !== 'active') {
      // for bypassed users we dont redirect
      return null; // Prevent rendering while redirecting
    }

    if (!isFbAccountConnected && subbedPackage == 'AI Content Creator') {
      // you are subscibed to use the AI Content Creator. To access the AI marketer tool they need to upgrade their plan.
      return <HomePageInfoCard adAccountConnected={true} />
    }

    if (!isFbAccountConnected && subbedPackage == 'AI Marketer Suite') {
      // They have AI marketer subscription but their facebook account is not connected yet.
      // Contact contact@reeply.net to get started with connecting your facebook account.
      return <HomePageInfoCard awaitingToGetReady={true} />
    }

    if (isFbAccountConnected && subbedPackage == 'AI Content Creator') {
      // You have to upgrade their package via stripe if this scenario happens where we add facebook account ids manually.
      return <HomePageInfoCard adAccountConnected={true} />
    }

    if (messages.length > 0) {
      return <ChatList messages={messages} isShared={false} session={session} />
    }

    return <EmptyScreen />
  }

  return (
    <div
      className="group w-full pl-0 peer-[[data-state=open]]:lg:pl-[250px] peer-[[data-state=open]]:xl:pl-[300px] relative"
      ref={scrollRef}
    >
      <div className="overflow-auto h-full">
        <div
          className={cn('pb-[200px] pt-4 md:pt-10 relative', className)}
          ref={messagesRef}
        >
          <div>
            {renderContent()}
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
      </div>

      <ChatPanel
        id={id}
        isAtBottom={isAtBottom}
        scrollToBottom={scrollToBottom}
        onCampaignCreate={handleCampaignCreated}
        campaignId={campaignId}
      />
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
