"use client"
import React, { useState } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChevronDown, ChevronUp, Edit2, Target, DollarSign, Image, Check } from 'lucide-react';

interface CampaignPreviewProps {
  type?: string;
  budget?: number;
  targeting?: {
    locations: string[];
    ageRange: { min: number; max: number };
    interests: string[];
  };
  images?: string[];
  adText?: string;
}

export default function CampaignPreview({ 
  type = '', 
  budget = 0, 
  targeting = {
    locations: [],
    ageRange: { min: 18, max: 65 },
    interests: []
  },
  images = [],
  adText = ''
}: CampaignPreviewProps) {
  const [expanded, setExpanded] = useState(true);

  return (
    <div className="w-full max-w-md">
      <Card className="bg-zinc-950 text-zinc-100 border-zinc-800">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <div>
            <h2 className="text-xl font-semibold">Campaign Preview</h2>
            <p className="text-sm text-zinc-400">Draft configuration</p>
          </div>
          <button
            onClick={() => setExpanded(!expanded)}
            className="text-zinc-400 hover:text-zinc-100"
          >
            {expanded ? <ChevronUp className="h-6 w-6" /> : <ChevronDown className="h-6 w-6" />}
          </button>
        </CardHeader>

        {expanded && (
          <CardContent className="space-y-6">
            {/* Campaign Type */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <Target className="h-5 w-5 text-blue-400" />
                  <h3 className="font-medium">Campaign Type</h3>
                </div>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                  <Edit2 className="h-4 w-4" />
                </Button>
              </div>
              <p className="text-zinc-400">
                {type || 'Not set yet'}
              </p>
            </div>

            {/* Budget */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5 text-green-400" />
                  <h3 className="font-medium">Daily Budget</h3>
                </div>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                  <Edit2 className="h-4 w-4" />
                </Button>
              </div>
              <p className="text-zinc-400">
                {budget ? `€${budget}/day` : 'Not set yet'}
              </p>
            </div>

            {/* Targeting */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <Target className="h-5 w-5 text-purple-400" />
                  <h3 className="font-medium">Targeting</h3>
                </div>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                  <Edit2 className="h-4 w-4" />
                </Button>
              </div>
              <div className="space-y-1 text-zinc-400">
                {targeting.locations.length > 0 ? (
                  <p>📍 {targeting.locations.join(', ')}</p>
                ) : (
                  <p>Location not set</p>
                )}
                <p>👥 Age {targeting.ageRange.min}-{targeting.ageRange.max}</p>
                {targeting.interests.length > 0 ? (
                  <p>🎯 Interests: {targeting.interests.join(', ')}</p>
                ) : (
                  <p>Interests not set</p>
                )}
              </div>
            </div>

            {/* Creative */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <Image className="h-5 w-5 text-orange-400" />
                  <h3 className="font-medium">Creative</h3>
                </div>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                  <Edit2 className="h-4 w-4" />
                </Button>
              </div>
              <p className="text-zinc-400">
                {images.length > 0 ? `${images.length} images selected` : 'No images uploaded'}
              </p>
              {adText && (
                <p className="text-zinc-400 text-sm">
                  Ad Text: {adText}
                </p>
              )}
            </div>

            {/* Action Button */}
            <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white">
              <Check className="mr-2 h-4 w-4" /> Launch Campaign
            </Button>
          </CardContent>
        )}
      </Card>
    </div>
  );
}