import React, { useState } from 'react';
import { Upload, Info, XCircle, Loader2, Plus, HelpCircle } from 'lucide-react';
import { MediaItem } from '../types';
import { InfoModal } from './InfoModal';

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
  const [isInfoModalOpen, setIsInfoModalOpen] = useState(false);
  return (
    <>
      {/* Upload area - smaller height + immediate display */}
      <div className="mb-5">
        <div
          className="relative flex flex-wrap items-center gap-3 p-3 w-full border-2 border-dashed border-border-dark rounded-lg hover:border-primary-green transition-all duration-200 cursor-pointer h-20"
          onClick={() => fileInputRef.current?.click()}
        >
          {mediaItems.length === 0 ? (
            <div className="flex flex-col items-center text-text-light-gray mx-auto">
              <Upload className="mb-1" size={20} />
              <span className="text-xs">Upload Media</span>
            </div>
          ) : (
            <>
              {mediaItems.map(item => (
                <div
                  key={item.id}
                  className="flex items-center space-x-2 bg-dark-bg rounded-lg p-2 border border-border-dark"
                >
                  {item.progress !== undefined && item.progress < 100 ? (
                    <Loader2 className="animate-spin text-primary-green" size={16} />
                  ) : (
                    <div className="w-4 h-4 rounded-full bg-primary-green flex items-center justify-center">
                      <span className="text-xs text-deep-black">✓</span>
                    </div>
                  )}
                  <span className="text-sm text-text-white">
                    {item.type.toUpperCase()} ({item.aspectRatio})
                  </span>
                  <span className="text-xs text-text-light-gray">
                    {item.progress ?? 0}%
                  </span>
                  <button
                    onClick={e => {
                      e.stopPropagation();
                      setMediaItems(prev => prev.filter(m => m.id !== item.id));
                    }}
                  >
                    <XCircle size={16} className="text-text-light-gray hover:text-red-500 transition-colors" />
                  </button>
                </div>
              ))}
              <div className="flex items-center space-x-2 bg-dark-bg rounded-lg p-2 border border-border-dark hover:border-primary-green transition-all duration-200">
                <Plus size={16} className="text-text-light-gray" />
                <span className="text-sm text-text-light-gray">Add more media</span>
              </div>
            </>
          )}
          <input
            type="file"
            ref={fileInputRef}
            className="hidden"
            accept="image/*,video/*"
          />
        </div>
      </div>

      {/* Link */}
      <div className="space-y-2 mt-5">
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium text-text-white flex items-center">
            Link
            <Info size={16} className="ml-2 text-text-light-gray" />
          </label>
        </div>
        <input
          type="text"
          value={link}
          onChange={e => setLink(e.target.value)}
          placeholder="Enter the link to what you'd like to advertise"
          className="w-full px-3 py-2.5 bg-dark-bg border border-border-dark text-text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-green focus:border-primary-green placeholder:text-text-light-gray transition-all duration-200"
        />
      </div>

      {/* Budget */}
      <div className="space-y-2 mt-5">
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium text-text-white flex items-center">
            Ad Budget (Daily)
            <Info size={16} className="ml-2 text-text-light-gray" />
          </label>
        </div>
        <div className="relative">
          <input
            type="text"
            value={budget}
            onChange={e => setBudget(e.target.value)}
            placeholder="Enter daily budget"
            className="w-full px-3 py-2.5 bg-dark-bg border border-border-dark text-text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-green focus:border-primary-green placeholder:text-text-light-gray transition-all duration-200 pr-16"
          />
          <div className="absolute inset-y-0 right-0 flex items-center pr-3 text-text-light-gray pointer-events-none">
            <span>USD</span>
          </div>
        </div>
      </div>

      {/* Optional AI guidance */}
      <div className="space-y-2 mt-5">
        <label className="text-sm font-medium text-text-white flex items-center">
          AI Guidance (Optional)
          <Info size={16} className="ml-2 text-text-light-gray" />
        </label>
        <textarea
          value={aiGuidance}
          onChange={e => setAiGuidance(e.target.value)}
          placeholder="Type any notes or instructions for the AI..."
          className="w-full px-3 py-2.5 bg-dark-bg border border-border-dark text-text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-green focus:border-primary-green placeholder:text-text-light-gray transition-all duration-200 min-h-[80px] resize-none"
        />
      </div>


      {/* Next Step: Preview & Review */}
      <div className="mt-8">
        <div className="flex items-center justify-between mb-2">
          <button
            onClick={() => setIsInfoModalOpen(true)}
            className="flex items-center text-text-light-gray hover:text-primary-green transition-colors"
          >
            <HelpCircle size={16} className="mr-1" />
            <span className="text-xs">What information is passed to Facebook?</span>
          </button>
        </div>
        <button
          className={`w-full bg-primary-green hover:bg-primary-green/90 text-deep-black font-bold py-3 px-4 rounded-lg transition-all duration-200 transform hover:scale-[1.02] ${mediaItems.length === 0 || !link || !budget || isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
          onClick={() => handleReviewTransition()}
          disabled={mediaItems.length === 0 || !link || !budget || isLoading}
        >
          Preview &amp; Review
        </button>
      </div>
      
      {/* Info Modal */}
      <InfoModal
        isOpen={isInfoModalOpen}
        onClose={() => setIsInfoModalOpen(false)}
        title="Data Passed to Facebook for Campaign Creation"
      >
        <div className="space-y-4 text-sm">
          <p>
            When you proceed to the review stage, the following data is sent to Facebook to prepare your campaign:
          </p>
          <ul className="list-disc list-inside space-y-2 ml-2">
            <li><strong>Media Files:</strong> The images and videos you&apos;ve uploaded</li>
            <li><strong>Website Link:</strong> The URL you entered for your campaign destination</li>
            <li><strong>Daily Budget:</strong> The amount you set for daily campaign spending</li>
            <li><strong>Account ID:</strong> Your Facebook Ad Account ID</li>
            <li><strong>Page ID:</strong> Your connected Facebook Page ID</li>
            <li><strong>Profile Data:</strong> Business information from your account settings</li>
            <li><strong>Locations:</strong> Geographic targeting information from your account</li>
            <li><strong>AI Guidance:</strong> Any optional instructions you provided</li>
          </ul>
          <p>
            This information is used to generate campaign recommendations and prepare your ad for review.
            No actual campaigns are created until you click &quot;Launch Campaign&quot; in the final step.
          </p>
        </div>
      </InfoModal>
    </>
  );
}