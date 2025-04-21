'use client'

import { ToolContent } from 'ai'
import { useActions, useAIState, useUIState } from 'ai/rsc'
import { useContext, useEffect, useRef, useState } from 'react'
import { cn } from '@/lib/utils'

import { fetchChatCampaignBudget, updateChat } from '@/app/actions'
import { spinner, SystemMessage } from '@/components/stocks'
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem
} from '@/components/ui/select'
import { ConnectAdsetResult } from '@/components/connect-adset-result'
import { CampaignContext } from '@/components/contexts/campaign-context'
import { IconSpinner } from '@/components/ui/icons'
import { Adset, Message } from '@/lib/types'
import { type AI } from '@/lib/chat/AIManager'
import { createAdset } from '@/lib/api/fasty-bot/create-adset'
import { generateAdsetTemplate } from '@/lib/data'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { CheckCircle, Plus, Link as LinkIcon, XCircle } from 'lucide-react'

interface ConnectAdsetFormProps {
  handleSelectAdset: (adset: Adset) => Promise<void>
}

export function ConnectAdsetForm({
  handleSelectAdset,
}: ConnectAdsetFormProps) {
  const [aiState] = useAIState()
  const [selectedAdset, setSelectedAdset] = useState<Adset>()
  const [isSubmitting, setSubmitting] = useState<boolean>(false)
  const [isCreating, setCreating] = useState<boolean>(false)
  const { campaign, adsets, fetchAdsets, setAdset } = useContext(CampaignContext)

  if (!campaign) {
    return (
      <Card className="bg-[#1A1D29] border-[#2A2E3A]">
        <CardContent className="p-6">
          <div className="text-white">
            Please connect a campaign to this chat first...
          </div>
        </CardContent>
      </Card>
    )
  }

  const handleCreateAdset = async () => {
    let adsetTemplate = {
      ...generateAdsetTemplate(),
      campaign_id: campaign.id
    } as any
    const budget = await fetchChatCampaignBudget(aiState.chatId)
    if (!campaign.daily_budget && budget.error) {
      adsetTemplate = { ...adsetTemplate, daily_budget: 100 }
    }
    const adset = await createAdset(campaign.id as string, adsetTemplate)
    if (adset && adset.id) {
      setAdset(adset)
      await handleSelectAdset({
        ...adset,
        ...adsetTemplate,
        created_time: Date.toString()
      })
      fetchAdsets()
    }
  }

  return (
    <>
      <div className="text-xl font-semibold text-white mb-4">
        Connect to Ad Set
      </div>
      <div className="text-sm text-[#ADB0B8] mb-6">
        Select an existing ad set or create a new one for your campaign
      </div>
      
      {adsets.length > 0 ? (
        <div className="space-y-6">
          <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
            {adsets.map((adset: Adset) => {
              const isActive = adset.status === 'ACTIVE';
              
              return (
                <div 
                  key={adset.id}
                  onClick={() => setSelectedAdset(adset)}
                  className={cn(
                    'flex items-center p-3 rounded-lg border transition-colors cursor-pointer',
                    selectedAdset?.id === adset.id 
                      ? 'border-[#4BF29C] bg-[#151925]' 
                      : 'border-[#2A2E3A] bg-[#0A0C14] hover:bg-[#151925]'
                  )}
                >
                  <div className="mr-3 flex-shrink-0">
                    <div className={cn(
                      'w-3 h-3 rounded-full',
                      isActive ? 'bg-[#4BF29C]' : 'bg-[#8A8F99]'
                    )}>
                    </div>
                  </div>
                  <div className="flex-1">
                    <div className="flex flex-col">
                      <span className="text-white font-medium">{adset.name}</span>
                      <span className="text-xs text-[#8A8F99]">
                        {adset.status || 'Unknown status'} • ID: {adset.id.substring(0, 10)}...
                      </span>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          <div className="flex gap-4">
            <button
              disabled={!selectedAdset || isSubmitting}
              onClick={async () => {
                if (selectedAdset) {
                  setSubmitting(true)
                  await handleSelectAdset(selectedAdset)
                }
              }}
              className={cn(
                'flex justify-center items-center gap-2 flex-1 h-12 px-6',
                'text-white font-medium rounded-lg',
                'bg-[#151925] border border-[#2A2E3A]',
                'hover:bg-[#1E2336]',
                'transition-colors duration-200',
                'disabled:opacity-50 disabled:cursor-not-allowed',
                'focus:outline-none focus:ring-2 focus:ring-[#4BF29C]'
              )}
            >
              {isSubmitting ? (
                <IconSpinner className="size-5" />
              ) : (
                <>
                  <LinkIcon className="size-4 text-[#4BF29C]" />
                  Connect Ad Set
                </>
              )}
            </button>

            <button
              disabled={isCreating}
              onClick={async () => {
                setCreating(true)
                await handleCreateAdset()
              }}
              className={cn(
                'flex justify-center items-center gap-2 flex-1 h-12 px-6',
                'text-[#0A0C14] font-medium rounded-lg',
                'bg-[#4BF29C] hover:bg-[#3AD88C]',
                'transition-colors duration-200',
                'disabled:opacity-50 disabled:cursor-not-allowed',
                'focus:outline-none focus:ring-2 focus:ring-[#4BF29C]',
                'hidden' // Add hidden class to hide the button
              )}
            >
              {isCreating ? (
                <IconSpinner className="size-5" />
              ) : (
                <>
                  <Plus className="size-4" />
                  Create New Ad Set
                </>
              )}
            </button>
          </div>
        </div>
      ) : (
        <div className="py-8 text-center bg-[#0A0C14] rounded-lg border border-[#2A2E3A]">
          <div className="text-[#ADB0B8] mb-4">
            No ad sets available
          </div>
          <button
            disabled={isCreating}
            onClick={async () => {
              setCreating(true)
              await handleCreateAdset()
            }}
            className={cn(
              'flex justify-center items-center gap-2 mx-auto h-12 px-6',
              'text-[#0A0C14] font-medium rounded-lg',
              'bg-[#4BF29C] hover:bg-[#3AD88C]',
              'transition-colors duration-200',
              'disabled:opacity-50 disabled:cursor-not-allowed',
              'focus:outline-none focus:ring-2 focus:ring-[#4BF29C]',
              'hidden' // Add hidden class to hide the button
            )}
          >
            {isCreating ? (
              <IconSpinner className="size-5" />
            ) : (
              <>
                <Plus className="size-4" />
                Create New Ad Set
              </>
            )}
          </button>
        </div>
      )}
    </>
  )
}

interface ConnectAdsetProps {
  connectingUiProps?: {
    adset: Adset
    success: boolean
  },
  toolCallId: string
}

export function ConnectingStatus({ adsetName }: { adsetName: string }) {
  return (
    <Card className="bg-[#1A1D29] border-[#2A2E3A]">
      <CardContent className="p-6">
        <div className="flex items-center gap-3">
          <IconSpinner className="size-5 text-[#4BF29C]" />
          <span className="text-white">
            Connecting to {adsetName}...
          </span>
        </div>
      </CardContent>
    </Card>
  );
}

export function ConnectAdset({ connectingUiProps, toolCallId }: ConnectAdsetProps) {
  const [aiState, setAIState] = useAIState()
  const { submitUserMessage, syncMessages } = useActions()
  const { setAdset } = useContext(CampaignContext)
  const [connectingUI, setConnectingUI] = useState<null | React.ReactNode>(
    connectingUiProps ? <ConnectAdsetResult {...connectingUiProps} /> : null
  )
  const [_, setMessages] = useUIState<typeof AI>()
  const aiMessages = aiState.messages
  const shouldSendSilentMessage = useRef(false)

  useEffect(() => {
    async function refresh() {
      const responseMessage = await submitUserMessage(
        'Okay, I connected an adset',
        [],
        true
      )
      setMessages(currentMessages => [...currentMessages, responseMessage])
    }
    if (aiMessages.length) {
      const { content, id, role } = aiMessages[1]
      if (
        role === 'system' &&
        id === 'adset-info-data' &&
        content?.slice(0, 17) === 'Adset is selected'
      ) {
        if (shouldSendSilentMessage.current) {
          setTimeout(refresh, 0)
          shouldSendSilentMessage.current = false
        }
      }
    }
  }, [aiMessages, setMessages, submitUserMessage])

  async function handleAdsetSelection(adset: Adset) {
    setConnectingUI(<ConnectingStatus adsetName={adset.name} />)
    
    try {
      const updateSuccess = await updateChat(
        aiState.chatId,
        { fbAdsetId: adset.id }
      )
      if (updateSuccess?.success) {
        setAdset(adset);
        shouldSendSilentMessage.current = true
        setConnectingUI(
          <Card className="bg-[#1A1D29] border-[#2A2E3A]">
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <CheckCircle className="size-6 text-[#4BF29C] shrink-0" />
                <div>
                  <div className="text-white font-medium">
                    Successfully connected to ad set
                  </div>
                  <div className="text-[#ADB0B8] text-sm">
                    {adset.name}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )
        
        setAIState({
          ...aiState,
          messages: [
            aiState.messages[0],
            {
              id: 'adset-info-data',
              role: 'system',
              content: `Adset is selected for this chat, the knowledge base about the selected adset: ${JSON.stringify(adset)}`,
              timestamp: new Date().toISOString() 
            },
            ...aiState.messages.slice(
              aiState.messages[1] && aiState.messages[1].id === 'adset-info-data' ? 2 : 1
            ).map((message: Message) => {
              if (message.id === toolCallId) {
                const content = (message.content as ToolContent)[0]
                content.result = {
                  connectingUiProps: {
                    success: !!updateSuccess?.success,
                    adset,
                  }
                }
              }
              return message
            })
          ]
        })
        await syncMessages()
      } else {
        setConnectingUI(
          <Card className="bg-[#1A1D29] border-[#2A2E3A]">
            <CardContent className="p-6">
              <div className="text-red-400 flex items-center gap-3">
                <XCircle className="size-6 text-red-400 shrink-0" />
                <div>
                  <div className="font-medium">Connection failed</div>
                  <div className="text-sm text-[#ADB0B8]">Please check your connection and try again.</div>
                </div>
              </div>
            </CardContent>
          </Card>
        )
      }
    } catch (error) {
      setConnectingUI(
        <Card className="bg-[#1A1D29] border-[#2A2E3A]">
          <CardContent className="p-6">
            <div className="text-red-400 flex items-center gap-3">
              <XCircle className="size-6 text-red-400 shrink-0" />
              <div>
                <div className="font-medium">Connection failed</div>
                <div className="text-sm text-[#ADB0B8]">Please check your connection and try again.</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )
    }
  }

  return (
    <Card className="bg-[#1A1D29] border-[#2A2E3A]">
      <CardContent className="p-6">
        {connectingUI ?? (
          <ConnectAdsetForm 
            handleSelectAdset={handleAdsetSelection} 
          />
        )}
      </CardContent>
    </Card>
  )
}