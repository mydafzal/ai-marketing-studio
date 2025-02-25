"use client"

import React, { useState, useMemo, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/use-toast"

// Icons & confetti
import { Brain, Sparkles, Check } from "lucide-react"
import confetti from "canvas-confetti"

// We assume you still have the same server endpoint or route handler for generating video
// If you are using a server action, you can adapt accordingly
// For now, let's assume you're calling "/api/generate-video"
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

interface Props {
  /** 
   * If you have an `improvePrompt` server action in a separate file, 
   * you can either import and call it here or pass it in as a prop. 
   * For simplicity, we'll assume we have an `improvePrompt` server action imported.
   */
  improvePrompt: (prompt: string) => Promise<string>;
}

export default function AiVideoTab({ improvePrompt }: Props) {
  const { toast } = useToast()

  // ----------------- VIDEO GENERATION STATES & LOGIC -----------------
  const [videoPrompt, setVideoPrompt] = useState("")
  const [videoImageFile, setVideoImageFile] = useState<File | null>(null)
  const [videoDuration, setVideoDuration] = useState<number>(5)
  const [aspectRatio, setAspectRatio] = useState<"16:9" | "9:16">("16:9")
  const [isVideoGenerating, setIsVideoGenerating] = useState(false)
  const [videoGenerated, setVideoGenerated] = useState(false)
  const [videoUrl, setVideoUrl] = useState("")

  // 3 minutes => 4 steps => 45s each
  const videoGenerationSteps = useMemo(
    () => [
      "Understanding your video concept...",
      "Analyzing your uploaded image for style...",
      "Synthesizing transitions and animations...",
      "Almost ready!",
    ],
    []
  )
  const [currentVideoStep, setCurrentVideoStep] = useState(0)

  // Prompt improvement for video
  const [isImprovingVideoPrompt, setIsImprovingVideoPrompt] = useState(false)

  async function handleImproveVideoPrompt() {
    if (!videoPrompt.trim()) {
      toast({
        title: "Error",
        description: "No video prompt to improve!",
        variant: "destructive",
      })
      return
    }
    setIsImprovingVideoPrompt(true)
    try {
      const improved = await improvePrompt(videoPrompt)
      setVideoPrompt(improved)
      toast({
        title: "Success",
        description: "Video prompt improved with AI!",
      })
    } catch (err) {
      console.error("Error improving video prompt:", err)
      toast({
        title: "Error",
        description: "Failed to improve video prompt.",
        variant: "destructive",
      })
    } finally {
      setIsImprovingVideoPrompt(false)
    }
  }

  function handleVideoImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.files && e.target.files.length > 0) {
      setVideoImageFile(e.target.files[0])
    }
  }

  async function handleGenerateVideo() {
    if (!videoPrompt.trim()) {
      toast({
        title: "Error",
        description: "Please enter a video prompt first.",
        variant: "destructive",
      })
      return
    }
    if (!videoImageFile) {
      toast({
        title: "Error",
        description: "Please upload an image first for video generation!",
        variant: "destructive",
      })
      return
    }

    setIsVideoGenerating(true)
    setVideoGenerated(false)
    setVideoUrl("")
    setCurrentVideoStep(0)

    try {
      // Step time = 45s each => ~3min total
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
        throw new Error(json.error || "No success from replicate.")
      }

      setVideoUrl(json.videoUrl)
      setVideoGenerated(true)
      setIsVideoGenerating(false)
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
      })

      toast({
        title: "Success",
        description: "Your AI video has been generated!",
      })
    } catch (err: any) {
      console.error("Error generating video:", err)
      toast({
        title: "Error",
        description: err.message || "Failed to generate video. Please try again.",
        variant: "destructive",
      })
      setIsVideoGenerating(false)
    }
  }

  function renderVideoSteps() {
    return (
      <div className="flex flex-col space-y-3 mt-4 text-gray-600 dark:text-gray-400">
        {videoGenerationSteps.map((step, index) => {
          const isCompleted = index < currentVideoStep - 1
          const isActive = index === currentVideoStep - 1
          const isUpcoming = index > currentVideoStep - 1

          return (
            <div key={index} className="flex items-center space-x-2">
              {isCompleted && <Check className="size-4 text-green-500" />}
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

  function renderVideoGenerating() {
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
          <div className="size-2 bg-primary rounded-full animate-bounce" />
          <div className="size-2 bg-primary rounded-full animate-bounce delay-100" />
          <div className="size-2 bg-primary rounded-full animate-bounce delay-200" />
        </div>
        {renderVideoSteps()}
      </div>
    )
  }

  function renderVideoResult() {
    if (videoGenerated && videoUrl) {
      const ratioClass = aspectRatio === "9:16" ? "aspect-[9/16]" : "aspect-[16/9]"
      return (
        <div className={`relative w-full ${ratioClass}`}>
          <video
            className="absolute inset-0 size-full rounded-lg object-contain"
            controls
            autoPlay
            muted
          >
            <source src={videoUrl} type="video/mp4" />
            Your browser does not support the video tag.
          </video>
        </div>
      )
    }
    return (
      <div className="text-center space-y-2">
        <Brain className="size-8 mx-auto text-muted-foreground mb-2" />
        <span className="text-muted-foreground text-sm">
          Enter a prompt, pick an aspect ratio, and upload an image to generate your AI video
        </span>
      </div>
    )
  }

  // ----------------------- RENDER UI -----------------------
  return (
    <Card>
      <CardHeader>
        <CardTitle>AI Video Generation</CardTitle>
        <CardDescription>
          Create engaging user-generated style videos using AI
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Left side: video prompt, improve, image, etc. */}
          <div className="space-y-4">
            {/* Video Prompt */}
            <div>
              <label className="text-sm font-medium">Video Prompt</label>
              <Textarea
                value={videoPrompt}
                onChange={(e) => setVideoPrompt(e.target.value)}
                placeholder="Describe how you'd like the video to appear..."
                className="mt-2"
              />
            </div>
            {/* Improve with AI */}
            <Button
              variant="outline"
              className="w-full"
              disabled={!videoPrompt.trim() || isImprovingVideoPrompt}
              onClick={handleImproveVideoPrompt}
            >
              {isImprovingVideoPrompt ? "Improving..." : "Improve with AI"}
            </Button>

            {/* Video Duration */}
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

            {/* Image Upload for Video */}
            <div>
              <label className="text-sm font-medium">Upload an Image</label>
              <Input
                type="file"
                accept="image/*"
                onChange={handleVideoImageUpload}
                className="mt-2"
              />
            </div>

            {/* Generate Button */}
            <Button
              onClick={handleGenerateVideo}
              disabled={isVideoGenerating}
              className="w-full"
            >
              {isVideoGenerating ? "AI is thinking..." : "Generate Video"}
            </Button>
          </div>

          {/* Right side: video output */}
          <div className="space-y-4">
            <div className="relative w-full h-[700px] border-2 border-dashed border-gray-200 dark:border-gray-800 rounded-lg flex items-center justify-center bg-gray-50 dark:bg-gray-900 overflow-hidden">
              {isVideoGenerating ? renderVideoGenerating() : renderVideoResult()}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
