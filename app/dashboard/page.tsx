'use client'

import React, { useState, useEffect } from 'react'
import { allCampaigns, dailyCreatives, insights } from '@/components/dashboard/data'
import DashboardChatWidget from '@/components/dashboard-chat-widget'

// Import our modular components
import Sidebar from '@/components/dashboard/Sidebar'
import SearchBar from '@/components/dashboard/SearchBar'
import CreateCampaignCard from '@/components/dashboard/CreateCampaignCard'
import CampaignCard from '@/components/dashboard/CampaignCard'
import Pagination from '@/components/dashboard/Pagination'
import AiInsights from '@/components/dashboard/AiInsights'
import DailyCreativeCard from '@/components/dashboard/DailyCreativeCard'
import CampaignStatsModal from '@/components/dashboard/modals/CampaignStatsModal'
import CampaignEditModal from '@/components/dashboard/modals/CampaignEditModal'
import IntegrationsModal from '@/components/dashboard/modals/IntegrationsModal'
import { Campaign } from '@/components/dashboard/types'

export default function DashboardPage() {
  // State for search, pagination, and collapsible sections
  const [searchQuery, setSearchQuery] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [showPrompt, setShowPrompt] = useState<number | null>(null)
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

  // Find the selected campaign for modals
  const getSelectedCampaign = (id: number | null): Campaign | null => {
    if (id === null) return null
    return allCampaigns.find(c => c.id === id) || null
  }

  // Handle Ask AI button
  const handleAskAI = () => {
    if ((window as any).dashboardChat) {
      (window as any).dashboardChat.open("Compare my last 3 campaigns");
    }
  }

  return (
    <div className="flex min-h-screen bg-[#0A0C14] text-white">
      {/* Sidebar */}
      <Sidebar />

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
        <SearchBar 
          searchQuery={searchQuery} 
          onSearchChange={setSearchQuery} 
        />

        {/* Campaign Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
          {/* Create Campaign Card - Always First */}
          <CreateCampaignCard onAskAI={handleAskAI} />
          
          {/* Regular Campaign Cards */}
          {currentCampaigns.map((campaign) => (
            <CampaignCard 
              key={campaign.id} 
              campaign={campaign} 
              onStatsClick={(id) => setShowStatsModal(id)}
              onEditClick={(id) => setShowEditModal(id)}
            />
          ))}
        </div>

        {/* Pagination Controls */}
        <Pagination 
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={handlePageChange}
        />

        {/* Collapsible AI Insights Section */}
        <AiInsights insights={insights} />

        {/* Daily Creatives Section */}
        <div className="mb-10">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold text-white">Daily Creatives</h2>
            <span className="text-gray-400 text-sm">Created for your account today</span>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {dailyCreatives.map((creative) => (
              <DailyCreativeCard 
                key={creative.id} 
                creative={creative}
                showPrompt={showPrompt === creative.id}
                onTogglePrompt={() => togglePrompt(creative.id)}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Modals */}
      <CampaignStatsModal 
        isOpen={showStatsModal !== null}
        onClose={() => setShowStatsModal(null)}
        campaign={getSelectedCampaign(showStatsModal)}
      />

      <CampaignEditModal 
        isOpen={showEditModal !== null}
        onClose={() => setShowEditModal(null)}
        campaign={getSelectedCampaign(showEditModal)}
      />

      <IntegrationsModal 
        isOpen={showIntegrationsModal}
        onOpenChange={setShowIntegrationsModal}
      />
    </div>
  )
}