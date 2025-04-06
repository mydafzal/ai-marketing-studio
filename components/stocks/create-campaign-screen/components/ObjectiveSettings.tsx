import React from 'react';

interface ObjectiveSettingsProps {
  campaignObjective: string;
  setCampaignObjective: (objective: string) => void;
}

export function ObjectiveSettings({ campaignObjective, setCampaignObjective }: ObjectiveSettingsProps) {
  return (
    <div className="space-y-3">
      <h3 className="font-medium">Campaign Objective</h3>
      <div className="space-y-2">
        <label className="flex items-center p-2 border border-gray-700 rounded-md cursor-pointer bg-gray-800 hover:bg-gray-750 transition-colors">
          <input
            type="radio"
            className="h-4 w-4 mr-2 accent-blue-500"
            checked={campaignObjective === 'Brand Awareness'}
            onChange={() => setCampaignObjective('Brand Awareness')}
          />
          <span>Brand Awareness</span>
        </label>
        <label className="flex items-center p-2 border border-gray-700 rounded-md cursor-pointer bg-gray-800 hover:bg-gray-750 transition-colors">
          <input
            type="radio"
            className="h-4 w-4 mr-2 accent-blue-500"
            checked={campaignObjective === 'Recruitment'}
            onChange={() => setCampaignObjective('Recruitment')}
          />
          <span>Recruitment</span>
        </label>
        <label className="flex items-center p-2 border border-gray-700 rounded-md cursor-pointer bg-gray-800 hover:bg-gray-750 transition-colors">
          <input
            type="radio"
            className="h-4 w-4 mr-2 accent-blue-500"
            checked={campaignObjective === 'Conversions'}
            onChange={() => setCampaignObjective('Conversions')}
          />
          <span>Conversions</span>
        </label>
        <label className="flex items-center p-2 border border-gray-700 rounded-md cursor-pointer bg-gray-800 hover:bg-gray-750 transition-colors">
          <input
            type="radio"
            className="h-4 w-4 mr-2 accent-blue-500"
            checked={campaignObjective === 'Lead Generation'}
            onChange={() => setCampaignObjective('Lead Generation')}
          />
          <span>Lead Generation</span>
        </label>
      </div>
    </div>
  );
}