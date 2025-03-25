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
    // Only register with the ActiveUI context, but don't open the sidebar
    const content = (
      <div className="flex flex-col h-full">
        <AdCreativesComparison campaignId={campaignId} skipAiThoughts={true} />
      </div>
    )
    
    // Register it with the active UI context but don't open the sidebar
    setActiveUI(content, 'adCreativesComparison', 'Ad Creatives Performance')
  }, [campaignId, setActiveUI])
  
  // Return null here since the content will be displayed in the sidebar when explicitly requested
  return null
}