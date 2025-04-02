'use client'

import { useEffect } from 'react'
import { useActiveUI } from '@/components/stocks/active-ui-context'
import { Support } from '@/components/stocks/support'

interface SupportComponentProps {
  title?: string;
}

export function SupportActiveUIWrapper({ 
  title = "Reeply AI Support"
}: SupportComponentProps) {
  const { setActiveUI } = useActiveUI()
  
  useEffect(() => {
    const content = (
      <div className="flex flex-col h-full">
        <Support title={title} />
      </div>
    )
    
    // Register it with the active UI context
    setActiveUI(content, 'supportComponent', 'Reeply AI Support')
  }, [title, setActiveUI])
  
  // Return null here since the content will be displayed in the sidebar
  return null
}