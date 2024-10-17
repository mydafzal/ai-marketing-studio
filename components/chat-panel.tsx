import { TextPart, ImagePart } from 'ai'
import { useAIState, useActions, useUIState } from 'ai/rsc'
import { nanoid } from 'nanoid'
import * as React from 'react'

import { shareChat } from '@/app/actions'
import { Button } from '@/components/ui/button'
import { PromptForm } from '@/components/prompt-form'
import { ButtonScrollToBottom } from '@/components/button-scroll-to-bottom'
import { IconShare } from '@/components/ui/icons'
import { FooterText } from '@/components/footer'
import { ChatShareDialog } from '@/components/chat-share-dialog'
import type { AI } from '@/lib/chat/actions'
import { UserMessage } from './stocks/message'
import { FloatingButton } from './floating-button'
import { TaskPalette } from './task-palette'


const exampleMessages = [
  {
    heading: 'I want to create a campaign to generate leads',
    subheading: 'Create a new campaign with Reeply AI',
    message: `I want to create a campaign to generate leads`
  },
  {
    heading: 'What are the results of my campaign?',
    subheading: 'Check the results of your campaign',
    message: 'What are the results of my campaign for today?'
  },
  {
    heading: 'I would like to change my campaign budget',
    subheading: 'Change the daily ad spent for your campaign',
    message: `I would like to change my campaign budget`
  },
  {
    heading: 'What are some Tipps you can give me for my campaigns?',
    subheading: `Learn more about how to improve your campaigns`,
    message: `I would like to learn about some tipps on how I can improve my campaigns`
  }
]

export interface ChatPanelProps {
  id?: string
  title?: string
  isAtBottom: boolean
  scrollToBottom: () => void
  onCampaignCreate: (campaignId: string) => Promise<void>
  campaignId: string | null
}

export function ChatPanel({
  id,
  title,
  isAtBottom,
  scrollToBottom,
  onCampaignCreate,
  campaignId,
}: ChatPanelProps) {
  const [aiState] = useAIState()
  const [messages, setMessages] = useUIState<typeof AI>()
  const { submitUserMessage } = useActions()
  const [shareDialogOpen, setShareDialogOpen] = React.useState(false)
  const [showTaskPalette, setShowTaskPalette] = React.useState(false)

  const sendMessage = React.useCallback(async (message: string, userContent?: (TextPart | ImagePart)[]) => {
    // Optimistically add user message UI
    setMessages(currentMessages => [
      ...currentMessages,
      {
        id: nanoid(),
        display: <UserMessage userContent={userContent}>{message}</UserMessage>
      }
    ])

    // Submit and get response message
    const responseMessage = await submitUserMessage(message, userContent);
    setMessages(currentMessages => [...currentMessages, responseMessage])
  }, [])

  return (
    <>
      <div className="fixed inset-x-0 bottom-0 w-full bg-gradient-to-b from-muted/30 from-0% to-muted/30 to-50% duration-300 ease-in-out animate-in dark:from-background/10 dark:from-10% dark:to-background/80 peer-[[data-state=open]]:group-[]:lg:pl-[250px] peer-[[data-state=open]]:group-[]:xl:pl-[300px]">
        <ButtonScrollToBottom
          isAtBottom={isAtBottom}
          scrollToBottom={scrollToBottom}
        />

        <div className="mx-auto sm:max-w-2xl sm:px-4">
          <div className="mb-4 grid grid-cols-2 gap-2 px-4 sm:px-0">
            {messages.length === 0 &&
              exampleMessages.map((example, index: number) => (
                <div
                  key={example.heading}
                  className={`cursor-pointer rounded-lg border bg-white p-4 hover:bg-zinc-50 dark:bg-zinc-950 dark:hover:bg-zinc-900 ${
                    index > 1 && 'hidden md:block'
                  }`}
                  onClick={async () => {
                    await sendMessage(example.message)
                  }}
                >
                  <div className="text-sm font-semibold">{example.heading}</div>
                  <div className="text-sm text-zinc-600">
                    {example.subheading}
                  </div>
                </div>
              ))}
          </div>

          {messages?.length >= 2 ? (
            <div className="flex h-12 items-center justify-center">
              <div className="flex space-x-2">
                {id && title ? (
                  <>
                    <Button
                      variant="outline"
                      onClick={() => setShareDialogOpen(true)}
                    >
                      <IconShare className="mr-2" />
                      Share
                    </Button>
                    <ChatShareDialog
                      open={shareDialogOpen}
                      onOpenChange={setShareDialogOpen}
                      onCopy={() => setShareDialogOpen(false)}
                      shareChat={shareChat}
                      chat={{
                        id,
                        title,
                        messages: aiState.messages
                      }}
                    />
                  </>
                ) : null}
              </div>
            </div>
          ) : null}

          <div className="space-y-4 border-t bg-background px-4 py-2 shadow-lg sm:rounded-t-xl sm:border md:py-4">
            <PromptForm onSendMessage={sendMessage} />
            <FooterText className="hidden sm:block" />
          </div>
        </div>
        <FloatingButton onClick={() => setShowTaskPalette(true)} />
      </div>
      {showTaskPalette && <TaskPalette />}
    </>
  )
}
