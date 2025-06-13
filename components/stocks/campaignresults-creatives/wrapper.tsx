'use client'

import React, { useEffect } from 'react'
import { useActiveUI } from '@/components/stocks/active-ui-context'
import AdCreativesComparison from './'

interface AdCreativesComparisonWrapperProps {
  campaignId: string
}

export function AdCreativesComparisonWrapper({ campaignId }: AdCreativesComparisonWrapperProps) {
  const { setActiveUI } = useActiveUI()
  
  // Set this component as the active UI in the sidebar
  useEffect(() => {
    const content = (
      <div className="flex flex-col h-full">
        <AdCreativesComparison campaignId={campaignId} />
      </div>
    )
    
    // Register it with the side panel
    setActiveUI(content, 'adCreativesComparison', 'Ad Creatives Performance')
  }, [campaignId, setActiveUI])

  // Return null here since the content will be displayed in the sidebar
  return null
}