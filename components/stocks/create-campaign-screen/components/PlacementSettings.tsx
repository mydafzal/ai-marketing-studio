import React from 'react';
import { AdPlacements } from '../types';

interface PlacementSettingsProps {
  adPlacements: AdPlacements;
  setAdPlacements: React.Dispatch<React.SetStateAction<AdPlacements>>;
}

export function PlacementSettings({ adPlacements, setAdPlacements }: PlacementSettingsProps) {
  return (
    <div className="space-y-6">
      <h3 className="font-medium mb-3">Ad Placements</h3>
      <div className="space-y-2">
        <label className="block text-sm mb-2">Instagram Placements</label>
        <div className="space-y-2">
          <label className="flex items-center p-2 bg-gray-800 rounded cursor-pointer">
            <input
              type="checkbox"
              className="h-4 w-4 mr-2 accent-blue-500"
              checked={adPlacements.instagram_stories}
              onChange={() =>
                setAdPlacements(prev => ({
                  ...prev,
                  instagram_stories: !prev.instagram_stories
                }))
              }
            />
            <span className="text-sm">Instagram Stories</span>
          </label>
        </div>
      </div>
    </div>
  );
}