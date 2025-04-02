'use client'

import * as React from 'react';

interface ConnectCampaignProps {
  campaignName: string
  success: boolean
}

export function ConnectCampaignResult({
  campaignName,
  success
}: ConnectCampaignProps) {
  return (
    <div className="p-6 border border-[#2A2E3A] rounded-lg bg-[#1A1D29] text-white">
      <div className="flex items-center gap-3">
        {success ? (
          <>
            <div className="text-[#4BF29C] shrink-0">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                <polyline points="22 4 12 14.01 9 11.01"></polyline>
              </svg>
            </div>
            <div>
              <div className="font-medium">Successfully connected</div>
              <div className="text-sm text-[#ADB0B8]">Campaign: {campaignName}</div>
            </div>
          </>
        ) : (
          <>
            <div className="text-red-400 shrink-0">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="15" y1="9" x2="9" y2="15"></line>
                <line x1="9" y1="9" x2="15" y2="15"></line>
              </svg>
            </div>
            <div>
              <div className="font-medium text-red-400">Connection failed</div>
              <div className="text-sm text-[#ADB0B8]">Could not connect to: {campaignName}</div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
