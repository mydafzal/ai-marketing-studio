'use client'

import { useActions, useAIState, useUIState } from 'ai/rsc' // Add useActions here
import React, { useCallback, useContext, useEffect, useState } from 'react'
import { toast } from 'sonner'
import { trackEvent } from '@/lib/utils'
import { useUsageStore } from '@/app/store/useUsageStore'

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
import { subscriptionBypassList } from '@/app/subscription/subscription-bypass-list'
import { SidebarContentProvider } from '@/components/contexts/sidebar-content-context'
import { DynamicSidebar, RestoreSidebarButton } from '@/components/dynamic-sidebar'
import { SidebarBridge } from '@/components/sidebar-bridge'
import { useSidebarContent } from '@/components/contexts/sidebar-content-context'
import { ActiveUIProvider } from '@/components/stocks/active-ui-context'

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
  const { isOpen: isSidebarContentOpen } = useSidebarContent()

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

  // Get usage store methods
  const { fetchUsageData, setIsSubscribed } = useUsageStore()
  
  useEffect(() => {
    const fetchSubscription = async () => {
      setIsFetchingSub(true)

      try {
        const result = await getSubscriptionInfo()

        if (result && result.success) {
          // Ensure result is not null before accessing properties
          const isActive = result.sub_status === 'active' || result.sub_status === 'trialing'
          
          setSubStatus(result.sub_status ?? '') // Default to empty string if missing
          setSubbedPackage(result.sub_offer ?? '') // Default to empty string if missing
          
          // Update subscription status in usage store
          setIsSubscribed(isActive)
          
          // Also fetch usage data after getting subscription status
          await fetchUsageData()
        } else {
          setSubStatus('') // Default if result is null
          setSubbedPackage('')
          setIsSubscribed(false)
        }
      } catch (error) {
        console.error('Error fetching subscription info:', error)
        setSubStatus('') // Handle errors gracefully
        setSubbedPackage('')
        setIsSubscribed(false)
      }

      setIsFetchingSub(false)
    }

    fetchSubscription()
  }, [fetchUsageData, setIsSubscribed])

  // Add sendMessage function
  const sendMessage = React.useCallback(
    async (message: string, userContent?: (TextPart | ImagePart)[]) => {

      // Track user message sent
      await trackEvent('chat_message_sent', 
        { email: session?.user?.email || '', id: session?.user?.id || '' },
        {
          message_type: 'user',
          message: message,
          has_attachments: !!userContent,
          chat_id: id
        }
      )

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
      
      // Add a data attribute to help identify when new AI message is added
      setMessages(currentMessages => [...currentMessages, {
        ...responseMessage,
        id: `ai-response-${Date.now()}`  // Add unique timestamp to ensure DOM changes
      }])
    },
    [id, session]
  )
  
  // Listen for "send-support-message" events
  useEffect(() => {
    const handleSupportMessage = (event: CustomEvent) => {
      const { message } = event.detail
      sendMessage(message)
    }
    
    window.addEventListener('send-support-message', handleSupportMessage as EventListener)
    
    return () => {
      window.removeEventListener('send-support-message', handleSupportMessage as EventListener)
    }
  }, [sendMessage])

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
    if (isFetchingSub) return // Avoid running while fetching

    let email = session?.user?.email ?? '' // Ensure email is always a string

    // With our new free plan, we don't redirect non-subscribed users - they can use the app with limits
    // Only redirect if we couldn't determine subscription status at all (error case)
    if (subStatus === undefined || subStatus === null) {
      window.location.href = '/subscription' // Hard redirect only in error case
    } else if (subStatus === 'active' || subStatus === 'trialing' || subscriptionBypassList.includes(email)) {
      setSubStatus('active') // Mark as active for subscribed users and bypass list
    }
    // Otherwise, user is on free plan with usage limits handled by useUsageStore
  }, [isFetchingSub, subStatus, session?.user?.email, router])

  const renderContent = () => {
    if (isFetchingSub) {
      return (
        <div className="flex items-center justify-center h-screen w-full">
          <IconSpinner />
        </div>
      )
    }
    
    // With the new free plan, we allow all users to access the app
    // The usage limits are enforced through useUsageStore when actions are performed

    if (!isFbAccountConnected && subbedPackage == 'AI Content Creator') {
      // you are subscibed to use the AI Content Creator. To access the AI marketer tool they need to upgrade their plan.
      return <HomePageInfoCard isSubscribedToAIContent={true} />
    }

    // Facebook connection is now handled via redirect to facebook-connect page

    if (isFbAccountConnected && subbedPackage == 'AI Content Creator') {
      // You have to upgrade their package via stripe if this scenario happens where we add facebook account ids manually.
      return <HomePageInfoCard adAccountConnected={true} />
    }

    if (messages.length > 0) {
      // Filter out any message marked as hidden before passing to ChatList
      const visibleMessages = messages.filter(message => typeof message === 'object' && 'hidden' in message ? !message.hidden : true);
      return <ChatList messages={visibleMessages} isShared={false} session={session} />
    }

    return <EmptyScreen />
  }

  return (
    <div className="w-full max-w-3xl flex flex-col h-full overflow-hidden">
      <div
        className="flex-1 overflow-y-auto hide-scrollbar"
        id="chat-messages-container"
        ref={scrollRef}
      >
        <div className={cn("pt-4 md:pt-10", className)} ref={messagesRef}>
          <div>
            {renderContent()}
            <div className="w-full h-px" ref={visibilityRef} />
          </div>

          {isFeatureToggleEnabled('rightSideOverviewCard') && (
            <div
              className="hidden lg:block fixed top-20 w-[350px]"
              style={{
                position: 'fixed',
                zIndex: 40,
                right: isSidebarContentOpen ? '370px' : '10px',
                transition: 'right 300ms ease-in-out'
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
        session={session}
      />
    </div>
  )
}

export const Chat = ({ ...chatProps }: ChatProps) => (
  <KvContextProvider chat={chatProps.chat}>
    <CampaignContextProvider>
      <SidebarContentProvider>
        <ActiveUIProvider>
          <SidebarBridge />
          <div className="relative w-full h-full flex justify-center">
            <ChatCore {...chatProps} />
            <DynamicSidebar />
          </div>
          <RestoreSidebarButton />
        </ActiveUIProvider>
      </SidebarContentProvider>
    </CampaignContextProvider>
  </KvContextProvider>
)