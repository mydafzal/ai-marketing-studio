"use client"

import React, { useEffect, useState } from "react"
import { IconSpinner } from "@/components/ui/icons"
import { useRouter } from "next/navigation"
import { getCampaigns } from '@/lib/api/fasty-bot/get-campaigns'
import { FbCampaign } from "@/lib/types"
import { CampaignSummary, getCampaignSummary } from "@/lib/api/fasty-bot/get-campaign-summary"
import { format } from "date-fns"

const findImageUrl = (obj: any): string | undefined => {
  if (!obj || typeof obj !== 'object') {
    return undefined;  
  }

  if (obj.hasOwnProperty('image_url')) {
    return obj.image_url;
  }

  for (let key in obj) {
    if (obj.hasOwnProperty(key)) {
      const result = findImageUrl(obj[key]);
      if (result) {
        return result;  
      }
    }
  }
  return undefined;  
};

// Utility function to calculate percentage difference
const getPercentageDifference = (newValue: number, oldValue: number) => {
  if (oldValue === 0) return 100;
  return ((newValue - oldValue) / oldValue) * 100;
}

// Reusable component for displaying each metric with optional percentage change
const CampaignMetrics = ({ label, value, comparisonValue, isSelected }: { label: string, value: number, comparisonValue: number, isSelected: boolean }) => {
  let comparison = isSelected ? 0 : getPercentageDifference(value, comparisonValue);  // No percentage for selected campaign
  return (
    <div className="flex items-center">
      <span className="font-semibold">{label}:</span>
      <span className="ml-2">{value.toFixed(2)}</span>
      {!isSelected && (
        <span className={`ml-4 text-sm ${comparison > 0 ? 'text-red-500' : 'text-green-500'}`}>
          {comparison > 0 ? `+${comparison.toFixed(2)}% ↑` : `${comparison.toFixed(2)}% ↓`}
        </span>
      )}
    </div>
  );
};

