'use client'
import { useUIState, useAIState } from 'ai/rsc'
import { useCallback, useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'

import { fetchChatFbCampaignId, updateChatFbCampaignId, updateChatTitle } from '@/app/actions'
import { ChatList } from '@/components/chat-list'
import { ChatPanel } from '@/components/chat-panel'
import { EmptyScreen } from '@/components/empty-screen'
import { CampaignSummary, getCampaignSummary } from '@/lib/api/fasty-bot/get-campaign-summary'
import { useLocalStorage } from '@/lib/hooks/use-local-storage'
import { useScrollAnchor } from '@/lib/hooks/use-scroll-anchor'
import { Chat as ChatType, Message, Session } from '@/lib/types'
import { cn } from '@/lib/utils'

export interface ChatProps extends React.ComponentProps<'div'> {
  initialMessages?: Message[]
  chat: ChatType | null
  id: string
  session?: Session
  missingKeys: string[]
}

const oneHour = 60 * 60 * 1000
const fiveMins = 5 * 60 * 1000

export function Chat({ id, chat, className, session, missingKeys }: ChatProps) {
  const [messages] = useUIState()
  const [aiState, setAIState] = useAIState()
  const lastUpdatedRef = useRef<Date | null>(null)
  const [_, setNewChatId] = useLocalStorage('newChatId', id)

  const [summary, setSummary] = useState<CampaignSummary | null>(null)
  const [campaignId, setCampaignId] = useState<string | null>(null)

  useEffect(() => {
    if (session && summary && summary.campaign_id !== '0') {
      const currentTimestamp = new Date().toISOString()
      setAIState((aiState: any) => ({
        ...aiState,
        messages: [
          ...aiState.messages.filter((message: Message) => message.id !== 'campaign-info-data' || message.role !== 'system'),
          {
            id: 'campaign-info-data',
            role: 'system',
            content: `Knowledge Base about current campaign information: ${JSON.stringify(summary)}`,
            timestamp: currentTimestamp 
          }
        ]
      }))
      lastUpdatedRef.current = new Date()

      const updateTitle = async () => {
        await updateChatTitle(aiState.chatId, summary.campaign_name)
        window.dispatchEvent(new CustomEvent("update-chat-title", {
          detail: {
            campaignId: summary.campaign_id,
            campaignName: summary.campaign_name
          }
        }))
      }

      if (chat?.title !== summary.campaign_name) {
        void updateTitle()
      }
    }
  }, [session, summary])

  const fetchSummaryData = useCallback(async (campaignId: string) => {
    console.log('fetchSummaryData with campaignId', campaignId)
    try {
      const result = await getCampaignSummary(campaignId)
      console.log('campaign summary', result)
      setSummary(result)
    } catch (error) {
      console.error('Error fetching campaign data:', error)
    }
  }, [])

  useEffect(() => {
    if (!campaignId && id) {
      const fetch = async () => {
        const result = await fetchChatFbCampaignId(id)
        console.log('campaignId', result.fbCampaignId)
  
        if (result.success) {
          setCampaignId(result.fbCampaignId as string)
        }
      }
      void fetch()
    }
  },[campaignId, id])

  useEffect(() => {
    if (campaignId) {
      fetchSummaryData(campaignId)
    }
    const interval = setInterval(() => {
      console.log('interval', campaignId)
      if (
        campaignId &&
        lastUpdatedRef.current &&
        new Date().getTime() - lastUpdatedRef.current.getTime() > oneHour
      ) {
        fetchSummaryData(campaignId)
      }
    }, fiveMins)

    return () => clearInterval(interval)
  }, [campaignId, fetchSummaryData])

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

  const handleCampaignCreate = useCallback(async (campaignId: string) => {
    setCampaignId(campaignId)
    await updateChatFbCampaignId(id, campaignId)
  }, [id])

  return (
    <div
      className="group w-full overflow-auto pl-0 peer-[[data-state=open]]:lg:pl-[250px] peer-[[data-state=open]]:xl:pl-[300px]"
      ref={scrollRef}
    >
      <div
        className={cn('pb-[200px] pt-4 md:pt-10', className)}
        ref={messagesRef}
      >
        {messages.length ? (
          <ChatList messages={messages} isShared={false} session={session} />
        ) : (
          <EmptyScreen />
        )}
        <div className="w-full h-px" ref={visibilityRef} />
      </div>
      <ChatPanel
        id={id}
        isAtBottom={isAtBottom}
        scrollToBottom={scrollToBottom}
        onCampaignCreate={handleCampaignCreate}
        campaignId={campaignId}
      />
    </div>
  )
}
