'use client'

import { useState, useEffect } from 'react'
import { Button } from './ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from './ui/card'
import { Checkbox } from './ui/checkbox'
import { useToast } from './ui/use-toast'
import { FbCampaign } from '@/lib/types'

interface AutoOptimizeCampaignSubscriptionProps {
  userEmail: string
  initialSubscriptions?: string[]
}

export default function AutoOptimizeCampaignSubscription({ userEmail, initialSubscriptions = [] }: AutoOptimizeCampaignSubscriptionProps) {
  const [campaigns, setCampaigns] = useState<FbCampaign[]>([])
  const [subscribedCampaigns, setSubscribedCampaigns] = useState<string[]>(initialSubscriptions)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    async function fetchCampaigns() {
      try {
        // First, fetch user's subscribed campaigns for optimization
        const subscriptionsResponse = await fetch('/api/user/get-campaign-optimization-subscriptions')
        let userSubscribedCampaigns: string[] = []
        
        if (subscriptionsResponse.ok) {
          const { subscribedCampaigns } = await subscriptionsResponse.json()
          if (Array.isArray(subscribedCampaigns)) {
            userSubscribedCampaigns = subscribedCampaigns
            setSubscribedCampaigns(subscribedCampaigns)
          }
        }
        
        // Then fetch the list of campaigns using the user's fbAccountId
        const response = await fetch('/api/user/get-user-campaigns')
        if (!response.ok) throw new Error('Failed to fetch campaigns')
        
        const data = await response.json()
        setCampaigns(data.campaigns || [])
        
        // Make sure checkboxes are properly set for already subscribed campaigns
        if (userSubscribedCampaigns.length > 0) {
          setSubscribedCampaigns(userSubscribedCampaigns)
        }
      } catch (error) {
        console.error('Error fetching campaigns:', error)
        toast({
          title: 'Error',
          description: 'Failed to load campaigns. Please try again.',
          variant: 'destructive',
        })
      } finally {
        setIsLoading(false)
      }
    }

    fetchCampaigns()
  }, [])

  async function saveSubscriptions() {
    setIsSaving(true)
    try {
      console.log("Saving campaign optimization subscriptions:", subscribedCampaigns)
      
      const response = await fetch('/api/user/update-campaign-optimization-subscriptions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          subscribedCampaigns,
        }),
      })

      if (!response.ok) throw new Error('Failed to save subscriptions')
      
      const message = subscribedCampaigns.length === 0
        ? 'All campaign optimizations have been disabled.'
        : `Campaign optimization enabled for ${subscribedCampaigns.length} campaign(s).`
      
      toast({
        title: 'Success',
        description: message,
      })
    } catch (error) {
      console.error('Error saving subscriptions:', error)
      toast({
        title: 'Error',
        description: 'Failed to save preferences. Please try again.',
        variant: 'destructive',
      })
    } finally {
      setIsSaving(false)
    }
  }

  function toggleCampaignSubscription(campaignId: string) {
    setSubscribedCampaigns(prev => {
      if (prev.includes(campaignId)) {
        return prev.filter(id => id !== campaignId)
      } else {
        return [...prev, campaignId]
      }
    })
  }

  if (isLoading) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Auto Optimize Campaigns</CardTitle>
          <CardDescription>Loading campaigns...</CardDescription>
        </CardHeader>
      </Card>
    )
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Auto Optimize Campaigns</CardTitle>
        <CardDescription>
          Select campaigns to enable automatic optimization of ad creatives.
          <div className="inline-flex items-center px-2.5 py-0.5 mt-2 rounded-full text-xs font-medium bg-blue-100 text-blue-800 border border-blue-200">
            Optimization: Pause low-performing creatives (15% higher CPL)
          </div>
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="max-h-[300px] overflow-y-auto border rounded p-2 mb-4">
          <div className="space-y-3">
            {campaigns.length === 0 ? (
              <p className="text-sm text-muted-foreground p-2">No campaigns found.</p>
            ) : (
              campaigns.map((campaign) => (
                <div key={campaign.id} className="flex items-center space-x-2 border-b pb-2 last:border-b-0">
                  <Checkbox
                    id={`campaign-opt-${campaign.id}`}
                    checked={subscribedCampaigns.includes(campaign.id)}
                    onCheckedChange={() => toggleCampaignSubscription(campaign.id)}
                  />
                  <div className="flex-1">
                    <label
                      htmlFor={`campaign-opt-${campaign.id}`}
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                    >
                      {campaign.name}
                    </label>
                    <p className="text-xs text-muted-foreground">
                      Status: {campaign.status} • Created: {new Date(campaign.created_time).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
        <div className="flex justify-between items-center w-full">
          <p className="text-sm text-muted-foreground">
            {subscribedCampaigns.length} campaign{subscribedCampaigns.length !== 1 ? 's' : ''} selected
          </p>
          <Button onClick={saveSubscriptions} disabled={isSaving}>
            {isSaving ? 'Saving...' : 'Save Preferences'}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}