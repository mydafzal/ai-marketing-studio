"use client"

import React, { useState, useEffect, useRef, useCallback } from "react"
import NextImage from "next/image"
import { AlertCircle, Download, ImagePlus, Save, Upload, Info, CheckCircle2, Video, Brain, Sparkles } from "lucide-react"
import { useTheme } from "next-themes"
import confetti from "canvas-confetti"
import { startVideoGeneration, checkVideoStatus } from "@/app/actions/generateVideo"
import { useUsageStore } from "@/app/store/useUsageStore"
import { UpgradeModal } from "@/components/upgrade-modal"
import { useT } from "@/lib/i18n/context"

// Helper functions
const fileToDataURL = async (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      if (e.target?.result) {
        resolve(e.target.result as string)
      } else {
        reject(new Error("Failed to convert file to data URL"))
      }
    }
    reader.onerror = (err) => reject(err)
    reader.readAsDataURL(file)
  })
}

async function urlToFile(url: string, fileName: string): Promise<File> {
  const response = await fetch(url)
  if (!response.ok) {
    throw new Error(`Failed to fetch video from ${url}`)
  }
  const blob = await response.blob()
  const type = blob.type || "video/mp4"
  return new File([blob], fileName, { type })
}

interface AiVideoTabProps {
  improvePrompt: (prompt: string) => Promise<string>
}

