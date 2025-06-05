'use client'

import { useState, useEffect } from 'react'
import { Button } from './ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from './ui/card'
import { Checkbox } from './ui/checkbox'
import { useToast } from './ui/use-toast'
import { FbCampaign } from '@/lib/types'

interface LeadNotificationSubscriptionProps {
  userEmail: string
  initialSubscriptions?: string[]
}

export default function LeadNotificationSubscription({ userEmail, initialSubscriptions = [] }: LeadNotificationSubscriptionProps) {
  const [campaigns, setCampaigns] = useState<FbCampaign[]>([])
  const [subscribedCampaigns, setSubscribedCampaigns] = useState<string[]>(initialSubscriptions)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    async function fetchCampaigns() {
      try {
        // First, fetch user's subscribed campaigns
        const subscriptionsResponse = await fetch('/api/user/get-lead-subscriptions')
        if (subscriptionsResponse.ok) {
          const { subscribedCampaigns } = await subscriptionsResponse.json()
          if (Array.isArray(subscribedCampaigns)) {
            setSubscribedCampaigns(subscribedCampaigns)
          }
        }
        
        // Then fetch the list of campaigns using the user's fbAccountId
        const response = await fetch('/api/user/get-user-campaigns')
        if (!response.ok) throw new Error('Failed to fetch campaigns')
        
        const data = await response.json()
        setCampaigns(data.campaigns || [])
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
      const response = await fetch('/api/user/update-lead-subscriptions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: userEmail,
          subscribedCampaigns,
        }),
      })

      if (!response.ok) throw new Error('Failed to save subscriptions')

      toast({
        title: 'Success',
        description: 'Lead notification preferences saved successfully.',
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
          <CardTitle>Lead Notifications</CardTitle>
          <CardDescription>Loading campaigns...</CardDescription>
        </CardHeader>
      </Card>
    )
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Lead Notifications</CardTitle>
        <CardDescription>
          Select campaigns to receive notifications when new leads are generated.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {campaigns.length === 0 ? (
            <p className="text-sm text-muted-foreground">No campaigns found.</p>
          ) : (
            campaigns.map((campaign) => (
              <div key={campaign.id} className="flex items-center space-x-2 border-b pb-2">
                <Checkbox
                  id={`campaign-${campaign.id}`}
                  checked={subscribedCampaigns.includes(campaign.id)}
                  onCheckedChange={() => toggleCampaignSubscription(campaign.id)}
                />
                <div className="flex-1">
                  <label
                    htmlFor={`campaign-${campaign.id}`}
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
      </CardContent>
      <CardFooter>
        <Button onClick={saveSubscriptions} disabled={isSaving}>
          {isSaving ? 'Saving...' : 'Save Preferences'}
        </Button>
      </CardFooter>
    </Card>
  )
}