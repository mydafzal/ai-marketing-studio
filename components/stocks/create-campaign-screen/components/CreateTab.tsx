import React, { useState } from 'react';
import { Upload, Info, XCircle, Loader2, Plus, ChevronDown, ChevronRight, Settings, Clock } from 'lucide-react';
import { MediaItem } from '../types';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger,
  DialogClose
} from '@/components/ui/dialog';

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
  isUploading?: boolean;
  cooldownActive?: boolean;
  cooldownTimeRemaining?: number;
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
  isLoading,
  isUploading = false,
  cooldownActive = false,
  cooldownTimeRemaining = 0
}: CreateTabProps) {

  const objectives = [
    {
      value: "awareness",
      label: "Awareness",
      description: "Increase awareness of your brand, products, or services."
    },
    {
      value: "recruitment",
      label: "Recruitment",
      description: "Find potential candidates for job opportunities."
    },
    {
      value: "conversions",
      label: "Conversions",
      description: "Drive valuable actions on your website or app."
    },
    {
      value: "lead_generation",
      label: "Lead Generation",
      description: "Collect lead information from people interested in your business."
    }
  ];

  // Remove showAdvancedSettings state since we're using Dialog now
  return (
    <>
      {/* Upload area - smaller height + immediate display */}
      <div className="mb-5">
        <div
          className={`relative flex flex-wrap items-center gap-3 p-3 w-full border-2 border-dashed ${
            isUploading || cooldownActive ? 'border-amber-500' : 'border-border-dark hover:border-primary-green'
          } rounded-lg transition-all duration-200 ${
            isUploading || cooldownActive ? 'cursor-not-allowed' : 'cursor-pointer'
          } h-auto min-h-20`}
          onClick={() => {
            if (!isUploading && !cooldownActive) {
              fileInputRef.current?.click();
            }
          }}
        >
          {/* Status bar for cooldown - no overlay for uploads to keep percentages visible */}
          {cooldownActive && (
            <div className="absolute inset-0 bg-dark-bg/90 rounded-lg flex items-center justify-center z-10">
              <div className="flex flex-col items-center text-amber-500">
                <Clock className="mb-2" size={24} />
                <span className="text-sm font-medium">Cooldown period active</span>
                <span className="text-xs mt-1 text-text-light-gray">
                  Please wait {cooldownTimeRemaining} seconds before uploading again
                </span>
              </div>
            </div>
          )}
          
          {/* Upload in progress banner instead of overlay */}
          {isUploading && !cooldownActive && (
            <div className="absolute top-0 inset-x-0 bg-amber-500/20 border-b border-amber-500 p-1 rounded-t-lg text-center">
              <div className="flex items-center justify-center text-amber-500 text-xs">
                <Loader2 className="animate-spin mr-1" size={12} />
                <span>Upload in progress - please wait</span>
              </div>
            </div>
          )}

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
                  {item.progress !== undefined && item.progress < 100 && item.progress >= 0 ? (
                    <Loader2 className="animate-spin text-primary-green" size={16} />
                  ) : item.progress === -1 ? (
                    <div className="w-4 h-4 rounded-full bg-red-500 flex items-center justify-center">
                      <span className="text-xs text-white">✗</span>
                    </div>
                  ) : (
                    <div className="w-4 h-4 rounded-full bg-primary-green flex items-center justify-center">
                      <span className="text-xs text-deep-black">✓</span>
                    </div>
                  )}
                  <span className="text-sm text-text-white">
                    {item.type.toUpperCase()} ({item.aspectRatio})
                  </span>
                  <span className="text-xs text-text-light-gray">
                    {item.progress === -1 ? 'Failed' : `${item.progress ?? 0}%`}
                  </span>
                  <button
                    onClick={e => {
                      e.stopPropagation();
                      setMediaItems(prev => prev.filter(m => m.id !== item.id));
                    }}
                    disabled={isUploading}
                  >
                    <XCircle 
                      size={16} 
                      className={`${isUploading ? 'text-text-light-gray/50' : 'text-text-light-gray hover:text-red-500'} transition-colors`} 
                    />
                  </button>
                </div>
              ))}
              {!isUploading && !cooldownActive && (
                <div className="flex items-center space-x-2 bg-dark-bg rounded-lg p-2 border border-border-dark hover:border-primary-green transition-all duration-200">
                  <Plus size={16} className="text-text-light-gray" />
                  <span className="text-sm text-text-light-gray">Add more media</span>
                </div>
              )}
            </>
          )}
          <input
            type="file"
            ref={fileInputRef}
            className="hidden"
            accept="image/*,video/*"
            disabled={isUploading || cooldownActive}
          />
        </div>
        
        {/* Upload instructions */}
        <div className="mt-2 text-xs text-text-light-gray">
          <p>• Upload one media file at a time</p>
          {mediaItems.length >= 2 && (
            <p>• After uploading 2 files, a 15-second cooldown applies between uploads</p>
          )}
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

      {/* Advanced Settings Dialog */}
      <div className="mt-5">
        <Dialog>
          <DialogTrigger asChild>
            <button 
              className="flex items-center text-sm font-medium text-text-white hover:text-primary-green transition-colors"
            >
              <Settings className="mr-1" size={16} />
              Advanced Settings
            </button>
          </DialogTrigger>
          <DialogContent className="bg-dark-bg border border-border-dark text-text-white">
            <DialogHeader>
              <DialogTitle className="text-text-white">Advanced Settings</DialogTitle>
            </DialogHeader>
            
            <div className="mt-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-text-white">Campaign Objective</label>
                
                <div className="space-y-3 mt-2">
                  {/* Auto Option */}
                  <div className="flex items-start space-x-2">
                    <div className="flex items-center h-5 mt-1">
                      <input
                        id="objective-auto"
                        type="radio"
                        value="auto"
                        checked={campaignObjective === "auto"}
                        onChange={() => setCampaignObjective("auto")}
                        className="w-4 h-4 border-border-dark focus:ring-primary-green accent-primary-green"
                      />
                    </div>
                    <div className="flex flex-col">
                      <label htmlFor="objective-auto" className="text-sm font-medium text-text-white">
                        Auto
                      </label>
                      <span className="text-xs text-text-light-gray">
                        Let AI automatically select the best objective for your campaign.
                      </span>
                    </div>
                  </div>
                  
                  {/* Other Objectives */}
                  {objectives.map(objective => (
                    <div key={objective.value} className="flex items-start space-x-2">
                      <div className="flex items-center h-5 mt-1">
                        <input
                          id={`objective-${objective.value}`}
                          type="radio"
                          value={objective.value}
                          checked={campaignObjective === objective.value}
                          onChange={() => setCampaignObjective(objective.value)}
                          className="w-4 h-4 border-border-dark focus:ring-primary-green accent-primary-green"
                        />
                      </div>
                      <div className="flex flex-col">
                        <label htmlFor={`objective-${objective.value}`} className="text-sm font-medium text-text-white">
                          {objective.label}
                        </label>
                        <span className="text-xs text-text-light-gray">
                          {objective.description}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            
            <div className="mt-6 flex justify-end">
              <DialogClose asChild>
                <button className="px-4 py-2 bg-primary-green text-deep-black font-medium rounded-md hover:bg-primary-green/90 transition-colors">
                  Done
                </button>
              </DialogClose>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Next Step: Preview & Review */}
      <div className="mt-8">
        <button
          className={`w-full bg-primary-green hover:bg-primary-green/90 text-deep-black font-bold py-3 px-4 rounded-lg transition-all duration-200 transform hover:scale-[1.02] ${mediaItems.length === 0 || !link || !budget || isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
          onClick={() => handleReviewTransition()}
          disabled={mediaItems.length === 0 || !link || !budget || isLoading}
        >
          Preview &amp; Review
        </button>
      </div>
    </>
  );
}