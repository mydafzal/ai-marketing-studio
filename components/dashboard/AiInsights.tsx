'use client'

import React, { useState } from 'react'

interface AiInsightsProps {
  insights: string[]
}

export default function AiInsights({ insights }: AiInsightsProps) {
  const [insightsCollapsed, setInsightsCollapsed] = useState(false)

  return (
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
  )
}