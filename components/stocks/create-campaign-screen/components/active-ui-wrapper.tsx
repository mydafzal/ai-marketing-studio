'use client'

import { useEffect } from 'react'
import { useActiveUI } from '@/components/stocks/active-ui-context'
import { CreateCampaignForm } from './CreateCampaignForm'

export function CreateCampaignActiveUIWrapper() {
  const { setActiveUI } = useActiveUI()
  
  useEffect(() => {
    const content = (
      <div className="flex flex-col h-full">
        <CreateCampaignForm />
      </div>
    )
    
    // Register it with the active UI context
    setActiveUI(content, 'createCampaignScreen', 'Create Campaign')
  }, [setActiveUI])
  
  // Return null here since the content will be displayed in the sidebar
  return null
}