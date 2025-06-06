'use client'

import React, { useState } from 'react'
import { ArrowLeft, Rocket, Settings, CheckCircle2, Image, Video, ExternalLink, DollarSign } from 'lucide-react'
import { StepByStepMediaItem } from '../types'

interface ReviewStepProps {
  mediaItems: StepByStepMediaItem[]
  link: string
  budget: string
  campaignObjective: string
  setCampaignObjective: React.Dispatch<React.SetStateAction<string>>
  selectedLeadFormId: string
  setSelectedLeadFormId: React.Dispatch<React.SetStateAction<string>>
  selectedCustomerProfileId: string
  setSelectedCustomerProfileId: React.Dispatch<React.SetStateAction<string>>
  campaignSessionId: string | null
  onPrevious: () => void
}

export function ReviewStep({
  mediaItems,
  link,
  budget,
  campaignObjective,
  setCampaignObjective,
  selectedLeadFormId,
  setSelectedLeadFormId,
  selectedCustomerProfileId,
  setSelectedCustomerProfileId,
  campaignSessionId,
  onPrevious
}: ReviewStepProps) {
  const [isLaunching, setIsLaunching] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleLaunchCampaign = async () => {
    setIsLaunching(true)
    setError(null)

    try {
      // Simulate the campaign creation process similar to the original
      // This would normally call the master flow API and then finalize the campaign
      
      // For now, just simulate a successful launch
      setTimeout(() => {
        setIsLaunching(false)
        setShowSuccess(true)
        
        // Hide success message after 3 seconds
        setTimeout(() => {
          setShowSuccess(false)
          // Could redirect to campaign results or homepage here
        }, 3000)
      }, 3000)

    } catch (error) {
      setIsLaunching(false)
      setError('Failed to launch campaign. Please try again.')
    }
  }

  if (showSuccess) {
    return (
      <div className="w-full flex justify-center px-2 sm:px-0">
        <div className="w-full max-w-xl">
          <div className="bg-[#151925] rounded-lg p-6 sm:p-8 shadow-lg border border-[#1A1D29]/50 text-center">
            <div className="w-20 h-20 rounded-full bg-[#4BF29C] mx-auto flex items-center justify-center mb-6">
              <CheckCircle2 size={40} className="text-black" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-4">Campaign Launched! 🚀</h2>
            <p className="text-gray-400 mb-6">
              Your campaign is now live and will start running soon. You can monitor its performance in your campaign dashboard.
            </p>
            <button
              onClick={() => window.location.href = '/'}
              className="px-6 py-3 bg-[#4BF29C] text-black rounded-lg font-medium hover:bg-[#4BF29C]/90 transition-all duration-200"
            >
              Go to Dashboard
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (isLaunching) {
    return (
      <div className="w-full flex justify-center px-2 sm:px-0">
        <div className="w-full max-w-xl">
          <div className="bg-[#151925] rounded-lg p-6 sm:p-8 shadow-lg border border-[#1A1D29]/50 text-center">
            <div className="w-20 h-20 rounded-full bg-[#4BF29C]/20 mx-auto flex items-center justify-center mb-6">
              <Rocket size={40} className="text-[#4BF29C] animate-pulse" />
            </div>
            <h2 className="text-xl font-bold text-white mb-4">Launching Your Campaign...</h2>
            <p className="text-gray-400 mb-6">
              Please wait while we create your campaign and set up all the targeting and creative elements.
            </p>
            <div className="w-full bg-[#1A1D29] rounded-full h-2 overflow-hidden">
              <div className="h-full bg-[#4BF29C] animate-pulse"></div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="w-full flex justify-center px-2 sm:px-0">
        <div className="w-full max-w-xl">
          <div className="bg-[#151925] rounded-lg p-6 sm:p-8 shadow-lg border border-[#1A1D29]/50 text-center">
            <div className="w-20 h-20 rounded-full bg-red-500 mx-auto flex items-center justify-center mb-6">
              <span className="text-white text-2xl">✗</span>
            </div>
            <h2 className="text-xl font-bold text-white mb-4">Launch Failed</h2>
            <p className="text-gray-400 mb-6">{error}</p>
            <div className="flex gap-4 justify-center">
              <button
                onClick={onPrevious}
                className="px-6 py-3 border border-[#2A2E3A] text-gray-300 rounded-lg font-medium hover:border-gray-500 transition-all duration-200"
              >
                Go Back
              </button>
              <button
                onClick={() => setError(null)}
                className="px-6 py-3 bg-[#4BF29C] text-black rounded-lg font-medium hover:bg-[#4BF29C]/90 transition-all duration-200"
              >
                Try Again
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <>
      {/* AI Greeting Message - Better Centered */}
      <div className="w-full flex justify-center px-2 sm:px-0">
        <div className="w-full max-w-xl">
          <div className="flex items-start">
            <div className="mr-3 sm:mr-4 flex-shrink-0">
              {/* Enhanced Color Blob */}
              <div className="w-10 h-10 sm:w-14 sm:h-14 rounded-full flex items-center justify-center relative overflow-hidden shadow-[0_0_15px_rgba(75,242,156,0.7)] sm:shadow-[0_0_20px_rgba(75,242,156,0.7)]">
                <div 
                  className="absolute inset-0 bg-gradient-to-br from-[#4BF29C] via-[#35d6ff] to-[#0a84ff]" 
                  style={{
                    animation: "pulse 2.5s cubic-bezier(0.4, 0, 0.6, 1) infinite, gradient 6s ease infinite",
                    backgroundSize: "300% 300%"
                  }}
                ></div>
                <div 
                  className="absolute inset-0" 
                  style={{
                    background: "radial-gradient(circle at 30% 30%, rgba(255,255,255,0.9), transparent 45%)",
                    animation: "rotate 10s linear infinite, shimmer 3s ease-in-out infinite"
                  }}
                ></div>
                <div 
                  className="absolute inset-0" 
                  style={{
                    background: "linear-gradient(45deg, transparent 40%, rgba(255,255,255,0.95) 48%, rgba(255,255,255,0.95) 52%, transparent 60%)",
                    backgroundSize: "400% 400%",
                    animation: "shimmer 2s ease-in-out infinite, rotate 8s linear infinite reverse"
                  }}
                ></div>
                <div 
                  className="absolute inset-0" 
                  style={{
                    background: "linear-gradient(-60deg, transparent 75%, rgba(255,255,255,0.8) 80%, rgba(255,255,255,0.9) 85%, transparent 90%)",
                    backgroundSize: "200% 200%",
                    animation: "shimmer 3.5s ease-in-out infinite 0.5s, rotate 12s linear infinite"
                  }}
                ></div>
                <div 
                  className="absolute inset-[2px] rounded-full"
                  style={{
                    background: "radial-gradient(circle at center, rgba(255,255,255,0.5) 0%, transparent 70%)",
                    animation: "pulse 2s ease-in-out infinite alternate"
                  }}
                ></div>
              </div>
            </div>
            <div className="bg-[#1A1D29] rounded-lg p-3 sm:p-5 shadow flex-grow">
              <div className="text-white text-sm sm:text-base typing-container">
                Perfect! Here&apos;s a summary of your campaign. I&apos;ll handle all the technical setup, targeting, and optimization for you. Ready to launch?
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Campaign Summary - Better Centered */}
      <div className="w-full flex justify-center px-2 sm:px-0">
        <div className="w-full max-w-xl">
          <div className="bg-[#151925] rounded-lg p-4 sm:p-6 shadow-lg border border-[#1A1D29]/50">
            
            <h3 className="text-lg sm:text-xl font-medium text-white mb-4 sm:mb-6">Campaign Summary</h3>
            
            {/* Media Items */}
            <div className="mb-4 sm:mb-6">
              <div className="flex items-center gap-2 mb-3">
                <Image size={18} className="text-[#4BF29C]" />
                <span className="text-sm sm:text-base font-medium text-white">Creative Content</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {mediaItems.map(item => (
                  <div key={item.id} className="flex items-center gap-2 bg-[#1A1D29] px-3 py-2 rounded-lg border border-[#2A2E3A] text-xs sm:text-sm">
                    {item.type === 'image' ? (
                      <Image size={14} className="text-[#4BF29C] flex-shrink-0" />
                    ) : (
                      <Video size={14} className="text-[#4BF29C] flex-shrink-0" />
                    )}
                    <span className="text-white">
                      {item.type.toUpperCase()} ({item.aspectRatio})
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Website URL */}
            <div className="mb-4 sm:mb-6">
              <div className="flex items-center gap-2 mb-3">
                <ExternalLink size={18} className="text-[#4BF29C]" />
                <span className="text-sm sm:text-base font-medium text-white">Landing Page</span>
              </div>
              <div className="bg-[#1A1D29] px-3 py-2 rounded-lg border border-[#2A2E3A]">
                <span className="text-sm sm:text-base text-white break-all">{link}</span>
              </div>
            </div>

            {/* Budget */}
            <div className="mb-4 sm:mb-6">
              <div className="flex items-center gap-2 mb-3">
                <DollarSign size={18} className="text-[#4BF29C]" />
                <span className="text-sm sm:text-base font-medium text-white">Daily Budget</span>
              </div>
              <div className="bg-[#1A1D29] px-3 py-2 rounded-lg border border-[#2A2E3A]">
                <span className="text-sm sm:text-base text-white">${budget} per day</span>
              </div>
            </div>

            {/* AI Optimization Notice */}
            <div className="mb-6 p-3 sm:p-4 bg-[#1A1D29] rounded-lg border border-[#4BF29C]/30">
              <div className="flex items-start gap-3">
                <Settings size={18} className="text-[#4BF29C] mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm sm:text-base font-medium text-white mb-1">AI-Powered Optimization</p>
                  <p className="text-xs sm:text-sm text-gray-400">
                    I&apos;ll automatically handle targeting, audience selection, ad copy creation, and campaign optimization to maximize your results.
                  </p>
                </div>
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
                onClick={handleLaunchCampaign}
                className="flex items-center justify-center px-6 py-3 bg-[#4BF29C] text-black rounded-lg font-medium hover:bg-[#4BF29C]/90 transform hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 text-base"
              >
                <Rocket size={18} className="mr-2" />
                Launch Campaign
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  )
} 