'use client'

import { ToolContent } from 'ai'
import { useActions, useAIState, useUIState } from 'ai/rsc'
import { useContext, useEffect, useRef, useState } from 'react'

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
import { type AI } from '@/lib/chat/actions'
import { createAdset } from '@/lib/api/fasty-bot/create-adset'
import { generateAdsetTemplate } from '@/lib/data'

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
      <div>
        Please connect a campaign to this chat first...
      </div>
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
    <div className="p-6 border rounded-x">
      <div className="text-lg font-medium text-gray-900 dark:text-zinc-300 mb-2">
        Let&apos;s connect this chat to an adset:
      </div>
      {adsets.length > 0 && (
        <Select
          onValueChange={value => {
            setSelectedAdset(adsets.find(e => e.id === value))
          }}
        >
          <SelectTrigger className="SelectTrigger" aria-label="Adset">
            <SelectValue placeholder="Select an adset" />
          </SelectTrigger>
          <SelectContent>
            {adsets.map((adset: Adset) => (
              <SelectItem key={adset.id} value={adset.id}>
                {adset.name} ({adset.id})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}
      {adsets.length === 0 && (
        <div className="py-2 text-md inline-block align-middle text-center text-gray-700 dark:text-white">
          No adsets are currently available. Please create a new adset
        </div>
      )}
      <div className="flex mt-4 gap-4">
        {adsets.length > 0 && (
          <button
            aria-disabled={!selectedAdset || isSubmitting}
            onClick={async () => {
              if (selectedAdset) {
                setSubmitting(true)
                await handleSelectAdset(selectedAdset)
              }
            }}
            className="flex justify-center items-center flex-1 px-3 mr-5 py-2 text-xs font-medium text-center text-white bg-gray-700 rounded-lg hover:bg-gray-800 focus:ring-4 focus:outline-none focus:ring-gray-300 dark:bg-gray-600 dark:hover:bg-gray-700 dark:focus:ring-gray-800"
          >
            {isSubmitting && <IconSpinner />}
            {!isSubmitting && 'Connect existing adset'}
          </button>
        )}

        <button
          aria-disabled={isCreating}
          onClick={async () => {
            setCreating(true)
            await handleCreateAdset()
          }}
          className="flex justify-center items-center flex-1 px-3 py-2 text-xs align-middle font-medium text-center text-white bg-blue-700 rounded-lg hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-gray-300 dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800"
        >
          {isCreating && <IconSpinner />}
          {!isCreating && 'Create a new adset instead'}
        </button>
      </div>
    </div>
  )
}

interface ConnectAdsetProps {
  connectingUiProps?: {
    adset: Adset
    success: boolean
  },
  toolCallId: string
}

export function ConnectAdset({ connectingUiProps, toolCallId }: ConnectAdsetProps) {
  const [aiState, setAIState] = useAIState()
  const { submitUserMessage, syncMessages } = useActions()
  console.log('connectingUiProps', connectingUiProps)
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
        content?.slice(0, 18) === 'Adset is connected'
      ) {
        if (shouldSendSilentMessage.current) {
          setTimeout(refresh, 0)
          shouldSendSilentMessage.current = false
        }
      }
    }
  }, [aiMessages])

  async function handleAdsetSelection(adset: Adset) {
    console.log('handleAdsetSelection', adset)
    setConnectingUI(
      <div className="inline-flex items-start gap-1 md:items-center">
        {spinner}
        <p>Connecting to {adset.name}...</p>
      </div>
    )
    try {
      const updateSuccess = await updateChat(
        aiState.chatId,
        { fbAdsetId: adset.id }
      )
      if (updateSuccess?.success) {
        shouldSendSilentMessage.current = true
        setConnectingUI(
          <ConnectAdsetResult
            success={!!updateSuccess?.success}
            adset={adset}
          />
        )
        console.log('toolCallId', toolCallId)
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
          <SystemMessage>
            Please check your connection and try again.
          </SystemMessage>
        )
      }
    } catch (error) {
      setConnectingUI(
        <SystemMessage>
          Please check your connection and try again.
        </SystemMessage>
      )
    }
  }

  return connectingUI ?? (
    <ConnectAdsetForm 
      handleSelectAdset={handleAdsetSelection} 
    />
  )
}
