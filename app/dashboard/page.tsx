'use client'

import React, { useState, useEffect } from 'react'
import { dailyCreatives, insights } from '@/components/dashboard/data'
import DashboardChatWidget from '@/components/dashboard-chat-widget'
import { getDashboardCampaigns } from '@/lib/api/dashboard/get-dashboard-campaigns'
import { DashboardCampaign } from '@/components/dashboard/types'

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

export default function DashboardPage() {
  // State for search, pagination, and collapsible sections
  const [searchQuery, setSearchQuery] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [showPrompt, setShowPrompt] = useState<number | null>(null)
  const [showStatsModal, setShowStatsModal] = useState<number | null>(null)
  const [showEditModal, setShowEditModal] = useState<number | null>(null)
  const [showIntegrationsModal, setShowIntegrationsModal] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [campaigns, setCampaigns] = useState<DashboardCampaign[]>([])
  const [totalCampaigns, setTotalCampaigns] = useState(0)
  
  // We need 11 campaigns per page (3 rows of 4 minus the create card)
  const itemsPerPage = 11
  
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
  
  // Function to fetch campaigns with pagination
  async function fetchCampaigns(page: number, pageSize: number) {
    setIsLoading(true)
    try {
      const response = await getDashboardCampaigns({
        limit: pageSize,
        offset: (page - 1) * pageSize
      })
      
      if (response.success) {
        setCampaigns(response.campaigns)
        setTotalCampaigns(response.total)
      } else {
        console.error('Failed to fetch campaigns')
        setCampaigns([])
      }
    } catch (error) {
      console.error('Error fetching campaigns:', error)
    } finally {
      setIsLoading(false)
    }
  }
  
  // Effect to fetch campaigns from Facebook when page changes
  useEffect(() => {
    // Only fetch if we're not searching
    if (!searchQuery) {
      fetchCampaigns(currentPage, itemsPerPage);
    }
  }, [currentPage, itemsPerPage, searchQuery])
  
  // When search is active, filter locally
  useEffect(() => {
    // Reset to first page when search query changes
    setCurrentPage(1);
    
    // Function to handle search
    async function handleSearch() {
      setIsLoading(true);
      
      if (searchQuery) {
        // If searching, fetch all campaigns and filter locally
        try {
          const response = await getDashboardCampaigns({
            limit: 100, // Get a larger batch for search
            offset: 0
          });
          
          if (response.success) {
            // Filter the results based on search
            const filtered = response.campaigns.filter(campaign => 
              campaign.name.toLowerCase().includes(searchQuery.toLowerCase())
            );
            setCampaigns(filtered);
            setTotalCampaigns(filtered.length);
          }
        } catch (error) {
          console.error('Error fetching campaigns for search:', error);
        }
      } else {
        // If search is cleared, refresh with pagination for first page
        try {
          const response = await getDashboardCampaigns({
            limit: itemsPerPage,
            offset: 0
          });
          
          if (response.success) {
            setCampaigns(response.campaigns);
            setTotalCampaigns(response.total);
          }
        } catch (error) {
          console.error('Error fetching campaigns after search cleared:', error);
        }
      }
      
      setIsLoading(false);
    }
    
    // Execute the search handler
    handleSearch();
  }, [searchQuery, itemsPerPage]);
  
  // Use the campaigns array directly
  const currentCampaigns = campaigns;
  
  // Use the total from the API for pagination
  const totalPages = Math.ceil(totalCampaigns / itemsPerPage)
  
  // Debug pagination values
  console.log('Pagination debug:', { totalCampaigns, itemsPerPage, totalPages, currentPage })
  
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
  const getSelectedCampaign = (id: number | null): DashboardCampaign | null => {
    if (id === null) return null
    return campaigns.find(c => c.id === id) || null
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
        <div className="mb-6">
          {/* Loading State */}
          {isLoading ? (
            <div className="bg-[#1A1D29] border border-[#2A2E3A] rounded-lg flex items-center justify-center p-12">
              <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500"></div>
              <span className="ml-3 text-gray-400">Loading campaigns...</span>
            </div>
          ) : currentCampaigns.length === 0 ? (
            /* Empty State */
            <div className="bg-[#1A1D29] border border-[#2A2E3A] rounded-lg p-8 flex flex-col items-center justify-center">
              <svg className="w-12 h-12 text-gray-500 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
              <h3 className="text-lg font-medium text-white mb-2">No campaigns found</h3>
              <p className="text-gray-400 text-center">
                {searchQuery 
                  ? `No campaigns match "${searchQuery}"`
                  : "Create your first campaign to get started"
                }
              </p>
              {searchQuery && (
                <button 
                  onClick={() => setSearchQuery('')}
                  className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-md text-white text-sm"
                >
                  Clear search
                </button>
              )}
            </div>
          ) : (
            /* Campaign Grid - Exactly 3 rows of 4 columns (responsive) */
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
              {/* Row 1 */}
              <div className="col-span-1">
                <CreateCampaignCard onAskAI={handleAskAI} />
              </div>
              
              {/* First row cards (positions 0-2) */}
              {currentCampaigns.slice(0, 3).map((campaign) => (
                <div key={campaign.id} className="col-span-1">
                  <CampaignCard 
                    campaign={campaign} 
                    onStatsClick={(id) => setShowStatsModal(id)}
                    onEditClick={(id) => setShowEditModal(id)}
                  />
                </div>
              ))}
              
              {/* Second row cards (positions 3-6) */}
              {currentCampaigns.slice(3, 7).map((campaign) => (
                <div key={campaign.id} className="col-span-1">
                  <CampaignCard 
                    campaign={campaign} 
                    onStatsClick={(id) => setShowStatsModal(id)}
                    onEditClick={(id) => setShowEditModal(id)}
                  />
                </div>
              ))}
              
              {/* Third row cards (positions 7-10) */}
              {currentCampaigns.slice(7, 11).map((campaign) => (
                <div key={campaign.id} className="col-span-1">
                  <CampaignCard 
                    campaign={campaign} 
                    onStatsClick={(id) => setShowStatsModal(id)}
                    onEditClick={(id) => setShowEditModal(id)}
                  />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Pagination Controls with info */}
        <div>
          {totalPages > 0 && (
            <div className="text-center text-sm text-gray-400 mb-2">
              Showing {((currentPage - 1) * itemsPerPage) + 1} - {Math.min(currentPage * itemsPerPage, totalCampaigns)} of {totalCampaigns} campaigns
            </div>
          )}
          <Pagination 
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={handlePageChange}
          />
        </div>

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