import React, { useState, useEffect } from 'react';
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
import { BudgetSettings } from './BudgetSettings';

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
      {/* Upload area - improved styling */}
      <div className="mb-6">
        <div className="text-sm font-medium text-text-white flex items-center mb-2">
          Upload Media <span className="text-primary-green ml-1">*</span>
          <Info size={16} className="ml-2 text-text-light-gray" />
        </div>
        <div
          className={`relative flex flex-wrap items-center gap-3 p-4 w-full border-2 border-dashed ${
            isUploading || cooldownActive ? 'border-amber-500' : 'border-border-dark hover:border-primary-green'
          } rounded-lg transition-all duration-200 ${
            isUploading || cooldownActive ? 'cursor-not-allowed' : 'cursor-pointer'
          } h-auto min-h-24 bg-dark-bg/50 backdrop-blur-sm`}
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
                <span className="text-sm font-medium">Thank you! Let me take a moment to review this.</span>
                <span className="text-xs mt-1 text-text-light-gray">
                  Please wait {cooldownTimeRemaining} seconds before uploading the next creative
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
                  ) : item.progress === -2 ? (
                    <Loader2 className="animate-spin text-amber-500" size={16} />
                  ) : (
                    <div className="w-4 h-4 rounded-full bg-primary-green flex items-center justify-center">
                      <span className="text-xs text-deep-black">✓</span>
                    </div>
                  )}
                  <span className="text-sm text-text-white">
                    {item.type.toUpperCase()} ({item.aspectRatio})
                  </span>
                  <span className="text-xs text-text-light-gray">
                    {item.progress === -1 ? 'Failed' : 
                     item.progress === -2 ? (item.error || 'Retrying...') : 
                     `${item.progress ?? 0}%`}
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
          <p>• Images must be under 4MB. Videos: recommended under 80MB, max 300MB.</p>
        </div>
      </div>

      {/* Link */}
      <div className="space-y-2 mt-6">
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium text-text-white flex items-center">
            Website Link <span className="text-primary-green ml-1">*</span>
            <Info size={16} className="ml-2 text-text-light-gray" />
          </label>
        </div>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" className="text-text-light-gray">
              <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path>
              <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path>
            </svg>
          </div>
          <input
            type="text"
            value={link}
            onChange={e => setLink(e.target.value)}
            onBlur={(e) => {
              // Format URL: remove www. and add https:// if needed
              const formattedUrl = (() => {
                if (!link || link.trim() === '') return link;
                
                // Remove www. if present
                let cleanUrl = link.replace(/^(https?:\/\/)?(www\.)/i, '');
                
                // Add https:// if not present
                if (!cleanUrl.match(/^https?:\/\//i)) {
                  return `https://${cleanUrl}`;
                }
                
                return cleanUrl;
              })();
              
              setLink(formattedUrl);

              // Check if URL has a valid format with TLD
              try {
                const urlObj = new URL(formattedUrl.match(/^https?:\/\//i) ? formattedUrl : `https://${formattedUrl}`);
                // Check if domain has a TLD (at least one dot in hostname)
                if (!urlObj.hostname.includes('.') || urlObj.hostname.split('.').pop()!.length === 0) {
                  // Invalid domain
                  e.currentTarget.classList.add('border-red-500', 'focus:ring-red-500', 'focus:border-red-500');
                  e.currentTarget.title = "Please enter a valid URL with a domain extension (e.g. .com)";
                } else {
                  e.currentTarget.classList.remove('border-red-500', 'focus:ring-red-500', 'focus:border-red-500');
                  e.currentTarget.title = "";
                }
              } catch (error) {
                // Invalid URL
                if (formattedUrl.trim() !== '') {
                  e.currentTarget.classList.add('border-red-500', 'focus:ring-red-500', 'focus:border-red-500');
                  e.currentTarget.title = "Please enter a valid URL";
                }
              }
            }}
            placeholder="Enter the URL you want to advertise"
            className="w-full pl-10 pr-3 py-2.5 bg-dark-bg/80 border border-border-dark text-text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-green focus:border-primary-green placeholder:text-text-light-gray transition-all duration-200"
          />
        </div>
        <p className="text-xs text-text-light-gray mt-1">The website or landing page where your audience will be directed</p>
      </div>

      {/* Budget with Currency and Minimum Budget Handling */}
      <div className="space-y-2 mt-6">
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium text-text-white flex items-center">
            Daily Budget <span className="text-primary-green ml-1">*</span>
            <Info size={16} className="ml-2 text-text-light-gray" />
          </label>
        </div>
        <BudgetSettings budget={budget} setBudget={setBudget} />
        <p className="text-xs text-text-light-gray mt-1">This is the maximum amount you'll spend per day on this campaign</p>
      </div>

      {/* AI Guidance field is hidden but we keep the functionality working */}
      <div className="hidden">
        <textarea
          value={aiGuidance}
          onChange={e => setAiGuidance(e.target.value)}
        />
      </div>

      {/* Advanced Settings Dialog - styled better */}
      <div className="mt-5">
        <Dialog>
          <DialogTrigger asChild>
            <button 
              className="flex items-center text-sm font-medium text-text-light-gray hover:text-primary-green transition-colors bg-dark-bg/50 px-3 py-1.5 rounded-md border border-border-dark/50 hover:border-primary-green/50"
            >
              <Settings className="mr-2" size={16} />
              Campaign Objective Settings
            </button>
          </DialogTrigger>
          <DialogContent className="bg-dark-bg border border-border-dark text-text-white">
            <DialogHeader>
              <DialogTitle className="text-text-white flex items-center">
                <div className="bg-primary-green/20 w-8 h-8 rounded-full flex items-center justify-center mr-2">
                  <Settings className="text-primary-green" size={16} />
                </div>
                Campaign Objective
              </DialogTitle>
            </DialogHeader>
            
            <div className="mt-4">
              <div className="space-y-2">
                <p className="text-sm text-text-light-gray mb-4">
                  Choose the primary goal of your ad campaign to help optimize its performance
                </p>
                
                <div className="space-y-3 mt-4 bg-dark-bg/50 p-4 rounded-lg border border-border-dark/50">
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
                <button className="px-5 py-2.5 bg-primary-green text-deep-black font-medium rounded-md hover:bg-primary-green/90 transition-colors">
                  Save Settings
                </button>
              </DialogClose>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Next Step: Preview & Review */}
      <div className="mt-8">
        <div className="text-xs text-text-light-gray mb-3 text-center">
          {mediaItems.length === 0 || !link || !budget 
            ? "Please fill in all required fields marked with * to continue" 
            : "Your campaign configuration is complete! Click below to continue"}
        </div>
        <button
          className={`w-full bg-gradient-to-r from-primary-green to-blue-400 hover:opacity-90 text-deep-black font-bold py-3.5 px-4 rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl ${mediaItems.length === 0 || !link || !budget || isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
          onClick={() => handleReviewTransition()}
          disabled={mediaItems.length === 0 || !link || !budget || isLoading}
        >
          Preview &amp; Review Campaign
        </button>
      </div>
    </>
  );
}