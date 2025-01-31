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
import { CheckCircle, Plus, Link as LinkIcon } from 'lucide-react'

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
      <Card className="bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800">
        <CardContent className="p-6">
          <div className="text-zinc-900 dark:text-zinc-200">
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
      <div className="text-xl font-semibold text-zinc-900 dark:text-zinc-200 mb-4">
        Connect to Ad Set
      </div>
      <div className="text-sm text-zinc-600 dark:text-zinc-400 mb-6">
        Select an existing ad set or create a new one for your campaign
      </div>
      
      {adsets.length > 0 ? (
        <div className="space-y-6">
          <Select
            onValueChange={value => {
              setSelectedAdset(adsets.find(e => e.id === value))
            }}
          >
            <SelectTrigger 
              className={cn(
                "w-full h-12",
                "bg-white dark:bg-zinc-800",
                "border-zinc-200 dark:border-zinc-700",
                "text-zinc-900 dark:text-zinc-200"
              )}
              aria-label="Select Ad Set"
            >
              <SelectValue placeholder="Select an ad set" />
            </SelectTrigger>
            <SelectContent className="bg-white dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700">
              {adsets.map((adset: Adset) => (
                <SelectItem 
                  key={adset.id} 
                  value={adset.id}
                  className="text-zinc-900 dark:text-zinc-200 focus:bg-zinc-100 dark:focus:bg-zinc-700"
                >
                  <div className="flex flex-col">
                    <span>{adset.name}</span>
                    <span className="text-xs text-zinc-500 dark:text-zinc-400">
                      ID: {adset.id}
                    </span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

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
                'text-zinc-900 dark:text-zinc-200 font-medium rounded-lg',
                'bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700',
                'hover:bg-zinc-100 dark:hover:bg-zinc-700',
                'transition-colors duration-200',
                'disabled:opacity-50 disabled:cursor-not-allowed',
                'focus:outline-none focus:ring-2 focus:ring-blue-500'
              )}
            >
              {isSubmitting ? (
                <IconSpinner className="size-5" />
              ) : (
                <>
                  <LinkIcon className="size-4" />
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
                'text-white font-medium rounded-lg',
                'bg-blue-600 hover:bg-blue-700',
                'transition-colors duration-200',
                'disabled:opacity-50 disabled:cursor-not-allowed',
                'focus:outline-none focus:ring-2 focus:ring-blue-500'
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
        <div className="py-8 text-center bg-zinc-100/50 dark:bg-zinc-800/50 rounded-lg border border-zinc-200 dark:border-zinc-700">
          <div className="text-zinc-600 dark:text-zinc-400 mb-4">
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
              'text-white font-medium rounded-lg',
              'bg-blue-600 hover:bg-blue-700',
              'transition-colors duration-200',
              'disabled:opacity-50 disabled:cursor-not-allowed',
              'focus:outline-none focus:ring-2 focus:ring-blue-500'
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
    <Card className="bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800">
      <CardContent className="p-6">
        <div className="flex items-center gap-3">
          <IconSpinner className="size-5 text-blue-600 dark:text-blue-500" />
          <span className="text-zinc-900 dark:text-zinc-200">
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
          <Card className="bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800">
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <CheckCircle className="size-6 text-green-600 dark:text-green-500 shrink-0" />
                <div>
                  <div className="text-zinc-900 dark:text-zinc-200 font-medium">
                    Successfully connected to ad set
                  </div>
                  <div className="text-zinc-600 dark:text-zinc-400 text-sm">
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
          <Card className="bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800">
            <CardContent className="p-6">
              <div className="text-red-600 dark:text-red-400">
                Connection failed. Please check your connection and try again.
              </div>
            </CardContent>
          </Card>
        )
      }
    } catch (error) {
      setConnectingUI(
        <Card className="bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800">
          <CardContent className="p-6">
            <div className="text-red-600 dark:text-red-400">
              Connection failed. Please check your connection and try again.
            </div>
          </CardContent>
        </Card>
      )
    }
  }

  return (
    <Card className="bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800">
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