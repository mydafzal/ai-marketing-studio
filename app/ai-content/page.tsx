"use client"

import React, { useState, useMemo, useEffect } from "react"

// UI components
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/use-toast"

// Import Next.js Image as NextImage
import NextImage from "next/image"

// Icons & confetti
import { Twitter, Linkedin, Instagram, Copy, Check, Download, Brain, Sparkles } from "lucide-react"
import confetti from "canvas-confetti"

// Server actions
import { generateContent } from "@/app/actions/generate"
import { generateImages } from "@/app/actions/generate-image"
import { improvePrompt } from "@/app/actions/generate-prompt"

export default function AiContentPage() {
  const { toast } = useToast()

  // ===========================================================================
  // ====================== TEXT CONTENT STATES & LOGIC ========================
  // ===========================================================================
  const [textPrompt, setTextPrompt] = useState("")
  const [isGeneratingText, setIsGeneratingText] = useState(false)
  const [content, setContent] = useState({
    twitter: "Here you can see how your Twitter post will look like",
    linkedin: "Here you can see how your LinkedIn post will look like",
    instagram: "Here you can see how your Instagram post will look like",
  })
  const [copiedStates, setCopiedStates] = useState({
    twitter: false,
    linkedin: false,
    instagram: false,
  })

  async function handleGenerateText() {
    if (!textPrompt.trim()) {
      toast({
        title: "Error",
        description: "Please enter a prompt first",
        variant: "destructive",
      })
      return
    }
    setIsGeneratingText(true)
    try {
      const generatedContent = await generateContent(textPrompt)
      setContent(generatedContent)
      toast({
        title: "Success",
        description: "Generated social media content successfully!",
      })
    } catch (err) {
      console.error("Error generating content:", err)
      toast({
        title: "Error",
        description: "Failed to generate text content. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsGeneratingText(false)
    }
  }

  async function handleCopy(platform: "twitter" | "linkedin" | "instagram") {
    await navigator.clipboard.writeText(content[platform])
    setCopiedStates((prev) => ({ ...prev, [platform]: true }))

    toast({
      title: "Copied!",
      description: `Copied ${platform.toUpperCase()} content to clipboard.`,
    })

    setTimeout(() => {
      setCopiedStates((prev) => ({ ...prev, [platform]: false }))
    }, 2000)
  }

  // ===========================================================================
  // ======================= IMAGE GENERATION STATES & LOGIC ===================
  // ===========================================================================
  const [imagePrompt, setImagePrompt] = useState("")
  const [isGeneratingImages, setIsGeneratingImages] = useState(false)
  const [generatedImages, setGeneratedImages] = useState<string[]>([])

  // Prompt improvement for images
  const [isImprovingImagePrompt, setIsImprovingImagePrompt] = useState(false)

  // Logo overlay
  const [logoUrl, setLogoUrl] = useState("")
  const [overlayPosition, setOverlayPosition] = useState("top-left")
  const [combinedPreviews, setCombinedPreviews] = useState<string[]>([])

  // ----- UTILS -----
  function handleLogoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0]
      const reader = new FileReader()
      reader.onload = () => {
        if (reader.result) {
          setLogoUrl(reader.result as string)
        }
      }
      reader.readAsDataURL(file)
    }
  }

  /**
   * Uses *native* `new window.Image()` to draw on canvas.
   */
  async function combineImages(
    backgroundUrl: string,
    overlayUrl: string,
    position: string
  ): Promise<string> {
    return new Promise((resolve, reject) => {
      const canvas = document.createElement("canvas")
      const ctx = canvas.getContext("2d")
      if (!ctx) {
        return reject(new Error("Could not get canvas context"))
      }

      const background = new window.Image()
      const overlay = new window.Image()

      background.crossOrigin = "anonymous"
      overlay.crossOrigin = "anonymous"

      background.onload = () => {
        // Set canvas to background's size
        canvas.width = background.width
        canvas.height = background.height
        ctx.drawImage(background, 0, 0)

        overlay.onload = () => {
          let x = 0
          let y = 0

          // Decide Y pos
          if (position.includes("bottom")) {
            y = canvas.height - overlay.height
          } else if (position.includes("middle") || position.includes("center")) {
            y = (canvas.height - overlay.height) / 2
          } else {
            // top
            y = 0
          }

          // Decide X pos
          if (position.includes("right")) {
            x = canvas.width - overlay.width
          } else if (position.includes("center")) {
            x = (canvas.width - overlay.width) / 2
          } else {
            // left
            x = 0
          }

          ctx.drawImage(overlay, x, y)
          const finalUrl = canvas.toDataURL("image/png")
          resolve(finalUrl)
        }
        overlay.onerror = (err) => reject(err)
        overlay.src = overlayUrl
      }

      background.onerror = (err) => reject(err)
      background.src = backgroundUrl
    })
  }

  async function handleDownloadWithLogo(aiImageUrl: string, index: number) {
    if (!logoUrl) {
      toast({
        title: "Error",
        description: "Please upload a logo first!",
        variant: "destructive",
      })
      return
    }
    try {
      const finalUrl = await combineImages(aiImageUrl, logoUrl, overlayPosition)
      // Then download finalUrl
      const res = await fetch(finalUrl)
      const blob = await res.blob()
      const tempUrl = window.URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.href = tempUrl
      link.download = `generated-image-${index + 1}-with-logo.png`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(tempUrl)

      toast({
        title: "Success",
        description: "Downloaded combined image with logo!",
      })
    } catch (err) {
      console.error("Error combining/downloading image:", err)
      toast({
        title: "Error",
        description: "Failed to download combined image. Please try again.",
        variant: "destructive",
      })
    }
  }

  async function updateLogoPreviews() {
    // Re-build the side-by-side previews
    if (!logoUrl || generatedImages.length === 0) {
      setCombinedPreviews([])
      return
    }
    try {
      const newPreviews: string[] = []
      for (let i = 0; i < generatedImages.length; i++) {
        const combined = await combineImages(generatedImages[i], logoUrl, overlayPosition)
        newPreviews.push(combined)
      }
      setCombinedPreviews(newPreviews)
    } catch (err) {
      console.error("Error combining for previews:", err)
    }
  }

  // Auto-run overlay preview updates
  useEffect(() => {
    updateLogoPreviews()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [generatedImages, logoUrl, overlayPosition])

  async function handleImageGenerate() {
    if (!imagePrompt.trim()) {
      toast({
        title: "Error",
        description: "Please enter an image prompt first.",
        variant: "destructive",
      })
      return
    }
    setIsGeneratingImages(true)
    try {
      const result = await generateImages(imagePrompt)
      if (result.success && result.images && result.images.length > 0) {
        const validUrls = result.images.filter(
          (url: unknown) => typeof url === "string"
        ) as string[]
        setGeneratedImages(validUrls)

        toast({
          title: "Success",
          description: `Generated ${validUrls.length} image(s) successfully`,
        })
      } else {
        throw new Error(result.error || "Failed to generate images.")
      }
    } catch (err) {
      console.error("Error generating images:", err)
      toast({
        title: "Error",
        description: "Failed to generate images. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsGeneratingImages(false)
    }
  }

  async function handleDownload(imageUrl: string, index: number) {
    try {
      const response = await fetch(imageUrl)
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.href = url
      link.download = `generated-image-${index + 1}.png`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)

      toast({
        title: "Success",
        description: "Image downloaded successfully!",
      })
    } catch (error) {
      console.error("Error downloading image:", error)
      toast({
        title: "Error",
        description: "Failed to download image. Please try again.",
        variant: "destructive",
      })
    }
  }

  // Improve Image Prompt
  async function handleImproveImagePrompt() {
    if (!imagePrompt.trim()) {
      toast({
        title: "Error",
        description: "No prompt to improve!",
        variant: "destructive",
      })
      return
    }
    setIsImprovingImagePrompt(true)
    try {
      const improved = await improvePrompt(imagePrompt)
      setImagePrompt(improved)
      toast({
        title: "Success",
        description: "Image prompt improved with AI!",
      })
    } catch (err) {
      console.error("Error improving image prompt:", err)
      toast({
        title: "Error",
        description: "Failed to improve image prompt.",
        variant: "destructive",
      })
    } finally {
      setIsImprovingImagePrompt(false)
    }
  }

  // ===========================================================================
  // ======================= VIDEO GENERATION STATES & LOGIC ===================
  // ===========================================================================
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
      // Step time = 45s each => 3min total
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
    if (videoGenerated) {
      const ratioClass = aspectRatio === "9:16" ? "aspect-[9/16]" : "aspect-[16/9]"
      return (
        <div className={`relative w-full ${ratioClass}`}>
          <video
            className="absolute inset-0 size-full rounded-lg object-contain"
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
    return (
      <div className="text-center space-y-2">
        <Brain className="size-8 mx-auto text-muted-foreground mb-2" />
        <span className="text-muted-foreground text-sm">
          Enter a prompt, pick an aspect ratio, and upload an image to generate your AI video
        </span>
      </div>
    )
  }

  // ===========================================================================
  // ============================== RENDER UI ===================================
  // ===========================================================================
  return (
    <div className="container mx-auto p-6">
      <div className="flex flex-col space-y-6">
        <div className="flex flex-col space-y-2">
          <h1 className="text-3xl font-bold">AI Content Generation</h1>
          <p className="text-muted-foreground">
            Create various types of AI-generated content for your campaigns
          </p>
        </div>

        <Tabs defaultValue="text" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="ugc">AI UGC Video</TabsTrigger>
            <TabsTrigger value="image">AI Image Creatives</TabsTrigger>
            <TabsTrigger value="text">AI Text Content</TabsTrigger>
          </TabsList>

          {/* VIDEO TAB */}
          <TabsContent value="ugc">
            <Card>
              <CardHeader>
                <CardTitle>AI UGC Video Generation</CardTitle>
                <CardDescription>Create engaging user-generated style videos using AI</CardDescription>
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
          </TabsContent>

          {/* IMAGE TAB */}
          <TabsContent value="image">
            <Card>
              <CardHeader>
                <CardTitle>AI Image Creatives</CardTitle>
                <CardDescription>
                  Generate custom images and visual assets for your marketing campaigns
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Left side - input, logo upload, position */}
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">
                        Enter your image prompt
                      </label>
                      <Textarea
                        value={imagePrompt}
                        onChange={(e) => setImagePrompt(e.target.value)}
                        placeholder="Describe the images you want to generate..."
                        className="min-h-[100px]"
                      />
                    </div>

                    {/* Improve Image Prompt */}
                    <Button
                      variant="outline"
                      className="w-full"
                      disabled={!imagePrompt.trim() || isImprovingImagePrompt}
                      onClick={handleImproveImagePrompt}
                    >
                      {isImprovingImagePrompt ? "Improving..." : "Improve with AI"}
                    </Button>

                    <Button
                      className="w-full"
                      onClick={handleImageGenerate}
                      disabled={isGeneratingImages}
                    >
                      {isGeneratingImages ? "Generating..." : "Generate Images"}
                    </Button>

                    {/* Logo Upload & Position */}
                    <div className="mt-4 space-y-2">
                      <label className="text-sm font-medium">Upload Your Logo</label>
                      <Input type="file" accept="image/*" onChange={handleLogoUpload} />
                    </div>

                    <div>
                      <label className="text-sm font-medium">Logo Position</label>
                      <select
                        value={overlayPosition}
                        onChange={(e) => setOverlayPosition(e.target.value)}
                        className="block mt-1 border p-1 rounded"
                      >
                        <option value="top-left">Top Left</option>
                        <option value="top-center">Top Center</option>
                        <option value="top-right">Top Right</option>
                        <option value="middle-center">Middle Center</option>
                        <option value="bottom-left">Bottom Left</option>
                        <option value="bottom-center">Bottom Center</option>
                        <option value="bottom-right">Bottom Right</option>
                      </select>
                    </div>
                  </div>

                  {/* Right side - Original vs Overlaid Previews */}
                  <div className="space-y-4">
                    <div className="flex flex-col space-y-2">
                      <h3 className="font-semibold">Original Images</h3>
                      <div className="grid grid-cols-2 gap-2">
                        {generatedImages.map((imgUrl, i) => (
                          <div
                            key={i}
                            className="aspect-square relative rounded border border-gray-200 dark:border-gray-800 overflow-hidden group"
                          >
                            <NextImage
                              src={imgUrl}
                              alt={`AI Img ${i}`}
                              fill
                              sizes="(max-width: 768px) 100vw, 448px"
                              className="object-cover"
                            />
                            {/* Normal download */}
                            <Button
                              className="absolute bottom-2 right-2 size-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-white hover:bg-white/80"
                              onClick={() => handleDownload(imgUrl, i)}
                              title="Download"
                            >
                              <Download className="size-4 text-black" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="flex flex-col space-y-2 mt-4">
                      <h3 className="font-semibold">Preview w/ Logo</h3>
                      <div className="grid grid-cols-2 gap-2">
                        {combinedPreviews.map((previewUrl, i) => (
                          <div
                            key={i}
                            className="aspect-square relative rounded border border-gray-200 dark:border-gray-800 overflow-hidden group"
                          >
                            <NextImage
                              src={previewUrl}
                              alt={`Combined preview ${i}`}
                              fill
                              sizes="(max-width: 768px) 100vw, 448px"
                              className="object-cover"
                            />
                            {/* Download w/ Logo */}
                            <Button
                              variant="outline"
                              className="absolute bottom-2 right-2 size-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-white hover:bg-white/80"
                              onClick={() => handleDownloadWithLogo(generatedImages[i], i)}
                              title="Download w/ Logo"
                            >
                              <Download className="size-4 text-black" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* "Images generated by Ideogram AI." + small logo */}
                    {generatedImages.length > 0 && (
                      <div className="mt-3 flex items-center text-xs text-gray-500 dark:text-gray-400">
                        <span className="mr-1">Images generated by Ideogram AI.</span>
                        <NextImage
                          src="/ideogramlogo.png"
                          alt="Ideogram Logo"
                          width={80}
                          height={80}
                        />
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* TEXT TAB */}
          <TabsContent value="text">
            <Card>
              <CardHeader>
                <CardTitle>AI Text Content</CardTitle>
                <CardDescription>
                  Generate engaging social media posts using AI
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Left side - Input */}
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">
                        Enter your content prompt
                      </label>
                      <Textarea
                        value={textPrompt}
                        onChange={(e) => setTextPrompt(e.target.value)}
                        placeholder="Describe what kind of content you want to generate..."
                        className="min-h-[100px]"
                      />
                    </div>
                    <Button
                      className="w-full"
                      onClick={handleGenerateText}
                      disabled={isGeneratingText}
                    >
                      {isGeneratingText ? "Generating..." : "Generate Content"}
                    </Button>
                  </div>

                  {/* Right side - Previews */}
                  <div className="space-y-6">
                    {/* Twitter Preview */}
                    <div className="relative border rounded-xl p-4 space-y-3 bg-white dark:bg-gray-800">
                      <div className="absolute top-4 right-4">
                        <Twitter className="size-5 text-[#1DA1F2]" />
                      </div>
                      <div className="flex items-center space-x-3">
                        <div className="size-10 rounded-full overflow-hidden">
                          <NextImage
                            src="/Reeplylogoicon.png"
                            alt="Reeply Logo"
                            width={40}
                            height={40}
                            className="object-cover"
                          />
                        </div>
                        <div>
                          <div className="font-bold">Reeply AI</div>
                          <div className="text-gray-500">@reeplyai</div>
                        </div>
                      </div>
                      <div className="text-gray-900 dark:text-gray-100">{content.twitter}</div>
                      <div className="text-gray-500 text-sm">12:00 PM · Jan 1, 2024</div>
                      <button
                        onClick={() => handleCopy("twitter")}
                        className="absolute bottom-4 right-4 p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
                        title="Copy content"
                      >
                        {copiedStates.twitter ? (
                          <Check className="size-4 text-green-500" />
                        ) : (
                          <Copy className="size-4 text-gray-500" />
                        )}
                      </button>
                    </div>

                    {/* LinkedIn Preview */}
                    <div className="relative border rounded-xl p-4 space-y-3 bg-white dark:bg-gray-800">
                      <div className="absolute top-4 right-4">
                        <Linkedin className="size-5 text-[#0A66C2]" />
                      </div>
                      <div className="flex items-center space-x-3">
                        <div className="size-12 rounded-full overflow-hidden">
                          <NextImage
                            src="/Reeplylogoicon.png"
                            alt="Reeply Logo"
                            width={48}
                            height={48}
                            className="object-cover"
                          />
                        </div>
                        <div>
                          <div className="font-bold">Reeply AI</div>
                          <div className="text-gray-500 text-sm">
                            AI-Powered Marketing Solutions
                          </div>
                        </div>
                      </div>
                      <div className="text-gray-900 dark:text-gray-100 whitespace-pre-line">
                        {content.linkedin}
                      </div>
                      <div className="flex items-center space-x-4 text-gray-500 text-sm">
                        <span>1,234 reactions</span>
                        <span>·</span>
                        <span>100 comments</span>
                      </div>
                      <button
                        onClick={() => handleCopy("linkedin")}
                        className="absolute bottom-4 right-4 p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
                        title="Copy content"
                      >
                        {copiedStates.linkedin ? (
                          <Check className="size-4 text-green-500" />
                        ) : (
                          <Copy className="size-4 text-gray-500" />
                        )}
                      </button>
                    </div>

                    {/* Instagram Preview */}
                    <div className="relative border rounded-xl overflow-hidden bg-white dark:bg-gray-800">
                      <div className="absolute top-4 right-4">
                        <Instagram className="size-5 text-[#E4405F]" />
                      </div>
                      <div className="p-4">
                        <div className="flex items-center space-x-3 mb-4">
                          <div className="size-8 rounded-full overflow-hidden">
                            <NextImage
                              src="/Reeplylogoicon.png"
                              alt="Reeply Logo"
                              width={32}
                              height={32}
                              className="object-cover"
                            />
                          </div>
                          <div className="font-bold">reeplyai</div>
                        </div>
                        <div className="text-gray-900 dark:text-gray-100 whitespace-pre-line">
                          {content.instagram}
                        </div>
                      </div>
                      <div className="border-t p-4 space-y-2">
                        <div className="flex space-x-4">
                          <span>❤️ 1,234 likes</span>
                        </div>
                        <div className="text-gray-500 text-sm">2 HOURS AGO</div>
                      </div>
                      <button
                        onClick={() => handleCopy("instagram")}
                        className="absolute bottom-4 right-4 p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
                        title="Copy content"
                      >
                        {copiedStates.instagram ? (
                          <Check className="size-4 text-green-500" />
                        ) : (
                          <Copy className="size-4 text-gray-500" />
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
