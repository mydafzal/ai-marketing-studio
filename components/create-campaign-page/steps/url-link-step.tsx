'use client'

import React from 'react'
import { ArrowLeft, Info } from 'lucide-react'
import { AIMessageWithTyping } from '../ai-message-with-typing'

interface UrlLinkStepProps {
  link: string
  setLink: React.Dispatch<React.SetStateAction<string>>
  onNext: () => void
  onPrevious: () => void
  canProceed: boolean
}

export function UrlLinkStep({
  link,
  setLink,
  onNext,
  onPrevious,
  canProceed
}: UrlLinkStepProps) {

  // URL validation to ensure all links have https:// but no www.
  const validateAndFixUrl = (url: string) => {
    if (!url || url.trim() === '') return url;
    
    // Remove www. if present
    let cleanUrl = url.replace(/^(https?:\/\/)?(www\.)/i, '');
    
    // Add https:// if not present
    if (!cleanUrl.match(/^https?:\/\//i)) {
      return `https://${cleanUrl}`;
    }
    
    return cleanUrl;
  };
  
  // Check if a URL is valid (has a TLD after adding https://)
  const isValidUrl = (url: string) => {
    if (!url || url.trim() === '') return false;
    
    try {
      // Ensure URL has protocol before checking
      const urlWithProtocol = url.match(/^https?:\/\//i) ? url : `https://${url}`;
      const urlObj = new URL(urlWithProtocol);
      
      // Check for a valid domain with at least one dot (to ensure there's a TLD)
      return urlObj.hostname.includes('.') && urlObj.hostname.split('.').pop()!.length > 0;
    } catch (e) {
      return false;
    }
  };

  const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLink(e.target.value);
  };

  const handleUrlBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    // Format URL: remove www. and add https:// if needed
    const formattedUrl = validateAndFixUrl(link);
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
  };

  return (
    <>
      {/* AI Greeting Message with Typing Effect */}
      <AIMessageWithTyping message="Perfect! Now I need to know where you'd like to send people when they click on your ad. Please enter the website URL you want to promote." />

      {/* Form Section - Better Centered */}
      <div className="w-full flex justify-center px-2 sm:px-0">
        <div className="w-full max-w-xl">
          <div className="bg-[#151925] rounded-lg p-4 sm:p-6 shadow-lg border border-[#1A1D29]/50">
          
            {/* URL Input */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-3">
                <label className="text-sm font-medium text-white flex items-center">
                  Website URL
                  <Info size={16} className="ml-2 text-gray-400" />
                </label>
              </div>
              <input
                type="text"
                value={link}
                onChange={handleUrlChange}
                onBlur={handleUrlBlur}
                placeholder="Enter the link to what you'd like to advertise"
                className="w-full px-4 py-3 bg-[#1A1D29] border border-[#2A2E3A] text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4BF29C] focus:border-[#4BF29C] placeholder:text-gray-400 transition-all duration-200"
              />
              <div className="mt-2 text-xs text-gray-400">
                <p>• We&apos;ll automatically format your URL (add https:// and remove www.)</p>
                <p>• Make sure it&apos;s a valid website URL with a domain extension (.com, .org, etc.)</p>
              </div>
            </div>

            {/* Navigation Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 sm:justify-between">
              <button
                onClick={onPrevious}
                className="flex items-center justify-center px-6 py-3 text-gray-300 hover:text-white border border-[#2A2E3A] hover:border-gray-500 rounded-lg font-medium transition-all duration-200 text-base active:scale-[0.98]"
              >
                <ArrowLeft size={18} className="mr-2" />
                Back
              </button>
              <button
                onClick={onNext}
                disabled={!canProceed}
                className={`px-6 py-3 rounded-lg font-medium text-base transition-all duration-200 ${
                  canProceed
                    ? 'bg-[#4BF29C] text-black hover:bg-[#4BF29C]/90 transform hover:scale-[1.02] active:scale-[0.98]'
                    : 'bg-gray-600 text-gray-300 cursor-not-allowed'
                }`}
              >
                Continue
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  )
} 