'use client'

import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { useToast } from '@/components/ui/use-toast'
import { FbCampaign } from '@/lib/types'
import { useActiveUI } from '@/components/stocks/active-ui-context'
import { showInSidebar } from '@/lib/sidebar-content-manager'

// Component for client rendering in chat
function LeadNotificationsUI() {
  const [campaigns, setCampaigns] = useState<FbCampaign[]>([])
  const [subscribedCampaigns, setSubscribedCampaigns] = useState<string[]>([])
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
        <div className="max-h-[300px] overflow-y-auto border rounded p-2 mb-4">
          <div className="space-y-3">
            {campaigns.length === 0 ? (
              <p className="text-sm text-muted-foreground p-2">No campaigns found.</p>
            ) : (
              campaigns.map((campaign) => (
                <div key={campaign.id} className="flex items-center space-x-2 border-b pb-2 last:border-b-0">
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

// Direct manipulation of the sidebar - injects our UI right inside the chat
export default function LeadNotificationsComponent() {
  const { toast } = useToast();
  const { setActiveUI } = useActiveUI();
  
  // Force the sidebar to show with our content
  useEffect(() => {
    // Create our component once
    const content = <LeadNotificationsUI />;
    
    // Use both approaches to maximize compatibility
    try {
      // Method 1: Direct manipulation through sidebar-content-manager
      showInSidebar(content, 'Lead Notifications');
      
      // Method 2: Register with the ActiveUI context
      setActiveUI(content, 'leadNotifications', 'Lead Notifications');
      
      // Add direct DOM manipulation as a fallback
      setTimeout(() => {
        try {
          // Try to directly open the sidebar if it exists in the DOM
          const sidebarToggleButton = document.querySelector('[aria-label="Toggle sidebar"]');
          if (sidebarToggleButton && sidebarToggleButton instanceof HTMLElement) {
            // If sidebar is not already open, click to open it
            const sidebarElement = document.querySelector('[data-state="closed"]');
            if (sidebarElement) {
              sidebarToggleButton.click();
            }
          }
          
          // Force display our content by injecting it if all else fails
          const sidebarContentElement = document.querySelector('[class*="sidebar-content"]');
          if (sidebarContentElement) {
            // Just force the sidebar to be visible
            const sidebarElement = document.querySelector('[data-state]');
            if (sidebarElement) {
              sidebarElement.setAttribute('data-state', 'open');
            }
          }
        } catch (e) {
          console.error('Failed to directly manipulate sidebar DOM', e);
        }
      }, 500); // Delay to ensure DOM is ready
      
    } catch (error) {
      console.error('Error showing content in sidebar', error);
      toast({
        title: 'Error',
        description: 'Failed to open sidebar. Please try again.',
        variant: 'destructive',
      });
    }
  }, [setActiveUI, toast]);

  // This is just a placeholder since we're manipulating the sidebar directly
  return null;
}