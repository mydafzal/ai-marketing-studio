'use client'

import * as React from 'react'
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem
} from '@/components/ui/select'
import { format } from 'date-fns'
import { useActions, useAIState } from 'ai/rsc'
import { useCallback, useContext } from 'react'

import { createCampaign } from '@/lib/api/fasty-bot/create-campaign'
import { FbCampaign } from '@/lib/types'
import { updateChatFbCampaignId } from '@/app/actions'
import { ConnectCampaignResult } from '@/components/connect-campaign-result'
import { CampaignContext } from '@/components/contexts/campaign-context'
import { IconSpinner } from '@/components/ui/icons'

interface ConnectCampaignFormProps {
  handleSelectCampaign: (campaign: FbCampaign) => void
}

export function ConnectCampaignForm({
  handleSelectCampaign
}: ConnectCampaignFormProps) {
  const [selectedCampaign, setSelectedCampaign] = React.useState<FbCampaign>()
  const [isSubmitting, setSubmitting] = React.useState<boolean>(false)
  const [isCreating, setCreating] = React.useState<boolean>(false)
  const [aiState] = useAIState()
  const { campaigns, getCampaignList } = useContext(CampaignContext)

  const handleCampaignCreated = useCallback(
    async (campaign: FbCampaign) => {
      setSelectedCampaign(campaign)
      await updateChatFbCampaignId(aiState.chatId, campaign.id)
    },
    [aiState]
  )
  const handleCreateCampaign = async () => {
    console.log('create campaign')
    const response = await createCampaign({
      chatSlug: aiState.chatId,
      name: 'My campaign',
      objective: 'OUTCOME_LEADS',
      status: 'PAUSED',
      special_ad_categories: ['NONE']
    });
    if (response.success && response.data.id) {
      console.log('created campaign id is', response.data.id);
      await handleCampaignCreated(response.data);
      await getCampaignList();
    }
  }

  return (
    <>
      <div className="text-lg font-medium text-gray-900 dark:text-zinc-300 mb-2">
        Let's connect this chat to a campaign:
      </div>
      {campaigns.length > 0 && (
        <Select
          onValueChange={value => {
            setSelectedCampaign(campaigns.find(e => e.id === value))
          }}
        >
          <SelectTrigger className="SelectTrigger" aria-label="Food">
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
      )}
      {campaigns.length === 0 && (
        <div className="py-2 text-md inline-block align-middle  text-center text-gray-700 dark:text-white">
          No campaigns are currently available. Please create a new campaign
        </div>
      )}
      <div className="flex mt-4 gap-4">
        {campaigns.length > 0 && (
          <button
            aria-disabled={!selectedCampaign || isSubmitting}
            onClick={() => {
              if (selectedCampaign) {
                setSubmitting(true)
                handleSelectCampaign(selectedCampaign)
              }
            }}
            className="flex-1 px-3 mr-5 py-2 text-xs font-medium text-center text-white bg-gray-700 rounded-lg hover:bg-gray-800 focus:ring-4 focus:outline-none focus:ring-gray-300 dark:bg-gray-600 dark:hover:bg-gray-700 dark:focus:ring-gray-800"
          >
            {isSubmitting && <IconSpinner />}
            {!isSubmitting && 'Connect existing campaign'}
          </button>
        )}

        <button
          aria-disabled={isCreating}
          onClick={() => {
            setCreating(true)
            handleCreateCampaign()
          }}
          className="flex-1 px-3 py-2 text-xs inline-block align-middle font-medium text-center text-white bg-blue-700 rounded-lg hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-gray-300 dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800"
        >
          {isCreating && <IconSpinner />}
          {!isCreating && 'Create a new campaign instead'}
        </button>
      </div>
    </>
  )
}

interface ConnectCampaignProps {
  connectingUiProps?: {
    campaignName: string
    success: boolean
  }
}

export function ConnectCampaign({ connectingUiProps }: ConnectCampaignProps) {
  const { selectCampaign } = useActions()
  const [connectingUI, setConnectingUI] =
    React.useState<null | React.ReactNode>(
      connectingUiProps ? (
        <ConnectCampaignResult {...connectingUiProps} />
      ) : null
    )
  return (
    <>
      {connectingUI ? (
        connectingUI
      ) : (
        <div className="mt-4 p-6  border rounded-x">
          <ConnectCampaignForm
            handleSelectCampaign={async (campaign: FbCampaign) => {
              const response = await selectCampaign(campaign.id, campaign.name)
              setConnectingUI(response.connectingUI)
            }}
          />
        </div>
      )}
    </>
  )
}
