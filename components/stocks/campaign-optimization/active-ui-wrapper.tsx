'use client'

import { useEffect, useState } from 'react'
import AutoOptimizeCampaignSubscription from '@/components/auto-optimize-campaign-subscription'

interface CampaignOptimizationWrapperProps {
  userEmail: string
}

export default function CampaignOptimizationWrapper({ userEmail }: CampaignOptimizationWrapperProps) {
  const [initialSubscriptions, setInitialSubscriptions] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function fetchSubscriptions() {
      try {
        const response = await fetch('/api/user/get-campaign-optimization-subscriptions')
        if (response.ok) {
          const data = await response.json()
          if (Array.isArray(data.subscribedCampaigns)) {
            setInitialSubscriptions(data.subscribedCampaigns)
          }
        }
      } catch (error) {
        console.error('Error fetching campaign optimization subscriptions:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchSubscriptions()
  }, [])

  if (isLoading) {
    return <div className="p-4">Loading campaign optimization settings...</div>
  }

  return (
    <div className="p-4">
      <AutoOptimizeCampaignSubscription 
        userEmail={userEmail}
        initialSubscriptions={initialSubscriptions}
      />
    </div>
  )
}