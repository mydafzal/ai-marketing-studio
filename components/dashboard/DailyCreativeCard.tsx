'use client'

import React from 'react'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'

interface DailyCreativeCardProps {
  creative: {
    id: number
    imageUrl: string
    prompt: string
    title: string
  }
  showPrompt: boolean
  onTogglePrompt: () => void
}

export default function DailyCreativeCard({
  creative,
  showPrompt,
  onTogglePrompt
}: DailyCreativeCardProps) {
  return (
    <Card className="bg-[#1A1D29] border-[#2A2E3A] shadow-md overflow-hidden">
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
      {showPrompt && (
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
          onClick={onTogglePrompt}
        >
          {showPrompt ? 'Hide Prompt' : 'View Prompt'}
        </Button>
        <Button 
          size="sm" 
          className="text-xs bg-blue-600 hover:bg-blue-700"
        >
          Download
        </Button>
      </CardFooter>
    </Card>
  )
}