'use client'

import { useEffect } from 'react'
import { useActiveUI } from '@/components/stocks/active-ui-context'
import { Stock } from './'

interface CampaignResultsProps {
  campaignId: string;
  guideForUser?: string;
}

export function CampaignResultsActiveUIWrapper({ 
  campaignId,
  guideForUser 
}: CampaignResultsProps) {
  const { setActiveUI } = useActiveUI()
  
  useEffect(() => {
    if (!campaignId) {
      return; // No campaign ID, don't show in sidebar
    }
    
    const content = (
      <div className="flex flex-col h-full">
        <Stock campaignId={campaignId} isActive={true} />
        {guideForUser && <div className="mt-4">{guideForUser}</div>}
      </div>
    )
    
    // Register it with the active UI context
    setActiveUI(content, 'campaignResults', 'Campaign Results')
  }, [campaignId, guideForUser, setActiveUI])
  
  // Return null here since the content will be displayed in the sidebar
  return null
}