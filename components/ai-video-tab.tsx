"use client"

import React, { useState, useEffect, useRef, useCallback } from "react"
import NextImage from "next/image"
import { AlertCircle, Download, ImagePlus, Save, Upload, Info, CheckCircle2, Video, Brain, Sparkles } from "lucide-react"
import { useTheme } from "next-themes"
import confetti from "canvas-confetti"

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
  const { theme } = useTheme()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const isDarkMode = theme === "dark"

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

  // Video generation steps
  const videoGenerationSteps = [
    "Understanding your video concept...",
    "Analyzing your uploaded image for style...",
    "Synthesizing transitions and animations...",
    "Almost ready!",
  ]
  const [currentVideoStep, setCurrentVideoStep] = useState(0)

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
        showToast("File too large", "Image file must be smaller than 5MB.", "error")
        return
      }
      
      setVideoImageFile(e.target.files[0])
      showToast("Image uploaded", "Your starting image has been uploaded successfully.", "success")
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
      showToast("No prompt to improve", "Please enter a video description first.", "error")
      return
    }
    
    setIsImprovingVideoPrompt(true)
    
    try {
      const improved = await improvePrompt(videoPrompt)
      setVideoPrompt(improved)
      showToast(
        "Prompt enhanced", 
        "Your description has been improved with AI assistance.", 
        "success"
      )
    } catch (err) {
      console.error("Error improving video prompt:", err)
      showToast(
        "Enhancement failed", 
        "Unable to improve your prompt. Please try again.", 
        "error"
      )
    } finally {
      setIsImprovingVideoPrompt(false)
    }
  }

  // Generate video
  async function handleGenerateVideo() {
    if (!videoPrompt.trim()) {
      showToast("Missing prompt", "Please enter a video description first.", "error")
      return
    }
    
    if (!videoImageFile) {
      showToast("Missing image", "Please upload a starting image first.", "error")
      return
    }
    
    setIsGeneratingVideo(true)
    setVideoGenerated(false)
    setVideoUrl("")
    setCurrentVideoStep(0)
    
    try {
      savePromptToHistory(videoPrompt)
      
      // Step time simulation (45s each step) for a 3-minute generation
      const STEP_DURATION = 45000
      let step = 0
      const intervalId = setInterval(() => {
        if (step < videoGenerationSteps.length) {
          setCurrentVideoStep(step + 1)
          step++
        } else {
          clearInterval(intervalId)
        }
      }, STEP_DURATION)

      const dataUrl = await fileToDataURL(videoImageFile)
      const res = await fetch("/api/generate-video", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: videoPrompt,
          duration: videoDuration,
          startImageDataUrl: dataUrl,
          aspectRatio,
        }),
      })

      if (!res.ok) {
        const errData = await res.json()
        throw new Error(errData.error || "Failed to generate video.")
      }

      const json = await res.json()
      if (!json.success) {
        throw new Error(json.error || "No success from video generation service.")
      }

      setVideoUrl(json.videoUrl)
      setVideoGenerated(true)
      
      // Add to generated videos array
      const newVideos = [...generatedVideos]
      newVideos.push(json.videoUrl)
      setGeneratedVideos(newVideos)
      
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
      })

      showToast("Success", "Your AI video has been generated!", "success")
    } catch (err: any) {
      console.error("Error generating video:", err)
      showToast(
        "Generation failed", 
        err.message || "Unable to create video. Please try again with a different prompt.", 
        "error"
      )
    } finally {
      setIsGeneratingVideo(false)
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

      showToast("Download complete", "Video saved successfully to your device.", "success")
    } catch (error) {
      console.error("Error downloading video:", error)
      showToast("Download failed", "Unable to download the video. Please try again.", "error")
    }
  }

  // Save to library
  async function handleSaveSelectedVideosToLibrary() {
    if (selectedVideos.length === 0) {
      showToast("No videos selected", "Please select at least one video to save to your library.", "error")
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
        "Saved to library", 
        `${selectedVideos.length} video${selectedVideos.length !== 1 ? 's' : ''} saved to your content library.`, 
        "success"
      )

      clearSelections()
    } catch (err) {
      console.error("Error saving videos:", err)
      showToast("Save failed", "Unable to save videos to your library. Please try again.", "error")
    } finally {
      setIsSaving(false)
    }
  }

  // Render video generation steps
  function renderVideoSteps() {
    return (
      <div className="flex flex-col space-y-3 mt-4 text-gray-600 dark:text-gray-400">
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
                <div className="size-2 rounded-full bg-gray-400 dark:bg-gray-500" />
              )}
              <span
                className={
                  isActive
                    ? "text-sm text-green-700 dark:text-green-200"
                    : isCompleted
                    ? "text-sm text-gray-400 line-through"
                    : "text-sm text-gray-500 dark:text-gray-500"
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
          <Brain className="size-12 mx-auto text-primary animate-pulse" />
          <Sparkles className="size-6 text-yellow-500 absolute -top-2 -right-2 animate-bounce" />
          <Sparkles className="size-6 text-blue-500 absolute -bottom-2 -left-2 animate-bounce delay-150" />
        </div>
        <div className="space-y-2">
          <p className={`text-lg font-semibold ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`}>AI Brain is Processing</p>
          <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Creating your custom video...</p>
        </div>
        <div className="flex justify-center space-x-2">
          <div className={`size-2 ${isDarkMode ? 'bg-blue-500' : 'bg-blue-600'} rounded-full animate-bounce`} />
          <div className={`size-2 ${isDarkMode ? 'bg-blue-500' : 'bg-blue-600'} rounded-full animate-bounce delay-100`} />
          <div className={`size-2 ${isDarkMode ? 'bg-blue-500' : 'bg-blue-600'} rounded-full animate-bounce delay-200`} />
        </div>
        {renderVideoSteps()}
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
            Your browser does not support the video tag.
          </video>
        </div>
      )
    }
    return (
      <div className="text-center space-y-2">
        <Video className={`size-8 mx-auto ${isDarkMode ? 'text-gray-400' : 'text-gray-500'} mb-2`} />
        <span className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
          Enter a prompt, pick settings, and upload an image to generate your AI video
        </span>
      </div>
    )
  }

  return (
    <div className={`w-full shadow-sm rounded-lg border ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
      {/* Toast notification */}
      {toastMessage && (
        <div className={`fixed top-4 right-4 z-50 p-4 rounded-md shadow-md transition-all ${
          toastMessage.type === 'success' 
            ? isDarkMode ? 'bg-green-900 border border-green-700' : 'bg-green-100 border border-green-300' 
            : isDarkMode ? 'bg-red-900 border border-red-700' : 'bg-red-100 border border-red-300'
        }`}>
          <div className="flex items-start gap-2">
            <div className={toastMessage.type === 'success' 
              ? isDarkMode ? 'text-green-400' : 'text-green-600' 
              : isDarkMode ? 'text-red-400' : 'text-red-600'}>
              {toastMessage.type === 'success' ? <CheckCircle2 className="size-5" /> : <AlertCircle className="size-5" />}
            </div>
            <div>
              <h3 className={`font-medium text-sm ${toastMessage.type === 'success' 
                ? isDarkMode ? 'text-green-200' : 'text-green-800' 
                : isDarkMode ? 'text-red-200' : 'text-red-800'}`}>
                {toastMessage.title}
              </h3>
              <p className={`text-sm ${toastMessage.type === 'success' 
                ? isDarkMode ? 'text-green-300' : 'text-green-700' 
                : isDarkMode ? 'text-red-300' : 'text-red-700'}`}>
                {toastMessage.description}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className={`flex items-center justify-between p-6 border-b ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
        <div>
          <h2 className="flex items-center gap-2 text-xl font-bold">
            <Video className={`size-5 ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`} />
            <span className={isDarkMode ? 'text-white' : 'text-gray-900'}>AI Video Generator</span>
          </h2>
          <p className={`text-sm mt-1.5 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
            Create engaging user-generated style videos using AI
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          {generatedVideos.length > 0 && (
            <span className={`inline-flex text-xs font-medium px-2.5 py-0.5 rounded-full ${
              isDarkMode ? 'bg-blue-900 text-blue-200' : 'bg-blue-100 text-blue-800'
            }`}>
              {generatedVideos.length} video{generatedVideos.length !== 1 ? 's' : ''} generated
            </span>
          )}
        </div>
      </div>
      
      <hr className={isDarkMode ? 'border-gray-700' : 'border-gray-200'} />
      
      {/* Main content */}
      <div className="p-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left panel: Prompt input and controls */}
          <div className="lg:col-span-1 space-y-5">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label htmlFor="videoPrompt" className={`text-sm font-medium ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}>
                  Describe the video you want
                </label>
                
                <button 
                  type="button" 
                  className={isDarkMode ? 'text-gray-400 hover:text-gray-300' : 'text-gray-500 hover:text-gray-700'}
                  title="Tips for better prompts"
                >
                  <Info className="size-4" />
                </button>
              </div>

              <textarea
                id="videoPrompt"
                value={videoPrompt}
                onChange={(e) => setVideoPrompt(e.target.value)}
                placeholder="A cinematic panning shot of a modern office space with natural lighting, showing professionals collaborating..."
                className={`w-full min-h-[120px] resize-none p-3 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none ${
                  isDarkMode 
                    ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                    : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'
                }`}
              />
              
              {promptHistory.length > 0 && (
                <div className="pt-1">
                  <div className={`text-xs flex items-center gap-1 mb-1.5 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                    <Sparkles className="size-3" /> Recent prompts
                  </div>
                  <div className={`h-20 w-full overflow-y-auto rounded-md p-2 ${
                    isDarkMode ? 'border-gray-700 border bg-gray-800' : 'border border-gray-200 bg-white'
                  }`}>
                    {promptHistory.map((prompt, idx) => (
                      <button 
                        key={idx} 
                        type="button"
                        className={`w-full text-left text-xs py-1 px-2 mb-1 rounded ${
                          isDarkMode 
                            ? 'hover:bg-gray-700 text-gray-300' 
                            : 'hover:bg-gray-100 text-gray-700'
                        }`}
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
                    ? isDarkMode 
                      ? 'bg-gray-700 text-gray-500 cursor-not-allowed border-gray-700' 
                      : 'bg-gray-100 text-gray-400 cursor-not-allowed border-gray-200'
                    : isDarkMode
                      ? 'bg-gray-700 text-gray-200 hover:bg-gray-600 border-gray-600' 
                      : 'bg-white text-gray-700 hover:bg-gray-50 border-gray-300'
                  }`}
              >
                <Sparkles className="mr-2 size-4" />
                {isImprovingVideoPrompt ? "Enhancing..." : "Enhance prompt with AI"}
              </button>
            </div>
            
            <hr className={isDarkMode ? 'border-gray-700' : 'border-gray-200'} />
            
            {/* Video Settings */}
            <div className="space-y-4">
              <h3 className={`text-sm font-medium ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}>Video Settings</h3>
              
              {/* Video Duration */}
              <div>
                <label className={`text-xs block mb-1.5 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>Duration</label>
                <div className="flex space-x-2">
                  <button
                    type="button"
                    onClick={() => setVideoDuration(5)}
                    className={`flex-1 py-1.5 px-3 text-sm font-medium rounded-md ${
                      videoDuration === 5
                        ? isDarkMode
                          ? 'bg-blue-600 text-white'
                          : 'bg-blue-600 text-white'
                        : isDarkMode
                          ? 'bg-gray-700 text-gray-200 border border-gray-600 hover:bg-gray-600'
                          : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    5 seconds
                  </button>
                  <button
                    type="button"
                    onClick={() => setVideoDuration(10)}
                    className={`flex-1 py-1.5 px-3 text-sm font-medium rounded-md ${
                      videoDuration === 10
                        ? isDarkMode
                          ? 'bg-blue-600 text-white'
                          : 'bg-blue-600 text-white'
                        : isDarkMode
                          ? 'bg-gray-700 text-gray-200 border border-gray-600 hover:bg-gray-600'
                          : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    10 seconds
                  </button>
                </div>
              </div>
              
              {/* Aspect Ratio */}
              <div>
                <label className={`text-xs block mb-1.5 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>Aspect Ratio</label>
                <div className="flex space-x-2">
                  <button
                    type="button"
                    onClick={() => setAspectRatio("16:9")}
                    className={`flex-1 py-1.5 px-3 text-sm font-medium rounded-md ${
                      aspectRatio === "16:9"
                        ? isDarkMode
                          ? 'bg-blue-600 text-white'
                          : 'bg-blue-600 text-white'
                        : isDarkMode
                          ? 'bg-gray-700 text-gray-200 border border-gray-600 hover:bg-gray-600'
                          : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    Landscape (16:9)
                  </button>
                  <button
                    type="button"
                    onClick={() => setAspectRatio("9:16")}
                    className={`flex-1 py-1.5 px-3 text-sm font-medium rounded-md ${
                      aspectRatio === "9:16"
                        ? isDarkMode
                          ? 'bg-blue-600 text-white'
                          : 'bg-blue-600 text-white'
                        : isDarkMode
                          ? 'bg-gray-700 text-gray-200 border border-gray-600 hover:bg-gray-600'
                          : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    Portrait (9:16)
                  </button>
                </div>
              </div>
              
              {/* Image Upload */}
              <div>
                <label className={`text-xs block mb-1.5 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                  Starting Image (Required)
                </label>
                <div className="flex items-center gap-2">
                  <button 
                    type="button"
                    onClick={handleImageButtonClick}
                    className={`flex items-center justify-center py-1.5 px-3 text-sm font-medium rounded-md flex-1 ${
                      videoImageFile 
                        ? isDarkMode
                          ? 'bg-gray-700 text-gray-200 border border-gray-600 hover:bg-gray-600'
                          : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                        : isDarkMode
                          ? 'bg-blue-600 hover:bg-blue-700 text-white'
                          : 'bg-blue-600 hover:bg-blue-700 text-white'
                    }`}
                  >
                    <Upload className="mr-2 size-4" />
                    {videoImageFile ? "Change image" : "Upload image"}
                  </button>
                  
                  <input 
                    type="file" 
                    accept="image/*" 
                    ref={fileInputRef}
                    onChange={handleVideoImageUpload} 
                    className="hidden" 
                  />
                  
                  {videoImageFile && (
                    <div className={`size-12 relative rounded-md overflow-hidden border ${
                      isDarkMode ? 'border-gray-600' : 'border-gray-300'
                    }`}>
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
                  <p className={`mt-1 text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
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
                    ? isDarkMode
                      ? 'bg-blue-800 cursor-not-allowed text-blue-300'
                      : 'bg-blue-300 cursor-not-allowed text-white'
                    : isDarkMode
                      ? 'bg-blue-600 hover:bg-blue-700 text-white'
                      : 'bg-blue-600 hover:bg-blue-700 text-white'
                  }`}
              >
                <Video className="mr-2 size-4" />
                {isGeneratingVideo ? "Generating..." : "Create video"}
              </button>
            </div>
          </div>
          
          {/* Right panel: Generated video display */}
          <div className="lg:col-span-2">
            {generatedVideos.length === 0 ? (
              <div className={`border border-dashed rounded-lg p-8 flex flex-col items-center justify-center h-full min-h-[400px] text-center ${
                isDarkMode ? 'border-gray-700' : 'border-gray-200'
              }`}>
                <div className={`p-3 rounded-full mb-3 ${isDarkMode ? 'bg-blue-900' : 'bg-blue-100'}`}>
                  <Video className={`size-6 ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`} />
                </div>
                <h3 className={`text-lg font-medium mb-1 ${isDarkMode ? 'text-gray-200' : 'text-gray-800'}`}>No videos generated yet</h3>
                <p className={`text-sm max-w-md mb-4 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  Enter a descriptive prompt, select your settings, and upload a starting image to generate AI videos for your project.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex flex-col w-full">
                    <div className={`border-b ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                      <div className="flex items-center justify-between">
                        <div className="flex">
                          <button
                            type="button"
                            className={`py-2 px-4 text-sm font-medium border-b-2 ${
                              isDarkMode
                                ? 'border-blue-500 text-blue-400'
                                : 'border-blue-600 text-blue-600'
                            }`}
                          >
                            Generated Videos
                          </button>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <div className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                            {selectedVideos.length} selected
                          </div>
                          <button 
                            type="button"
                            onClick={selectAll}
                            disabled={generatedVideos.length === 0}
                            className={`py-1 px-2 text-xs font-medium rounded border 
                              ${generatedVideos.length === 0 
                                ? isDarkMode
                                  ? 'bg-gray-700 text-gray-500 cursor-not-allowed border-gray-700'
                                  : 'bg-gray-100 text-gray-400 cursor-not-allowed border-gray-200'
                                : isDarkMode
                                  ? 'bg-gray-700 text-gray-300 hover:bg-gray-600 border-gray-600'
                                  : 'bg-white text-gray-700 hover:bg-gray-50 border-gray-300'
                              }`}
                          >
                            Select all
                          </button>
                          {selectedVideos.length > 0 && (
                            <button 
                              type="button"
                              onClick={clearSelections}
                              className={`py-1 px-2 text-xs font-medium rounded ${
                                isDarkMode
                                  ? 'bg-gray-700 text-gray-300 hover:bg-gray-600 border border-gray-600'
                                  : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'
                              }`}
                            >
                              Clear
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
                                  ? "ring-2 ring-blue-500 ring-offset-2" 
                                  : isDarkMode ? "border-gray-700 border" : "border-gray-300 border"
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
                                  className="absolute bottom-2 right-2 py-1 px-3 text-xs font-medium bg-white text-gray-700 rounded-md shadow hover:bg-gray-50 flex items-center"
                                >
                                  <Download className="mr-1 size-4" />
                                  Download
                                </button>
                              </div>
                              
                              {isSelected && (
                                <div className="absolute top-2 left-2 bg-blue-600 text-white rounded-full p-1">
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
                  <div className={`flex p-4 rounded-lg ${
                    isDarkMode 
                      ? 'bg-gray-700 border-amber-600 border'
                      : 'bg-gray-50 border border-gray-200'
                  }`}>
                    <div className={`flex-shrink-0 mr-3 ${isDarkMode ? 'text-amber-400' : 'text-amber-500'}`}>
                      <AlertCircle className="size-5" />
                    </div>
                    <div>
                      <h3 className={`text-sm font-medium ${isDarkMode ? 'text-gray-200' : 'text-gray-800'}`}>
                        Remember copyright and licensing
                      </h3>
                      <div className={`mt-1 text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                        Always verify you have the appropriate rights to use AI-generated content in your projects.
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
        <div className={`flex justify-between items-center border-t p-4 ${
          isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-200'
        }`}>
          <div className="flex items-center text-xs text-gray-500">
            <span className={`mr-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              Powered by Runway AI
            </span>
          </div>
          
          <button 
            type="button"
            onClick={handleSaveSelectedVideosToLibrary}
            disabled={selectedVideos.length === 0 || isSaving}
            className={`flex items-center gap-2 py-2 px-4 rounded-md text-sm font-medium 
              ${selectedVideos.length === 0 || isSaving
                ? isDarkMode
                  ? 'bg-blue-800 cursor-not-allowed text-blue-300'
                  : 'bg-blue-300 cursor-not-allowed text-white'
                : 'bg-blue-600 hover:bg-blue-700 text-white'}`}
          >
            <Save className="size-4" />
            {isSaving ? 'Saving...' : `Save ${selectedVideos.length > 0 ? selectedVideos.length : ''} to Library`}
          </button>
        </div>
      )}
      
      {/* Video being generated overlay */}
      {isGeneratingVideo && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
          <div className={`mx-auto max-w-md w-full p-6 rounded-lg shadow-xl ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
            {renderVideoGenerating()}
          </div>
        </div>
      )}
    </div>
  )
}