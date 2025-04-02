import React from 'react';
import { XCircle } from 'lucide-react';
import { Gender } from '../types';

interface AudienceSettingsProps {
  targetedLocations: string[];
  setTargetedLocations: React.Dispatch<React.SetStateAction<string[]>>;
  newLocation: string;
  setNewLocation: React.Dispatch<React.SetStateAction<string>>;
  ageRange: [number, number];
  setAgeRange: React.Dispatch<React.SetStateAction<[number, number]>>;
  targetedInterests: string[];
  setTargetedInterests: React.Dispatch<React.SetStateAction<string[]>>;
  newInterest: string;
  setNewInterest: React.Dispatch<React.SetStateAction<string>>;
  behavioralFilters: string[];
  setBehavioralFilters: React.Dispatch<React.SetStateAction<string[]>>;
  demographicFilters: string[];
  setDemographicFilters: React.Dispatch<React.SetStateAction<string[]>>;
  gender: Gender;
  setGender: React.Dispatch<React.SetStateAction<Gender>>;
}

export function AudienceSettings({
  targetedLocations,
  setTargetedLocations,
  newLocation,
  setNewLocation,
  ageRange,
  setAgeRange,
  targetedInterests,
  setTargetedInterests,
  newInterest,
  setNewInterest,
  behavioralFilters,
  setBehavioralFilters,
  demographicFilters,
  setDemographicFilters,
  gender,
  setGender
}: AudienceSettingsProps) {
  
  // Manage locations
  const addLocation = () => {
    if (newLocation && !targetedLocations.includes(newLocation)) {
      setTargetedLocations(prev => [...prev, newLocation]);
      setNewLocation('');
    }
  };
  
  const removeLocation = (loc: string) => {
    setTargetedLocations(prev => prev.filter(l => l !== loc));
  };

  // Manage filters (the typed ones)
  const addFilter = () => {
    if (newInterest && !targetedInterests.includes(newInterest)) {
      setTargetedInterests(prev => [...prev, newInterest]);
      setNewInterest('');
    }
  };
  
  const removeFilter = (f: string) => {
    setTargetedInterests(prev => prev.filter(fl => fl !== f));
  };

  // Manage behavioral filters
  const removeBehavioralFilter = (filter: string) => {
    setBehavioralFilters(prev => prev.filter(f => f !== filter));
  };

  // Manage demographic filters
  const removeDemographicFilter = (filter: string) => {
    setDemographicFilters(prev => prev.filter(f => f !== filter));
  };

  return (
    <div className="space-y-6">
      <h3 className="font-medium mb-2">Audience Settings</h3>

      {/* Locations */}
      <div>
        <label className="block text-sm mb-2">Location</label>
        <div className="space-y-2">
          {targetedLocations.map((loc, i) => (
            <div
              key={i}
              className="flex items-center justify-between bg-gray-800 p-2 rounded"
            >
              <span>{loc}</span>
              <XCircle
                size={16}
                className="cursor-pointer text-gray-400 hover:text-red-500"
                onClick={() => removeLocation(loc)}
              />
            </div>
          ))}
          <div className="flex">
            <input
              type="text"
              placeholder="Add location"
              value={newLocation}
              onChange={e => setNewLocation(e.target.value)}
              className="flex-grow px-3 py-2 bg-gray-900 border border-gray-700 rounded-l-md"
              onKeyDown={e => e.key === 'Enter' && addLocation()}
            />
            <button
              className="bg-blue-600 px-4 rounded-r-md"
              onClick={addLocation}
            >
              Add
            </button>
          </div>
        </div>
      </div>

      {/* Age Range */}
      <div>
        <label className="block text-sm mb-2">Age Range</label>
        <div className="px-2">
          <div className="relative h-2 bg-gray-700 rounded-full">
            <div
              className="absolute h-2 bg-blue-600 rounded-full"
              style={{
                left: `${((ageRange[0] - 18) * 100) / (65 - 18)}%`,
                width: `${((ageRange[1] - ageRange[0]) * 100) / (65 - 18)}%`
              }}
            ></div>
            <div
              className="absolute w-4 h-4 bg-white rounded-full -mt-1 -ml-2 cursor-pointer"
              style={{
                left: `${((ageRange[0] - 18) * 100) / (65 - 18)}%`
              }}
            ></div>
            <div
              className="absolute w-4 h-4 bg-white rounded-full -mt-1 -ml-2 cursor-pointer"
              style={{
                left: `${((ageRange[1] - 18) * 100) / (65 - 18)}%`
              }}
            ></div>
          </div>
          <div className="flex justify-between mt-2 text-xs text-gray-400">
            <span>18</span>
            <span>65+</span>
          </div>
          <div className="text-center text-sm mt-1">
            {ageRange[0]} - {ageRange[1]}
          </div>
          <div className="flex justify-between mt-3">
            <button
              className="px-2 py-1 bg-gray-800 text-sm rounded"
              onClick={() =>
                setAgeRange([
                  Math.max(18, ageRange[0] - 5),
                  ageRange[1]
                ])
              }
              disabled={ageRange[0] <= 18}
            >
              Younger
            </button>
            <button
              className="px-2 py-1 bg-gray-800 text-sm rounded"
              onClick={() =>
                setAgeRange([
                  ageRange[0],
                  Math.min(65, ageRange[1] + 5)
                ])
              }
              disabled={ageRange[1] >= 65}
            >
              Older
            </button>
          </div>
        </div>
      </div>

      {/* All Filters in one place with different colors */}
      <div>
        <label className="block text-sm mb-2">Filters</label>
        <div className="space-y-2">
          {/* Show all filters in one place but with different colors */}
          <div className="flex flex-wrap gap-2">
            {/* Regular filters */}
            {targetedInterests.map((f, i) => (
              <div key={i} className="flex items-center bg-gray-800 px-3 py-1 rounded">
                <span className="mr-2">{f}</span>
                <XCircle
                  size={14}
                  className="cursor-pointer text-gray-400 hover:text-red-500"
                  onClick={() => removeFilter(f)}
                />
              </div>
            ))}
            
            {/* Behavioral filters with blue color */}
            {behavioralFilters.map((f, i) => (
              <div key={`beh-${i}`} className="flex items-center bg-blue-900 px-3 py-1 rounded">
                <span className="mr-2 text-blue-300">{f}</span>
                <XCircle
                  size={14}
                  className="cursor-pointer text-blue-400 hover:text-red-500"
                  onClick={() => removeBehavioralFilter(f)}
                />
              </div>
            ))}
            
            {/* Demographic filters with green color */}
            {demographicFilters.map((f, i) => (
              <div key={`dem-${i}`} className="flex items-center bg-green-900 px-3 py-1 rounded">
                <span className="mr-2 text-green-300">{f}</span>
                <XCircle
                  size={14}
                  className="cursor-pointer text-green-400 hover:text-red-500"
                  onClick={() => removeDemographicFilter(f)}
                />
              </div>
            ))}
          </div>
          
          <div className="flex">
            <input
              type="text"
              placeholder="Add filter"
              value={newInterest}
              onChange={e => setNewInterest(e.target.value)}
              className="flex-grow px-3 py-2 bg-gray-900 border border-gray-700 rounded-l-md"
              onKeyDown={e => e.key === 'Enter' && addFilter()}
            />
            <button className="bg-blue-600 px-4 rounded-r-md" onClick={addFilter}>
              Add
            </button>
          </div>
        </div>
      </div>

      {/* Gender */}
      <div>
        <label className="block text-sm mb-2">Gender</label>
        <div className="flex space-x-4">
          <label className="flex items-center cursor-pointer">
            <input
              type="radio"
              className="h-4 w-4 mr-2 accent-blue-500"
              checked={gender === 'All'}
              onChange={() => setGender('All')}
            />
            <span>All</span>
          </label>
          <label className="flex items-center cursor-pointer">
            <input
              type="radio"
              className="h-4 w-4 mr-2 accent-blue-500"
              checked={gender === 'Male'}
              onChange={() => setGender('Male')}
            />
            <span>Male</span>
          </label>
          <label className="flex items-center cursor-pointer">
            <input
              type="radio"
              className="h-4 w-4 mr-2 accent-blue-500"
              checked={gender === 'Female'}
              onChange={() => setGender('Female')}
            />
            <span>Female</span>
          </label>
        </div>
      </div>
    </div>
  );
}