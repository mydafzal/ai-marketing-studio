'use client'

import * as React from 'react';

interface ConnectCampaignProps {
  campaignName: string
  success: boolean
}

export function ConnectCampaignResult({
  campaignName,
  success
}: ConnectCampaignProps) {
  return (
    <div className="p-6  border rounded-x">
      {success ? `Connected to campaign: ${campaignName}` : `Failure connect to campaign: ${campaignName}`}
    </div>
  )
}
