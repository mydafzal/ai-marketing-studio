'use client'

import { useActions, useAIState, useUIState } from 'ai/rsc'
import { format } from 'date-fns'
import { useContext, useEffect, useRef, useState } from 'react'
import { spinner, SystemMessage } from '@/components/stocks'

import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem
} from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { updateChatFbCampaignId, updateChatFbPageId } from '@/app/actions'
import { ConnectCampaignAdvancedResult } from '@/components/connect-campaign-advanced-result'
import { CampaignContext } from '@/components/contexts/campaign-context'
import { IconSpinner } from '@/components/ui/icons'
import { FbCampaign, FbPageAccount, Message } from '@/lib/types'
import { type AI } from '@/lib/chat/actions'

interface ConnectCampaignFormProps {
  handleSelectCampaign: (
    campaign: FbCampaign,
    pageAccount: FbPageAccount
  ) => Promise<void>
}

export function ConnectCampaignForm({
  handleSelectCampaign
}: ConnectCampaignFormProps) {
  const [selectedCampaign, setSelectedCampaign] = useState<FbCampaign>()
  const [selectedPageAccount, setSelectedPageAccount] =
    useState<FbPageAccount>()
  const [isSubmitting, setSubmitting] = useState<boolean>(false)
  const [isCreating, setCreating] = useState<boolean>(false)
  const [showCampaignError, setShowCampaignError] = useState<boolean>(false)
  const [showPageError, setShowPageError] = useState<boolean>(false)

  const { campaigns, pageAccounts, getCampaignList } =
    useContext(CampaignContext)
  const [showModal, setShowModal] = useState(false)

  const [campaignName, setCampaignName] = useState('')
  const handleCreateCampaign = async () => {
    if (!selectedPageAccount) return
    setShowModal(false)
    const createData = {
      name: campaignName,
      status: 'PAUSED'
    }
    const url = '/api/fasty-bot/proxy-create-campaign'
    const responseStream = await fetch(url, {
      method: 'POST',
      body: JSON.stringify({
        objective: 'OUTCOME_LEADS',
        special_ad_categories: ['NONE'],
        ...createData
      })
    })
    const response = await responseStream.json()
    if (response.success && response.data.id) {
      await handleSelectCampaign(
        {
          ...response.data,
          ...createData,
          created_time: Date.toString()
        },
        selectedPageAccount
      )
      await getCampaignList()
    }
    setCampaignName('')
  }
  const confirmEnterName = () => {
    setShowModal(true)
  }
  const resetErrorMessages = () => {
    setShowPageError(false)
    setShowCampaignError(false)
  }
  const vaildateForm = (type = 'connect') => {
    setShowPageError(!selectedPageAccount)
    if (type === 'connect') {
      setShowCampaignError(!selectedCampaign)
    } else {
      setShowCampaignError(false)
    }
  }
  return (
    <>
      <div className="text-lg font-medium text-gray-900 dark:text-zinc-300 mb-2">
        Let&apos;s connect this chat to a campaign:
      </div>
      {campaigns.length > 0 && (
        <div className="mb-4">
          <Label className="dark:text-zinc-200">Select a Campaign:</Label>
          <Select
            onValueChange={value => {
              setSelectedCampaign(campaigns.find(e => e.id === value))
              resetErrorMessages()
            }}
          >
            <SelectTrigger
              className={showCampaignError ? 'border-rose-500' : ''}
              aria-label="Food"
            >
              <SelectValue placeholder="Select a campaign" />
            </SelectTrigger>
            <SelectContent>
              {campaigns.map((campaign: FbCampaign) => {
                const created_time = format(
                  new Date(campaign.created_time),
                  'MMM d, yyyy HH:mm'
                )
                return (
                  <SelectItem key={campaign.id} value={campaign.id}>
                    {campaign.name} - {campaign.status} ({created_time})
                  </SelectItem>
                )
              })}
            </SelectContent>
          </Select>
          {showCampaignError && (
            <div className="py-2 text-xs inline-block align-middle text-center text-rose-500 dark:text-rose-500">
              Please select a campagin before connecting.
            </div>
          )}
        </div>
      )}

      {pageAccounts.length > 0 && (
        <div className="mb-4">
          <Label className="dark:text-zinc-200">Select a Business Page:</Label>

          <Select
            onValueChange={value => {
              setSelectedPageAccount(pageAccounts.find(e => e.id === value))
              resetErrorMessages()
            }}
          >
            <SelectTrigger
              className={showPageError ? 'border-rose-500' : ''}
              aria-label="Food"
            >
              <SelectValue placeholder="Select a page" />
            </SelectTrigger>
            <SelectContent>
              {pageAccounts.map((pageAccount: FbPageAccount) => {
                return (
                  <SelectItem key={pageAccount.id} value={pageAccount.id}>
                    {pageAccount.name} - ({pageAccount.id})
                  </SelectItem>
                )
              })}
            </SelectContent>
          </Select>
          {showPageError && (
            <div className="py-2 text-xs inline-block align-middle text-center text-rose-500 dark:text-rose-500">
              Please select a business page before creating a new campaign
            </div>
          )}
        </div>
      )}
      {pageAccounts.length === 0 && (
        <div className="py-2 text-md inline-block align-middle  text-center text-gray-700 dark:text-white">
          No page are currently available.
        </div>
      )}

      <div className="flex mt-4 gap-4">
        {campaigns.length > 0 && (
          <button
            aria-disabled={!selectedCampaign || isSubmitting}
            onClick={async () => {
              if (selectedCampaign && selectedPageAccount) {
                setSubmitting(true)
                await handleSelectCampaign(
                  selectedCampaign,
                  selectedPageAccount
                )
              } else {
                vaildateForm()
              }
            }}
            className="flex justify-center items-center flex-1 px-3 mr-5 py-2 text-xs  font-medium text-center text-white bg-gray-700 rounded-lg hover:bg-gray-800 focus:ring-4 focus:outline-none focus:ring-gray-300 dark:bg-gray-600 dark:hover:bg-gray-700 dark:focus:ring-gray-800"
          >
            {isSubmitting && <IconSpinner />}
            {!isSubmitting && 'Connect existing campaign'}
          </button>
        )}

        <button
          aria-disabled={isCreating}
          onClick={async () => {
            if (selectedPageAccount) {
              confirmEnterName()
            } else {
              vaildateForm('create')
            }
          }}
          className="flex justify-center items-center flex-1 px-3 py-2 text-xs align-middle font-medium text-center text-white bg-blue-700 rounded-lg hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-gray-300 dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800"
        >
          {isCreating && <IconSpinner />}
          {!isCreating && 'Create a new campaign instead'}
        </button>
      </div>
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
          <div className="bg-white dark:bg-zinc-800 p-4 rounded-lg w-full max-w-md">
            <h3 className="text-lg font-bold mb-4 dark:text-white">
              Campaign Name
            </h3>
            <div className="mb-4">
              <Label className="dark:text-zinc-200">Campaign Name:</Label>
              <Input
                value={campaignName}
                onChange={e => setCampaignName(e.target.value)}
                placeholder="Enter campaign name"
                className="dark:bg-zinc-700 dark:text-zinc-200"
              />
            </div>

            <div className="text-right">
              <Button
                onClick={() => {
                  setShowModal(false)
                }}
                className="mr-2"
              >
                Cancel
              </Button>
              <Button
                disabled={campaignName.trim().length === 0}
                onClick={async () => {
                  setCreating(true)
                  await handleCreateCampaign()
                }}
              >
                Create
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

interface ConnectCampaignAdvancedProps {
  connectingUiProps?: {
    campaignName: string
    pageName: string
    success: boolean
  }
}

export function ConnectCampaignAdvanced({
  connectingUiProps
}: ConnectCampaignAdvancedProps) {
  const [aiState, setAIState] = useAIState()
  const { submitUserMessage } = useActions()
  const [connectingUI, setConnectingUI] = useState<null | React.ReactNode>(
    connectingUiProps ? (
      <ConnectCampaignAdvancedResult {...connectingUiProps} />
    ) : null
  )
  const [_, setMessages] = useUIState<typeof AI>()
  const { setId: setCampaignId } = useContext(CampaignContext)

  const aiMessages = aiState.messages
  const shouldSendSilentMessage = useRef(false)

  useEffect(() => {
    async function refresh() {
      const responseMessage = await submitUserMessage(
        'Okay, I connected campaign',
        [],
        true
      )
      setMessages(currentMessages => [...currentMessages, responseMessage])
    }
    if (aiMessages.length) {
      const { content, id, role } = aiMessages[0]
      if (
        role === 'system' &&
        id === 'campaign-info-data' &&
        content?.slice(0, 21) === 'Campaign is connected'
      ) {
        if (shouldSendSilentMessage.current) {
          // this is a workaround, campaign info data is replaced if I do not use setTimeout
          setTimeout(refresh, 0)
          shouldSendSilentMessage.current = false
        }
      }
    }
  }, [aiMessages])

  async function handleCampaignSelection(
    campaign: FbCampaign,
    pageAccount: FbPageAccount
  ) {
    setConnectingUI(
      <div className="inline-flex items-start gap-1 md:items-center">
        {spinner}
        <p>Connecting to {campaign.name}...</p>
      </div>
    )
    try {
      const updateSuccess = await updateChatFbCampaignId(
        aiState.chatId,
        campaign.id
      )
      const updatePageSuccess = await updateChatFbPageId(
        aiState.chatId,
        pageAccount.id
      )

      if (updateSuccess?.success && updatePageSuccess?.success) {
        shouldSendSilentMessage.current = true
        setCampaignId(campaign.id)
        setConnectingUI(
          <ConnectCampaignAdvancedResult
            success={!!updateSuccess?.success}
            campaignName={campaign.name}
            pageName={pageAccount.name}
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
                  content.toolName === 'showCampaignConnectionUIAdvanced'
                ) {
                  content.result = {
                    ...(content.result as Object),
                    connectingUiProps: (
                      content.result as { connectingUiProps: object }
                    ).connectingUiProps ?? {
                      success: !!updateSuccess?.success,
                      campaignName: campaign.name,
                      pageName: pageAccount.name
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
        <div className="p-6  border rounded-x">
          <ConnectCampaignForm handleSelectCampaign={handleCampaignSelection} />
        </div>
      )}
    </>
  )
}
