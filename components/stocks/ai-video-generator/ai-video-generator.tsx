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
 *  - Has a button to "Improve with AI" (calls `improvePrompt(...)`)
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
  const [predictionId, setPredictionId] = useState("")

  // Steps displayed while generating
  const generationSteps = useMemo(() => [
    "Understanding your video concept...",
    "Analyzing your uploaded image...",
    "Synthesizing transitions and animations...",
    "Finalizing your AI video..."
  ], [])
  const [currentStepIndex, setCurrentStepIndex] = useState(0)

  // For the "Improve with AI" flow
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
    setPredictionId("")
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

      // If we got a predictionId without a videoUrl, we need to poll for status
      if (json.predictionId && json.status !== "completed") {
        console.log(`Starting polling for video with prediction ID: ${json.predictionId}`)
        setPredictionId(json.predictionId)
        
        // Record when we started polling to detect stuck generations
        const startedAt = Date.now()
        
        // Start polling for status updates
        const checkStatus = async () => {
          try {
            console.log(`Checking status for prediction ID: ${json.predictionId}`)
            const statusRes = await fetch(`/api/video-status/${json.predictionId}?startedAt=${startedAt}`)
            
            if (!statusRes.ok) {
              console.error(`Error response from status check: ${statusRes.status}`)
              return false
            }
            
            const statusJson = await statusRes.json()
            console.log(`Video status update: ${statusJson.status}`)
            
            if (statusJson.status === "completed" && statusJson.videoUrl) {
              setVideoUrl(statusJson.videoUrl)
              setVideoGenerated(true)
              setIsVideoGenerating(false)
              confetti({
                particleCount: 100,
                spread: 70,
                origin: { y: 0.6 }
              })
              toast.success("Your AI video has been generated!")
              return true // Done polling
            } else if (statusJson.status === "failed") {
              setIsVideoGenerating(false)
              toast.error(statusJson.error || "Video generation failed")
              return true // Done polling due to failure
            }
            
            // Continue polling
            return false
          } catch (pollError) {
            console.error("Error polling for video status:", pollError)
            return false
          }
        }
        
        // Setup polling with recursive setTimeout to adapt to longer waits
        const poll = async () => {
          // Start with short intervals, then increase if still processing
          let attempts = 0
          let done = false
          
          const attemptCheck = async () => {
            if (done) return
            
            done = await checkStatus()
            attempts++
            
            if (!done) {
              // Exponential backoff with max interval of 10 seconds
              const delay = Math.min(3000 + (attempts * 1000), 10000)
              setTimeout(attemptCheck, delay)
            }
          }
          
          // Start polling
          attemptCheck()
        }
        
        // Begin polling but don't await it
        poll()
        
      } else if (json.videoUrl) {
        // Direct success (synchronous response with video URL)
        setVideoUrl(json.videoUrl)
        setVideoGenerated(true)
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 }
        })
        toast.success("Your AI video has been generated!")
        setIsVideoGenerating(false)
      } else {
        // Unexpected response with neither videoUrl nor valid predictionId
        throw new Error("No video URL or valid prediction ID returned")
      }
    } catch (error: any) {
      console.error("Error generating video:", error)
      toast.error(error.message || "Failed to generate video. Please try again.")
      setIsVideoGenerating(false)
    }
  }

  // -------------------------
  // RENDER HELPERS
  // -------------------------

  function renderSteps() {
    return (
      <div className="flex flex-col space-y-3 mt-4 text-gray-600 dark:text-gray-400">
        {generationSteps.map((step, index) => {
          const isCompleted = index < currentStepIndex - 1
          const isActive = index === currentStepIndex - 1
          const isUpcoming = index > currentStepIndex - 1

          return (
            <div key={index} className="flex items-center space-x-2">
              {isCompleted && <Check className="size-4 text-green-500" />}
              {isActive && (
                <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
              )}
              {isUpcoming && !isActive && (
                <div className="w-2 h-2 rounded-full bg-gray-400 dark:bg-gray-500" />
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

  function renderGeneratingState() {
    return (
      <div className="text-center space-y-4 p-4 max-w-md mx-auto">
        <div className="relative">
          <Brain className="size-12 mx-auto text-primary animate-pulse" />
          <Sparkles className="size-6 text-purple-500 absolute -top-2 -right-2 animate-bounce" />
          <Sparkles className="size-6 text-blue-500 absolute -bottom-2 -left-2 animate-bounce delay-150" />
        </div>
        <div className="space-y-2">
          <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            AI Brain is Processing
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Creating your custom video...
          </p>
          {predictionId && (
            <p className="text-xs text-gray-500 dark:text-gray-400">
              ID: {predictionId}
            </p>
          )}
        </div>
        <div className="flex justify-center space-x-2">
          <div className="size-2 bg-primary rounded-full animate-bounce" />
          <div className="size-2 bg-primary rounded-full animate-bounce delay-100" />
          <div className="size-2 bg-primary rounded-full animate-bounce delay-200" />
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
        <div className="w-full flex flex-col gap-4">
          <div className={`relative w-full ${ratioClass}`}>
            <video
              className="absolute inset-0 w-full h-full rounded-lg object-contain"
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
              className="flex gap-2 items-center"
            >
              <Download className="size-4" />
              <span>Download</span>
            </Button>
          </div>
        </div>
      )
    }

    // If video not generated yet, show a placeholder
    return (
      <div className="text-center space-y-2">
        <Brain className="size-8 mx-auto text-muted-foreground mb-2" />
        <span className="text-muted-foreground text-sm">
          The AI video will appear here once generated.
        </span>
      </div>
    )
  }

  function renderVideoStage() {
    return (
      <div className="w-full flex flex-col items-center space-y-4">
        <div className="relative w-full h-[700px] border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg flex items-center justify-center bg-gray-50 dark:bg-zinc-800 overflow-hidden">
          {isVideoGenerating ? renderGeneratingState() : renderFinalOrPlaceholder()}
        </div>
      </div>
    )
  }

  function renderInitialForm() {
    return (
      <div className="grid grid-cols-1 gap-4">
        {/* Video Prompt */}
        <div>
          <label className="text-sm font-medium text-gray-900 dark:text-gray-200">
            Video Prompt
          </label>
          <Textarea
            value={videoPrompt}
            onChange={(e) => setVideoPrompt(e.target.value)}
            placeholder="Describe how you'd like the video to appear..."
            className="mt-2"
          />
        </div>

        {/* Purple 'Improve with AI' button */}
        <Button
          onClick={handleImprovePrompt}
          disabled={!videoPrompt.trim() || isImproving}
          className="w-full mt-2 bg-purple-600 hover:bg-purple-700 text-white transition-colors"
        >
          {isImproving ? (
            <div className="flex items-center gap-2">
              <Sparkles className="size-4 animate-spin" />
              <span>Improving...</span>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Sparkles className="size-4" />
              <span>Improve with AI</span>
            </div>
          )}
        </Button>

        {/* Video Duration */}
        <div>
          <label className="text-sm font-medium text-gray-900 dark:text-gray-200">
            Video Duration
          </label>
          <div className="flex space-x-4 mt-2">
            <Button
              variant={videoDuration === 5 ? "default" : "outline"}
              onClick={() => setVideoDuration(5)}
            >
              5 sec
            </Button>
            <Button
              variant={videoDuration === 10 ? "default" : "outline"}
              onClick={() => setVideoDuration(10)}
            >
              10 sec
            </Button>
          </div>
        </div>

        {/* Aspect Ratio */}
        <div>
          <label className="text-sm font-medium text-gray-900 dark:text-gray-200">
            Aspect Ratio
          </label>
          <div className="flex space-x-4 mt-2">
            <Button
              variant={aspectRatio === "16:9" ? "default" : "outline"}
              onClick={() => setAspectRatio("16:9")}
            >
              16:9
            </Button>
            <Button
              variant={aspectRatio === "9:16" ? "default" : "outline"}
              onClick={() => setAspectRatio("9:16")}
            >
              9:16
            </Button>
          </div>
        </div>

        {/* Image Upload */}
        <div>
          <label
            htmlFor="videoImage"
            className="text-sm font-medium text-gray-900 dark:text-gray-200"
          >
            Upload an Image
          </label>
          <Input
            id="videoImage"
            type="file"
            accept="image/*"
            onChange={handleVideoImageUpload}
            className="mt-2"
          />
        </div>

        {/* Generate Video Button */}
        <Button
          onClick={handleGenerateVideo}
          disabled={isVideoGenerating}
          className="w-full mt-4"
        >
          {isVideoGenerating ? "AI is thinking..." : "Generate Video"}
        </Button>
      </div>
    )
  }

  // -------------------------
  // MAIN RENDER
  // -------------------------
  return (
    <div className="space-y-6 py-4">
      <Card className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 overflow-hidden shadow-sm">
        <CardHeader>
          <CardTitle className="text-gray-900 dark:text-gray-100">
            AI Video Generation
          </CardTitle>
          <CardDescription className="text-gray-700 dark:text-gray-400">
            Create engaging user-generated style videos using AI
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4 p-6">
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