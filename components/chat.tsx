'use client'

import { useUIState, useAIState } from 'ai/rsc'
import { useContext, useCallback, useEffect } from 'react'
import { toast } from 'sonner'

import { fetchChatFbCampaignId, updateChatFbCampaignId, updateChatTitle } from '@/app/actions'
import { CampaignContext, CampaignContextProvider } from '@/components/contexts/campaign-context'
import { ChatList } from '@/components/chat-list'
import { ChatPanel } from '@/components/chat-panel'
import { EmptyScreen } from '@/components/empty-screen'
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

function ChatCore({ id, chat, className, session, missingKeys }: ChatProps) {
  const [messages] = useUIState()
  const [aiState, setAIState] = useAIState()
  const [_, setNewChatId] = useLocalStorage('newChatId', id)
  const { id: campaignId, setId: setCampaignId, summary: campaignSummary } = useContext(CampaignContext)
  console.log('aiState.messages', aiState.messages)

  useEffect(() => {
    if (!aiState.messages.length) {
      setAIState((aiState: any) => ({
        ...aiState,
        messages: [
            {
                id: 'campaign-info-data',
                role: 'system',
                content: 'No campaign is connected to this chat. You should always show UI to connect a campaign to the chat when user asks about one of "setting campaign budget", "changing campaign budget" "campaign result" and "campaign status".',
                timestamp: new Date().toISOString() 
            }
        ]
    }))
    }
  }, []);

  useEffect(() => {
    if (campaignSummary && campaignSummary.campaign_id !== '0') {
      const updateTitle = async () => {
        await updateChatTitle(aiState.chatId, campaignSummary.campaign_name)
        // dispatch is for only optimistic update
        window.dispatchEvent(new CustomEvent("update-chat-title", {
          detail: {
            campaignId: campaignSummary.campaign_id,
            campaignName: campaignSummary.campaign_name
          }
        }))
      }

      if (chat?.title && chat.title !== campaignSummary.campaign_name) {
        void updateTitle()
      }
    }
  }, [campaignSummary, chat])

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
  },[campaignId, id])

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

  const handleCampaignCreated = useCallback(async (campaignId: string) => {
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
          <ChatList messages={messages} isShared={false} session={session}/>
        ) : (
          <EmptyScreen />
        )}
        <div className="w-full h-px" ref={visibilityRef} />
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
  <CampaignContextProvider>
    <ChatCore {...chatProps} />
  </CampaignContextProvider>
)
