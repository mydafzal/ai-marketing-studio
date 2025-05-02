'use client'

import React from 'react'
import { KvContextProvider } from '@/components/contexts/kv-context'
import { StandaloneCampaignConnect } from '@/components/connect-campaign/standalone'
import { StandaloneCampaignContextProvider } from '@/components/connect-campaign/standalone-context'

export function ClientCampaignConnect() {
  return (
    <div className="w-full max-w-full">
      <KvContextProvider chat={null}>
        <StandaloneCampaignContextProvider>
          <StandaloneCampaignConnect />
        </StandaloneCampaignContextProvider>
      </KvContextProvider>
    </div>
  )
}