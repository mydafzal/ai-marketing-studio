'use client'

import React, { useEffect } from 'react'
import { useActiveUI } from '@/components/stocks/active-ui-context'
import AdCreativesComparison from './'
import { Download } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface AdCreativesComparisonWrapperProps {
  campaignId: string
}

export function AdCreativesComparisonWrapper({ campaignId }: AdCreativesComparisonWrapperProps) {
  const { setActiveUI } = useActiveUI()
  
  // Set this component as the active UI in the sidebar
  useEffect(() => {
    const handleDownloadClick = () => {
      // Dispatch a custom event that the component will listen for
      document.dispatchEvent(new CustomEvent('download-pdf-report'))
    }
    
    const headerActions = (
      <Button 
        variant="ghost" 
        size="sm" 
        onClick={handleDownloadClick}
        className="text-[#ADB0B8] hover:text-white hover:bg-[#151925] transition-colors p-2 sm:p-2.5"
        title="Download PDF report"
      >
        <Download className="h-4 w-4" />
      </Button>
    )
    
    const content = (
      <div className="flex flex-col h-full">
        <AdCreativesComparison campaignId={campaignId} />
      </div>
    )
    
    // Register it with the side panel, including the header actions
    setActiveUI(content, 'adCreativesComparison', 'Ad Creatives Performance', headerActions)
  }, [campaignId, setActiveUI])

  // Return null here since the content will be displayed in the sidebar
  return null
}