export default function AiVideoTab({ improvePrompt }: AiVideoTabProps) {
  const t = useT()
  const { theme } = useTheme()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const isDarkMode = theme === "dark"

  // Usage tracking
  const { 
    fetchUsageData, 
    incrementVideoCount, 
    isVideoLimitReached,
    videoCount
  } = useUsageStore()
  
  // Modal for upgrade prompt
  const [showUpgradeModal, setShowUpgradeModal] = useState(false)
  
  // Fetch usage data on component mount
  useEffect(() => {
    fetchUsageData()
  }, [fetchUsageData])

  // State management
  const [videoPrompt, setVideoPrompt] = useState("")
  const [isGeneratingVideo, setIsGeneratingVideo] = useState(false)
  const [videoGenerated, setVideoGenerated] = useState(false)
  const [videoUrl, setVideoUrl] = useState("")
  const [videoImageFile, setVideoImageFile] = useState<File | null>(null)
  const [videoDuration, setVideoDuration] = useState<number>(5)
  const [aspectRatio, setAspectRatio] = useState<"16:9" | "9:16">("16:9")
  const [isImprovingVideoPrompt, setIsImprovingVideoPrompt] = useState(false)
  const [promptHistory, setPromptHistory] = useState<string[]>([])
  const [toastMessage, setToastMessage] = useState<{title: string, description: string, type: 'success' | 'error'} | null>(null)
  const [generatedVideos, setGeneratedVideos] = useState<string[]>([])
  const [selectedVideos, setSelectedVideos] = useState<number[]>([])
  const [isSaving, setIsSaving] = useState(false)
  const [predictionId, setPredictionId] = useState<string | null>(null)
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const [pollCount, setPollCount] = useState(0)

  // Video generation steps
  const videoGenerationSteps = [
    t('aiVideoGenerator.steps.understanding'),
    t('aiVideoGenerator.steps.analyzing'),
    t('aiVideoGenerator.steps.synthesizing'),
    t('aiVideoGenerator.steps.finalizing'),
  ]
  const [currentVideoStep, setCurrentVideoStep] = useState(0)

  // Clear polling interval on unmount
  useEffect(() => {
    return () => {
      if (pollingIntervalRef.current) {
        console.log("[CLIENT_CLEANUP] Clearing polling interval on unmount")
        clearInterval(pollingIntervalRef.current)
      }
    }
  }, [])

  // Show toast notification
  const showToast = (title: string, description: string, type: 'success' | 'error') => {
    setToastMessage({ title, description, type })
    setTimeout(() => setToastMessage(null), 3000)
  }

  // Save prompt to history
  function savePromptToHistory(prompt: string) {
    const trimmedPrompt = prompt.trim()
    if (trimmedPrompt && !promptHistory.includes(trimmedPrompt)) {
      setPromptHistory(prev => [trimmedPrompt, ...prev.slice(0, 4)])
    }
  }

  // Handle video image upload
  function handleVideoImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0]
      
      // Validate file size (5MB max)
      if (file.size > 5 * 1024 * 1024) {
        showToast(t('aiVideoGenerator.toast.fileTooLarge'), t('aiVideoGenerator.toast.imageTooLarge'), "error")
        return
      }
      
      setVideoImageFile(e.target.files[0])
      showToast(t('aiVideoGenerator.toast.imageUploaded'), t('aiVideoGenerator.toast.startingImageUploaded'), "success")
    }
  }

  // Trigger file input click
  function handleImageButtonClick() {
    if (fileInputRef.current) {
      fileInputRef.current.click()
    }
  }

  // Improve prompt with AI
  async function handleImproveVideoPrompt() {
    if (!videoPrompt.trim()) {
      showToast(t('aiVideoGenerator.toast.noPromptToImprove'), t('aiVideoGenerator.toast.enterVideoDescriptionFirst'), "error")
      return
    }
    
    setIsImprovingVideoPrompt(true)
    
    try {
      const improved = await improvePrompt(videoPrompt)
      setVideoPrompt(improved)
      showToast(
        t('aiVideoGenerator.toast.promptEnhanced'), 
        t('aiVideoGenerator.toast.promptImprovedDescription'), 
        "success"
      )
    } catch (err) {
      console.error("Error improving video prompt:", err)
      showToast(
        t('aiVideoGenerator.toast.enhancementFailed'), 
        t('aiVideoGenerator.toast.unableToImprovePrompt'), 
        "error"
      )
    } finally {
      setIsImprovingVideoPrompt(false)
    }
  }

  // Generate video
  async function handleGenerateVideo() {
    if (!videoPrompt.trim()) {
      showToast(t('aiVideoGenerator.toast.missingPrompt'), t('aiVideoGenerator.toast.enterVideoDescriptionFirst'), "error")
      return
    }
    
    if (!videoImageFile) {
      showToast(t('aiVideoGenerator.toast.missingImage'), t('aiVideoGenerator.toast.uploadStartingImageFirst'), "error")
      return
    }
    
    // Check if video limit reached
    if (isVideoLimitReached) {
      setShowUpgradeModal(true)
      return
    }
    
    setIsGeneratingVideo(true)
    setVideoGenerated(false)
    setVideoUrl("")
    setCurrentVideoStep(0)
    setPollCount(0)
    
    try {
      savePromptToHistory(videoPrompt)
      
      // Step time simulation for UI feedback
      const STEP_DURATION = 20000 // 20 seconds per step instead of 45
      let step = 0
      const intervalId = setInterval(() => {
        if (step < videoGenerationSteps.length) {
          setCurrentVideoStep(step + 1)
          step++
        }
      }, STEP_DURATION)

      // Convert file to data URL
      const dataUrl = await fileToDataURL(videoImageFile)
      
      // Start the video generation
      console.log(`[CLIENT_GEN] Starting video generation with prompt: "${videoPrompt.substring(0, 30)}..." and duration: ${videoDuration}s`)
      console.log(`[CLIENT_GEN] Using image file: ${videoImageFile?.name}, aspect ratio: ${aspectRatio}`)
      
      const startResult = await startVideoGeneration({
        prompt: videoPrompt,
        duration: videoDuration,
        startImageDataUrl: dataUrl,
        aspectRatio,
      })
      
      console.log(`[CLIENT_GEN] Video generation started:`, JSON.stringify(startResult))

      if (!startResult.success) {
        console.error(`[CLIENT_GEN] Failed to start video generation: ${JSON.stringify(startResult)}`)
        throw new Error("Failed to start video generation")
      }

      // Save prediction ID for polling - store in a local const to capture it
      const predId = startResult.predictionId
      console.log(`[CLIENT_GEN] Setting prediction ID for polling: ${predId}`)
      setPredictionId(predId || null)
      
      // Show initial toast
      showToast(t('aiVideoGenerator.toast.processing'), t('aiVideoGenerator.toast.videoBeingGenerated'), "success")
      
      // Start polling for status
      if (pollingIntervalRef.current) {
        console.log(`[CLIENT_GEN] Clearing existing polling interval`)
        clearInterval(pollingIntervalRef.current)
      }
      
      console.log(`[CLIENT_GEN] Setting up polling interval (every 5s)`)
      
      // Define a polling function that uses the captured ID
      const pollWithCapturedId = async () => {
        try {
          console.log(`[CLIENT_POLL] Polling for prediction: ${predId}`)
          setPollCount(count => count + 1)
          
          const result = await checkVideoStatus(predId!)
          console.log(`[CLIENT_POLL] Status for ${predId}: ${result.status}`)
          
          // Handle error case
          if (!result.success) {
            console.error(`[CLIENT_POLL] Generation failed:`, result.error)
            showToast(t('aiVideoGenerator.toast.generationFailed'), result.error || t('aiVideoGenerator.toast.unableToCreateVideo'), "error")
            setIsGeneratingVideo(false)
            setPredictionId(null)
            setPollCount(0)
            
            if (pollingIntervalRef.current) {
              clearInterval(pollingIntervalRef.current)
              pollingIntervalRef.current = null
            }
            return
          }
          
          // Handle success case
          if (result.status === "succeeded" && result.videoUrl) {
            console.log(`[CLIENT_POLL] Video generated successfully! URL: ${result.videoUrl}`)
            setVideoUrl(result.videoUrl)
            setVideoGenerated(true)
            setGeneratedVideos(prev => [...prev, result.videoUrl] as string[])
            
            // Increment video usage count
            await incrementVideoCount()
            
            showToast(t('aiVideoGenerator.toast.success'), t('aiVideoGenerator.toast.videoGenerated'), "success")
            setIsGeneratingVideo(false)
            setPredictionId(null)
            setPollCount(0)
            
            confetti({
              particleCount: 100,
              spread: 70,
              origin: { y: 0.6 },
            })
            
            if (pollingIntervalRef.current) {
              clearInterval(pollingIntervalRef.current)
              pollingIntervalRef.current = null
            }
          } 
          // Still processing - update UI as needed
          else if (result.status === "processing") {
            if (currentVideoStep >= videoGenerationSteps.length) {
              // Keep showing "Almost ready!" state
              setCurrentVideoStep(videoGenerationSteps.length)
            }
          }
        } catch (err) {
          console.error(`[CLIENT_POLL] Error polling status:`, err)
          // Don't break polling loop on error
        }
      }
      
      // Start polling using captured ID
      pollingIntervalRef.current = setInterval(pollWithCapturedId, 5000)
      
      // Clean up the UI step interval after all steps are done
      setTimeout(() => {
        console.log(`[CLIENT_GEN] Clearing UI step interval`)
        clearInterval(intervalId)
      }, STEP_DURATION * (videoGenerationSteps.length + 1))
      
    } catch (err: any) {
      console.error("[CLIENT_GEN] Error generating video:", err)
      showToast(
        t('aiVideoGenerator.toast.generationFailed'), 
        err.message || t('aiVideoGenerator.toast.unableToCreateVideo'), 
        "error"
      )
      setIsGeneratingVideo(false)
      
      // Clean up polling if it was started
      if (pollingIntervalRef.current) {
        console.log(`[CLIENT_GEN] Clearing polling interval due to error`)
        clearInterval(pollingIntervalRef.current)
        pollingIntervalRef.current = null
      }
    }
  }

  // Toggle selection for a given video index
  function toggleVideoSelected(index: number) {
    setSelectedVideos((prev) =>
      prev.includes(index) ? prev.filter((i) => i !== index) : [...prev, index]
    )
  }

  // Handle clear selections
  function clearSelections() {
    setSelectedVideos([])
  }

  // Handle select all
  function selectAll() {
    const allIndices = Array.from({ length: generatedVideos.length }, (_, i) => i)
    setSelectedVideos(allIndices)
  }

  // Download video
  async function handleDownload(videoUrl: string, index: number) {
    try {
      const response = await fetch(videoUrl)
      if (!response.ok) throw new Error("Failed to fetch video for download")

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.href = url
      link.download = `generated-video-${index + 1}.mp4`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)

      showToast(t('aiVideoGenerator.toast.downloadComplete'), t('aiVideoGenerator.toast.videoSavedSuccessfully'), "success")
    } catch (error) {
      console.error("Error downloading video:", error)
      showToast(t('aiVideoGenerator.toast.downloadFailed'), t('aiVideoGenerator.toast.unableToDownloadVideo'), "error")
    }
  }

  // Save to library
  async function handleSaveSelectedVideosToLibrary() {
    if (selectedVideos.length === 0) {
      showToast(t('aiVideoGenerator.toast.noVideosSelected'), t('aiVideoGenerator.toast.selectAtLeastOneVideo'), "error")
      return
    }

    setIsSaving(true)

    try {
      const formData = new FormData()
      formData.append("userId", "user123")
      formData.append("type", "video")

      for (let i = 0; i < selectedVideos.length; i++) {
        const index = selectedVideos[i]
        const videoSrc = generatedVideos[index]

        if (videoSrc) {
          const file = await urlToFile(videoSrc, `selected_${Date.now()}_${index}.mp4`)
          formData.append("files", file)
        }
      }

      const res = await fetch("/api/content-library-upload", {
        method: "POST",
        body: formData,
      })

      if (!res.ok) {
        throw new Error(`Upload failed: ${res.statusText}`)
      }

      await res.json()
      
      showToast(
        t('aiVideoGenerator.toast.savedToLibrary'), 
        `${selectedVideos.length} ${t('aiVideoGenerator.toast.videosSavedToLibrary')}`, 
        "success"
      )

      clearSelections()
    } catch (err) {
      console.error("Error saving videos:", err)
      showToast(t('aiVideoGenerator.toast.saveFailed'), t('aiVideoGenerator.toast.unableToSaveVideos'), "error")
    } finally {
      setIsSaving(false)
    }
  }

  // Render video generation steps
  function renderVideoSteps() {
    return (
      <div className="flex flex-col space-y-3 mt-4 text-gray-400">
        {videoGenerationSteps.map((step, index) => {
          const isCompleted = index < currentVideoStep - 1
          const isActive = index === currentVideoStep - 1
          const isUpcoming = index > currentVideoStep - 1

          return (
            <div key={index} className="flex items-center space-x-2">
              {isCompleted && <CheckCircle2 className="size-4 text-green-500" />}
              {isActive && (
                <div className="size-2 rounded-full bg-green-400 animate-pulse" />
              )}
              {isUpcoming && !isActive && (
                <div className="size-2 rounded-full bg-gray-600" />
              )}
              <span
                className={
                  isActive
                    ? "text-sm text-green-400"
                    : isCompleted
                    ? "text-sm text-gray-500 line-through"
                    : "text-sm text-gray-600"
                }
              >
                {step}
              </span>
            </div>
          )
        })}
      </div>
    )
  }

  // Render video loading state
  function renderVideoGenerating() {
    return (
      <div className="text-center space-y-4">
        <div className="relative">
          <Brain className="size-12 mx-auto text-[#4BF29C] animate-pulse" />
          <Sparkles className="size-6 text-yellow-500 absolute -top-2 -right-2 animate-bounce" />
          <Sparkles className="size-6 text-blue-500 absolute -bottom-2 -left-2 animate-bounce delay-150" />
        </div>
        <div className="space-y-2">
          <p className="text-lg font-semibold text-[#4BF29C]">{t('aiVideoGenerator.aiProcessing')}</p>
          <p className="text-sm text-gray-400">{t('aiVideoGenerator.creatingCustomVideo')}</p>
        </div>
        <div className="flex justify-center space-x-2">
          <div className="size-2 bg-[#4BF29C] rounded-full animate-bounce" />
          <div className="size-2 bg-[#4BF29C] rounded-full animate-bounce delay-100" />
          <div className="size-2 bg-[#4BF29C] rounded-full animate-bounce delay-200" />
        </div>
        {renderVideoSteps()}
        
        {pollCount > 0 && (
          <div className="text-xs text-gray-500 mt-3">
            {t('aiVideoGenerator.checkingStatus')} ({pollCount})
          </div>
        )}
      </div>
    )
  }

  // Render video result
  function renderVideoResult() {
    if (videoGenerated && videoUrl) {
      const ratioClass = aspectRatio === "9:16" ? "aspect-[9/16]" : "aspect-[16/9]"
      return (
        <div className={`relative w-full ${ratioClass}`}>
          <video
            className="absolute inset-0 size-full rounded-lg object-contain"
            controls
            autoPlay
            playsInline
            loop
            src={videoUrl}
          >
            {t('aiVideoGenerator.browserNotSupported')}
          </video>
        </div>
      )
    }
    return (
      <div className="text-center space-y-2">
        <Video className="size-8 mx-auto text-gray-500 mb-2" />
        <span className="text-sm text-gray-400">
          {t('aiVideoGenerator.enterPromptPlaceholder')}
        </span>
      </div>
    )
  }

  return (
    <div className="w-full shadow-sm rounded-lg border border-[#2A2E3A] bg-[#151925]">
      {/* Upgrade Modal */}
      <UpgradeModal 
        isOpen={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
        usageType="videos"
        currentCount={videoCount}
      />
      
      {/* Toast notification */}
      {toastMessage && (
        <div className={`fixed top-4 right-4 z-50 p-4 rounded-md shadow-md transition-all ${
          toastMessage.type === 'success' 
            ? 'bg-[#1A3029] border border-[#2A5F46]' 
            : 'bg-[#3D1A1A] border border-[#5F2A2A]'
        }`}>
          <div className="flex items-start gap-2">
            <div className={toastMessage.type === 'success' 
              ? 'text-[#4BF29C]' 
              : 'text-[#FF7D5A]'}>
              {toastMessage.type === 'success' ? <CheckCircle2 className="size-5" /> : <AlertCircle className="size-5" />}
            </div>
            <div>
              <h3 className={`font-medium text-sm ${toastMessage.type === 'success' 
                ? 'text-[#4BF29C]' 
                : 'text-[#FF7D5A]'}`}>
                {toastMessage.title}
              </h3>
              <p className={`text-sm ${toastMessage.type === 'success' 
                ? 'text-[#ADB0B8]' 
                : 'text-[#ADB0B8]'}`}>
                {toastMessage.description}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b border-[#2A2E3A]">
        <div>
          <h2 className="flex items-center gap-2 text-xl font-bold">
            <Video className="size-5 text-[#4BF29C]" />
            <span className="text-white">{t('aiVideoGenerator.title')}</span>
          </h2>
          <p className="text-sm mt-1.5 text-[#8A8F99]">
            {t('aiVideoGenerator.description')}
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          {generatedVideos.length > 0 && (
            <span className="inline-flex text-xs font-medium px-2.5 py-0.5 rounded-full bg-[#1A3029] text-[#4BF29C]">
              {generatedVideos.length} {generatedVideos.length !== 1 ? t('aiVideoGenerator.videosGenerated') : t('aiVideoGenerator.videoGenerated')}
            </span>
          )}
        </div>
      </div>
      
      <hr className="border-[#2A2E3A]" />
      
      {/* Main content */}
      <div className="p-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left panel: Prompt input and controls */}
          <div className="lg:col-span-1 space-y-5">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label htmlFor="videoPrompt" className="text-sm font-medium text-white">
                  {t('aiVideoGenerator.describeVideo')}
                </label>
                
                <button 
                  type="button" 
                  className="text-[#8A8F99] hover:text-white"
                  title="Tips for better prompts"
                >
                  <Info className="size-4" />
                </button>
              </div>

              <textarea
                id="videoPrompt"
                value={videoPrompt}
                onChange={(e) => setVideoPrompt(e.target.value)}
                placeholder={t('aiVideoGenerator.placeholderPrompt')}
                className="w-full min-h-[120px] resize-none p-3 rounded-md focus:ring-2 focus:ring-[#4BF29C] focus:border-[#4BF29C] outline-none
                  bg-[#1A1D29] border-[#2A2E3A] border text-white placeholder-[#8A8F99]"
              />
              
              {promptHistory.length > 0 && (
                <div className="pt-1">
                  <div className="text-xs flex items-center gap-1 mb-1.5 text-[#8A8F99]">
                    <Sparkles className="size-3" /> {t('aiVideoGenerator.recentPrompts')}
                  </div>
                  <div className="h-20 w-full overflow-y-auto rounded-md p-2 border-[#2A2E3A] border bg-[#1A1D29]">
                    {promptHistory.map((prompt, idx) => (
                      <button 
                        key={idx} 
                        type="button"
                        className="w-full text-left text-xs py-1 px-2 mb-1 rounded hover:bg-[#1A1D29] text-[#ADB0B8]"
                        onClick={() => setVideoPrompt(prompt)}
                      >
                        {prompt.length > 50 ? `${prompt.substring(0, 50)}...` : prompt}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
            
            <div className="flex flex-col gap-3">
              <button
                type="button"
                onClick={handleImproveVideoPrompt}
                disabled={!videoPrompt.trim() || isImprovingVideoPrompt}
                className={`flex justify-center items-center w-full py-2 px-4 border rounded-md text-sm font-medium 
                  ${!videoPrompt.trim() || isImprovingVideoPrompt 
                    ? 'bg-[#1A1D29] text-[#8A8F99] cursor-not-allowed border-[#2A2E3A]' 
                    : 'bg-[#1A1D29] text-white hover:bg-[#252836] border-[#2A2E3A]'
                  }`}
              >
                <Sparkles className="mr-2 size-4" />
                {isImprovingVideoPrompt ? t('aiVideoGenerator.enhancing') : t('aiVideoGenerator.enhancePrompt')}
              </button>
            </div>
            
            <hr className="border-[#2A2E3A]" />
            
            {/* Video Settings */}
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-white">{t('aiVideoGenerator.videoSettings')}</h3>
              
              {/* Video Duration */}
              <div>
                <label className="text-xs block mb-1.5 text-[#ADB0B8]">{t('aiVideoGenerator.duration')}</label>
                <div className="flex space-x-2">
                  <button
                    type="button"
                    onClick={() => setVideoDuration(5)}
                    className={`flex-1 py-1.5 px-3 text-sm font-medium rounded-md ${
                      videoDuration === 5
                        ? 'bg-[#4BF29C] text-[#0A0C14]'
                        : 'bg-[#1A1D29] text-white border border-[#2A2E3A] hover:bg-[#252836]'
                    }`}
                  >
                    {t('aiVideoGenerator.duration5')}
                  </button>
                  <button
                    type="button"
                    onClick={() => setVideoDuration(10)}
                    className={`flex-1 py-1.5 px-3 text-sm font-medium rounded-md ${
                      videoDuration === 10
                        ? 'bg-[#4BF29C] text-[#0A0C14]'
                        : 'bg-[#1A1D29] text-white border border-[#2A2E3A] hover:bg-[#252836]'
                    }`}
                  >
                    {t('aiVideoGenerator.duration10')}
                  </button>
                </div>
              </div>
              
              {/* Aspect Ratio */}
              <div>
                <label className="text-xs block mb-1.5 text-[#ADB0B8]">{t('aiVideoGenerator.aspectRatio')}</label>
                <div className="flex space-x-2">
                  <button
                    type="button"
                    onClick={() => setAspectRatio("16:9")}
                    className={`flex-1 py-1.5 px-3 text-sm font-medium rounded-md ${
                      aspectRatio === "16:9"
                        ? 'bg-[#4BF29C] text-[#0A0C14]'
                        : 'bg-[#1A1D29] text-white border border-[#2A2E3A] hover:bg-[#252836]'
                    }`}
                  >
                    {t('aiVideoGenerator.landscape')}
                  </button>
                  <button
                    type="button"
                    onClick={() => setAspectRatio("9:16")}
                    className={`flex-1 py-1.5 px-3 text-sm font-medium rounded-md ${
                      aspectRatio === "9:16"
                        ? 'bg-[#4BF29C] text-[#0A0C14]'
                        : 'bg-[#1A1D29] text-white border border-[#2A2E3A] hover:bg-[#252836]'
                    }`}
                  >
                    {t('aiVideoGenerator.portrait')}
                  </button>
                </div>
              </div>
              
              {/* Image Upload */}
              <div>
                <label className="text-xs block mb-1.5 text-[#ADB0B8]">
                  {t('aiVideoGenerator.startingImage')}
                </label>
                <div className="flex items-center gap-2">
                  <button 
                    type="button"
                    onClick={handleImageButtonClick}
                    className={`flex items-center justify-center py-1.5 px-3 text-sm font-medium rounded-md flex-1 ${
                      videoImageFile 
                        ? 'bg-[#1A1D29] text-white border border-[#2A2E3A] hover:bg-[#252836]'
                        : 'bg-[#4BF29C] hover:bg-[#3AD98C] text-[#0A0C14]'
                    }`}
                  >
                    <Upload className="mr-2 size-4" />
                    {videoImageFile ? t('aiVideoGenerator.changeImage') : t('aiVideoGenerator.uploadImage')}
                  </button>
                  
                  <input 
                    type="file" 
                    accept="image/*" 
                    ref={fileInputRef}
                    onChange={handleVideoImageUpload} 
                    className="hidden" 
                  />
                  
                  {videoImageFile && (
                    <div className="size-12 relative rounded-md overflow-hidden border border-[#2A2E3A]">
                      <NextImage
                        src={URL.createObjectURL(videoImageFile)}
                        alt="Starting image"
                        fill
                        sizes="48px"
                        className="object-cover"
                      />
                    </div>
                  )}
                </div>
                
                {videoImageFile && (
                  <p className="mt-1 text-xs text-[#8A8F99]">
                    {videoImageFile.name.length > 25 
                      ? `${videoImageFile.name.substring(0, 25)}...${videoImageFile.name.split('.').pop()}`
                      : videoImageFile.name
                    }
                  </p>
                )}
              </div>
              
              {/* Generate Button */}
              <button
                type="button"
                onClick={handleGenerateVideo}
                disabled={!videoPrompt.trim() || !videoImageFile || isGeneratingVideo}
                className={`flex justify-center items-center w-full py-2 px-4 rounded-md text-sm font-medium mt-2
                  ${!videoPrompt.trim() || !videoImageFile || isGeneratingVideo
                    ? 'bg-[#1A3029] cursor-not-allowed text-[#4BF29C]/50'
                    : 'bg-[#4BF29C] hover:bg-[#3AD98C] text-[#0A0C14]'
                  }`}
              >
                <Video className="mr-2 size-4" />
                {isGeneratingVideo ? t('aiVideoGenerator.generating') : t('aiVideoGenerator.createVideo')}
              </button>
            </div>
          </div>
          
          {/* Right panel: Generated video display */}
          <div className="lg:col-span-2">
            {generatedVideos.length === 0 ? (
              <div className="border border-dashed border-[#2A2E3A] rounded-lg p-8 flex flex-col items-center justify-center h-full min-h-[400px] text-center">
                <div className="p-3 rounded-full mb-3 bg-[#1A3029]">
                  <Video className="size-6 text-[#4BF29C]" />
                </div>
                <h3 className="text-lg font-medium mb-1 text-white">{t('aiVideoGenerator.noVideosGenerated')}</h3>
                <p className="text-sm max-w-md mb-4 text-[#8A8F99]">
                  {t('aiVideoGenerator.noVideosDescription')}
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex flex-col w-full">
                    <div className="border-b border-[#2A2E3A]">
                      <div className="flex items-center justify-between">
                        <div className="flex">
                          <button
                            type="button"
                            className="py-2 px-4 text-sm font-medium border-b-2 border-[#4BF29C] text-[#4BF29C]"
                          >
                            {t('aiVideoGenerator.generatedVideos')}
                          </button>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <div className="text-xs text-[#8A8F99]">
                            {selectedVideos.length} {t('aiVideoGenerator.selected')}
                          </div>
                          <button 
                            type="button"
                            onClick={selectAll}
                            disabled={generatedVideos.length === 0}
                            className={`py-1 px-2 text-xs font-medium rounded border 
                              ${generatedVideos.length === 0 
                                ? 'bg-[#1A1D29] text-[#8A8F99] cursor-not-allowed border-[#2A2E3A]'
                                : 'bg-[#1A1D29] text-white hover:bg-[#252836] border-[#2A2E3A]'
                              }`}
                          >
                            {t('aiVideoGenerator.selectAll')}
                          </button>
                          {selectedVideos.length > 0 && (
                            <button 
                              type="button"
                              onClick={clearSelections}
                              className="py-1 px-2 text-xs font-medium rounded bg-[#1A1D29] text-white hover:bg-[#252836] border border-[#2A2E3A]"
                            >
                              {t('aiVideoGenerator.clear')}
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                      
                    <div className="mt-3">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {generatedVideos.map((videoUrl, i) => {
                          const isSelected = selectedVideos.includes(i)
                          const ratioClass = aspectRatio === "9:16" ? "aspect-[9/16]" : "aspect-[16/9]"
                          
                          return (
                            <div
                              key={i}
                              className={`relative ${ratioClass} rounded-md overflow-hidden group cursor-pointer ${
                                isSelected 
                                  ? "ring-2 ring-[#4BF29C] ring-offset-2 ring-offset-[#151925]" 
                                  : "border-[#2A2E3A] border"
                              }`}
                              onClick={() => toggleVideoSelected(i)}
                            >
                              <video
                                className="absolute inset-0 size-full object-cover"
                                controls
                                muted
                                autoPlay
                                playsInline
                                loop
                                src={videoUrl}
                              >
                                Your browser does not support the video tag.
                              </video>
                              
                              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100">
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDownload(videoUrl, i);
                                  }}
                                  className="absolute bottom-2 right-2 py-1 px-3 text-xs font-medium bg-[#1A1D29] text-white rounded-md shadow hover:bg-[#252836] border border-[#2A2E3A] flex items-center"
                                >
                                  <Download className="mr-1 size-4" />
                                  {t('aiVideoGenerator.download')}
                                </button>
                              </div>
                              
                              {isSelected && (
                                <div className="absolute top-2 left-2 bg-[#4BF29C] text-[#0A0C14] rounded-full p-1">
                                  <CheckCircle2 className="size-4" />
                                </div>
                              )}
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  </div>
                </div>
                
                {generatedVideos.length > 0 && (
                  <div className="flex p-4 rounded-lg bg-[#1A1D29] border-[#FF7D5A] border">
                    <div className="flex-shrink-0 mr-3 text-[#FF7D5A]">
                      <AlertCircle className="size-5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-white">
                        {t('aiVideoGenerator.copyrightWarning')}
                      </h3>
                      <div className="mt-1 text-sm text-[#ADB0B8]">
                        {t('aiVideoGenerator.copyrightDescription')}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Footer with save to library button */}
      {generatedVideos.length > 0 && (
        <div className="flex justify-between items-center border-t border-[#2A2E3A] p-4 bg-[#1A1D29]">
          <div className="flex items-center text-xs text-[#8A8F99]">
            <span className="mr-1">
              {t('aiVideoGenerator.poweredBy')}
            </span>
          </div>
          
          <button 
            type="button"
            onClick={handleSaveSelectedVideosToLibrary}
            disabled={selectedVideos.length === 0 || isSaving}
            className={`flex items-center gap-2 py-2 px-4 rounded-md text-sm font-medium 
              ${selectedVideos.length === 0 || isSaving
                ? 'bg-[#1A3029] cursor-not-allowed text-[#4BF29C]/50'
                : 'bg-[#4BF29C] hover:bg-[#3AD98C] text-[#0A0C14]'}`}
          >
            <Save className="size-4" />
            {isSaving ? t('aiVideoGenerator.saving') : `${t('aiVideoGenerator.saveToLibrary')}${selectedVideos.length > 0 ? ` ${selectedVideos.length}` : ''}`}
          </button>
        </div>
      )}
      
      {/* Video being generated overlay */}
      {isGeneratingVideo && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center">
          <div className="mx-auto max-w-md w-full p-6 rounded-lg shadow-xl bg-[#151925] border border-[#2A2E3A]">
            {renderVideoGenerating()}
          </div>
        </div>
      )}
    </div>
  )
}