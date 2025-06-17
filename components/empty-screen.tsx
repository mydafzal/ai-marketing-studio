import { UseChatHelpers } from 'ai/react'
import { trackEvent } from '@/lib/utils'
import { useUsageStore } from '@/app/store/useUsageStore'
import { useState } from 'react'

import { Button } from '@/components/ui/button'
import { ExternalLink } from '@/components/external-link'
import { IconArrowRight, IconBell, IconBolt, IconChartBar, IconCog, IconDownload, IconMessage, IconPower, IconRefresh } from '@/components/ui/icons'
import { UpgradeModal } from '@/components/upgrade-modal'
import { Zap, BarChart, PieChart, Download, DollarSign, Power, Plus } from 'lucide-react'

export function EmptyScreen() {
  const [showUpgradeModal, setShowUpgradeModal] = useState(false)
  const { isMessageLimitReached, messageCount, incrementMessageCount } = useUsageStore()

  const actions = [
    {
      title: 'Create a Campaign',
      description: 'I can help you set up a new advertising campaign.',
      icon: <IconMessage className="h-6 w-6" />,
      prompt: 'I want to create a campaign'
    },
    {
      title: 'View Campaign Results',
      description: 'I can show you the performance metrics of your campaign.',
      icon: <IconChartBar className="h-6 w-6" />,
      prompt: 'What are the results of my campaign for today?'
    },
    {
      title: 'Analyse Campaign Results',
      description: 'I can provide an analysis of your campaign\'s performance.',
      icon: <IconBolt className="h-6 w-6" />,
      prompt: 'Analyze my campaign performance'
    },
    {
      title: 'Download Leads',
      description: 'I can help you download leads from your campaign.',
      icon: <IconDownload className="h-6 w-6" />,
      prompt: 'I want to download leads from my campaign'
    },
    {
      title: 'Change Campaign Budget',
      description: 'I can assist in adjusting your campaign\'s budget.',
      icon: <IconCog className="h-6 w-6" />,
      prompt: 'I would like to change my campaign budget'
    },
    {
      title: 'Turn Campaigns On/Off',
      description: 'I can help you manage the status of your campaigns.',
      icon: <IconPower className="h-6 w-6" />,
      prompt: 'I want to turn my campaign on/off'
    },
    {
      title: 'Lead Notifications',
      description: 'Receive notifications for campaign results of yesterday.',
      icon: <IconBell className="h-6 w-6" />,
      prompt: 'I want to manage my lead notifications'
    },
    {
      title: 'Auto Optimize Campaigns',
      description: 'Enable automatic optimization of ad creatives for your campaigns.',
      icon: <IconRefresh className="h-6 w-6" />,
      prompt: 'I want to manage auto optimization for my campaigns'
    }
  ]

  const handleActionClick = async (message: string) => {
    // Check if message limit has been reached
    if (isMessageLimitReached) {
      // Show upgrade modal instead of sending message
      setShowUpgradeModal(true)
      return
    }
    // Track event
    await trackEvent('example_message_clicked', { email: '', id: '' }, { message })
    
    // Send message via event
    const event = new CustomEvent('send-support-message', {
      detail: { message }
    })
    window.dispatchEvent(event)
    
    // Increment message count
    await incrementMessageCount()
  }

  return (
    <>
      <UpgradeModal 
        isOpen={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
        usageType="messages"
        currentCount={messageCount}
      />
      
      <div className="flex justify-center w-full pt-4 sm:pt-6 pb-32 sm:pb-24">
        <div className="w-full max-w-sm xs:max-w-md sm:max-w-2xl md:max-w-3xl px-3 sm:px-4 mx-auto">
          <div className="rounded-lg p-3 sm:p-6 bg-[#0D1117] border border-[#1E2433]">
            <h1 className="text-lg sm:text-xl font-semibold text-white mb-3 text-center">How can I help you today?</h1>
            
            <div className="grid grid-cols-1 xs:grid-cols-2 md:grid-cols-3 gap-3">
              {actions.map((action, index) => (
                <div
                  key={index}
                  onClick={() => handleActionClick(action.prompt)}
                  className="flex flex-col p-3 rounded-lg bg-[#1E2433] border border-[#2D3343] hover:border-primary-green active:bg-[#2D3343] active:border-primary-green transition-all cursor-pointer group"
                >
                  <div className="flex items-center mb-2">
                    <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-[#192133] flex items-center justify-center mr-2 text-primary-green group-hover:bg-primary-green/10">
                      {action.icon}
                    </div>
                    <h3 className="font-medium text-white text-sm leading-tight">{action.title}</h3>
                  </div>
                  <p className="text-xs text-gray-400 mb-2">{action.description}</p>
                  <div className="mt-auto text-primary-green text-xs font-medium flex items-center opacity-0 group-hover:opacity-100 group-active:opacity-100 transition-opacity">
                    <span className="hidden sm:inline">Try this</span> <IconArrowRight className="ml-0.5 h-2 w-2" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  )
}