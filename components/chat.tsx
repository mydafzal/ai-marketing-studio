'use client'

import { cn } from '@/lib/utils'
import { ChatList } from '@/components/chat-list'
import { ChatPanel } from '@/components/chat-panel'
import { EmptyScreen } from '@/components/empty-screen'
import { useLocalStorage } from '@/lib/hooks/use-local-storage'
import { useEffect, useRef, useCallback, useState } from 'react'
import { useUIState, useAIState } from 'ai/rsc'
import { Message, Session } from '@/lib/types'
import { useScrollAnchor } from '@/lib/hooks/use-scroll-anchor'
import { toast } from 'sonner'
import { getCampaignSummary } from '@/lib/api/fasty-bot/get-campaign-summary'
import { createCampaign } from '@/lib/api/fasty-bot/create-campaign'
import { fetchChatFbCampaignId, getChat, updateChatTitle } from '@/app/actions'

export interface ChatProps extends React.ComponentProps<'div'> {
  initialMessages?: Message[]
  id?: string
  session?: Session
  missingKeys: string[]
}

export function Chat({ id, className, session, missingKeys }: ChatProps) {
  const [messages] = useUIState()
  const [aiState, setAIState] = useAIState()
  const lastUpdatedRef = useRef<Date | null>(null)
  const [_, setNewChatId] = useLocalStorage('newChatId', id)

  const fetchSummaryData = useCallback(async () => {
    try {
      const summary = await getCampaignSummary()
      if (summary && summary.campaign_id !== '0') {
        if(session){
          const chat = await getChat(aiState.chatId, session.user.id);
          console.log('chat', chat)
          console.log('summary', summary)
          if(chat?.title !== summary.campaign_name){
              await updateChatTitle(aiState.chatId, summary.campaign_name);
          }
        }
       
        setAIState((aiState: any) => ({
          ...aiState,
          messages: [
            ...aiState.messages,
            {
              id: 'campaign-info-data',
              role: 'system',
              content: `Knowledge Base about current campaign infomations: ${JSON.stringify(summary)}`
            }
          ]
        }))
        lastUpdatedRef.current = new Date()
      }
    } catch (error) {
      console.error('Error fetching campaign data:', error)
    }
  }, [])

  const createNewCampaign = async (defaultName: string): Promise<string | false> => {
    const response = await createCampaign({
      chatSlug: aiState.chatId,
      name: defaultName,
      objective: 'OUTCOME_LEADS',
      status: 'PAUSED',
      special_ad_categories: ['NONE']
    })
    if (response.success && response.data.id) {
      return response.data.id
    }
    return false
  }

  const fetchCampaignId = useCallback(async (chatId: string) => {
    if (!lastUpdatedRef.current){
      const result = await fetchChatFbCampaignId(chatId);
      if(result.success){
        fetchSummaryData()
      }
    }
  }, [lastUpdatedRef, fetchSummaryData])
  
  useEffect(() => {
    fetchCampaignId(aiState.chatId);
  },[aiState, fetchCampaignId, lastUpdatedRef])

  useEffect(() => {
    const oneHour = 60 * 60 * 1000
    const fiveMins = 5 * 60 * 1000
    const interval = setInterval(() => {
      if (
        lastUpdatedRef.current &&
        new Date().getTime() - lastUpdatedRef.current.getTime() > oneHour
      ) {
        fetchSummaryData()
      }
    }, fiveMins)

    return () => clearInterval(interval)
  }, [])

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
        createNewCampaign={createNewCampaign}
      />
    </div>
  )
}
