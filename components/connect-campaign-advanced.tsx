'use client'

import { ToolContent } from 'ai'
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
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { updateChat } from '@/app/actions'
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
  const [isConnecting, setConnecting] = useState<boolean>(false)
  const [showCampaignError, setShowCampaignError] = useState<boolean>(false)
  const [showCampaignNameError, setShowCampaignNameError] = useState<boolean>(false)
  const [showPageError, setShowPageError] = useState<boolean>(false)
  const [formType, setFormType] = useState<'connect' | 'create'>('connect')

  const { campaigns, pageAccounts, getCampaignList } =
    useContext(CampaignContext)
  const [campaignName, setCampaignName] = useState('')
  const [isCreatingCampaign, setIsCreatingCampaign] = useState<boolean>(false)

  const handleCreateCampaign = async () => {
    if (!selectedPageAccount || !campaignName.trim()) return
    setIsCreatingCampaign(true)
    try {
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
    } catch (error) {
      console.error('Error creating campaign:', error)
    } finally {
      setIsCreatingCampaign(false)
    }
  }

  const resetErrorMessages = () => {
    setShowPageError(false)
    setShowCampaignError(false)
  }
  const setFormTypeAndValidate = (type: 'connect' | 'create') => {
    setFormType(type)
    setShowPageError(!selectedPageAccount)
    if (type === 'connect') {
      setShowCampaignError(!selectedCampaign)
      setShowCampaignNameError(false)
    } else {
      setShowCampaignError(false)
      setShowCampaignNameError(campaignName.trim().length === 0)
    }
  }

  const handleClickConnect = async () => {
    setFormTypeAndValidate('connect')
    if (selectedCampaign && selectedPageAccount) {
      setConnecting(true)
      await handleSelectCampaign(
        selectedCampaign,
        selectedPageAccount
      )
      setConnecting(false)
    }
  }
  const handleClickCreate = async () => {
    setFormTypeAndValidate('create')
    await handleCreateCampaign()
  }
  return (
    <>
      <div className="text-lg font-medium text-gray-900 dark:text-zinc-300 mb-2">
        Let&apos;s connect this chat to a campaign:
      </div>
      {formType === 'connect' && campaigns.length > 0 && (
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
                const isDisabled = !pageAccount?.access_token;
                return (
                  <SelectItem
                    disabled={isDisabled}
                    key={pageAccount.id}
                    value={pageAccount.id}
                  >
                    {!isDisabled && `${pageAccount.name} - ${pageAccount.id}`}
                    {isDisabled && (
                      <>
                        {`${pageAccount.name} - `}
                        <span className={'text-red-600'}>
                          Missing permissions
                        </span>
                      </>
                    )}
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

      {formType === 'create' && (
        <div className="mb-4">
          <Label className="dark:text-zinc-200">Campaign Name:</Label>
          <Input
            value={campaignName}
            onChange={e => setCampaignName(e.target.value)}
            placeholder="Enter campaign name"
            className={`dark:bg-zinc-700 dark:text-zinc-200 ${showCampaignNameError ? 'border-rose-500' : ''}`}
          />
          {showCampaignNameError && (
            <div className="py-2 text-xs inline-block align-middle text-center text-rose-500 dark:text-rose-500">
              Please enter a campaign name.
            </div>
          )}
        </div>
      )}

      <div className="flex mt-4 gap-4">
        {campaigns.length > 0 && (
          <button
            aria-disabled={!selectedCampaign || isConnecting}
            onClick={handleClickConnect}
            className="flex justify-center items-center flex-1 px-3 mr-5 py-2 text-xs  font-medium text-center text-white bg-gray-700 rounded-lg hover:bg-gray-800 focus:ring-4 focus:outline-none focus:ring-gray-300 dark:bg-gray-600 dark:hover:bg-gray-700 dark:focus:ring-gray-800"
          >
            {isConnecting && <IconSpinner />}
            {!isConnecting && 'Connect existing campaign'}
          </button>
        )}

        <button
          aria-disabled={isCreatingCampaign}
          onClick={handleClickCreate}
          className="flex justify-center items-center flex-1 px-3 py-2 text-xs align-middle font-medium text-center text-white bg-blue-700 rounded-lg hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-gray-300 dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800"
        >
          {isCreatingCampaign && <IconSpinner />}
          {!isCreatingCampaign && 'Create a new campaign'}
        </button>
      </div>
    </>
  )
}

interface ConnectCampaignAdvancedProps {
  toolCallId?: string
  connectingUiProps?: {
    campaignName: string
    pageName: string
    success: boolean
  }
}

export function ConnectCampaignAdvanced({
  toolCallId,
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
      const updateSuccess = await updateChat(
        aiState.chatId,
        {
          fbCampaignId: campaign.id,
          fbPageId: pageAccount.id
        }
      )

      if (updateSuccess?.success) {
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
            // we use map, instead of updating only last message, because user might use this component in chat history, which failed to connect before
            ...aiState.messages.map((message: Message) => {
              if (message.id === toolCallId) {
                const content = (message.content as ToolContent)[0]
                content.result = {
                  toolCallId,
                  connectingUiProps: {
                    success: !!updateSuccess?.success,
                    campaignName: campaign.name,
                    pageName: pageAccount.name
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