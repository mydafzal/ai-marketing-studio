'use client'

import React from 'react'
import { Card } from '@/components/ui/card'

interface CreateCampaignCardProps {
  onAskAI: () => void
}

export default function CreateCampaignCard({ onAskAI }: CreateCampaignCardProps) {
  return (
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
          onClick={onAskAI}
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
  )
}