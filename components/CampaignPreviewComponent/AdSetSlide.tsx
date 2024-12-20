"use client";

import React from 'react';
import { Target, Plus, Edit2, Instagram, Facebook } from 'lucide-react'; // Added Instagram and Facebook import here
import { Button } from '@/components/ui/button';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { IconSpinner } from '@/components/ui/icons';

interface AdsetData {
  id: string;
  name: string;
  status?: string;
  created_time?: string;
}

interface AdSetSlideProps {
  campaign: any;
  adsets: AdsetData[];
  adset: any;
  setAdset: (adset: any) => void;
  fetchAdsets: () => Promise<void>;
  isCreatingAdset: boolean;
  handleCreateAdset: () => Promise<void>;
  safeConfig: any;
  setShowTargetingModal: (val: boolean) => void;
  setShowPlacementModal: (val: boolean) => void;
}

export function AdSetSlide({
  campaign,
  adsets,
  adset,
  setAdset,
  isCreatingAdset,
  handleCreateAdset,
  safeConfig,
  setShowTargetingModal,
  setShowPlacementModal
}: AdSetSlideProps) {
  return (
    <>
      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Target className="size-5 text-purple-400" />
            <h3 className="font-medium">Ad Set</h3>
          </div>
        </div>
        {campaign ? (
          <>
            <Select
              value={adset?.id}
              onValueChange={(value) => {
                const selectedAdset = adsets.find(a => a.id === value);
                if (selectedAdset) setAdset(selectedAdset);
              }}
            >
              <SelectTrigger className="w-full bg-secondary border-border text-foreground">
                <SelectValue placeholder="Select an ad set" />
              </SelectTrigger>
              <SelectContent className="bg-secondary border-border">
                {adsets.map((as: AdsetData) => (
                  <SelectItem key={as.id} value={as.id}>
                    <div className="flex flex-col">
                      <span>{as.name}</span>
                      <span className="text-xs text-muted-foreground">
                        {as.status} {as.created_time && ` • ${as.created_time}`}
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Button
              variant="outline"
              size="sm"
              disabled={isCreatingAdset}
              onClick={handleCreateAdset}
              className="w-full mt-2"
            >
              {isCreatingAdset ? (
                <IconSpinner className="size-4 mr-2 animate-spin" />
              ) : (
                <Plus className="size-4 mr-2" />
              )}
              Create New Ad Set
            </Button>
          </>
        ) : (
          <p className="text-muted-foreground text-sm">Please select a campaign first</p>
        )}
      </div>

      {/* Targeting */}
      <div className="space-y-2 mt-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Target className="size-5 text-purple-400" />
            <h3 className="font-medium">Targeting</h3>
          </div>
          <button
            onClick={() => setShowTargetingModal(true)}
            className="text-muted-foreground hover:text-foreground p-0 focus:outline-none"
          >
            <Edit2 className="size-4" />
          </button>
        </div>
        <div className="space-y-1 text-muted-foreground text-sm">
          <p>📍 {safeConfig.targeting.locations?.length
            ? safeConfig.targeting.locations.join(', ')
            : 'Location not set'}</p>
          <p>👥 Age {safeConfig.targeting.ageRange.min}-{safeConfig.targeting.ageRange.max}</p>
          {safeConfig.targeting.interests.length > 0 ? (
            <p>🎯 Interests: {safeConfig.targeting.interests.join(', ')}</p>
          ) : (
            <p>Interests not set</p>
          )}
        </div>
      </div>

      {/* Placement Targeting */}
      <div className="space-y-2 mt-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Instagram className="size-5 text-pink-600" />
            <Facebook className="size-5 text-blue-600" />
            <h3 className="font-medium">Ad Placement</h3>
          </div>
          <button
            onClick={() => setShowPlacementModal(true)}
            className="text-muted-foreground hover:text-foreground p-0 focus:outline-none"
          >
            <Edit2 className="size-4" />
          </button>
        </div>
        <p className="text-muted-foreground text-sm">
          {safeConfig.placements
            ? `Facebook: ${safeConfig.placements.facebook?.join(', ') || 'None'} | Instagram: ${safeConfig.placements.instagram?.join(', ') || 'None'}`
            : 'No placements selected'}
        </p>
      </div>
    </>
  );
}
