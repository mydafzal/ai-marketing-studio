'use client'

import React, { useContext, useEffect, useState } from 'react'
import { format } from 'date-fns'
import { cn } from '@/lib/utils'
import { IconSpinner } from '@/components/ui/icons'
import { FbCampaign } from '@/lib/types'
import { Card, CardContent } from '@/components/ui/card'
import { CheckCircle, Link as LinkIcon, XCircle } from 'lucide-react'
import { StandaloneCampaignContext } from '@/components/connect-campaign/standalone-context'
import { StandaloneAdCreativesComparison } from '@/components/connect-campaign/standalone-creatives'
import { useToast } from '@/components/ui/use-toast'
import { useRouter } from 'next/navigation'

export function StandaloneCampaignConnect() {
  const { toast } = useToast()
  const router = useRouter()
  const { 
    campaigns, 
    getCampaignList, 
    setId, 
    id: currentCampaignId, 
    isRefreshing,
    checkAndRefreshAccountData
  } = useContext(StandaloneCampaignContext)
  const [selectedCampaign, setSelectedCampaign] = useState<FbCampaign | undefined>()
  const [isSubmitting, setSubmitting] = useState<boolean>(false)
  const [connectionStatus, setConnectionStatus] = useState<'initial' | 'connecting' | 'success' | 'error'>('initial')
  
  // Refresh campaign list
  // Initial data load - only run once when component mounts
  useEffect(() => {
    // Only force refresh on initial mount
    if (campaigns.length === 0) {
      getCampaignList(true);
    }
  }, [])
  
  // Simple refresh button handler - only make one API call
  const handleManualRefresh = async () => {
    toast({
      title: "Refreshing campaigns",
      description: "Fetching latest campaign data..."
    });
    await checkAndRefreshAccountData();
  }

  // Pre-select the currently connected campaign if available
  useEffect(() => {
    if (currentCampaignId && campaigns && campaigns.length > 0 && !selectedCampaign) {
      const connectedCampaign = campaigns.find(
        (campaign: FbCampaign) => campaign.id === currentCampaignId
      );
      
      if (connectedCampaign) {
        setSelectedCampaign(connectedCampaign);
      }
    }
  }, [currentCampaignId, campaigns, selectedCampaign]);

  async function handleSelectCampaign(campaign: FbCampaign) {
    setSubmitting(true)
    setConnectionStatus('connecting')
    
    try {
      // Update the campaign ID in the context
      setId(campaign.id)
      
      // Show success message
      setConnectionStatus('success')
      toast({
        title: "Campaign connected",
        description: `Successfully connected to "${campaign.name}"`,
      })
    } catch (error) {
      console.error('Error connecting to campaign:', error)
      setConnectionStatus('error')
      toast({
        title: "Connection failed",
        description: "Failed to connect to campaign. Please try again.",
        variant: "destructive"
      })
    } finally {
      setSubmitting(false)
    }
  }

  function handleChangeSelection() {
    setConnectionStatus('initial')
    setSelectedCampaign(undefined)
  }

  return (
    <Card className="bg-[#1A1D29] border-[#2A2E3A] w-full max-w-full">
      <CardContent className="p-6 w-full relative">
        <div className="absolute top-2 right-2 flex items-center gap-2">
          {isRefreshing && (
            <IconSpinner className="size-4 text-[#4BF29C]" />
          )}
          <button 
            onClick={handleManualRefresh}
            className="text-xs text-zinc-400 hover:text-white transition-colors"
            title="Refresh campaigns list"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 2v6h-6"></path>
              <path d="M3 12a9 9 0 0 1 15-6.7L21 8"></path>
              <path d="M3 22v-6h6"></path>
              <path d="M21 12a9 9 0 0 1-15 6.7L3 16"></path>
            </svg>
          </button>
        </div>
        {connectionStatus === 'connecting' && (
          <div className="flex items-center gap-3">
            <IconSpinner className="size-5 text-[#4BF29C]" />
            <span className="text-white">
              Connecting to {selectedCampaign?.name}...
            </span>
          </div>
        )}

        {connectionStatus === 'success' && selectedCampaign && (
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-3">
              <CheckCircle className="size-6 text-[#4BF29C] shrink-0" />
              <div>
                <div className="text-white font-medium">
                  Successfully connected to campaign
                </div>
                <div className="text-[#ADB0B8] text-sm">
                  {selectedCampaign.name}
                </div>
              </div>
            </div>
            
            <button
              onClick={handleChangeSelection}
              className="mt-4 w-full px-4 py-2 bg-[#151925] text-white border border-[#2A2E3A] rounded-lg hover:bg-[#1E2336] transition-colors"
            >
              Connect to Different Campaign
            </button>
            
            <div className="mt-6 w-full max-w-full overflow-x-auto">
              <StandaloneAdCreativesComparison />
            </div>
          </div>
        )}

        {connectionStatus === 'error' && (
          <div className="text-red-400 flex items-center gap-3">
            <XCircle className="size-6 text-red-400 shrink-0" />
            <div>
              <div className="font-medium">Connection failed</div>
              <div className="text-sm text-[#ADB0B8]">Please check your connection and try again.</div>
            </div>
          </div>
        )}

        {connectionStatus === 'initial' && (
          <>
            <div className="text-xl font-semibold text-white mb-4">
              Connect to Campaign
            </div>
            <div className="text-sm text-[#ADB0B8] mb-6">
              Select a Facebook campaign to work with
            </div>
            
            {campaigns.length > 0 ? (
              <div className="space-y-6">
                <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
                  {campaigns.map((campaign: FbCampaign) => {
                    const created_time = format(
                      new Date(campaign.created_time),
                      'MMM d, yyyy HH:mm'
                    )
                    const isActive = campaign.status === 'ACTIVE';
                    
                    return (
                      <div 
                        key={campaign.id}
                        onClick={() => setSelectedCampaign(campaign)}
                        className={cn(
                          'flex items-center p-3 rounded-lg border transition-colors cursor-pointer',
                          selectedCampaign?.id === campaign.id 
                            ? 'border-[#4BF29C] bg-[#151925]' 
                            : currentCampaignId === campaign.id
                              ? 'border-[#4BF29C] bg-[#151925]/60' 
                              : 'border-[#2A2E3A] bg-[#0A0C14] hover:bg-[#151925]'
                        )}
                      >
                        <div className="mr-3 flex-shrink-0">
                          <div className={cn(
                            'w-3 h-3 rounded-full',
                            isActive ? 'bg-[#4BF29C]' : 'bg-[#8A8F99]'
                          )}>
                          </div>
                        </div>
                        <div className="flex-1">
                          <div className="flex flex-col">
                            <div className="flex items-center">
                              <span className="text-white font-medium">{campaign.name}</span>
                              {currentCampaignId === campaign.id && (
                                <span className="ml-2 text-xs px-2 py-0.5 rounded-full bg-[#0F2922] text-[#4BF29C]">
                                  Current
                                </span>
                              )}
                            </div>
                            <span className="text-xs text-[#8A8F99]">
                              {campaign.status} • {created_time}
                            </span>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>

                <div className="flex">
                  <button
                    disabled={!selectedCampaign || isSubmitting}
                    onClick={async () => {
                      if (selectedCampaign) {
                        await handleSelectCampaign(selectedCampaign)
                      }
                    }}
                    className={cn(
                      'flex justify-center items-center gap-2 w-full h-12 px-6',
                      'text-white font-medium rounded-lg',
                      'bg-[#151925] border border-[#2A2E3A]',
                      'hover:bg-[#1E2336]',
                      'transition-colors duration-200',
                      'disabled:opacity-50 disabled:cursor-not-allowed',
                      'focus:outline-none focus:ring-2 focus:ring-[#4BF29C]'
                    )}
                  >
                    {isSubmitting ? (
                      <IconSpinner className="size-5" />
                    ) : (
                      <>
                        <LinkIcon className="size-4 text-[#4BF29C]" />
                        Connect Campaign
                      </>
                    )}
                  </button>
                </div>
              </div>
            ) : (
              <div className="py-8 text-center bg-[#0A0C14] rounded-lg border border-[#2A2E3A]">
                <div className="text-[#ADB0B8]">
                  No campaigns available. You need to create a campaign first.
                </div>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  )
}