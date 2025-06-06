'use client'

import React, { useEffect } from 'react'
import { Upload, Plus, XCircle, Loader2, Clock } from 'lucide-react'
import { StepByStepMediaItem } from '../types'

interface MediaUploadStepProps {
  mediaItems: StepByStepMediaItem[]
  setMediaItems: React.Dispatch<React.SetStateAction<StepByStepMediaItem[]>>
  fileInputRef: React.RefObject<HTMLInputElement>
  handleFileUpload: (e: React.ChangeEvent<HTMLInputElement>) => void
  removeMediaItem: (id: string) => void
  isUploading: boolean
  cooldownActive: boolean
  cooldownTimeRemaining: number
  onNext: () => void
  canProceed: boolean
}

export function MediaUploadStep({
  mediaItems,
  setMediaItems,
  fileInputRef,
  handleFileUpload,
  removeMediaItem,
  isUploading,
  cooldownActive,
  cooldownTimeRemaining,
  onNext,
  canProceed
}: MediaUploadStepProps) {

  // Add event listener to file input ref to handle file uploads
  useEffect(() => {
    const currentFileInput = fileInputRef.current;
    if (currentFileInput) {
      const fileChangeHandler = (e: Event) => {
        handleFileUpload(e as unknown as React.ChangeEvent<HTMLInputElement>);
      };
      
      currentFileInput.addEventListener('change', fileChangeHandler);
      
      return () => {
        currentFileInput.removeEventListener('change', fileChangeHandler);
      };
    }
  }, [fileInputRef, handleFileUpload]);

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
                Let&apos;s start by uploading your creative content! Upload images or videos that will be used in your campaign. High-quality visuals work best for engagement.
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Form Section - Better Centered */}
      <div className="w-full flex justify-center px-2 sm:px-0">
        <div className="w-full max-w-xl">
          <div className="bg-[#151925] rounded-lg p-4 sm:p-6 shadow-lg border border-[#1A1D29]/50">
            
            {/* Upload area */}
            <div className="mb-6">
              <div
                className={`relative flex flex-wrap items-center gap-3 p-4 w-full border-2 border-dashed ${
                  isUploading || cooldownActive ? 'border-amber-500' : 'border-[#2A2E3A] hover:border-[#4BF29C]'
                } rounded-lg transition-all duration-200 ${
                  isUploading || cooldownActive ? 'cursor-not-allowed' : 'cursor-pointer'
                } min-h-24`}
                onClick={() => {
                  if (!isUploading && !cooldownActive) {
                    fileInputRef.current?.click();
                  }
                }}
              >
                {/* Status bar for cooldown */}
                {cooldownActive && (
                  <div className="absolute inset-0 bg-[#151925]/90 rounded-lg flex items-center justify-center z-10">
                    <div className="flex flex-col items-center text-amber-500">
                      <Clock className="mb-2" size={24} />
                      <span className="text-sm font-medium">Thank you! Let me take a moment to review this.</span>
                      <span className="text-xs mt-1 text-gray-400">
                        Please wait {cooldownTimeRemaining} seconds before uploading the next creative
                      </span>
                    </div>
                  </div>
                )}
                
                {/* Upload in progress banner */}
                {isUploading && !cooldownActive && (
                  <div className="absolute top-0 inset-x-0 bg-amber-500/20 border-b border-amber-500 p-2 rounded-t-lg text-center">
                    <div className="flex items-center justify-center text-amber-500 text-sm">
                      <Loader2 className="animate-spin mr-2" size={16} />
                      <span>Upload in progress - please wait</span>
                    </div>
                  </div>
                )}

                {mediaItems.length === 0 ? (
                  <div className="flex flex-col items-center text-gray-400 mx-auto">
                    <Upload className="mb-2" size={24} />
                    <span className="text-sm">Click here to upload media</span>
                    <span className="text-xs mt-1">Images or videos</span>
                  </div>
                ) : (
                  <>
                    {mediaItems.map(item => (
                      <div
                        key={item.id}
                        className="flex items-center space-x-3 bg-[#1A1D29] rounded-lg p-3 border border-[#2A2E3A]"
                      >
                        {item.progress !== undefined && item.progress < 100 && item.progress >= 0 ? (
                          <Loader2 className="animate-spin text-[#4BF29C]" size={18} />
                        ) : item.progress === -1 ? (
                          <div className="w-5 h-5 rounded-full bg-red-500 flex items-center justify-center">
                            <span className="text-xs text-white">✗</span>
                          </div>
                        ) : (
                          <div className="w-5 h-5 rounded-full bg-[#4BF29C] flex items-center justify-center">
                            <span className="text-xs text-black">✓</span>
                          </div>
                        )}
                        <span className="text-sm text-white">
                          {item.type.toUpperCase()} ({item.aspectRatio})
                        </span>
                        <span className="text-xs text-gray-400">
                          {item.progress === -1 ? 'Failed' : `${item.progress ?? 0}%`}
                        </span>
                        <button
                          onClick={e => {
                            e.stopPropagation();
                            removeMediaItem(item.id);
                          }}
                          disabled={isUploading}
                          className="ml-auto"
                        >
                          <XCircle 
                            size={18} 
                            className={`${isUploading ? 'text-gray-500' : 'text-gray-400 hover:text-red-400'} transition-colors`} 
                          />
                        </button>
                      </div>
                    ))}
                    {!isUploading && !cooldownActive && (
                      <div className="flex items-center space-x-3 bg-[#1A1D29] rounded-lg p-3 border border-[#2A2E3A] hover:border-[#4BF29C] transition-all duration-200 cursor-pointer">
                        <Plus size={18} className="text-gray-400" />
                        <span className="text-sm text-gray-400">Add more media</span>
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
              <div className="mt-3 text-xs text-gray-400">
                <p>• Images must be under 4MB. Videos: recommended under 80MB, max 300MB.</p>
                <p>• Supported formats: JPG, PNG, MP4, MOV</p>
              </div>
            </div>

            {/* Continue Button */}
            <div className="flex justify-end">
              <button
                onClick={onNext}
                disabled={!canProceed}
                className={`px-6 py-3 rounded-lg font-medium transition-all duration-200 ${
                  canProceed
                    ? 'bg-[#4BF29C] text-black hover:bg-[#4BF29C]/90 transform hover:scale-[1.02]'
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