'use client'

import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardFooter, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import Image from 'next/image'
import Link from 'next/link'

export default function DashboardPage() {
  // State for search, pagination, and collapsible sections
  const [searchQuery, setSearchQuery] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [showPrompt, setShowPrompt] = useState<number | null>(null)
  const [insightsCollapsed, setInsightsCollapsed] = useState(false)
  
  const itemsPerPage = 4
  
  // Example campaign data
  const allCampaigns = [
    {
      id: 1,
      name: 'Campaign A',
      thumbnail: 'https://i.imgur.com/Ojnc0UD.png',
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
      thumbnail: 'https://i.imgur.com/RV46pAm.png',
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
      thumbnail: 'https://i.imgur.com/mPyghQL.png',
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
      thumbnail: 'https://i.imgur.com/m980mEj.png',
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
    },
    {
      id: 5,
      name: 'Summer Sale Campaign',
      thumbnail: 'https://i.imgur.com/Ojnc0UD.png',
      status: 'ACTIVE',
      metrics: {
        ctr: '3.1%',
        conversions: 192,
        cpa: '$21.70'
      },
      performance: {
        ctr: 75,
        conversions: 90,
        cpa: 72
      }
    },
    {
      id: 6,
      name: 'Holiday Promotion',
      thumbnail: 'https://i.imgur.com/RV46pAm.png',
      status: 'PAUSED',
      metrics: {
        ctr: '2.3%',
        conversions: 165,
        cpa: '$25.80'
      },
      performance: {
        ctr: 60,
        conversions: 75,
        cpa: 55
      }
    },
    {
      id: 7,
      name: 'Brand Awareness',
      thumbnail: 'https://i.imgur.com/mPyghQL.png',
      status: 'ACTIVE',
      metrics: {
        ctr: '2.9%',
        conversions: 205,
        cpa: '$19.90'
      },
      performance: {
        ctr: 72,
        conversions: 92,
        cpa: 77
      }
    }
  ]

  // Example daily creatives data
  const dailyCreatives = [
    {
      id: 1,
      imageUrl: 'https://i.imgur.com/W1GwjpZ.jpeg',
      prompt: 'A modern minimalist logo for a tech startup with blue and teal colors, digital theme',
      title: 'Tech Startup Logo'
    },
    {
      id: 2,
      imageUrl: 'https://i.imgur.com/7JVLczg.jpeg',
      prompt: 'Professional business woman in a modern office setting with city view, discussing marketing strategy',
      title: 'Business Professional'
    },
    {
      id: 3,
      imageUrl: 'https://i.imgur.com/yzsypIu.jpeg',
      prompt: 'Product showcase of a premium smartphone with dark background and blue accent lighting',
      title: 'Product Showcase'
    },
    {
      id: 4,
      imageUrl: 'https://i.imgur.com/5TObwdK.jpeg',
      prompt: 'Happy family enjoying vacation at a beach resort with sunset, lifestyle photography',
      title: 'Lifestyle Photo'
    }
  ]

  // AI-generated insights based on the campaign data
  const insights = [
    'Campaign C has the highest conversion rate and lowest CPA',
    'Consider increasing the budget for Campaign D with its strong performance',
    'Campaign B is underperforming - review creative and targeting',
    'Campaigns A and D have similar CTR - test new ad variations'
  ]

  // Filter campaigns based on search query
  const filteredCampaigns = allCampaigns.filter(campaign => 
    campaign.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  // Calculate total pages
  const totalPages = Math.ceil(filteredCampaigns.length / itemsPerPage)
  
  // Get current page of campaigns
  const currentCampaigns = filteredCampaigns.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  )

  // Handle pagination
  const handlePageChange = (page: number) => {
    setCurrentPage(page)
  }

  // Handle prompt view toggle
  const togglePrompt = (id: number) => {
    if (showPrompt === id) {
      setShowPrompt(null)
    } else {
      setShowPrompt(id)
    }
  }

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
      <div className="flex-1 p-8 overflow-y-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-2xl font-bold text-white">Campaign Dashboard</h1>
          <Button className="bg-blue-600 hover:bg-blue-700">
            Create Campaign
          </Button>
        </div>

        {/* Search Bar */}
        <div className="mb-6">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
              <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
              </svg>
            </div>
            <input
              type="search"
              className="block w-full p-3 pl-10 text-sm text-white border border-[#2A2E3A] rounded-lg bg-[#1A1D29] focus:ring-blue-500 focus:border-blue-500"
              placeholder="Search campaigns..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {/* Campaign Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
          {currentCampaigns.map((campaign) => (
            <Card key={campaign.id} className="bg-[#1A1D29] border-[#2A2E3A] shadow-md hover:shadow-lg transition-shadow">
              <div className="relative h-32 bg-gray-800 border-b border-[#2A2E3A]">
                <Image 
                  src={campaign.thumbnail}
                  alt={campaign.name}
                  fill
                  style={{ objectFit: 'cover' }}
                />
                <div className="absolute top-2 right-2">
                  <Badge className={campaign.status === 'ACTIVE' ? 'bg-green-600 text-white' : 'bg-gray-600 text-white'}>
                    {campaign.status}
                  </Badge>
                </div>
              </div>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg text-white">{campaign.name}</CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-3">
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

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="flex justify-center mt-6 mb-8">
            <nav className="flex items-center space-x-2">
              <button
                onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="px-3 py-1 rounded-md bg-[#1A1D29] border border-[#2A2E3A] text-gray-300 disabled:opacity-50"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                  <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd"></path>
                </svg>
              </button>
              
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                <button
                  key={page}
                  onClick={() => handlePageChange(page)}
                  className={`px-3 py-1 rounded-md ${
                    currentPage === page 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-[#1A1D29] border border-[#2A2E3A] text-gray-300'
                  }`}
                >
                  {page}
                </button>
              ))}
              
              <button
                onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
                className="px-3 py-1 rounded-md bg-[#1A1D29] border border-[#2A2E3A] text-gray-300 disabled:opacity-50"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                  <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd"></path>
                </svg>
              </button>
            </nav>
          </div>
        )}

        {/* Collapsible AI Insights Section */}
        <div className="bg-[#1A1D29] rounded-lg shadow-md border border-[#2A2E3A] mb-8">
          <div 
            className="p-4 flex justify-between items-center cursor-pointer" 
            onClick={() => setInsightsCollapsed(!insightsCollapsed)}
          >
            <h2 className="text-xl font-semibold text-white">AI Insights</h2>
            <svg 
              className={`w-5 h-5 text-gray-400 transition-transform ${insightsCollapsed ? 'transform rotate-180' : ''}`} 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24" 
              xmlns="http://www.w3.org/2000/svg"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
          
          {!insightsCollapsed && (
            <div className="p-4 pt-0 border-t border-[#2A2E3A]">
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
          )}
        </div>

        {/* Daily Creatives Section */}
        <div className="mb-10">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold text-white">Daily Creatives</h2>
            <span className="text-gray-400 text-sm">Created for your account today</span>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {dailyCreatives.map((creative) => (
              <Card key={creative.id} className="bg-[#1A1D29] border-[#2A2E3A] shadow-md overflow-hidden">
                <div className="relative aspect-video bg-gray-800">
                  <Image 
                    src={creative.imageUrl}
                    alt={creative.title}
                    fill
                    style={{ objectFit: 'cover' }}
                    unoptimized
                  />
                </div>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base text-white">{creative.title}</CardTitle>
                </CardHeader>
                {showPrompt === creative.id && (
                  <CardContent className="pt-0">
                    <div className="p-3 bg-[#0A0C14] rounded-md text-xs text-gray-300 mt-2">
                      {creative.prompt}
                    </div>
                  </CardContent>
                )}
                <CardFooter className="flex justify-between pt-0">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="text-xs border-[#2A2E3A] text-gray-300 hover:bg-blue-900/20"
                    onClick={() => togglePrompt(creative.id)}
                  >
                    {showPrompt === creative.id ? 'Hide Prompt' : 'View Prompt'}
                  </Button>
                  <Button 
                    size="sm" 
                    className="text-xs bg-blue-600 hover:bg-blue-700"
                  >
                    Download
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}