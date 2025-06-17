'use client'

import React from 'react'
import { BotCard, BotMessage } from '@/components/stocks'
import LeadsCountUI from '@/components/campaign-leads-count'
import { SidebarContentWrapper } from '@/components/sidebar-content-wrapper'
import useChatViewStore from '@/app/store/useChatViewStore'

interface LeadsUIConditionalProps {
  campaignId?: string | null
  isVisible?: boolean
  className?: string
  toolCallId?: string
}

export default function LeadsUIConditional({
  campaignId,
  isVisible = true,
  className = '',
  toolCallId = 'leads-ui-conditional'
}: LeadsUIConditionalProps) {
  const { isLeadsVisible, currentView, setCurrentView } = useChatViewStore()

  // Don't render if not visible or no campaign ID
  if (!isVisible || !campaignId) {
    return null
  }

  // Create the leads content component
  const leadsContent = (
    <div className="p-4">
      <BotCard>
        <div className="space-y-4">
          <BotMessage content="Here are the leads for your current campaign." />
          
          <LeadsCountUI 
            toolCallId={toolCallId}
            toolCallResult={{
              success: true,
              data: undefined
            }}
          />
        </div>
      </BotCard>
    </div>
  )

  // Conditional rendering based on current view and leads visibility
  if (currentView === 'leads' && isLeadsVisible) {
    return (
      <SidebarContentWrapper 
        content={leadsContent}
        title="Campaign Leads"
        onMount={true}
      />
    )
  }

  // Return the content directly if not using sidebar
  return (
    <div className={className}>
      {leadsContent}
    </div>
  )
} 