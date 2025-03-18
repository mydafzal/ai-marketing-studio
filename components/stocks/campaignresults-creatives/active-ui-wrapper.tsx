'use client'

import { useEffect } from 'react'
import { useActiveUI } from '@/components/stocks/active-ui-context'
import AdCreativesComparison from './'

interface AdCreativesComparisonProps {
  campaignId: string
}

export function AdCreativesActiveUIWrapper({ campaignId }: AdCreativesComparisonProps) {
  const { setActiveUI } = useActiveUI()
  
  useEffect(() => {
    const content = (
      <div className="flex flex-col h-full">
        <AdCreativesComparison campaignId={campaignId} />
      </div>
    )
    
    // Register it with the active UI context
    setActiveUI(content, 'adCreativesComparison', 'Ad Creatives Performance')
  }, [campaignId, setActiveUI])
  
  // Return null here since the content will be displayed in the sidebar
  return null
}