"use client"

import React, { useState, useEffect } from "react"
import NextImage from "next/image"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/components/ui/use-toast"
import { Download } from "lucide-react"

// ----- Server Actions (or adjust your imports as needed) -----
import { generateImages } from "@/app/actions/generate-image"

interface AiImageTabProps {
  // If you have a separate server action for prompt improvement, pass it here:
  improvePrompt: (prompt: string) => Promise<string>
}

// 1. Helper: Convert a base64 data URL → File
function dataURLtoFile(dataURL: string, fileName: string, mimeType: string): File {
  const arr = dataURL.split(",")
  const bstr = atob(arr[1]) // decode base64
  let n = bstr.length
  const u8arr = new Uint8Array(n)
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n)
  }
  return new File([u8arr], fileName, { type: mimeType })
}

// 2. Helper: Fetch a normal URL → Blob → File
async function urlToFile(url: string, fileName: string): Promise<File> {
  const response = await fetch(url)
  if (!response.ok) {
    throw new Error(`Failed to fetch image from ${url}`)
  }
  const blob = await response.blob()
  // Try to preserve the MIME type; default to image/png if unknown
  const type = blob.type || "image/png"
  return new File([blob], fileName, { type })
}

export default function AiImageTab({ improvePrompt }: AiImageTabProps) {
  const { toast } = useToast()

  // ---------- Prompt & Generation ----------
  const [imagePrompt, setImagePrompt] = useState("")
  const [isGeneratingImages, setIsGeneratingImages] = useState(false)
  const [generatedImages, setGeneratedImages] = useState<string[]>([]) // Could be direct URLs or base64

  const [isImprovingImagePrompt, setIsImprovingImagePrompt] = useState(false)

  // ---------- Logo Overlay ----------
  const [logoUrl, setLogoUrl] = useState<string>("") // base64 or direct URL if you prefer
  const [overlayPosition, setOverlayPosition] = useState("top-left")
  const [combinedPreviews, setCombinedPreviews] = useState<string[]>([]) // Overlaid images

  // ---------- Selection of images to save ----------
  const [selectedImages, setSelectedImages] = useState<number[]>([])

  // Toggle selection for a given image index
  function toggleImageSelected(index: number) {
    setSelectedImages((prev) =>
      prev.includes(index) ? prev.filter((i) => i !== index) : [...prev, index]
    )
  }

  // ----------- 1) Generate Images -----------
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
      if (result.success && result.images) {
        const validUrls = result.images.filter((url: unknown) => typeof url === "string") as string[]
        setGeneratedImages(validUrls)
        setCombinedPreviews([]) // Reset combined previews
        setSelectedImages([])   // Reset selections
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

  // ----------- 2) Improve Prompt -----------
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

  // ----------- 3) Logo Upload -----------
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

  // ----------- 4) Combine Images (Overlays) -----------
  async function combineImages(backgroundUrl: string, overlayUrl: string, position: string) {
    return new Promise<string>((resolve, reject) => {
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
        canvas.width = background.width
        canvas.height = background.height
        ctx.drawImage(background, 0, 0)

        overlay.onload = () => {
          let x = 0
          let y = 0

          // Decide Y
          if (position.includes("bottom")) {
            y = canvas.height - overlay.height
          } else if (position.includes("middle") || position.includes("center")) {
            y = (canvas.height - overlay.height) / 2
          } else {
            y = 0 // top
          }

          // Decide X
          if (position.includes("right")) {
            x = canvas.width - overlay.width
          } else if (position.includes("center")) {
            x = (canvas.width - overlay.width) / 2
          } else {
            x = 0 // left
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

  // Rebuild combined previews whenever generatedImages, logoUrl, or overlayPosition changes
  useEffect(() => {
    async function updateLogoPreviews() {
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

    updateLogoPreviews()
  }, [generatedImages, logoUrl, overlayPosition])

  // ----------- 5) Download Handlers -----------
  async function handleDownload(imageUrl: string, index: number) {
    try {
      const response = await fetch(imageUrl)
      if (!response.ok) throw new Error("Failed to fetch image for download")

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
      const res = await fetch(finalUrl)
      if (!res.ok) throw new Error("Failed to fetch combined image for download")

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

  // ----------- 6) Save Selected Images to the New Route (/api/content-library-upload) -----------
  async function handleSaveSelectedImagesToLibrary() {
    if (selectedImages.length === 0) {
      toast({
        title: "No images selected",
        description: "Please select at least one image to save.",
        variant: "destructive",
      })
      return
    }

    try {
      const formData = new FormData()
      // For demonstration, let's pass userId and a "type" to the route
      formData.append("userId", "user123") // or your real user/campaign ID
      formData.append("type", "image")

      // Decide if you want to upload the overlaid images or the originals
      const sourceArray = combinedPreviews.length > 0 ? combinedPreviews : generatedImages

      for (let i = 0; i < selectedImages.length; i++) {
        const index = selectedImages[i]
        const img = sourceArray[index] // could be base64 or normal URL

        if (img.startsWith("data:image")) {
          // It's a base64 data URL => use dataURLtoFile
          const file = dataURLtoFile(img, `selected_${Date.now()}_${index}.png`, "image/png")
          formData.append("files", file)
        } else {
          // It's a normal URL => fetch => convert to File
          const file = await urlToFile(img, `selected_${Date.now()}_${index}.png`)
          formData.append("files", file)
        }
      }

      // ----- CHANGED: We now call the new route for your aicontentlibrary bucket -----
      const res = await fetch("/api/content-library-upload", {
        method: "POST",
        body: formData,
      })

      if (!res.ok) {
        throw new Error(`Upload failed: ${res.statusText}`)
      }

      const data = await res.json()
      console.log("New S3 URLs => ", data.urls)

      toast({
        title: "Success",
        description: "Selected images saved to your content library!",
      })

      // Optionally: do something else (e.g. refresh a list) 
    } catch (err) {
      console.error("Error saving images:", err)
      toast({
        title: "Error",
        description: "Failed to save images to the library.",
        variant: "destructive",
      })
    }
  }

  // ----------- Render -----------
  return (
    <Card>
      <CardHeader>
        <CardTitle>AI Image Creatives</CardTitle>
        <CardDescription>
          Generate custom images and visual assets for your campaigns
        </CardDescription>
      </CardHeader>

      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Left side: prompt, improve button, generate button, logo upload, etc. */}
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Enter your image prompt</label>
              <Textarea
                value={imagePrompt}
                onChange={(e) => setImagePrompt(e.target.value)}
                placeholder="Describe the images you want to generate..."
                className="min-h-[100px]"
              />
            </div>

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

            {/* Logo Upload */}
            <div className="mt-4 space-y-2">
              <label className="text-sm font-medium">Upload Your Logo</label>
              <Input type="file" accept="image/*" onChange={handleLogoUpload} />
            </div>

            {/* Logo Position */}
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

            {/* Save Selected Button */}
            <Button variant="outline" onClick={handleSaveSelectedImagesToLibrary}>
              Save Selected to Library
            </Button>
          </div>

          {/* Right side: Original vs Overlaid Previews */}
          <div className="space-y-4">
            {/* Original Images */}
            <div className="flex flex-col space-y-2">
              <h3 className="font-semibold">Original Images</h3>
              <div className="grid grid-cols-2 gap-2">
                {generatedImages.map((imgUrl, i) => {
                  const isSelected = selectedImages.includes(i)
                  return (
                    <div
                      key={i}
                      className="relative aspect-square rounded border border-gray-200 dark:border-gray-800 overflow-hidden group"
                    >
                      <NextImage
                        src={imgUrl}
                        alt={`AI Img ${i}`}
                        fill
                        sizes="(max-width: 768px) 100vw, 448px"
                        className="object-cover"
                      />
                      {/* Download button */}
                      <Button
                        className="absolute bottom-2 right-2 size-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-white hover:bg-white/80"
                        onClick={() => handleDownload(imgUrl, i)}
                        title="Download"
                      >
                        <Download className="size-4 text-black" />
                      </Button>

                      {/* Checkbox to select this image */}
                      <input
                        type="checkbox"
                        className="absolute top-2 left-2 w-5 h-5"
                        checked={isSelected}
                        onChange={() => toggleImageSelected(i)}
                        title="Select this image"
                      />
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Overlaid Previews (if logoUrl is set) */}
            <div className="flex flex-col space-y-2 mt-4">
              <h3 className="font-semibold">Preview w/ Logo</h3>
              <div className="grid grid-cols-2 gap-2">
                {combinedPreviews.map((previewUrl, i) => {
                  const isSelected = selectedImages.includes(i)
                  return (
                    <div
                      key={i}
                      className="relative aspect-square rounded border border-gray-200 dark:border-gray-800 overflow-hidden group"
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

                      {/* Checkbox to select this overlaid image */}
                      <input
                        type="checkbox"
                        className="absolute top-2 left-2 w-5 h-5"
                        checked={isSelected}
                        onChange={() => toggleImageSelected(i)}
                        title="Select this overlaid image"
                      />
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Example note/branding */}
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
  )
}
