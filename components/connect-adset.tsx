'use client'

import { useActions, useAIState, useUIState } from 'ai/rsc'
import { useContext, useEffect, useRef, useState } from 'react'
import { spinner, SystemMessage } from '@/components/stocks'

import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem
} from '@/components/ui/select'

import { fetchChatCampaignBudget, getUserDetail, updateChatFbAdsetId } from '@/app/actions'
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
  const [selectedAdset, setSelectedAdset] = useState<Adset>()
  const [isSubmitting, setSubmitting] = useState<boolean>(false)
  const [isCreating, setCreating] = useState<boolean>(false)
  const campaignContext = useContext(CampaignContext)
  console.log('campaignContext', campaignContext)
  const { adsets } = campaignContext
  const [aiState, setAIState] = useAIState()

  const handleCreateAdset = async () => {
    const budget = await fetchChatCampaignBudget(aiState.chatId)
    let createData = {
        ...generateAdsetTemplate(),
        campaign_id: campaignContext.id
    } as any
    if (budget.error) {
        createData = { ...createData, daily_budget: 100 }
    }
    const adset = await createAdset(campaignContext.id as string, createData)
    if (adset && adset.id) {
      await handleSelectAdset({
        ...adset,
        ...createData,
        created_time: Date.toString()
      })
      campaignContext.fetchAdsetIds()
    }
  }

  return (
    <>
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
                {adset.id}
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
    </>
  )
}

interface ConnectAdsetProps {
  connectingUiProps?: {
    adsetId: string
    success: boolean
  }
}

export function ConnectAdset({ connectingUiProps }: ConnectAdsetProps) {
  const [aiState, setAIState] = useAIState()
  const { submitUserMessage } = useActions()
  const [connectingUI, setConnectingUI] = useState<null | React.ReactNode>(
    connectingUiProps ? <ConnectAdsetResult {...connectingUiProps} /> : null
  )
  const [_, setMessages] = useUIState<typeof AI>()
  const { adsets } = useContext(CampaignContext)

  const aiMessages = aiState.messages
  const shouldSendSilentMessage = useRef(false)

  useEffect(() => {
    async function refresh() {
      const responseMessage = await submitUserMessage(
        'Okay, I connected adset',
        [],
        true
      )
      setMessages(currentMessages => [...currentMessages, responseMessage])
    }
    if (aiMessages.length) {
      const { content, id, role } = aiMessages[0]
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
      const updateSuccess = await updateChatFbAdsetId(
        aiState.chatId,
        adset.id
      )
      if (updateSuccess?.success) {
        shouldSendSilentMessage.current = true
        setConnectingUI(
          <ConnectAdsetResult
            success={!!updateSuccess?.success}
            adsetId={adset.id}
          />
        )
        setAIState({
          ...aiState,
          messages: [
            ...aiState.messages.map((message: Message) => {
              if (message.role === 'tool') {
                const content = message.content[0]
                if (
                  content.type === 'tool-result' &&
                  content.toolName === 'showAdsetConnectionUI'
                ) {
                  content.result = {
                    ...(content.result as Object),
                    connectingUiProps: (
                      content.result as { connectingUiProps: object }
                    ).connectingUiProps ?? {
                      success: !!updateSuccess?.success,
                      adsetId: adset.id
                    }
                  }
                }
              }
              return message
            })
          ]
        })
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

  return (
    <>
      {connectingUI ? (
        connectingUI
      ) : (
        <div className="p-6 border rounded-x">
          <ConnectAdsetForm 
            handleSelectAdset={handleAdsetSelection} 
          />
        </div>
      )}
    </>
  )
}
