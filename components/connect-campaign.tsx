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
import {type AI} from '@/lib/chat/AIManager'
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
    const url = '/api/fasty-bot/proxy-create-base-lead-or-recruitment-campaign'
    const responseStream = await fetch(url, {
      method: 'POST',
      body: JSON.stringify({
      })
    })
    const response = await responseStream.json()
    if (response.success && response.data.campaign.id) {
      // TODO: UPDATE CHAT IN KV HERE IS WELL TO HAVE LEAD FORM ID
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
      <div className="text-xl font-semibold text-white mb-4">
        Connect to Campaign
      </div>
      <div className="text-sm text-[#ADB0B8] mb-6">
        Select an existing campaign or create a new one to get started
      </div>
      
      {campaigns.length > 0 ? (
        <div className="space-y-6">
          <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
            {campaigns.map((campaign: FbCampaign) => {
              const created_time = format(
                new Date(campaign.created_time),
                'MMM d, yyyy HH:mm'
              )
              const isActive = campaign.status === 'ACTIVE';
              
              return (
                <div 
                  key={campaign.id}
                  onClick={() => setSelectedCampaign(campaign)}
                  className={cn(
                    'flex items-center p-3 rounded-lg border transition-colors cursor-pointer',
                    selectedCampaign?.id === campaign.id 
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
                      <span className="text-white font-medium">{campaign.name}</span>
                      <span className="text-xs text-[#8A8F99]">
                        {campaign.status} • {created_time}
                      </span>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

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
                'text-[#0A0C14] font-medium rounded-lg',
                'bg-[#4BF29C] hover:bg-[#3AD88C]',
                'transition-colors duration-200',
                'disabled:opacity-50 disabled:cursor-not-allowed',
                'focus:outline-none focus:ring-2 focus:ring-[#4BF29C]'
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
        <div className="py-8 text-center bg-[#0A0C14] rounded-lg border border-[#2A2E3A]">
          <div className="text-[#ADB0B8] mb-4">
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
              'text-[#0A0C14] font-medium rounded-lg',
              'bg-[#4BF29C] hover:bg-[#3AD88C]',
              'transition-colors duration-200',
              'disabled:opacity-50 disabled:cursor-not-allowed',
              'focus:outline-none focus:ring-2 focus:ring-[#4BF29C]'
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
    <Card className="bg-[#1A1D29] border-[#2A2E3A]">
      <CardContent className="p-6">
        <div className="flex items-center gap-3">
          <IconSpinner className="size-5 text-[#4BF29C]" />
          <span className="text-white">
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
        'Okay, I connected campaign. Ask me whether I like to see campaign results. dont ask me to create a campaign.',
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
          <Card className="bg-[#1A1D29] border-[#2A2E3A]">
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <CheckCircle className="size-6 text-[#4BF29C] shrink-0" />
                <div>
                  <div className="text-white font-medium">
                    Successfully connected to campaign
                  </div>
                  <div className="text-[#ADB0B8] text-sm">
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
        {connectingUI ? (
          connectingUI
        ) : (
          <ConnectCampaignForm handleSelectCampaign={handleCampaignSelection} />
        )}
      </CardContent>
    </Card>
  )
}