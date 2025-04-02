"use client"

import React, { useState, useMemo } from "react"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { toast } from "sonner"
import confetti from "canvas-confetti"
import { Brain, Sparkles, Check, Download } from "lucide-react"

// 1) SERVER ACTION that improves the prompt text
// Ensure you have this action: /app/actions/generate-prompt.ts
import { improvePrompt } from "@/app/actions/generate-prompt"

/**
 * A client component that:
 *  - Lets user enter a prompt, optionally upload an image, pick duration/ratio
 *  - Has a button to “Improve with AI” (calls `improvePrompt(...)`)
 *  - Generates a video with /api/generate-video
 *  - Offers a Download button for the final MP4
 */
export function AiVideoGenerator() {
  // -------------------------
  // COMPONENT STATE
  // -------------------------
  const [videoPrompt, setVideoPrompt] = useState("")
  const [videoImageFile, setVideoImageFile] = useState<File | null>(null)
  const [videoDuration, setVideoDuration] = useState<number>(5)
  const [aspectRatio, setAspectRatio] = useState<"16:9" | "9:16">("16:9")

  // For generation steps
  const [isVideoGenerating, setIsVideoGenerating] = useState(false)
  const [videoGenerated, setVideoGenerated] = useState(false)
  const [videoUrl, setVideoUrl] = useState("")

  // Steps displayed while generating
  const generationSteps = useMemo(() => [
    "Understanding your video concept...",
    "Analyzing your uploaded image...",
    "Synthesizing transitions and animations...",
    "Finalizing your AI video..."
  ], [])
  const [currentStepIndex, setCurrentStepIndex] = useState(0)

  // For the “Improve with AI” flow
  const [isImproving, setIsImproving] = useState(false)

  // -------------------------
  // UTILS / HELPERS
  // -------------------------

  // Convert the user-uploaded file to a DataURL
  const handleVideoImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setVideoImageFile(e.target.files[0])
    }
  }

  async function fileToDataURL(file: File): Promise<string> {
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

  /**
   * Download the final video from `videoUrl`.
   * We'll fetch the MP4 as a Blob, then create a temporary link to trigger download.
   */
  async function handleDownloadVideo(url: string) {
    try {
      const res = await fetch(url)
      const blob = await res.blob()
      const tempUrl = window.URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.href = tempUrl
      link.download = "AI_Video.mp4"
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(tempUrl)

      toast.success("Video downloaded successfully!")
    } catch (err) {
      console.error("Error downloading video:", err)
      toast.error("Failed to download video. Please try again.")
    }
  }

  // -------------------------
  // IMPROVE PROMPT WITH AI
  // -------------------------
  async function handleImprovePrompt() {
    if (!videoPrompt.trim()) {
      toast.error("Please enter a prompt first.")
      return
    }
    setIsImproving(true)
    try {
      const improved = await improvePrompt(videoPrompt)
      setVideoPrompt(improved)
      toast.success("Prompt improved with AI!")
    } catch (error: any) {
      console.error("Error improving prompt:", error)
      toast.error(error.message || "Failed to improve prompt.")
    } finally {
      setIsImproving(false)
    }
  }

  // -------------------------
  // VIDEO GENERATION LOGIC
  // -------------------------
  const handleGenerateVideo = async () => {
    if (!videoPrompt.trim()) {
      toast.error("Please enter a prompt first.")
      return
    }
    if (!videoImageFile) {
      toast.error("Please upload an image first.")
      return
    }

    setIsVideoGenerating(true)
    setVideoGenerated(false)
    setVideoUrl("")
    setCurrentStepIndex(0)

    try {
      // Example: each step ~45s
      const STEP_DURATION = 45000
      let step = 0
      const intervalId = setInterval(() => {
        if (step < generationSteps.length) {
          setCurrentStepIndex(step + 1)
          step++
        } else {
          clearInterval(intervalId)
        }
      }, STEP_DURATION)

      // Convert file -> dataURL
      const dataUrl = await fileToDataURL(videoImageFile)

      // Make request to your server => /api/generate-video
      const res = await fetch("/api/generate-video", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: videoPrompt,
          duration: videoDuration,
          startImageDataUrl: dataUrl,
          aspectRatio
        })
      })

      if (!res.ok) {
        const errData = await res.json()
        throw new Error(errData.error || "Failed to generate video.")
      }

      const json = await res.json()
      if (!json.success) {
        throw new Error(json.error || "No success from replicate.")
      }

      // SUCCESS: set the final video URL & states
      setVideoUrl(json.videoUrl)
      setVideoGenerated(true)
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 }
      })
      toast.success("Your AI video has been generated!")

      // IMPORTANT: if successful => turn off "generating"
      setIsVideoGenerating(false)
    } catch (error: any) {
      console.error("Error generating video:", error)
      toast.error(error.message || "Failed to generate video. Please try again.")
      // If error => turn off "generating"
      setIsVideoGenerating(false)
    }
  }

  // -------------------------
  // RENDER HELPERS
  // -------------------------

  function renderSteps() {
    return (
      <div className="flex flex-col space-y-4 mt-6 text-text-light-gray">
        {generationSteps.map((step, index) => {
          const isCompleted = index < currentStepIndex - 1
          const isActive = index === currentStepIndex - 1
          const isUpcoming = index > currentStepIndex - 1

          return (
            <div key={index} className="flex items-center space-x-3">
              {isCompleted && <Check className="size-5 text-primary-green" />}
              {isActive && (
                <div className="w-2.5 h-2.5 rounded-full bg-primary-green animate-pulse" />
              )}
              {isUpcoming && !isActive && (
                <div className="w-2.5 h-2.5 rounded-full bg-border-dark" />
              )}
              <span
                className={
                  isActive
                    ? "text-[14px] text-primary-green font-medium"
                    : isCompleted
                    ? "text-[14px] text-text-light-gray line-through"
                    : "text-[14px] text-text-light-gray"
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

  function renderGeneratingState() {
    return (
      <div className="text-center space-y-6 p-6 max-w-md mx-auto">
        <div className="relative">
          <Brain className="size-16 mx-auto text-primary-green animate-pulse" />
          <Sparkles className="size-7 text-coral absolute -top-3 -right-3 animate-bounce" />
          <Sparkles className="size-7 text-primary-green absolute -bottom-3 -left-3 animate-bounce delay-150" />
        </div>
        <div className="space-y-3">
          <p className="text-[20px] font-bold text-text-white">
            AI Brain is Processing
          </p>
          <p className="text-[15px] text-text-light-gray">
            Creating your custom video...
          </p>
        </div>
        <div className="flex justify-center space-x-3">
          <div className="w-2.5 h-2.5 bg-primary-green rounded-full animate-bounce" />
          <div className="w-2.5 h-2.5 bg-primary-green rounded-full animate-bounce delay-100" />
          <div className="w-2.5 h-2.5 bg-primary-green rounded-full animate-bounce delay-200" />
        </div>
        {renderSteps()}
      </div>
    )
  }

  function renderFinalOrPlaceholder() {
    if (videoGenerated) {
      // Fit the video to container without cropping
      const ratioClass = aspectRatio === "9:16" ? "aspect-[9/16]" : "aspect-[16/9]"
      return (
        <div className="w-full flex flex-col gap-6">
          <div className={`relative w-full ${ratioClass}`}>
            <video
              className="absolute inset-0 w-full h-full rounded-xl object-contain bg-dark-bg"
              controls
              autoPlay
              muted
            >
              <source src={videoUrl || "/aiclothing.mp4"} type="video/mp4" />
              Your browser does not support the video tag.
            </video>
          </div>

          {/* Download Button */}
          <div className="flex justify-end">
            <Button
              variant="outline"
              onClick={() => handleDownloadVideo(videoUrl)}
              className="flex gap-3 items-center border-border-dark text-text-white hover:bg-container-bg transition-all duration-200 h-12 px-5 rounded-lg"
            >
              <Download className="size-5" />
              <span className="text-[15px] font-medium">Download Video</span>
            </Button>
          </div>
        </div>
      )
    }

    // If video not generated yet, show a placeholder
    return (
      <div className="text-center space-y-4">
        <Brain className="size-16 mx-auto text-text-light-gray mb-4 opacity-50" />
        <span className="text-text-light-gray text-[16px] block max-w-xs mx-auto">
          Your AI-generated video will appear here once created.
        </span>
      </div>
    )
  }

  function renderVideoStage() {
    return (
      <div className="w-full flex flex-col items-center space-y-4">
        <div className="relative w-full h-[700px] border border-dashed border-border-dark rounded-xl flex items-center justify-center bg-dark-bg overflow-hidden">
          {isVideoGenerating ? renderGeneratingState() : renderFinalOrPlaceholder()}
        </div>
      </div>
    )
  }

  function renderInitialForm() {
    return (
      <div className="grid grid-cols-1 gap-8">
        {/* Video Prompt */}
        <div className="space-y-3">
          <h3 className="text-[18px] font-bold text-text-white">
            Describe the video you want
          </h3>
          <Textarea
            value={videoPrompt}
            onChange={(e) => setVideoPrompt(e.target.value)}
            placeholder="A cinematic panning shot of a modern office space with natural lighting, showing professionals collaborating..."
            className="w-full min-h-[120px] border-border-dark bg-dark-bg text-text-white placeholder:text-text-light-gray focus:ring-primary-green focus:border-primary-green rounded-lg text-[15px] leading-relaxed transition-all duration-200"
          />
          
          {/* Enhance prompt button */}
          <Button
            onClick={handleImprovePrompt}
            disabled={!videoPrompt.trim() || isImproving}
            className="mt-3 bg-transparent hover:bg-container-bg text-coral border border-coral hover:border-coral/90 transition-all duration-200 h-10 px-4 rounded-lg"
            variant="outline"
          >
            {isImproving ? (
              <div className="flex items-center gap-2">
                <Sparkles className="size-4 animate-spin" />
                <span className="text-[14px]">Enhancing...</span>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Sparkles className="size-4" />
                <span className="text-[14px]">Enhance prompt with AI</span>
              </div>
            )}
          </Button>
        </div>

        {/* Video Settings Section */}
        <div className="space-y-5">
          <h3 className="text-[18px] font-bold text-text-white">
            Video Settings
          </h3>
          
          {/* Duration */}
          <div className="space-y-3">
            <label className="text-[14px] font-medium text-text-light-gray">
              Duration
            </label>
            <div className="flex space-x-3">
              <Button
                variant="outline"
                onClick={() => setVideoDuration(5)}
                className={videoDuration === 5 
                  ? "flex-1 bg-transparent border-primary-green text-primary-green hover:bg-container-bg transition-all duration-200 h-12 rounded-lg"
                  : "flex-1 bg-transparent border-border-dark text-text-light-gray hover:bg-container-bg hover:text-text-white transition-all duration-200 h-12 rounded-lg"
                }
              >
                <span className="text-[14px]">5 seconds</span>
              </Button>
              <Button
                variant="outline"
                onClick={() => setVideoDuration(10)}
                className={videoDuration === 10 
                  ? "flex-1 bg-transparent border-primary-green text-primary-green hover:bg-container-bg transition-all duration-200 h-12 rounded-lg" 
                  : "flex-1 bg-transparent border-border-dark text-text-light-gray hover:bg-container-bg hover:text-text-white transition-all duration-200 h-12 rounded-lg"
                }
              >
                <span className="text-[14px]">10 seconds</span>
              </Button>
            </div>
          </div>
          
          {/* Aspect Ratio */}
          <div className="space-y-3">
            <label className="text-[14px] font-medium text-text-light-gray">
              Aspect Ratio
            </label>
            <div className="flex space-x-3">
              <Button
                variant="outline"
                onClick={() => setAspectRatio("16:9")}
                className={aspectRatio === "16:9" 
                  ? "flex-1 bg-transparent border-primary-green text-primary-green hover:bg-container-bg transition-all duration-200 h-12 rounded-lg"
                  : "flex-1 bg-transparent border-border-dark text-text-light-gray hover:bg-container-bg hover:text-text-white transition-all duration-200 h-12 rounded-lg"
                }
              >
                <span className="text-[14px]">Landscape (16:9)</span>
              </Button>
              <Button
                variant="outline"
                onClick={() => setAspectRatio("9:16")}
                className={aspectRatio === "9:16" 
                  ? "flex-1 bg-transparent border-primary-green text-primary-green hover:bg-container-bg transition-all duration-200 h-12 rounded-lg"
                  : "flex-1 bg-transparent border-border-dark text-text-light-gray hover:bg-container-bg hover:text-text-white transition-all duration-200 h-12 rounded-lg"
                }
              >
                <span className="text-[14px]">Portrait (9:16)</span>
              </Button>
            </div>
          </div>
          
          {/* Image Upload */}
          <div className="space-y-3">
            <label className="text-[14px] font-medium text-text-light-gray">
              Starting Image (Required)
            </label>
            <div className="flex flex-col">
              <Input
                id="videoImage"
                type="file"
                accept="image/*"
                onChange={handleVideoImageUpload}
                className="sr-only"
              />
              <label 
                htmlFor="videoImage" 
                className="flex items-center justify-center w-full h-12 rounded-lg border border-dashed border-border-dark bg-transparent text-text-light-gray hover:bg-container-bg hover:text-text-white cursor-pointer transition-all duration-200"
              >
                <span className="text-[14px]">{videoImageFile ? videoImageFile.name : "Upload image"}</span>
              </label>
            </div>
          </div>
        </div>

        {/* Generate Video Button */}
        <Button
          onClick={handleGenerateVideo}
          disabled={isVideoGenerating}
          className="w-full h-12 mt-2 bg-primary-green hover:bg-primary-green/90 text-deep-black font-bold text-[16px] rounded-lg transition-all duration-200 transform hover:scale-[1.02]"
        >
          {isVideoGenerating ? "Creating video..." : "Create video"}
        </Button>
      </div>
    )
  }

  // -------------------------
  // MAIN RENDER
  // -------------------------
  return (
    <div className="space-y-6 py-4">
      <Card className="bg-white dark:bg-container-bg border border-border-dark rounded-xl overflow-hidden shadow-[0_4px_12px_rgba(0,0,0,0.1)]">
        <CardHeader className="border-b border-border-dark px-6 py-5">
          <CardTitle className="text-gray-900 dark:text-text-white text-[20px] font-bold">
            AI Video Generator
          </CardTitle>
          <CardDescription className="text-gray-700 dark:text-text-light-gray text-[14px] mt-1">
            Create engaging user-generated style videos using AI
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6 p-6">
          {(!isVideoGenerating && !videoGenerated) ? (
            renderInitialForm()
          ) : (
            renderVideoStage()
          )}
        </CardContent>
      </Card>
    </div>
  )
}
