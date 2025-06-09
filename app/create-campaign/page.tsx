'use client'

import React from 'react'
import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import { StepByCampaignCreator } from '@/components/create-campaign-page/step-by-step-campaign-creator'

export default function CreateCampaignPage() {
  return (
    <div className="relative flex h-[calc(100vh_-_theme(spacing.16))] overflow-hidden bg-[#0A0C14] text-white">
      <div className="w-full h-full flex items-center justify-center overflow-y-auto overflow-x-hidden">
        <div className="w-full h-fit min-h-full flex items-center justify-center py-4 sm:py-8">
          <StepByCampaignCreator />
        </div>
      </div>
    </div>
  )
} 