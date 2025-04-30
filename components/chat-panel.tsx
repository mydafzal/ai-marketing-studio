import { TextPart, ImagePart, FilePart } from 'ai'
import { useAIState, useActions, useUIState } from 'ai/rsc'
import { nanoid } from 'nanoid'
import * as React from 'react'
import { trackEvent } from '@/lib/utils'

import { shareChat } from '@/app/actions'
import { Button } from '@/components/ui/button'
import { PromptForm } from '@/components/prompt-form'
import { ButtonScrollToBottom } from '@/components/button-scroll-to-bottom'
import { IconShare, IconArrowRight, IconMessageCircle } from '@/components/ui/icons'
import { FooterText } from '@/components/footer'
import { ChatShareDialog } from '@/components/chat-share-dialog'
import type { AI } from '@/lib/chat/AIManager'
import { UserMessage } from './stocks/message'
import { FloatingButton } from './floating-button'
import { TaskPalette } from './task-palette'
import {isFeatureToggleEnabled} from "@/lib/helpers/feature-toggle/feature-toggle-manager";
import useAccountStore from "@/app/store/useAccountStore";
import { useUsageStore } from "@/app/store/useUsageStore";
import { UpgradeModal } from '@/components/upgrade-modal';


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
    heading: 'What are some Tips you can give me for my campaigns?',
    subheading: `Learn more about how to improve your campaigns`,
    message: `I would like to learn about some tips on how I can improve my campaigns`
  }
]

export interface ChatPanelProps {
  id?: string
  title?: string
  isAtBottom: boolean
  scrollToBottom: () => void
  onCampaignCreate: (campaignId: string) => Promise<void>
  campaignId: string | null
  session?: { user?: { email?: string; id?: string } }
}

export function ChatPanel({
  id,
  title,
  isAtBottom,
  scrollToBottom,
  onCampaignCreate,
  campaignId,
  session
}: ChatPanelProps) {
  const [aiState] = useAIState()
  const [messages, setMessages] = useUIState<typeof AI>()
  const { submitUserMessage } = useActions()
  const [shareDialogOpen, setShareDialogOpen] = React.useState(false)
  const [isTaskPaletteOpen, setIsTaskPaletteOpen] = React.useState(false)
  const [showUpgradeModal, setShowUpgradeModal] = React.useState(false)
  
  let isUserGuideButtonEnabled = isFeatureToggleEnabled("userGuideFloatingButton")
  const { isFbAccountConnected } = useAccountStore();
  
  // Usage store for checking message limits
  const { 
    isMessageLimitReached, 
    messageCount,
    incrementMessageCount 
  } = useUsageStore();
  
  const sendMessage = React.useCallback(async (message: string, userContent?: (TextPart | ImagePart | FilePart)[]) => {
    // Check for message limit in PromptForm now handles this check separately
    // This is just a safeguard for programmatic calls
    if (isMessageLimitReached) {
      setShowUpgradeModal(true);
      return;
    }
    
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

    setMessages(currentMessages => [...currentMessages, responseMessage])
    
    // Note: incrementMessageCount is handled by the calling component to avoid double counting
    // The PromptForm component handles incrementing for normal input
    // The example buttons and showMe functions handle incrementing for those cases
  }, [isMessageLimitReached, setShowUpgradeModal, session, id, submitUserMessage, setMessages])

  const handleShowMe = async (prompt: string) => {
    // Check if message limit has been reached
    if (isMessageLimitReached) {
      // Show upgrade modal instead of sending message
      setShowUpgradeModal(true);
      return;
    }
    
    // Send message and increment counter
    await sendMessage(prompt);
    await incrementMessageCount();
  }

  const handleExampleClick = React.useCallback(async (example: string) => {
    // Check if message limit has been reached
    if (isMessageLimitReached) {
      // Show upgrade modal instead of sending message
      setShowUpgradeModal(true);
      return;
    }

    await trackEvent('example_message_clicked', 
      { email: session?.user?.email || '', id: session?.user?.id || '' },
      { message: example }
    );
    
    // Send message and increment counter
    await sendMessage(example);
    await incrementMessageCount();
  }, [sendMessage, session, isMessageLimitReached, incrementMessageCount])

  return (
    <>
      {/* Upgrade Modal */}
      <UpgradeModal 
        isOpen={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
        usageType="messages"
        currentCount={messageCount}
      />
      
      <div className="fixed inset-x-0 bottom-0 w-full bg-gradient-to-b from-deep-black/90 from-0% to-deep-black to-50% duration-300 ease-in-out animate-in peer-[[data-state=open]]:group-[]:lg:pl-[250px] peer-[[data-state=open]]:group-[]:xl:pl-[300px] md:pb-0">
        {/* Hidden element to ensure proper spacing when keyboard appears on mobile */}
        <div className="mobile-keyboard-spacer h-0 md:hidden"></div>
        
        <ButtonScrollToBottom
          isAtBottom={isAtBottom}
          scrollToBottom={scrollToBottom}
        />

        { isFbAccountConnected && <div className="mx-auto sm:max-w-2xl sm:px-4">
          <div className="mb-6 grid grid-cols-2 gap-4 px-4 sm:px-0">
            {messages.length === 0 &&
              exampleMessages.map((example, index: number) => (
                <div
                  key={example.heading}
                  className={`cursor-pointer rounded-xl border border-border-dark bg-container-bg p-5 hover:bg-light-container transition-all duration-200 shadow-sm ${
                    index > 1 && 'hidden md:block'
                  }`}
                  onClick={() => handleExampleClick(example.message)}
                >
                  <div className="text-sm font-bold text-text-white mb-1">{example.heading}</div>
                  <div className="text-xs text-text-light-gray">
                    {example.subheading}
                  </div>
                  <div className="mt-3 w-full flex justify-end">
                    <div className="h-6 w-6 rounded-full bg-primary-green flex items-center justify-center">
                      <IconArrowRight className="h-3 w-3 text-deep-black" />
                    </div>
                  </div>
                </div>
              ))}
          </div>

          <div className={`flex ${id && title && "h-12"} items-center justify-center mb-4`}>
            <div className="flex space-x-2">
              {messages?.length >= 2 && id && title ? (
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
                    shareChat={shareChat as (id: string) => Promise<any>}
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

          <div className="space-y-4 border-t border-border-dark bg-light-container px-4 py-2 shadow-lg sm:rounded-t-xl sm:border md:py-4">
            <PromptForm onSendMessage={sendMessage} />
            <FooterText className="hidden sm:block" />
          </div>
        </div>
        }
        {isUserGuideButtonEnabled && <FloatingButton onClick={() => setIsTaskPaletteOpen(true)} />}
        {isUserGuideButtonEnabled && <TaskPalette
            isOpen={isTaskPaletteOpen}
            onClose={() => setIsTaskPaletteOpen(false)}
            onShowMe={handleShowMe}
        />}
      </div>
    </>
  )
}
