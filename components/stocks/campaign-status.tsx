'use client'

import { useState, useEffect } from 'react'
import { nanoid } from 'nanoid'
import { toast } from 'sonner'
import Image from 'next/image'
import { IconSpinner } from '@/components/ui/icons'
import { AdTextSelectionSkeleton } from '@/components/stocks/ad-text-selection-skeleton'
import { sleep } from '@/lib/utils'
import { ImagePart } from 'ai'
import { Message } from '@/lib/types'
import { useActions, useAIState, useUIState } from 'ai/rsc'
import type { AI } from '@/lib/chat/actions'
import { Switch } from '@/components/ui/switch'

export interface CampaignStatusProps {
  campaignName: string
  status: boolean
}

export function CampaignStatus({ props }: { props: CampaignStatusProps }) {
  const [currentStatus, setCurrentStatus] = useState(props.status)
  const [updateStatusUI, setUpdateStatusUI] = useState<null | React.ReactNode>(
    null
  )
  const [aiState, setAIState] = useAIState<typeof AI>();
  const [, setMessages] = useUIState<typeof AI>()
  const { confirmUpdateStatus } = useActions()
  function onStatusChange(status: boolean) {
    setAIState({
      ...aiState,
      messages: [...aiState.messages, { id: 'status-change', role: 'system', content: `Campaign status updated to ${status}. ` }]
    });
  }
  return (
    <div className="p-4 text-white-400 border rounded-xl  dark:bg-zinc-950">
      <div className="text-lg dark:text-zinc-300">{props.campaignName}</div>
      {updateStatusUI ? (
        <div className="mt-4 dark:text-zinc-200">{updateStatusUI}</div>
      ) : (
        <>
          <div className="flex w-full flex-col my-10">
            <span className="text-white-700 mb-2">Status:</span>
            <div className="flex items-center">
              <Switch
                defaultChecked={currentStatus}
                onCheckedChange={val => {
                  setCurrentStatus(val)
                }}
              />
              <span className="text-white-500 pl-3">
                {currentStatus ? 'Enable' : 'Disable'}
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
              ]);
              onStatusChange(currentStatus);
            }}
          >
            Confirm
          </button>
        </>
      )}
    </div>
  )
}

export default CampaignStatus
