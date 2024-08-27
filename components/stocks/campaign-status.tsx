'use client'

import { useState, useMemo, useEffect } from 'react'
import { AdTextSelectionSkeleton } from '@/components/stocks/ad-text-selection-skeleton'
import { useActions, useAIState, useUIState } from 'ai/rsc'
import type { AI } from '@/lib/chat/actions'
import { Switch } from '@/components/ui/switch'
import {
  getCampaignSummary
} from '@/lib/api/fasty-bot/get-campaign-summary'

export interface CampaignStatusProps {
  toolCallId?: string
  campaignName: string
  status: string
}

export function CampaignStatus({ props }: { props: CampaignStatusProps }) {
  const [currentStatus, setCurrentStatus] = useState<string>('ACTIVE')
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [updateStatusUI, setUpdateStatusUI] = useState<null | React.ReactNode>(
    null
  )
  const [aiState, setAIState] = useAIState<typeof AI>()
  const [, setMessages] = useUIState<typeof AI>()
  const { confirmUpdateStatus } = useActions()
  function onStatusChange(status: string) {
    setAIState({
      ...aiState,
      messages: [
        ...aiState.messages,
        {
          id: 'status-change',
          role: 'system',
          content: `Campaign status updated to ${status}. `
        }
      ]
    })
  }
  const isLastedMessage = useMemo(() => {
    const messages = aiState.messages.filter(message => message.role === 'tool')
    if (messages.length > 0) {
      return messages[messages.length - 1].id === props?.toolCallId
    }
    return false
  }, [aiState.messages, props?.toolCallId])

  useEffect(() => {
    const fetchData = async () => {
      try {
        const summary = await getCampaignSummary()
        setCurrentStatus(summary?.status)
        setIsLoading(false)
      } catch (error) {
        console.error('Error fetching campaign data:', error)
      }
    }
    fetchData()
  }, [])



  if (isLoading) {
    return <AdTextSelectionSkeleton />
  }
  return (
    <div className="p-4 text-white-400 border rounded-xl  dark:bg-zinc-950">
      <div className="text-lg dark:text-zinc-300">{props.campaignName}</div>
      {updateStatusUI ? (
        <div className="mt-4 dark:text-zinc-200">{updateStatusUI}</div>
      ) : isLastedMessage ? (
        <>
          <div className="flex w-full flex-col my-10">
            <span className="text-white-700 mb-2">Status:</span>
            <div className="flex items-center">
              <Switch
                checked={currentStatus === 'ACTIVE'}
                onCheckedChange={val => {
                  setCurrentStatus(val ? 'ACTIVE' : 'PAUSED')
                }}
              />
              <span className="text-white-500 pl-3">
                {currentStatus === 'ACTIVE' ? 'Active' : 'Paused'}
              </span>
            </div>
          </div>
          <button
            className="w-full px-4 py-2 mt-6 font-boldtext-center text-white bg-gray-700 rounded-lg hover:bg-gray-800 focus:ring-4 focus:outline-none focus:ring-gray-300 dark:bg-gray-600 dark:hover:bg-gray-700 dark:focus:ring-gray-800"
            onClick={async () => {
              const response = await confirmUpdateStatus(
                props.campaignName,
                currentStatus
              )
              setUpdateStatusUI(response.updateStatusUI)
              setMessages(currentMessages => [
                ...currentMessages,
                response.newMessage
              ])
              onStatusChange(currentStatus)
            }}
          >
            Confirm
          </button>
        </>
      ) : (
        <div>
          <p className="mb-2">
            I updated the status to {currentStatus === 'ACTIVE' ? 'Active' : 'Paused'}.
          </p>
        </div>
      )}
    </div>
  )
}

export default CampaignStatus
