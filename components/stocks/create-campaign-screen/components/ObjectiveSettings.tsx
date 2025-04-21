import React from 'react';

interface ObjectiveSettingsProps {
  campaignObjective: string;
  setCampaignObjective: (objective: string) => void;
}

export function ObjectiveSettings({ campaignObjective, setCampaignObjective }: ObjectiveSettingsProps) {
  return (
    <div className="space-y-3">
      <h3 className="font-medium">Campaign Objective</h3>
      <p className="text-sm text-gray-400 mb-3">Choose your campaign objective to optimize your ad performance.</p>
      <div className="space-y-2">
        <label className="flex items-center p-2 border border-gray-700 rounded-md cursor-pointer bg-gray-800 hover:bg-gray-750 transition-colors">
          <input
            type="radio"
            className="h-4 w-4 mr-2 accent-blue-500"
            checked={campaignObjective === 'awareness'}
            onChange={() => setCampaignObjective('awareness')}
          />
          <div>
            <span className="font-medium">Awareness</span>
            <p className="text-xs text-gray-400 mt-1">Increase awareness of your brand, products, or services.</p>
          </div>
        </label>
        <label className="flex items-center p-2 border border-gray-700 rounded-md cursor-pointer bg-gray-800 hover:bg-gray-750 transition-colors">
          <input
            type="radio"
            className="h-4 w-4 mr-2 accent-blue-500"
            checked={campaignObjective === 'recruitment'}
            onChange={() => setCampaignObjective('recruitment')}
          />
          <div>
            <span className="font-medium">Recruitment</span>
            <p className="text-xs text-gray-400 mt-1">Find potential candidates for job opportunities.</p>
          </div>
        </label>
        <label className="flex items-center p-2 border border-gray-700 rounded-md cursor-pointer bg-gray-800 hover:bg-gray-750 transition-colors">
          <input
            type="radio"
            className="h-4 w-4 mr-2 accent-blue-500"
            checked={campaignObjective === 'conversions'}
            onChange={() => setCampaignObjective('conversions')}
          />
          <div>
            <span className="font-medium">Conversions</span>
            <p className="text-xs text-gray-400 mt-1">Drive valuable actions on your website or app.</p>
          </div>
        </label>
        <label className="flex items-center p-2 border border-gray-700 rounded-md cursor-pointer bg-gray-800 hover:bg-gray-750 transition-colors">
          <input
            type="radio"
            className="h-4 w-4 mr-2 accent-blue-500"
            checked={campaignObjective === 'lead_generation'}
            onChange={() => setCampaignObjective('lead_generation')}
          />
          <div>
            <span className="font-medium">Lead Generation</span>
            <p className="text-xs text-gray-400 mt-1">Collect lead information from people interested in your business.</p>
          </div>
        </label>
      </div>
    </div>
  );
}