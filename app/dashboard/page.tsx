'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardFooter, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Slider } from '@/components/ui/slider'
import { Label } from '@/components/ui/label'
import { BarChart, PieChart, LineChart, ChevronDown, Download, Edit, PieChart as PieChartIcon, BarChart2, Settings, Toggle, DollarSign, Users, Calendar, Eye, EyeOff } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import DashboardChatWidget from '@/components/dashboard-chat-widget'

export default function DashboardPage() {
  // State for search, pagination, and collapsible sections
  const [searchQuery, setSearchQuery] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [showPrompt, setShowPrompt] = useState<number | null>(null)
  const [insightsCollapsed, setInsightsCollapsed] = useState(false)
  const [showStatsModal, setShowStatsModal] = useState<number | null>(null)
  const [showEditModal, setShowEditModal] = useState<number | null>(null)
  const [showIntegrationsModal, setShowIntegrationsModal] = useState(false)
  
  // Effect to listen for hash changes
  useEffect(() => {
    const handleHashChange = () => {
      if (window.location.hash === '#integrations') {
        setShowIntegrationsModal(true);
      }
    };
    
    // Check on initial load
    handleHashChange();
    
    // Add listener for hash changes
    window.addEventListener('hashchange', handleHashChange);
    
    // Cleanup
    return () => {
      window.removeEventListener('hashchange', handleHashChange);
    };
  }, []);
  
  const itemsPerPage = 4
  
  // Example campaign data
  const allCampaigns = [
    {
      id: 1,
      name: 'Campaign A',
      thumbnail: 'https://i.imgur.com/Ojnc0UD.png',
      status: 'ACTIVE',
      budget: 1200,
      startDate: '2023-12-01',
      endDate: '2024-01-15',
      metrics: {
        ctr: '2.7%',
        conversions: 138,
        cpa: '$24.50',
        clicks: 5125,
        impressions: 189815,
        spend: '$3,381.00',
        leads: 76
      },
      performance: {
        ctr: 70,
        conversions: 80,
        cpa: 65
      },
      adSets: [
        { id: 101, name: 'Interest Targeting', status: 'ACTIVE', budget: 600, impressions: 95420, clicks: 2578 },
        { id: 102, name: 'Lookalike Audience', status: 'ACTIVE', budget: 600, impressions: 94395, clicks: 2547 }
      ],
      creatives: [
        { id: 201, name: 'Blue Banner', status: 'ACTIVE', impressions: 94908, clicks: 2562, ctr: '2.7%' },
        { id: 202, name: 'Product Showcase', status: 'ACTIVE', impressions: 94907, clicks: 2563, ctr: '2.7%' }
      ]
    },
    {
      id: 2,
      name: 'Campaign B',
      thumbnail: 'https://i.imgur.com/RV46pAm.png',
      status: 'PAUSED',
      budget: 800,
      startDate: '2023-11-15',
      endDate: '2023-12-31',
      metrics: {
        ctr: '1.9%',
        conversions: 82,
        cpa: '$31.20',
        clicks: 3280,
        impressions: 172632,
        spend: '$2,558.40',
        leads: 42
      },
      performance: {
        ctr: 50,
        conversions: 45,
        cpa: 40
      },
      adSets: [
        { id: 103, name: 'Broad Targeting', status: 'PAUSED', budget: 400, impressions: 85000, clicks: 1615 },
        { id: 104, name: 'Retargeting', status: 'PAUSED', budget: 400, impressions: 87632, clicks: 1665 }
      ],
      creatives: [
        { id: 203, name: 'Product Demo', status: 'PAUSED', impressions: 86316, clicks: 1640, ctr: '1.9%' },
        { id: 204, name: 'Customer Testimonial', status: 'PAUSED', impressions: 86316, clicks: 1640, ctr: '1.9%' }
      ]
    },
    {
      id: 3,
      name: 'Campaign C',
      thumbnail: 'https://i.imgur.com/mPyghQL.png',
      status: 'ACTIVE',
      budget: 1500,
      startDate: '2023-12-15',
      endDate: '2024-02-15',
      metrics: {
        ctr: '3.2%',
        conversions: 215,
        cpa: '$18.75',
        clicks: 6720,
        impressions: 210000,
        spend: '$4,031.25',
        leads: 125
      },
      performance: {
        ctr: 85,
        conversions: 95,
        cpa: 80
      },
      adSets: [
        { id: 105, name: 'Core Audience', status: 'ACTIVE', budget: 750, impressions: 105000, clicks: 3360 },
        { id: 106, name: 'Custom Audience', status: 'ACTIVE', budget: 750, impressions: 105000, clicks: 3360 }
      ],
      creatives: [
        { id: 205, name: 'Feature Highlight', status: 'ACTIVE', impressions: 70000, clicks: 2240, ctr: '3.2%' },
        { id: 206, name: 'Value Proposition', status: 'ACTIVE', impressions: 70000, clicks: 2240, ctr: '3.2%' },
        { id: 207, name: 'Limited Offer', status: 'ACTIVE', impressions: 70000, clicks: 2240, ctr: '3.2%' }
      ]
    },
    {
      id: 4,
      name: 'Campaign D',
      thumbnail: 'https://i.imgur.com/m980mEj.png',
      status: 'ACTIVE',
      budget: 1350,
      startDate: '2024-01-01',
      endDate: '2024-02-28',
      metrics: {
        ctr: '2.5%',
        conversions: 176,
        cpa: '$22.30',
        clicks: 5280,
        impressions: 211200,
        spend: '$3,924.80',
        leads: 92
      },
      performance: {
        ctr: 65,
        conversions: 85,
        cpa: 70
      },
      adSets: [
        { id: 107, name: 'Geographic Targeting', status: 'ACTIVE', budget: 675, impressions: 105600, clicks: 2640 },
        { id: 108, name: 'Demographic Targeting', status: 'ACTIVE', budget: 675, impressions: 105600, clicks: 2640 }
      ],
      creatives: [
        { id: 208, name: 'Main Banner', status: 'ACTIVE', impressions: 70400, clicks: 1760, ctr: '2.5%' },
        { id: 209, name: 'Secondary Banner', status: 'ACTIVE', impressions: 70400, clicks: 1760, ctr: '2.5%' },
        { id: 210, name: 'Video Ad', status: 'ACTIVE', impressions: 70400, clicks: 1760, ctr: '2.5%' }
      ]
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
            <a href="#integrations" className="block px-4 py-2 text-sm text-gray-300 hover:bg-blue-900/40 hover:text-blue-400 rounded-md">
              Integrations
            </a>
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-8 overflow-y-auto">
        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center">
            <h1 className="text-2xl font-bold text-white mr-3">Campaign Dashboard</h1>
            <div id="dashboard-chat-container">
              <DashboardChatWidget />
            </div>
          </div>
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
          {/* Create Campaign Card - Always First */}
          <Card className="bg-[#1A1D29] border-[#2A2E3A] shadow-md hover:shadow-lg transition-shadow overflow-hidden">
            <div className="grid grid-cols-1 grid-rows-2 h-full divide-y divide-[#2A2E3A]">
              {/* Create Campaign Section */}
              <div className="p-5 flex items-center cursor-pointer hover:bg-[#20232f] transition-colors group">
                <div className="w-12 h-12 rounded-full bg-blue-600 flex items-center justify-center mr-4 group-hover:scale-110 transition-transform flex-shrink-0">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-medium text-white">Create Campaign</h3>
                  <p className="text-gray-400 text-xs mt-1">Start a new marketing campaign</p>
                </div>
              </div>
              
              {/* Ask AI Section */}
              <div 
                className="p-5 flex items-center cursor-pointer hover:bg-[#20232f] transition-colors group"
                onClick={() => {
                  // Use the global chat function we added to the window object
                  if ((window as any).dashboardChat) {
                    (window as any).dashboardChat.open("Compare my last 3 campaigns");
                  }
                }}
              >
                <div className="w-12 h-12 rounded-full bg-[#4F46E5] flex items-center justify-center mr-4 group-hover:scale-110 transition-transform flex-shrink-0">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"></path>
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-medium text-white">Ask AI</h3>
                  <p className="text-gray-400 text-xs mt-1">Get insights about existing campaigns and more</p>
                </div>
              </div>
            </div>
          </Card>
          
          {/* Regular Campaign Cards */}
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
                <div className="flex justify-between items-start">
                  <CardTitle className="text-lg text-white">{campaign.name}</CardTitle>
                  <div className="flex space-x-2">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-8 w-8 p-0 text-gray-400 hover:text-blue-400"
                      onClick={() => setShowStatsModal(campaign.id)}
                    >
                      <BarChart2 className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-8 w-8 p-0 text-gray-400 hover:text-blue-400"
                      onClick={() => setShowEditModal(campaign.id)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
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

      {/* Campaign Stats Modal */}
      <Dialog open={showStatsModal !== null} onOpenChange={() => setShowStatsModal(null)}>
        <DialogContent className="bg-[#1A1D29] text-white border-[#2A2E3A] max-w-4xl max-h-[90vh] overflow-auto">
          {showStatsModal !== null && (() => {
            const campaign = allCampaigns.find(c => c.id === showStatsModal);
            if (!campaign) return null;
            
            return (
              <>
                <DialogHeader>
                  <DialogTitle className="text-xl font-bold flex items-center">
                    <BarChart2 className="mr-2 h-5 w-5 text-blue-400" />
                    Campaign Statistics: {campaign.name}
                    <Badge className={`ml-3 ${campaign.status === 'ACTIVE' ? 'bg-green-600' : 'bg-gray-600'}`}>
                      {campaign.status}
                    </Badge>
                  </DialogTitle>
                  <DialogDescription className="text-gray-400 mt-2 flex flex-wrap gap-x-6 gap-y-2">
                    <div className="flex items-center">
                      <Calendar className="h-4 w-4 mr-1" />
                      <span>Start: {campaign.startDate}</span>
                    </div>
                    <div className="flex items-center">
                      <Calendar className="h-4 w-4 mr-1" />
                      <span>End: {campaign.endDate}</span>
                    </div>
                    <div className="flex items-center">
                      <DollarSign className="h-4 w-4 mr-1" />
                      <span>Budget: ${campaign.budget}</span>
                    </div>
                  </DialogDescription>
                </DialogHeader>

                <Tabs defaultValue="overview" className="mt-4">
                  <TabsList className="bg-[#0A0C14] border border-[#2A2E3A] p-1">
                    <TabsTrigger value="overview" className="data-[state=active]:bg-blue-600">Overview</TabsTrigger>
                    <TabsTrigger value="adsets" className="data-[state=active]:bg-blue-600">Ad Sets</TabsTrigger>
                    <TabsTrigger value="creatives" className="data-[state=active]:bg-blue-600">Creatives</TabsTrigger>
                    <TabsTrigger value="leads" className="data-[state=active]:bg-blue-600">Leads</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="overview" className="pt-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                      <Card className="bg-[#0A0C14] border-[#2A2E3A]">
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm text-gray-400">Impressions</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="text-2xl font-bold">{campaign.metrics.impressions.toLocaleString()}</div>
                        </CardContent>
                      </Card>
                      
                      <Card className="bg-[#0A0C14] border-[#2A2E3A]">
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm text-gray-400">Clicks</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="text-2xl font-bold">{campaign.metrics.clicks.toLocaleString()}</div>
                        </CardContent>
                      </Card>
                      
                      <Card className="bg-[#0A0C14] border-[#2A2E3A]">
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm text-gray-400">CTR</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="text-2xl font-bold">{campaign.metrics.ctr}</div>
                        </CardContent>
                      </Card>
                      
                      <Card className="bg-[#0A0C14] border-[#2A2E3A]">
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm text-gray-400">Spend</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="text-2xl font-bold">{campaign.metrics.spend}</div>
                        </CardContent>
                      </Card>
                    </div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      <Card className="bg-[#0A0C14] border-[#2A2E3A]">
                        <CardHeader>
                          <CardTitle className="text-white">Conversions</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-4">
                            <div>
                              <div className="flex justify-between text-sm mb-1">
                                <span className="text-gray-400">Total</span>
                                <span className="font-medium text-white">{campaign.metrics.conversions}</span>
                              </div>
                              <div className="h-2 w-full bg-gray-800 rounded-full overflow-hidden">
                                <div className="h-full bg-blue-500 rounded-full" style={{ width: `${campaign.performance.conversions}%` }} />
                              </div>
                            </div>
                            
                            <div>
                              <div className="flex justify-between text-sm mb-1">
                                <span className="text-gray-400">Cost Per Acquisition</span>
                                <span className="font-medium text-white">{campaign.metrics.cpa}</span>
                              </div>
                              <div className="h-2 w-full bg-gray-800 rounded-full overflow-hidden">
                                <div className="h-full bg-blue-500 rounded-full" style={{ width: `${campaign.performance.cpa}%` }} />
                              </div>
                            </div>
                            
                            <div>
                              <div className="flex justify-between text-sm mb-1">
                                <span className="text-gray-400">Leads</span>
                                <span className="font-medium text-white">{campaign.metrics.leads}</span>
                              </div>
                              <div className="h-2 w-full bg-gray-800 rounded-full overflow-hidden">
                                <div className="h-full bg-green-500 rounded-full" style={{ width: `${Math.min(100, (campaign.metrics.leads / campaign.metrics.conversions) * 100)}%` }} />
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                      
                      <Card className="bg-[#0A0C14] border-[#2A2E3A]">
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                          <CardTitle className="text-white">Performance Trend</CardTitle>
                          <div className="flex space-x-2 text-sm text-gray-400">
                            <span>Last 30 days</span>
                            <ChevronDown className="h-4 w-4" />
                          </div>
                        </CardHeader>
                        <CardContent>
                          <div className="flex-1 min-h-[180px] flex items-center justify-center text-gray-500">
                            <LineChart className="h-16 w-16 opacity-30" />
                            <span className="ml-2">Performance Chart</span>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="adsets" className="pt-4">
                    <div className="bg-[#0A0C14] border border-[#2A2E3A] rounded-lg p-4">
                      <h3 className="text-lg font-medium mb-4">Ad Sets ({campaign.adSets.length})</h3>
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead className="border-b border-[#2A2E3A]">
                            <tr>
                              <th className="text-left font-medium text-gray-400 pb-2">Name</th>
                              <th className="text-left font-medium text-gray-400 pb-2">Status</th>
                              <th className="text-left font-medium text-gray-400 pb-2">Budget</th>
                              <th className="text-left font-medium text-gray-400 pb-2">Impressions</th>
                              <th className="text-left font-medium text-gray-400 pb-2">Clicks</th>
                              <th className="text-left font-medium text-gray-400 pb-2">CTR</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-[#2A2E3A]">
                            {campaign.adSets.map(adSet => (
                              <tr key={adSet.id} className="hover:bg-[#0a0c14]/50">
                                <td className="py-3">{adSet.name}</td>
                                <td className="py-3">
                                  <Badge className={adSet.status === 'ACTIVE' ? 'bg-green-600' : 'bg-gray-600'}>
                                    {adSet.status}
                                  </Badge>
                                </td>
                                <td className="py-3">${adSet.budget}</td>
                                <td className="py-3">{adSet.impressions.toLocaleString()}</td>
                                <td className="py-3">{adSet.clicks.toLocaleString()}</td>
                                <td className="py-3">{((adSet.clicks / adSet.impressions) * 100).toFixed(1)}%</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="creatives" className="pt-4">
                    <div className="bg-[#0A0C14] border border-[#2A2E3A] rounded-lg p-4">
                      <h3 className="text-lg font-medium mb-4">Ad Creatives ({campaign.creatives.length})</h3>
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead className="border-b border-[#2A2E3A]">
                            <tr>
                              <th className="text-left font-medium text-gray-400 pb-2">Name</th>
                              <th className="text-left font-medium text-gray-400 pb-2">Status</th>
                              <th className="text-left font-medium text-gray-400 pb-2">Impressions</th>
                              <th className="text-left font-medium text-gray-400 pb-2">Clicks</th>
                              <th className="text-left font-medium text-gray-400 pb-2">CTR</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-[#2A2E3A]">
                            {campaign.creatives.map(creative => (
                              <tr key={creative.id} className="hover:bg-[#0a0c14]/50">
                                <td className="py-3">{creative.name}</td>
                                <td className="py-3">
                                  <Badge className={creative.status === 'ACTIVE' ? 'bg-green-600' : 'bg-gray-600'}>
                                    {creative.status}
                                  </Badge>
                                </td>
                                <td className="py-3">{creative.impressions.toLocaleString()}</td>
                                <td className="py-3">{creative.clicks.toLocaleString()}</td>
                                <td className="py-3">{creative.ctr}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="leads" className="pt-4">
                    <div className="bg-[#0A0C14] border border-[#2A2E3A] rounded-lg p-6">
                      <div className="flex justify-between items-center mb-6">
                        <h3 className="text-lg font-medium">Leads Generated: {campaign.metrics.leads}</h3>
                        <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                          <Download className="h-4 w-4 mr-2" />
                          Download Leads
                        </Button>
                      </div>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        <Card className="bg-[#1A1D29] border-[#2A2E3A]">
                          <CardHeader>
                            <CardTitle className="text-white flex items-center">
                              <Users className="h-4 w-4 mr-2 text-blue-400" />
                              Lead Demographics
                            </CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="flex-1 min-h-[180px] flex items-center justify-center text-gray-500">
                              <PieChart className="h-16 w-16 opacity-30" />
                              <span className="ml-2">Demographics Chart</span>
                            </div>
                          </CardContent>
                        </Card>
                        
                        <Card className="bg-[#1A1D29] border-[#2A2E3A]">
                          <CardHeader>
                            <CardTitle className="text-white flex items-center">
                              <BarChart className="h-4 w-4 mr-2 text-blue-400" />
                              Lead Sources
                            </CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="flex-1 min-h-[180px] flex items-center justify-center text-gray-500">
                              <BarChart className="h-16 w-16 opacity-30" />
                              <span className="ml-2">Sources Chart</span>
                            </div>
                          </CardContent>
                        </Card>
                      </div>
                    </div>
                  </TabsContent>
                </Tabs>

                <DialogFooter className="mt-6">
                  <Button 
                    variant="outline" 
                    className="border-[#2A2E3A] hover:bg-[#2A2E3A] text-gray-300"
                    onClick={() => setShowStatsModal(null)}
                  >
                    Close
                  </Button>
                </DialogFooter>
              </>
            );
          })()}
        </DialogContent>
      </Dialog>

      {/* Integrations Modal */}
      <Dialog open={showIntegrationsModal} onOpenChange={(open) => {
        setShowIntegrationsModal(open);
        if (!open && window.location.hash === '#integrations') {
          window.history.pushState(null, '', window.location.pathname);
        }
      }}>
        <DialogContent className="bg-[#1A1D29] text-white border-[#2A2E3A] max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">Integrations</DialogTitle>
            <DialogDescription className="text-gray-400">
              Connect your campaign dashboard with other tools and services.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <div className="bg-[#0A0C14] rounded-lg border border-[#2A2E3A] p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="bg-[#FF4A00] p-1.5 rounded">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M18.2834 5.72233C17.3136 5.72233 16.5245 6.51017 16.5245 7.48106C16.5245 8.45196 17.3136 9.22983 18.2834 9.22983C19.2533 9.22983 20.0505 8.45196 20.0505 7.48106C20.0494 6.51133 19.2603 5.72233 18.2834 5.72233Z" fill="white"/>
                      <path d="M6.56258 13.7554C5.59392 13.7554 4.80377 14.5432 4.80377 15.5141C4.80377 16.485 5.59392 17.2729 6.56258 17.2729C7.53123 17.2729 8.32138 16.485 8.32138 15.5141C8.32138 14.5432 7.53123 13.7554 6.56258 13.7554Z" fill="white"/>
                      <path d="M6.56258 5.72233C5.59392 5.72233 4.80377 6.51017 4.80377 7.48106C4.80377 8.45196 5.59392 9.22983 6.56258 9.22983C7.53123 9.22983 8.32138 8.45196 8.32138 7.48106C8.32138 6.51017 7.53123 5.72233 6.56258 5.72233Z" fill="white"/>
                      <path d="M18.2834 13.7554C17.3136 13.7554 16.5245 14.5432 16.5245 15.5141C16.5245 16.485 17.3136 17.2729 18.2834 17.2729C19.2533 17.2729 20.0505 16.485 20.0505 15.5141C20.0494 14.5432 19.2603 13.7554 18.2834 13.7554Z" fill="white"/>
                      <path d="M12.423 9.76746C11.4532 9.76746 10.6641 10.5553 10.6641 11.5262C10.6641 12.4971 11.4532 13.2849 12.423 13.2849C13.3929 13.2849 14.189 12.4971 14.189 11.5262C14.189 10.5553 13.3929 9.76746 12.423 9.76746Z" fill="white"/>
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-medium text-white">Zapier</h3>
                    <p className="text-xs text-gray-400">Connect to 3000+ apps</p>
                  </div>
                </div>
                <Button className="bg-[#FF4A00] hover:bg-[#E54400] text-white">
                  Connect
                </Button>
              </div>
            </div>
            
            <div className="bg-[#0A0C14] rounded-lg border border-[#2A2E3A] p-4 opacity-50">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="bg-gray-700 p-1.5 rounded">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M20 4H4C2.89 4 2.01 4.89 2.01 6L2 18C2 19.11 2.89 20 4 20H20C21.11 20 22 19.11 22 18V6C22 4.89 21.11 4 20 4ZM20 18H4V12H20V18ZM20 8H4V6H20V8Z" fill="white"/>
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-medium text-white">Payment Gateway</h3>
                    <p className="text-xs text-gray-400">Coming soon</p>
                  </div>
                </div>
                <Button className="bg-gray-700 text-gray-400 cursor-not-allowed" disabled>
                  Connect
                </Button>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" className="border-[#2A2E3A] hover:bg-[#2A2E3A] text-gray-300">
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Campaign Edit Modal */}
      <Dialog open={showEditModal !== null} onOpenChange={() => setShowEditModal(null)}>
        <DialogContent className="bg-[#1A1D29] text-white border-[#2A2E3A] max-w-3xl max-h-[90vh] overflow-auto">
          {showEditModal !== null && (() => {
            const campaign = allCampaigns.find(c => c.id === showEditModal);
            if (!campaign) return null;
            
            return (
              <>
                <DialogHeader>
                  <DialogTitle className="text-xl font-bold flex items-center">
                    <Settings className="mr-2 h-5 w-5 text-blue-400" />
                    Edit Campaign: {campaign.name}
                  </DialogTitle>
                  <DialogDescription className="text-gray-400 mt-1">
                    Adjust campaign settings, budget, and toggle ad sets and creatives.
                  </DialogDescription>
                </DialogHeader>

                <Tabs defaultValue="budget" className="mt-4">
                  <TabsList className="bg-[#0A0C14] border border-[#2A2E3A] p-1">
                    <TabsTrigger value="budget" className="data-[state=active]:bg-blue-600">Budget</TabsTrigger>
                    <TabsTrigger value="adsets" className="data-[state=active]:bg-blue-600">Ad Sets</TabsTrigger>
                    <TabsTrigger value="creatives" className="data-[state=active]:bg-blue-600">Creatives</TabsTrigger>
                    <TabsTrigger value="rulesets" className="data-[state=active]:bg-blue-600">Rulesets</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="budget" className="py-4">
                    <div className="space-y-6">
                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <Label className="text-white text-lg">Campaign Status</Label>
                          <div className="flex items-center space-x-2">
                            <Label htmlFor="campaign-status" className={campaign.status === 'ACTIVE' ? 'text-green-400' : 'text-gray-400'}>
                              {campaign.status === 'ACTIVE' ? 'Active' : 'Paused'}
                            </Label>
                            <Switch id="campaign-status" checked={campaign.status === 'ACTIVE'} />
                          </div>
                        </div>
                        
                        <div className="border-b border-[#2A2E3A] py-2"></div>
                        
                        <div className="space-y-3">
                          <Label className="text-white text-lg">Campaign Budget</Label>
                          <div className="bg-[#0A0C14] p-4 rounded-lg border border-[#2A2E3A]">
                            <div className="flex justify-between items-center mb-4">
                              <span className="text-gray-400">Daily Budget</span>
                              <div className="bg-[#1A1D29] border border-[#2A2E3A] rounded px-3 py-1 flex items-center">
                                <DollarSign className="h-4 w-4 text-gray-400" />
                                <input 
                                  type="number" 
                                  className="w-20 bg-transparent border-none focus:outline-none text-white" 
                                  defaultValue={campaign.budget / 30}
                                />
                              </div>
                            </div>
                            
                            <div className="space-y-6">
                              <div>
                                <div className="flex justify-between text-sm mb-2">
                                  <span className="text-gray-400">Min: $10</span>
                                  <span className="text-gray-400">Max: $1,000</span>
                                </div>
                                <Slider 
                                  defaultValue={[campaign.budget / 30]} 
                                  max={1000} 
                                  min={10} 
                                  step={10}
                                  className="w-full" 
                                />
                              </div>
                              
                              <div className="flex justify-between bg-[#19222E] p-3 rounded border border-[#2a3a4a] text-sm">
                                <span className="text-blue-300">Monthly estimate</span>
                                <span className="font-semibold text-white">${campaign.budget.toLocaleString()}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        <div className="border-b border-[#2A2E3A] py-2"></div>
                        
                        <div className="space-y-3">
                          <Label className="text-white text-lg">Campaign Timeline</Label>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label htmlFor="start-date" className="text-gray-400">Start Date</Label>
                              <input 
                                id="start-date"
                                type="date" 
                                className="w-full bg-[#0A0C14] border border-[#2A2E3A] rounded p-2 text-white"
                                defaultValue={campaign.startDate} 
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="end-date" className="text-gray-400">End Date</Label>
                              <input 
                                id="end-date"
                                type="date" 
                                className="w-full bg-[#0A0C14] border border-[#2A2E3A] rounded p-2 text-white"
                                defaultValue={campaign.endDate} 
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="adsets" className="py-4">
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <h3 className="text-lg font-medium">Ad Sets ({campaign.adSets.length})</h3>
                        <Button className="bg-blue-600 hover:bg-blue-700 text-white text-sm">
                          Create New Ad Set
                        </Button>
                      </div>
                      
                      <div className="bg-[#0A0C14] rounded-lg border border-[#2A2E3A] divide-y divide-[#2A2E3A]">
                        {campaign.adSets.map((adSet) => (
                          <div key={adSet.id} className="p-4 flex justify-between items-center">
                            <div>
                              <h4 className="font-medium text-white">{adSet.name}</h4>
                              <p className="text-sm text-gray-400">Budget: ${adSet.budget} • {adSet.impressions.toLocaleString()} impressions</p>
                            </div>
                            <div className="flex items-center space-x-4">
                              <div className="flex items-center space-x-2">
                                <Switch id={`adset-status-${adSet.id}`} checked={adSet.status === 'ACTIVE'} />
                                <Label htmlFor={`adset-status-${adSet.id}`} className={adSet.status === 'ACTIVE' ? 'text-green-400' : 'text-gray-400'}>
                                  {adSet.status === 'ACTIVE' ? 'Active' : 'Paused'}
                                </Label>
                              </div>
                              <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-gray-400 hover:text-blue-400">
                                <Edit className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="creatives" className="py-4">
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <h3 className="text-lg font-medium">Ad Creatives ({campaign.creatives.length})</h3>
                        <Button className="bg-blue-600 hover:bg-blue-700 text-white text-sm">
                          Create New Creative
                        </Button>
                      </div>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {campaign.creatives.map((creative) => (
                          <Card key={creative.id} className="bg-[#0A0C14] border-[#2A2E3A] overflow-hidden">
                            <div className="h-32 bg-gray-800 flex items-center justify-center border-b border-[#2A2E3A]">
                              <Image 
                                src={campaign.thumbnail}
                                alt={creative.name}
                                width={125}
                                height={125}
                                style={{ objectFit: 'contain' }}
                              />
                            </div>
                            <CardContent className="p-4">
                              <div className="flex justify-between items-start">
                                <div>
                                  <h4 className="font-medium text-white">{creative.name}</h4>
                                  <p className="text-sm text-gray-400 mt-1">CTR: {creative.ctr} • {creative.clicks.toLocaleString()} clicks</p>
                                </div>
                                <div className="flex items-center space-x-1">
                                  {creative.status === 'ACTIVE' ? (
                                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-green-400 hover:text-green-500" title="Pause">
                                      <Eye className="h-4 w-4" />
                                    </Button>
                                  ) : (
                                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-gray-400 hover:text-gray-300" title="Activate">
                                      <EyeOff className="h-4 w-4" />
                                    </Button>
                                  )}
                                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-gray-400 hover:text-blue-400" title="Edit">
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="rulesets" className="py-4">
                    <div className="space-y-6">
                      <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-medium">Automation Rules</h3>
                        <Button className="bg-blue-600 hover:bg-blue-700 text-white text-sm">
                          Add New Rule
                        </Button>
                      </div>
                      
                      <div className="bg-[#0A0C14] rounded-lg border border-[#2A2E3A] divide-y divide-[#2A2E3A]">
                        {/* Rule 1: Pause underperforming ads */}
                        <div className="p-4">
                          <div className="mb-3 flex items-center justify-between">
                            <h4 className="font-medium text-white">Rule 1</h4>
                            <div className="flex items-center space-x-2">
                              <Switch id="rule1-active" defaultChecked />
                              <Label htmlFor="rule1-active" className="text-green-400">Active</Label>
                            </div>
                          </div>
                          
                          <div className="flex flex-wrap items-center gap-2 text-sm">
                            <span className="text-gray-300">If</span>
                            <select className="bg-[#1A1D29] border border-[#2A2E3A] rounded text-white px-2 py-1">
                              <option>ROAS</option>
                              <option>CTR</option>
                              <option selected>CPC</option>
                            </select>
                            <span className="text-gray-300">is</span>
                            <select className="bg-[#1A1D29] border border-[#2A2E3A] rounded text-white px-2 py-1">
                              <option>below</option>
                              <option selected>above</option>
                            </select>
                            <div className="bg-[#1A1D29] border border-[#2A2E3A] rounded px-2 py-1 flex items-center">
                              <input 
                                type="number" 
                                className="w-16 bg-transparent border-none focus:outline-none text-white"
                                defaultValue={1.5} 
                              />
                            </div>
                            <span className="text-gray-300">then</span>
                            <select className="bg-[#1A1D29] border border-[#2A2E3A] rounded text-white px-2 py-1">
                              <option selected>pause</option>
                              <option>reduce budget by</option>
                              <option>send alert</option>
                            </select>
                            <span className="text-gray-300">the</span>
                            <select className="bg-[#1A1D29] border border-[#2A2E3A] rounded text-white px-2 py-1">
                              <option>campaign</option>
                              <option selected>ad creative</option>
                              <option>ad set</option>
                            </select>
                          </div>
                        </div>
                        
                        {/* Rule 2: Scale budgets */}
                        <div className="p-4">
                          <div className="mb-3 flex items-center justify-between">
                            <h4 className="font-medium text-white">Rule 2</h4>
                            <div className="flex items-center space-x-2">
                              <Switch id="rule2-active" defaultChecked />
                              <Label htmlFor="rule2-active" className="text-green-400">Active</Label>
                            </div>
                          </div>
                          
                          <div className="flex flex-wrap items-center gap-2 text-sm">
                            <span className="text-gray-300">If</span>
                            <select className="bg-[#1A1D29] border border-[#2A2E3A] rounded text-white px-2 py-1">
                              <option selected>ROAS</option>
                              <option>CTR</option>
                              <option>CPC</option>
                            </select>
                            <span className="text-gray-300">is</span>
                            <select className="bg-[#1A1D29] border border-[#2A2E3A] rounded text-white px-2 py-1">
                              <option>below</option>
                              <option selected>above</option>
                            </select>
                            <div className="bg-[#1A1D29] border border-[#2A2E3A] rounded px-2 py-1 flex items-center">
                              <input 
                                type="number" 
                                className="w-16 bg-transparent border-none focus:outline-none text-white"
                                defaultValue={3.0} 
                              />
                            </div>
                            <span className="text-gray-300">for</span>
                            <div className="bg-[#1A1D29] border border-[#2A2E3A] rounded px-2 py-1 flex items-center">
                              <input 
                                type="number" 
                                className="w-10 bg-transparent border-none focus:outline-none text-white"
                                defaultValue={3} 
                              />
                            </div>
                            <span className="text-gray-300">consecutive days then</span>
                            <select className="bg-[#1A1D29] border border-[#2A2E3A] rounded text-white px-2 py-1">
                              <option>pause</option>
                              <option selected>increase budget by</option>
                              <option>send alert</option>
                            </select>
                            <div className="bg-[#1A1D29] border border-[#2A2E3A] rounded px-2 py-1 flex items-center">
                              <input 
                                type="number" 
                                className="w-10 bg-transparent border-none focus:outline-none text-white"
                                defaultValue={20} 
                              />
                              <span className="text-white">%</span>
                            </div>
                          </div>
                        </div>
                        
                        {/* Rule 3: Custom rule */}
                        <div className="p-4">
                          <div className="mb-3 flex items-center justify-between">
                            <h4 className="font-medium text-white">Rule 3</h4>
                            <div className="flex items-center space-x-2">
                              <Switch id="rule3-active" defaultChecked={false} />
                              <Label htmlFor="rule3-active" className="text-gray-400">Inactive</Label>
                            </div>
                          </div>
                          
                          <div className="flex flex-wrap items-center gap-2 text-sm">
                            <span className="text-gray-300">If</span>
                            <select className="bg-[#1A1D29] border border-[#2A2E3A] rounded text-white px-2 py-1">
                              <option>ROAS</option>
                              <option selected>CTR</option>
                              <option>CPC</option>
                            </select>
                            <span className="text-gray-300">is</span>
                            <select className="bg-[#1A1D29] border border-[#2A2E3A] rounded text-white px-2 py-1">
                              <option selected>below</option>
                              <option>above</option>
                            </select>
                            <div className="bg-[#1A1D29] border border-[#2A2E3A] rounded px-2 py-1 flex items-center">
                              <input 
                                type="number" 
                                className="w-16 bg-transparent border-none focus:outline-none text-white"
                                defaultValue={1.2} 
                              />
                              <span className="text-white">%</span>
                            </div>
                            <span className="text-gray-300">then</span>
                            <select className="bg-[#1A1D29] border border-[#2A2E3A] rounded text-white px-2 py-1">
                              <option>pause</option>
                              <option>reduce budget by</option>
                              <option selected>send alert</option>
                            </select>
                            <span className="text-gray-300">to</span>
                            <select className="bg-[#1A1D29] border border-[#2A2E3A] rounded text-white px-2 py-1">
                              <option selected>email</option>
                              <option>dashboard</option>
                              <option>SMS</option>
                            </select>
                          </div>
                        </div>
                      </div>
                      
                      <div className="p-4 bg-[#1A1D29] border border-[#2A2E3A] rounded-lg">
                        <h4 className="font-medium text-white mb-2">Create a New Rule</h4>
                        <p className="text-sm text-gray-400 mb-4">
                          Automate campaign management with custom rules based on performance metrics.
                        </p>
                        <div className="flex flex-wrap items-center gap-2 text-sm">
                          <span className="text-gray-300">If</span>
                          <select className="bg-[#0A0C14] border border-[#2A2E3A] rounded text-white px-2 py-1">
                            <option>ROAS</option>
                            <option>CTR</option>
                            <option>CPC</option>
                            <option>Impressions</option>
                            <option>Conversions</option>
                            <option>Cost</option>
                          </select>
                          <span className="text-gray-300">is</span>
                          <select className="bg-[#0A0C14] border border-[#2A2E3A] rounded text-white px-2 py-1">
                            <option>below</option>
                            <option>above</option>
                            <option>equal to</option>
                          </select>
                          <div className="bg-[#0A0C14] border border-[#2A2E3A] rounded px-2 py-1 flex items-center">
                            <input 
                              type="text" 
                              className="w-16 bg-transparent border-none focus:outline-none text-white"
                              placeholder="Value" 
                            />
                          </div>
                          <span className="text-gray-300">then</span>
                          <select className="bg-[#0A0C14] border border-[#2A2E3A] rounded text-white px-2 py-1">
                            <option>pause</option>
                            <option>increase budget by</option>
                            <option>decrease budget by</option>
                            <option>send alert</option>
                          </select>
                          <span className="text-gray-300">the</span>
                          <select className="bg-[#0A0C14] border border-[#2A2E3A] rounded text-white px-2 py-1">
                            <option>campaign</option>
                            <option>ad creative</option>
                            <option>ad set</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  </TabsContent>
                </Tabs>

                <DialogFooter className="mt-6 flex justify-between">
                  <Button 
                    variant="outline" 
                    className="border-[#2A2E3A] hover:bg-[#2A2E3A] text-gray-300"
                    onClick={() => setShowEditModal(null)}
                  >
                    Cancel
                  </Button>
                  <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                    Save Changes
                  </Button>
                </DialogFooter>
              </>
            );
          })()}
        </DialogContent>
      </Dialog>
    </div>
  )
}