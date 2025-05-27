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
import {CheckCircle, Link as LinkIcon, Plus, XCircle} from 'lucide-react'
import { useActiveUI } from '@/components/stocks/active-ui-context'

interface ConnectCampaignFormProps {
  handleSelectCampaign: (campaign: FbCampaign) => Promise<void>;
}

export function ConnectCampaignForm({
  handleSelectCampaign
}: ConnectCampaignFormProps) {
  const { campaigns, getCampaignList, id: currentCampaignId } = useContext(CampaignContext)
  const [selectedCampaign, setSelectedCampaign] = useState<FbCampaign | undefined>()
  const [isSubmitting, setSubmitting] = useState<boolean>(false)
  
  // Pre-select the currently connected campaign if available
  useEffect(() => {
    if (currentCampaignId && campaigns && campaigns.length > 0 && !selectedCampaign) {
      const connectedCampaign = campaigns.find(
        (campaign: FbCampaign) => campaign.id === currentCampaignId
      );
      
      if (connectedCampaign) {
        setSelectedCampaign(connectedCampaign);
      }
    }
  }, [currentCampaignId, campaigns, selectedCampaign]);

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
                      : currentCampaignId === campaign.id
                        ? 'border-[#4BF29C] bg-[#151925]/60' 
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
                      <div className="flex items-center">
                        <span className="text-white font-medium">{campaign.name}</span>
                        {currentCampaignId === campaign.id && (
                          <span className="ml-2 text-xs px-2 py-0.5 rounded-full bg-[#0F2922] text-[#4BF29C]">
                            Connected
                          </span>
                        )}
                      </div>
                      <span className="text-xs text-[#8A8F99]">
                        {campaign.status} • {created_time}
                      </span>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          <div className="flex">
            <button
              disabled={!selectedCampaign || isSubmitting}
              onClick={async () => {
                if (selectedCampaign) {
                  setSubmitting(true)
                  await handleSelectCampaign(selectedCampaign)
                }
              }}
              className={cn(
                'flex justify-center items-center gap-2 w-full h-12 px-6',
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
          </div>
        </div>
      ) : (
        <div className="py-8 text-center bg-[#0A0C14] rounded-lg border border-[#2A2E3A]">
          <div className="text-[#ADB0B8]">
            No campaigns available. Please use the chat to create a campaign first.
          </div>
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

// Original ActiveUIWrapper has been moved to connect-campaign/active-ui-wrapper.tsx

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
  const campaignContext = useContext(CampaignContext)
  const { id: currentCampaignId, setId: setCampaignId, campaigns } = campaignContext
  const [connectedCampaign, setConnectedCampaign] = useState<FbCampaign | null>(null)
  const [showSelector, setShowSelector] = useState<boolean>(false)

  const aiMessages = aiState.messages;
  const shouldSendSilentMessage = useRef(false);
  
  // Reset the UI when showSelector changes to true
  useEffect(() => {
    if (showSelector) {
      setConnectingUI(null);
    }
  }, [showSelector]);
  
  // Find currently connected campaign when component mounts or campaigns list changes
  useEffect(() => {
    // If we have a current campaign ID and campaigns list, find the connected campaign
    if (currentCampaignId && campaigns && campaigns.length > 0 && !showSelector) {
      const campaign = campaigns.find((campaign: FbCampaign) => campaign.id === currentCampaignId);
      
      if (campaign) {
        setConnectedCampaign(campaign);
        
        // If we have a connected campaign and no UI is showing, display the success state
        if (!connectingUI) {
          setConnectingUI(
            <Card className="bg-[#1A1D29] border-[#2A2E3A]">
              <CardContent className="p-6">
                <div className="flex flex-col gap-4">
                  <div className="flex items-center gap-3">
                    <CheckCircle className="size-6 text-[#4BF29C] shrink-0" />
                    <div>
                      <div className="text-white font-medium">
                        Currently connected to campaign
                      </div>
                      <div className="text-[#ADB0B8] text-sm">
                        {campaign.name}
                      </div>
                    </div>
                  </div>
                  
                  <button
                    onClick={() => setShowSelector(true)}
                    className="mt-4 w-full px-4 py-2 bg-[#151925] text-white border border-[#2A2E3A] rounded-lg hover:bg-[#1E2336] transition-colors"
                  >
                    Connect to Different Campaign
                  </button>
                </div>
              </CardContent>
            </Card>
          );
        }
      }
    }
  }, [currentCampaignId, campaigns, connectingUI, showSelector]);

  useEffect(() => {
    async function refresh() {
      // Look for the last user message to determine context
      const lastUserMessage = aiMessages
        .filter((msg: { role: string }) => msg.role === 'user')
        .pop()?.content || '';

      // Construct a contextual response based on previous user messages
      let responsePrompt = 'I have successfully connected to the campaign. ';
      
      if (typeof lastUserMessage === 'string' && 
          (lastUserMessage.toLowerCase().includes('result') || 
           lastUserMessage.toLowerCase().includes('performance') ||
           lastUserMessage.toLowerCase().includes('stats') ||
           lastUserMessage.toLowerCase().includes('metrics'))) {
        // User was likely asking about campaign results/performance
        responsePrompt += 'Now continue with showing the campaign results or metrics as previously discussed.';
      } else if (typeof lastUserMessage === 'string' && 
                (lastUserMessage.toLowerCase().includes('edit') || 
                 lastUserMessage.toLowerCase().includes('change') ||
                 lastUserMessage.toLowerCase().includes('update') ||
                 lastUserMessage.toLowerCase().includes('modify'))) {
        // User was likely asking about editing the campaign
        responsePrompt += 'Now continue with helping the user edit or update the campaign as previously discussed.';
      } else {
        // No specific context found, ask for next steps
        responsePrompt += 'Ask the user what they would like to do with this campaign now that it\'s connected.';
      }
      
      const responseMessage = await submitUserMessage(
        responsePrompt,
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
    <div className="w-full">
      <Card className="bg-[#1A1D29] border-[#2A2E3A]">
        <CardContent className="p-6">
          {connectingUI ? (
            connectingUI
          ) : (
            <ConnectCampaignForm handleSelectCampaign={handleCampaignSelection} />
          )}
        </CardContent>
      </Card>
    </div>
  )
}