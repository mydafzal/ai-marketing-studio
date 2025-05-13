'use client'

import React from 'react'
import SafeImage from './SafeImage'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { BarChart2, Edit } from 'lucide-react'

interface CampaignCardProps {
  campaign: {
    id: number
    name: string
    thumbnail: string
    status: string
    metrics: {
      ctr: string
      conversions: number
      cpa: string
    }
    performance: {
      ctr: number
      conversions: number
      cpa: number
    }
  }
  onStatsClick: (id: number) => void
  onEditClick: (id: number) => void
}

export default function CampaignCard({ 
  campaign, 
  onStatsClick, 
  onEditClick 
}: CampaignCardProps) {
  return (
    <Card className="bg-[#1A1D29] border-[#2A2E3A] shadow-md hover:shadow-lg transition-shadow">
      <div className="relative h-32 bg-gray-800 border-b border-[#2A2E3A]">
        <SafeImage 
          src={campaign.thumbnail}
          alt={campaign.name}
          fill
        />
        <div className="absolute top-2 right-2">
          <Badge className={campaign.status === 'ACTIVE' ? 'bg-green-600 text-white' : 'bg-gray-600 text-white'}>
            {campaign.status}
          </Badge>
        </div>
      </div>
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <CardTitle className="text-sm font-medium text-white line-clamp-2 min-h-[40px] leading-tight">
            {campaign.name}
          </CardTitle>
          <div className="flex space-x-2 ml-2 flex-shrink-0">
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-7 w-7 p-0 text-gray-400 hover:text-blue-400"
              onClick={() => onStatsClick(campaign.id)}
            >
              <BarChart2 className="h-3.5 w-3.5" />
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-7 w-7 p-0 text-gray-400 hover:text-blue-400"
              onClick={() => onEditClick(campaign.id)}
            >
              <Edit className="h-3.5 w-3.5" />
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
  )
}