'use client'

import {useActions, useAIState, useUIState} from 'ai/rsc'
import {format} from 'date-fns'
import {useContext, useEffect, useRef, useState} from 'react'
import {cn} from '@/lib/utils'

import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from '@/components/ui/select'

import {updateChatFbCampaignId} from '@/app/actions'
import {ConnectCampaignResult} from '@/components/connect-campaign-result'
import {CampaignContext} from '@/components/contexts/campaign-context'
import {IconSpinner} from '@/components/ui/icons'
import {FbCampaign, Message} from '@/lib/types'
import {type AI} from '@/lib/chat/actions'
import {Card, CardContent} from '@/components/ui/card'
import {CheckCircle, Link as LinkIcon, Plus} from 'lucide-react'

interface ConnectCampaignFormProps {
  handleSelectCampaign: (campaign: FbCampaign) => Promise<void>;
}

export function ConnectCampaignForm({
  handleSelectCampaign
}: ConnectCampaignFormProps) {
  const [selectedCampaign, setSelectedCampaign] = useState<FbCampaign>()
  const [isSubmitting, setSubmitting] = useState<boolean>(false)
  const [isCreating, setCreating] = useState<boolean>(false)
  const { campaigns, getCampaignList } = useContext(CampaignContext)

  const handleCreateCampaign = async () => {


    const createData = {
      name: 'Lead Campaign',
      status: 'PAUSED',
    }
    const url = '/api/fasty-bot/proxy-create-base-lead-campaign'
    const responseStream = await fetch(url, {
      method: 'POST',
      body: JSON.stringify({
      })
    })
    const response = await responseStream.json()
    if (response.success && response.data.campaign.id) {
      await handleSelectCampaign({
        ...response.data.campaign,
        created_time: Date.toString(),
        daily_budget:"300"  // Just to avoid error
      })
      await getCampaignList()
    }
  }

  return (
    <>
      <div className="text-xl font-semibold text-zinc-900 dark:text-zinc-200 mb-4">
        Connect to Campaign
      </div>
      <div className="text-sm text-zinc-600 dark:text-zinc-400 mb-6">
        Select an existing campaign or create a new one to get started
      </div>
      
      {campaigns.length > 0 ? (
        <div className="space-y-6">
          <Select
            onValueChange={value => {
              setSelectedCampaign(campaigns.find(e => e.id === value))
            }}
          >
            <SelectTrigger 
              className="w-full bg-white dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-zinc-200 h-12"
              aria-label="Select Campaign"
            >
              <SelectValue placeholder="Select a campaign" />
            </SelectTrigger>
            <SelectContent className="bg-white dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700">
              {campaigns.map((campaign: FbCampaign) => {
                const created_time = format(
                  new Date(campaign.created_time),
                  'MMM d, yyyy HH:mm'
                )
                return (
                  <SelectItem 
                    key={campaign.id} 
                    value={campaign.id}
                    className="text-zinc-900 dark:text-zinc-200 focus:bg-zinc-100 dark:focus:bg-zinc-700"
                  >
                    <div className="flex flex-col">
                      <span>{campaign.name}</span>
                      <span className="text-xs text-zinc-600 dark:text-zinc-400">
                        {campaign.status} • {created_time}
                      </span>
                    </div>
                  </SelectItem>
                )
              })}
            </SelectContent>
          </Select>

          <div className="flex gap-4">
            <button
              disabled={!selectedCampaign || isSubmitting}
              onClick={async () => {
                if (selectedCampaign) {
                  setSubmitting(true)
                  await handleSelectCampaign(selectedCampaign)
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
                  Connect Campaign
                </>
              )}
            </button>

            <button
              disabled={isCreating}
              onClick={async () => {
                setCreating(true)
                await handleCreateCampaign()
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
                  Create New Campaign
                </>
              )}
            </button>
          </div>
        </div>
      ) : (
        <div className="py-8 text-center bg-zinc-100/50 dark:bg-zinc-800/50 rounded-lg border border-zinc-200 dark:border-zinc-700">
          <div className="text-zinc-600 dark:text-zinc-400 mb-4">
            No campaigns available
          </div>
          <button
            disabled={isCreating}
            onClick={async () => {
              setCreating(true)
              await handleCreateCampaign()
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
                Create New Campaign
              </>
            )}
          </button>
        </div>
      )}
    </>
  )
}

interface ConnectCampaignProps {
  connectingUiProps?: {
    campaignName: string
    success: boolean
  }
}

export function ConnectingStatus({ campaignName }: { campaignName: string }) {
  return (
    <Card className="bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800">
      <CardContent className="p-6">
        <div className="flex items-center gap-3">
          <IconSpinner className="size-5 text-blue-600 dark:text-blue-500" />
          <span className="text-zinc-900 dark:text-zinc-200">
            Connecting to {campaignName}...
          </span>
        </div>
      </CardContent>
    </Card>
  );
}

export function ConnectCampaign({ connectingUiProps }: ConnectCampaignProps) {
  const [aiState, setAIState] = useAIState()
  const { submitUserMessage } = useActions()
  const [connectingUI, setConnectingUI] = useState<null | React.ReactNode>(
    connectingUiProps ? <ConnectCampaignResult {...connectingUiProps} /> : null
  )
  const [_, setMessages] = useUIState<typeof AI>()
  const { setId: setCampaignId } = useContext(CampaignContext)

  const aiMessages = aiState.messages;
  const shouldSendSilentMessage = useRef(false);

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
      const { content, id, role } = aiMessages[0];
      if (role === 'system' && id === 'campaign-info-data' && content?.slice(0, 21) === 'Campaign is connected') {
        if (shouldSendSilentMessage.current) {
          setTimeout(refresh, 0);
          shouldSendSilentMessage.current = false;
        }
      }
    }
  }, [aiMessages, setMessages, submitUserMessage]);

  async function handleCampaignSelection(campaign: FbCampaign) {
    setConnectingUI(<ConnectingStatus campaignName={campaign.name} />)
    
    try {
      const updateSuccess = await updateChatFbCampaignId(
        aiState.chatId,
        campaign.id
      )
      if (updateSuccess?.success) {
        shouldSendSilentMessage.current = true;
        setCampaignId(campaign.id)
        setConnectingUI(
          <Card className="bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800">
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <CheckCircle className="size-6 text-green-600 dark:text-green-500 shrink-0" />
                <div>
                  <div className="text-zinc-900 dark:text-zinc-200 font-medium">
                    Successfully connected to campaign
                  </div>
                  <div className="text-zinc-600 dark:text-zinc-400 text-sm">
                    {campaign.name}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )
        setAIState({
          ...aiState,
          messages: [
            ...aiState.messages.map((message: Message) => {
              if (message.role === 'tool') {
                const content = message.content[0]
                if (
                  content.type === 'tool-result' &&
                  content.toolName === 'showCampaignConnectionUI'
                ) {
                  content.result = {
                    ...(content.result as Object),
                    connectingUiProps: {
                      success: !!updateSuccess?.success,
                      campaignName: campaign.name
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
        {connectingUI ? (
          connectingUI
        ) : (
          <ConnectCampaignForm handleSelectCampaign={handleCampaignSelection} />
        )}
      </CardContent>
    </Card>
  )
}