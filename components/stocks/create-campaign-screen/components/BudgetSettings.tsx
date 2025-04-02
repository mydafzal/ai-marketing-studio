import React from 'react';

interface BudgetSettingsProps {
  budget: string;
  setBudget: React.Dispatch<React.SetStateAction<string>>;
}

export function BudgetSettings({ budget, setBudget }: BudgetSettingsProps) {
  return (
    <div className="space-y-6">
      <h3 className="font-medium mb-3">Budget Settings</h3>
      <div>
        <label className="block text-sm mb-2">Daily Budget</label>
        <div className="relative">
          <input
            type="text"
            value={budget}
            onChange={e => setBudget(e.target.value)}
            placeholder="Enter daily budget"
            className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-md pr-16"
          />
          <div className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 pointer-events-none">
            <span>USD</span>
          </div>
        </div>
      </div>
      <div className="space-y-2">
        <label className="block text-sm mb-2">Campaign Duration</label>
        <div className="flex space-x-2">
          <button className="flex-1 py-2 bg-gray-800 rounded-md">
            Ongoing
          </button>
          <button className="flex-1 py-2 bg-gray-800 rounded-md">
            Set End Date
          </button>
        </div>
      </div>
    </div>
  );
}