"use client"

import React, { useState, useMemo } from "react"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { toast } from "sonner" // or your own toast library
import confetti from "canvas-confetti"
import { Brain, Sparkles, Check } from "lucide-react"

/**
 * A simplified component that ONLY handles the AI UGC Video Generation workflow.
 */
export function AiVideoGenerator() {
  // -------------------------
  // COMPONENT STATE
  // -------------------------
  const [videoPrompt, setVideoPrompt] = useState("")
  const [videoImageFile, setVideoImageFile] = useState<File | null>(null)
  const [videoDuration, setVideoDuration] = useState<number>(5)
  const [aspectRatio, setAspectRatio] = useState<"16:9" | "9:16">("16:9")
  const [isVideoGenerating, setIsVideoGenerating] = useState(false)
  const [videoGenerated, setVideoGenerated] = useState(false)
  const [videoUrl, setVideoUrl] = useState("")

  // Steps you want to show while generating (time-based or logic-based)
  const generationSteps = useMemo(
    () => [
      "Understanding your video concept...",
      "Analyzing your uploaded image...",
      "Synthesizing transitions and animations...",
      "Finalizing your AI video..."
    ],
    []
  )
  const [currentStepIndex, setCurrentStepIndex] = useState(0)

  // -------------------------
  // UTILS / HELPERS
  // -------------------------
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
      // Optional: Interval-based step progression (example 45s each)
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

      // Convert file to dataURL
      const dataUrl = await fileToDataURL(videoImageFile)

      // Make request to your server
      const res = await fetch("/api/generate-video", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: videoPrompt,
          duration: videoDuration,
          startImageDataUrl: dataUrl,
          aspectRatio,
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

      // Generation complete
      setVideoUrl(json.videoUrl)
      setVideoGenerated(true)
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 }
      })
      toast.success("Your AI video has been generated!")
    } catch (error: any) {
      console.error("Error generating video:", error)
      toast.error(error.message || "Failed to generate video. Please try again.")
    } finally {
      setIsVideoGenerating(false)
    }
  }

  // -------------------------
  // RENDER HELPERS
  // -------------------------
  function renderSteps() {
    return (
      <div className="flex flex-col space-y-3 mt-4 text-gray-400">
        {generationSteps.map((step, index) => {
          const isCompleted = index < currentStepIndex - 1
          const isActive = index === currentStepIndex - 1
          const isUpcoming = index > currentStepIndex - 1

          return (
            <div key={index} className="flex items-center space-x-2">
              {isCompleted && <Check className="size-4 text-green-500" />}
              {isActive && <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />}
              {isUpcoming && !isActive && <div className="w-2 h-2 rounded-full bg-gray-500" />}
              <span
                className={
                  isActive
                    ? "text-sm text-green-200"
                    : isCompleted
                    ? "text-sm text-gray-500 line-through"
                    : "text-sm text-gray-500"
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

  function renderVideoOrPlaceholder() {
    if (isVideoGenerating) {
      return (
        <div className="text-center space-y-4">
          <div className="relative">
            <Brain className="size-12 mx-auto text-primary animate-pulse" />
            <Sparkles className="size-6 text-yellow-500 absolute -top-2 -right-2 animate-bounce" />
            <Sparkles className="size-6 text-blue-500 absolute -bottom-2 -left-2 animate-bounce delay-150" />
          </div>
          <div className="space-y-2">
            <p className="text-lg font-semibold text-primary">AI Brain is Processing</p>
            <p className="text-sm text-muted-foreground">Creating your custom video...</p>
          </div>
          <div className="flex justify-center space-x-2">
            <div className="size-2 bg-primary rounded-full animate-bounce"></div>
            <div className="size-2 bg-primary rounded-full animate-bounce delay-100"></div>
            <div className="size-2 bg-primary rounded-full animate-bounce delay-200"></div>
          </div>
          {renderSteps()}
        </div>
      )
    }

    if (videoGenerated) {
      // Fit the video to container without cropping
      const ratioClass = aspectRatio === "9:16" ? "aspect-[9/16]" : "aspect-[16/9]"
      return (
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
      )
    }

    // Neither generating nor generated => placeholder
    return (
      <div className="text-center space-y-2">
        <Brain className="size-8 mx-auto text-muted-foreground mb-2" />
        <span className="text-muted-foreground text-sm">
          Enter a prompt, pick an aspect ratio, and upload an image to generate your AI video
        </span>
      </div>
    )
  }

  // -------------------------
  // RENDER
  // -------------------------
  return (
    <div className="space-y-6 py-4">
      <Card className="bg-zinc-900 border-zinc-800 overflow-hidden">
        <CardHeader>
          <CardTitle>AI UGC Video Generation</CardTitle>
          <CardDescription>Create engaging user-generated style videos using AI</CardDescription>
        </CardHeader>

        <CardContent className="space-y-4 p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* LEFT SIDE */}
            <div className="space-y-4">
              {/* Video Prompt */}
              <div>
                <label htmlFor="videoPrompt" className="text-sm font-medium">
                  Video Prompt
                </label>
                <Textarea
                  id="videoPrompt"
                  value={videoPrompt}
                  onChange={(e) => setVideoPrompt(e.target.value)}
                  placeholder="Describe how you'd like the video to appear..."
                  className="mt-2"
                />
              </div>

              {/* Duration */}
              <div>
                <label className="text-sm font-medium">Video Duration</label>
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
                <label className="text-sm font-medium">Aspect Ratio</label>
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
                <label htmlFor="videoImage" className="text-sm font-medium">
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

              <Button
                onClick={handleGenerateVideo}
                disabled={isVideoGenerating}
                className="w-full"
              >
                {isVideoGenerating ? "AI is thinking..." : "Generate Video"}
              </Button>
            </div>

            {/* RIGHT SIDE: Video Preview Container */}
            <div className="space-y-4">
              <div className="relative w-full h-[700px] border-2 border-dashed border-gray-700 rounded-lg flex items-center justify-center bg-zinc-800 overflow-hidden">
                {renderVideoOrPlaceholder()}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