export default function AiCampaignAnalysis() {
  const [campaigns, setCampaigns] = useState<FbCampaign[]>([])
  const [selectedCampaignId, setSelectedCampaignId] = useState<string | undefined>(undefined)
  const [selectedCampaignSummary, setSelectedCampaignSummary] = useState<CampaignSummary | null>(null)
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const [isFetching, setIsFetching] = useState(true)
  const [isFetchingSummary, setIsFetchingSummary] = useState(false)
  const router = useRouter()

  // Fetch campaigns on component mount
  useEffect(() => {
    const fetchCampaigns = async () => {
      try {
        const campaignsData = await getCampaigns()
        if (campaignsData.length > 0) {
          const response = await fetch('/api/fasty-bot/proxy-get-adcreatives?campaignId=all')
          const adcreatives = await response.json()
  

          campaignsData.forEach((campaign: FbCampaign) => {
            const adCreative = adcreatives.data.data.find((ad: any) => ad.campaign_id === campaign.id)
            if (adCreative) {
              const imageUrl = findImageUrl(adCreative.creative);
              campaign.image_url = imageUrl || adCreative.creative.image_url || adCreative.creative.thumbnail_url;
              campaign.thumbnail_url = adCreative.creative.thumbnail_url;
            }
          })
          setCampaigns(campaignsData)
          setSelectedCampaignId(campaignsData[0].id)
        }
      } catch (error) {
        console.error('Error fetching campaigns:', error)
        router.push('/login')
      }
      setIsFetching(false)
    }
    fetchCampaigns()
  }, [])

  // Fetch campaign summary for selected campaign
  useEffect(() => {
    if (selectedCampaignId) {
      setIsFetchingSummary(true)
      const fetchSummary = async () => {
        try {
          const summary = await getCampaignSummary(selectedCampaignId)
          console.log('Campaign Summary:', summary)
          setSelectedCampaignSummary(summary)
        } catch (error) {
          console.error('Error fetching campaign summary:', error)
        }
        setIsFetchingSummary(false)
      } 
      fetchSummary()
    }
  }, [selectedCampaignId])

  const handleCampaignSelect = (campaignId: string) => {
    setSelectedCampaignId(campaignId)
    setIsDropdownOpen(false)
  }

  if (isFetching || isFetchingSummary) {
    return (
      <div className="flex items-center justify-center h-screen w-full">
        <IconSpinner />
      </div>
    )
  }

  // eg "From January 01, 2023 Till October 01, 2023"
  const startDate = selectedCampaignSummary?.creation_date ? format(new Date(selectedCampaignSummary.creation_date), 'MMMM dd, yyyy') : 'N/A';
  const endDate = format(new Date(), 'MMMM dd, yyyy');

  return (
    <div className="container mx-auto p-3 sm:p-6 flex justify-center">
      <div className="flex flex-col space-y-6">
        {/* Title Center Alignment */}
        <div className="flex items-center justify-center">
          <h1 className="text-2xl font-bold">Campaign Comparison Tool</h1>
        </div>

        <div className="flex flex-col items-center gap-3">
          <p className="text-sm text-muted-foreground text-center">
            Select a campaign and analyze with other campaigns of the same account
          </p>

          {/* Custom dropdown for selecting a campaign */}
          <div className="relative">
            <button
              className="flex items-center justify-between border border-gray-300 rounded px-3 py-2 w-full text-sm"
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            >
              <span>{campaigns.find(campaign => campaign.id === selectedCampaignId)?.name || 'Select Campaign'}</span>
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            {isDropdownOpen && (
              <div className="absolute bg-white border border-gray-300 rounded shadow-lg w-full mt-2 max-h-60 overflow-auto z-10 text-black">
                {campaigns.map((campaign) => (
                  <div
                    key={campaign.id}
                    onClick={() => handleCampaignSelect(campaign.id)}
                    className="flex items-center px-4 py-2 cursor-pointer hover:bg-gray-100"
                  >
                    <img
                      src={campaign.thumbnail_url || '/default-thumbnail.png'}
                      alt={campaign.name}
                      className="w-8 h-8 rounded-full object-cover mr-3"
                    />
                    <span>{campaign.name}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Display Comparison Timeline */}
          {selectedCampaignSummary && (
            <div className="flex justify-center text-center py-3 px-6 bg-white border border-gray-200 rounded-lg shadow-lg max-w-xl mx-auto">
              <p className="text-sm text-gray-600">
                <span className="font-semibold text-gray-800"> From: </span> 
                <strong className="text-black">{startDate}</strong>
                <span className="font-semibold text-gray-800"> || Till: </span> 
                <strong className="text-black">{endDate}</strong>
              </p>
            </div>
          )}


          {/* Selected Campaign Box */}
          <div className="p-10 border rounded-lg shadow-md bg-white">
            <h2 className="text-xl font-semibold mb-4 text-center text-gray-500">
                  {selectedCampaignSummary?.campaign_name}
            </h2>

            <div className="flex items-center text-black">
              <img
                src={campaigns.find(c => c.id === selectedCampaignSummary?.campaign_id)?.image_url || '/default-thumbnail.png'}
                alt={selectedCampaignSummary?.campaign_name}
                className="w-80 object-cover mr-4"
              />
              <div className="flex flex-col space-y-2">
                
                {/* Optimization Goal */}
                <div className="flex items-center">
                  <span className="font-semibold">Optimization Goal:</span>
                  <span className="ml-2">{selectedCampaignSummary?.optimization_goal || 'N/A'}</span>
                </div>
               
                {/* Cost per Lead */}
                <CampaignMetrics 
                  label="Cost per Lead"
                  value={selectedCampaignSummary?.cost_per_lead || 0}
                  comparisonValue={selectedCampaignSummary?.cost_per_lead || 0} // Comparison with another campaign or previous period
                  isSelected={true}
                />

                {/* Cost per 1,000 People (CPP) */}
                <CampaignMetrics 
                  label="Cost per 1,000 People (CPP)"
                  value={selectedCampaignSummary?.cpp || 0}
                  comparisonValue={selectedCampaignSummary?.cpp || 0} // Comparison with another campaign or previous period
                  isSelected={true}
                />

                {/* Cost per Click (CPC) */}
                <CampaignMetrics 
                  label="Cost per Click (CPC)"
                  value={selectedCampaignSummary?.cpc || 0}
                  comparisonValue={selectedCampaignSummary?.cpc || 0} // Comparison with another campaign or previous period
                  isSelected={true}
                />

                {/* Cost per 1,000 Impressions (CPM) */}
                <CampaignMetrics 
                  label="Cost per 1,000 Impressions (CPM)"
                  value={selectedCampaignSummary?.cpm || 0}
                  comparisonValue={selectedCampaignSummary?.cpm || 0} // Comparison with another campaign or previous period
                  isSelected={true}
                />

                {/* Cost per Action Type */}
                <span className="font-semibold">Cost per Action Type:</span>
                <div className="flex items-center">
                  <div className="ml-2">
                    {selectedCampaignSummary?.cost_per_action_type?.length ? (
                      <table className="table-auto border-collapse border border-gray-300">
                        <thead>
                          <tr>
                            <th className="border border-gray-300 px-4 py-2">Per Action Type</th>
                            <th className="border border-gray-300 px-4 py-2">Cost</th>
                          </tr>
                        </thead>
                        <tbody>
                          {selectedCampaignSummary.cost_per_action_type.map((action: any, index: number) => (
                            <tr key={index}>
                              <td className="border border-gray-300 px-4 py-2">{action.action_type}</td>
                              <td className="border border-gray-300 px-4 py-2">{action.value}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    ) : (
                      <span>N/A</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Other Campaigns Comparison */}
          <div className="space-y-4 p-10 rounded-lg shadow-md">
            <div className="text-center rounded-lg shadow-lg p-5 m-5 text-gray-200">
            <h2 className="text-xl font-semibold">Comparison to similar campaigns</h2>
            </div>
            {selectedCampaignSummary?.other_campaign_insights?.length ? (
              selectedCampaignSummary.other_campaign_insights.map((campaign) => {
                if (campaign.campaign_id !== selectedCampaignId) {
                  return (
                    <div key={campaign.campaign_id} className="p-10 border rounded-lg shadow-md bg-white text-black">
                      <h2 className="text-xl font-semibold mb-4 text-center text-gray-500">
                            {campaign?.campaign_name}
                      </h2>
                      <div className="flex items-center">
                        <img
                          src={campaigns.find(c => c.id === campaign.campaign_id)?.image_url || '/default-thumbnail.png'}
                          alt={campaign.campaign_name}
                          className="w-80 object-cover mr-4"
                        />
                        <div className="flex flex-col space-y-2">

                          {/* Optimization Goal */}
                          <div className="flex items-center">
                            <span className="font-semibold">Optimization Goal:</span>
                            <span className="ml-2">{campaign.optimization_goal || 'N/A'}</span>
                          </div>

                          <CampaignMetrics 
                            label="Cost per Lead"
                            value={campaign.cost_per_lead || 0}
                            comparisonValue={selectedCampaignSummary?.cost_per_lead || 0}
                            isSelected={false}
                          />

                          <CampaignMetrics 
                            label="Cost per 1,000 People (CPP)"
                            value={campaign.cpp || 0}
                            comparisonValue={selectedCampaignSummary?.cpp || 0}
                            isSelected={false}
                          />

                          <CampaignMetrics 
                            label="Cost per Click (CPC)"
                            value={campaign.cpc || 0}
                            comparisonValue={selectedCampaignSummary?.cpc || 0}
                            isSelected={false}
                          />

                          <CampaignMetrics 
                            label="Cost per 1,000 Impressions (CPM)"
                            value={campaign.cpm || 0}
                            comparisonValue={selectedCampaignSummary?.cpm || 0}
                            isSelected={false}
                          />

                          {/* Cost per Action Type */}
                          <div className="font-semibold">Cost per Action Type:</div>
                          <div className="ml-2">
                            {campaign.cost_per_action_type?.length ? (
                              <table className="table-auto border-collapse border border-gray-300">
                                <thead>
                                  <tr>
                                    <th className="border border-gray-300 px-4 py-2">Per Action Type</th>
                                    <th className="border border-gray-300 px-4 py-2">Cost</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {campaign.cost_per_action_type.map((action: any, index: number) => (
                                    <tr key={index}>
                                      <td className="border border-gray-300 px-4 py-2">{action.action_type}</td>
                                      <td className="border border-gray-300 px-4 py-2">{action.value}</td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            ) : (
                              <span>N/A</span>
                            )}
                          </div>

                        </div>
                      </div>
                    </div>
                  );
                }
                return null;
              })
            ) : (
              <div>
                <p className="text-center text-gray-200" style={{ fontStyle: 'italic' }}>No similar campaigns found</p>
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  )
}
