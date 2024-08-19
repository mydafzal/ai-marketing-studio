'use client'

import { cn } from '@/lib/utils'
import { ChatList } from '@/components/chat-list'
import { ChatPanel } from '@/components/chat-panel'
import { EmptyScreen } from '@/components/empty-screen'
import { useLocalStorage } from '@/lib/hooks/use-local-storage'
import { useEffect, useCallback, useState } from 'react'
import { useUIState, useAIState } from 'ai/rsc'
import { Message, Session } from '@/lib/types'
import { usePathname, useRouter } from 'next/navigation'
import { useScrollAnchor } from '@/lib/hooks/use-scroll-anchor'
import { toast } from 'sonner'
import {
  getCampaignSummary
} from '@/lib/api/fasty-bot/get-campaign-summary'

export interface ChatProps extends React.ComponentProps<'div'> {
  initialMessages?: Message[]
  id?: string
  session?: Session
  missingKeys: string[]
}

export function Chat({ id, className, session, missingKeys }: ChatProps) {
  const router = useRouter()
  const path = usePathname()
  const [input, setInput] = useState('')
  const [messages] = useUIState()
  const [aiState, setAIState] = useAIState()
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)

  const [_, setNewChatId] = useLocalStorage('newChatId', id)

  useEffect(() => {
    if (session?.user) {
      if (!path.includes('chat') && messages.length === 1) {
        window.history.replaceState({}, '', `/chat/${id}`)
      }
    }
  }, [id, path, session?.user, messages])

  useEffect(() => {
    const messagesLength = aiState.messages?.length
    if (messagesLength === 2) {
      router.refresh()
    }
  }, [aiState.messages, router])

  const fetchSummaryData = useCallback(async () => {
    console.log("de");
    try {
      const summary = await getCampaignSummary()
      setAIState({
        ...aiState,
        messages: [
          ...aiState.messages,
          {
            id: 'campaign-info-data',
            role: 'system',
            content: `Knowledge Base about current campaign infomations: ${JSON.stringify(summary)}`
          }
        ]
      })
      setLastUpdated(new Date())
    } catch (error) {
      console.error('Error fetching campaign data:', error)
    }
  }, []);

  useEffect(() => {
    fetchSummaryData()
  }, [id, fetchSummaryData])

  useEffect(() => {
    const ONE_HOUR = 60 * 60 * 1000
    const now = new Date()

    if (lastUpdated && now.getTime() - lastUpdated.getTime() > ONE_HOUR) {
      fetchSummaryData()
    }

    const interval = setInterval(
      () => {
        if (
          lastUpdated &&
          new Date().getTime() - lastUpdated.getTime() > ONE_HOUR
        ) {
          fetchSummaryData()
        }
      },
      5 * 60 * 1000
    )

    return () => clearInterval(interval)
  }, [lastUpdated, fetchSummaryData])

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
        input={input}
        setInput={setInput}
        isAtBottom={isAtBottom}
        scrollToBottom={scrollToBottom}
      />
    </div>
  )
}
