import React from 'react';
import { Upload, Info, XCircle, Loader2 } from 'lucide-react';
import { MediaItem } from '../types';

interface CreateTabProps {
  mediaItems: MediaItem[];
  setMediaItems: React.Dispatch<React.SetStateAction<MediaItem[]>>;
  fileInputRef: React.RefObject<HTMLInputElement>;
  campaignObjective: string;
  setCampaignObjective: (objective: string) => void;
  link: string;
  setLink: React.Dispatch<React.SetStateAction<string>>;
  budget: string;
  setBudget: React.Dispatch<React.SetStateAction<string>>;
  aiGuidance: string;
  setAiGuidance: React.Dispatch<React.SetStateAction<string>>;
  handleReviewTransition: () => void;
  isLoading: boolean;
}

export function CreateTab({
  mediaItems,
  setMediaItems,
  fileInputRef,
  campaignObjective,
  setCampaignObjective,
  link,
  setLink,
  budget,
  setBudget,
  aiGuidance,
  setAiGuidance,
  handleReviewTransition,
  isLoading
}: CreateTabProps) {
  return (
    <>
      {/* Upload area - smaller height + immediate display */}
      <div className="mb-4">
        <div
          className="relative flex flex-wrap items-center gap-3 p-2 w-full border-2 border-dashed border-gray-600 rounded-lg hover:border-gray-400 transition-colors cursor-pointer h-20"
          onClick={() => fileInputRef.current?.click()}
        >
          {mediaItems.length === 0 ? (
            <div className="flex flex-col items-center text-gray-400 mx-auto">
              <Upload className="mb-1" size={20} />
              <span className="text-xs">Upload Media</span>
            </div>
          ) : (
            mediaItems.map(item => (
              <div
                key={item.id}
                className="flex items-center space-x-2 bg-gray-800 rounded p-2"
              >
                {item.progress !== undefined && item.progress < 100 ? (
                  <Loader2 className="animate-spin" size={16} />
                ) : (
                  <div className="w-4 h-4 rounded-full bg-green-500 flex items-center justify-center">
                    <span className="text-xs text-white">✓</span>
                  </div>
                )}
                <span className="text-sm text-gray-200">
                  {item.type.toUpperCase()} ({item.aspectRatio})
                </span>
                <span className="text-xs text-gray-400">
                  {item.progress ?? 0}%
                </span>
                <button
                  onClick={e => {
                    e.stopPropagation();
                    setMediaItems(prev => prev.filter(m => m.id !== item.id));
                  }}
                >
                  <XCircle size={16} className="text-gray-400 hover:text-red-500" />
                </button>
              </div>
            ))
          )}
          <input
            type="file"
            ref={fileInputRef}
            className="hidden"
            accept="image/*,video/*"
            onChange={(e) => {
              // This will be handled by the useMediaUpload hook in the parent component
              if (fileInputRef.current) fileInputRef.current.click();
            }}
          />
        </div>
      </div>

      {/* Campaign Objective */}
      <div className="mt-2">
        <h3 className="text-sm font-medium mb-1">Campaign Objective</h3>
        <div className="space-y-1">
          <label className="flex items-center p-2 border border-gray-700 rounded-md cursor-pointer bg-gray-800 hover:bg-gray-750 transition-colors">
            <input
              type="radio"
              className="h-4 w-4 mr-2 accent-blue-500"
              checked={campaignObjective === 'Brand Awareness'}
              onChange={() => setCampaignObjective('Brand Awareness')}
            />
            <span className="text-sm">Brand Awareness</span>
          </label>
          <label className="flex items-center p-2 border border-gray-700 rounded-md cursor-pointer bg-gray-800 hover:bg-gray-750 transition-colors">
            <input
              type="radio"
              className="h-4 w-4 mr-2 accent-blue-500"
              checked={campaignObjective === 'Recruitment'}
              onChange={() => setCampaignObjective('Recruitment')}
            />
            <span className="text-sm">Recruitment</span>
          </label>
          <label className="flex items-center p-2 border border-gray-700 rounded-md cursor-pointer bg-gray-800 hover:bg-gray-750 transition-colors">
            <input
              type="radio"
              className="h-4 w-4 mr-2 accent-blue-500"
              checked={campaignObjective === 'Conversions'}
              onChange={() => setCampaignObjective('Conversions')}
            />
            <span className="text-sm">Conversions</span>
          </label>
          <label className="flex items-center p-2 border border-gray-700 rounded-md cursor-pointer bg-gray-800 hover:bg-gray-750 transition-colors">
            <input
              type="radio"
              className="h-4 w-4 mr-2 accent-blue-500"
              checked={campaignObjective === 'Lead Generation'}
              onChange={() => setCampaignObjective('Lead Generation')}
            />
            <span className="text-sm">Lead Generation</span>
          </label>
        </div>
      </div>

      {/* Link */}
      <div className="space-y-2 mt-4">
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium flex items-center">
            Link
            <Info size={16} className="ml-2 text-gray-500" />
          </label>
        </div>
        <input
          type="text"
          value={link}
          onChange={e => setLink(e.target.value)}
          placeholder="Enter the link to what you'd like to advertise"
          className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Budget */}
      <div className="space-y-2 mt-4">
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium flex items-center">
            Ad Budget (Daily)
            <Info size={16} className="ml-2 text-gray-500" />
          </label>
        </div>
        <div className="relative">
          <input
            type="text"
            value={budget}
            onChange={e => setBudget(e.target.value)}
            placeholder="Enter daily budget"
            className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 pr-16"
          />
          <div className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 pointer-events-none">
            <span>USD</span>
          </div>
        </div>
      </div>

      {/* Optional AI guidance */}
      <div className="space-y-2 mt-4">
        <label className="text-sm font-medium flex items-center">
          AI Guidance (Optional)
          <Info size={16} className="ml-2 text-gray-500" />
        </label>
        <textarea
          value={aiGuidance}
          onChange={e => setAiGuidance(e.target.value)}
          placeholder="Type any notes or instructions for the AI..."
          className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 h-16 resize-none"
        />
      </div>

      {/* Next Step: Preview & Review */}
      <div className="mt-6">
        <button
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md transition-colors shadow-lg"
          onClick={() => handleReviewTransition()}
          disabled={mediaItems.length === 0 || !link || !budget || isLoading}
        >
          Preview &amp; Review
        </button>
      </div>
    </>
  );
}