'use client'

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

export default function DashboardPage() {
  // Example campaign data
  const campaigns = [
    {
      id: 1,
      name: 'Campaign A',
      status: 'ACTIVE',
      metrics: {
        ctr: '2.7%',
        conversions: 138,
        cpa: '$24.50'
      },
      performance: {
        ctr: 70,
        conversions: 80,
        cpa: 65
      }
    },
    {
      id: 2,
      name: 'Campaign B',
      status: 'PAUSED',
      metrics: {
        ctr: '1.9%',
        conversions: 82,
        cpa: '$31.20'
      },
      performance: {
        ctr: 50,
        conversions: 45,
        cpa: 40
      }
    },
    {
      id: 3,
      name: 'Campaign C',
      status: 'ACTIVE',
      metrics: {
        ctr: '3.2%',
        conversions: 215,
        cpa: '$18.75'
      },
      performance: {
        ctr: 85,
        conversions: 95,
        cpa: 80
      }
    },
    {
      id: 4,
      name: 'Campaign D',
      status: 'ACTIVE',
      metrics: {
        ctr: '2.5%',
        conversions: 176,
        cpa: '$22.30'
      },
      performance: {
        ctr: 65,
        conversions: 85,
        cpa: 70
      }
    }
  ]

  // AI-generated insights based on the campaign data
  const insights = [
    'Campaign C has the highest conversion rate and lowest CPA',
    'Consider increasing the budget for Campaign D with its strong performance',
    'Campaign B is underperforming - review creative and targeting',
    'Campaigns A and D have similar CTR - test new ad variations'
  ]

  return (
    <div className="flex min-h-screen bg-[#0A0C14] text-white">
      {/* Sidebar */}
      <div className="w-64 bg-[#1A1D29] border-r border-[#2A2E3A] shadow-md">
        <div className="p-4">
          <h2 className="text-lg font-semibold mb-6 text-white">Reeply Marketing</h2>
          <nav className="space-y-1">
            <a href="#" className="block px-4 py-2 text-sm text-gray-300 hover:bg-blue-900/40 hover:text-blue-400 rounded-md">
              Dashboard
            </a>
            <a href="#" className="block px-4 py-2 text-sm bg-blue-900/40 text-blue-400 font-medium rounded-md">
              Campaigns
            </a>
            <a href="#" className="block px-4 py-2 text-sm text-gray-300 hover:bg-blue-900/40 hover:text-blue-400 rounded-md">
              Reports
            </a>
            <a href="#" className="block px-4 py-2 text-sm text-gray-300 hover:bg-blue-900/40 hover:text-blue-400 rounded-md">
              Settings
            </a>
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-2xl font-bold text-white">Campaign Dashboard</h1>
          <Button className="bg-blue-600 hover:bg-blue-700">
            Create Campaign
          </Button>
        </div>

        {/* Campaign Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {campaigns.map((campaign) => (
            <Card key={campaign.id} className="bg-[#1A1D29] border-[#2A2E3A] shadow-md hover:shadow-lg transition-shadow">
              <CardHeader className="pb-2 border-b border-[#2A2E3A]">
                <div className="flex justify-between items-start">
                  <CardTitle className="text-lg text-white">{campaign.name}</CardTitle>
                  <Badge className={campaign.status === 'ACTIVE' ? 'bg-green-600 text-white' : 'bg-gray-600 text-white'}>
                    {campaign.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="pt-4">
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-400">CTR</span>
                      <span className="font-medium text-white">{campaign.metrics.ctr}</span>
                    </div>
                    <div className="h-1.5 w-full bg-gray-800 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-blue-500 rounded-full" 
                        style={{ width: `${campaign.performance.ctr}%` }}
                      />
                    </div>
                  </div>
                  
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-400">Conversions</span>
                      <span className="font-medium text-white">{campaign.metrics.conversions}</span>
                    </div>
                    <div className="h-1.5 w-full bg-gray-800 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-blue-500 rounded-full" 
                        style={{ width: `${campaign.performance.conversions}%` }}
                      />
                    </div>
                  </div>
                  
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-400">CPA</span>
                      <span className="font-medium text-white">{campaign.metrics.cpa}</span>
                    </div>
                    <div className="h-1.5 w-full bg-gray-800 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-blue-500 rounded-full" 
                        style={{ width: `${campaign.performance.cpa}%` }}
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* AI Insights Section */}
        <div className="bg-[#1A1D29] rounded-lg shadow-md p-6 border border-[#2A2E3A]">
          <h2 className="text-xl font-semibold mb-4 text-white">AI Insights</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {insights.map((insight, index) => (
              <div key={index} className="flex items-start space-x-3">
                <div className="flex-shrink-0 mt-1">
                  <svg className="w-5 h-5 text-blue-400" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2h-1V9z" clipRule="evenodd" />
                  </svg>
                </div>
                <p className="text-gray-300">{insight}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}