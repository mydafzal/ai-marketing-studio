'use client'

import * as React from 'react'

interface ConnectCampaignProps {
  campaignName: string
  pageName: string
  success: boolean
}

export function ConnectCampaignAdvancedResult({
  campaignName,
  pageName,
  success
}: ConnectCampaignProps) {
  return (
    <div className="p-6  border rounded-x">
      {success
        ? `Connected to campaign: ${campaignName}, page: ${pageName}`
        : `Failure connect to campaign: ${campaignName}, page: ${pageName}`}
    </div>
  )
}
