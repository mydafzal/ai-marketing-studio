'use client'

import React from 'react'
import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import { StepByCampaignCreator } from '@/components/create-campaign-page/step-by-step-campaign-creator'

export default function CreateCampaignPage() {
  return (
    <div className="relative flex h-[calc(100vh_-_theme(spacing.16))] overflow-hidden bg-[#0A0C14] text-white">
      <div className="w-full h-full flex items-center justify-center">
        <StepByCampaignCreator />
      </div>
    </div>
  )
} 