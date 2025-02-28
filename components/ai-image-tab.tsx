"use client"

import React, { useState, useEffect, useRef, useCallback } from "react"
import NextImage from "next/image"
import { AlertCircle, Download, ImagePlus, Save, Upload, Info, CheckCircle2 } from "lucide-react"
import { useTheme } from "next-themes" // You'll need to install next-themes
// Import the AspectRatio type along with the server action
import { generateImages } from "@/app/actions/generate-image"
// Import the AspectRatio type - add this to your file
import type { AspectRatio } from "@/app/actions/generate-image"
// ----- Server Actions (or adjust your imports as needed) -----

// Simple Magic Icon component
const Magic = ({ className }: { className?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M12 2L14.4 7.2L20 8.4L16 12.4L17.2 18L12 15.2L6.8 18L8 12.4L4 8.4L9.6 7.2L12 2Z" />
  </svg>
)

// Simple Sparkles Icon component
const Sparkles = ({ className }: { className?: string }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={className}
  >
    <path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z"/>
    <path d="M5 3l.9 2.6L9 7l-3.1 1.4L5 11l-.9-2.6L1 7l3.1-1.4z"/>
    <path d="M18 3l.9 2.6L22 7l-3.1 1.4L18 11l-.9-2.6L14 7l3.1-1.4z"/>
  </svg>
)

interface AiImageTabProps {
  improvePrompt: (prompt: string) => Promise<string>
}

// Helper functions
function dataURLtoFile(dataURL: string, fileName: string, mimeType: string): File {
  const arr = dataURL.split(",")
  const bstr = atob(arr[1])
  let n = bstr.length
  const u8arr = new Uint8Array(n)
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n)
  }
  return new File([u8arr], fileName, { type: mimeType })
}

async function urlToFile(url: string, fileName: string): Promise<File> {
  const response = await fetch(url)
  if (!response.ok) {
    throw new Error(`Failed to fetch image from ${url}`)
  }
  const blob = await response.blob()
  const type = blob.type || "image/png"
  return new File([blob], fileName, { type })
}

// Function to map aspect ratios to CSS classes
function getAspectRatioClass(format: string): string {
  switch(format) {
    case "16:9": return "aspect-video"; // 16:9 is represented by aspect-video in Tailwind
    case "9:16": return "aspect-[9/16]";
    case "4:3": return "aspect-[4/3]";
    case "3:4": return "aspect-[3/4]";
    case "2:3": return "aspect-[2/3]";
    case "3:2": return "aspect-[3/2]";
    default: return "aspect-square"; // 1:1 as default
  }
}

export default function AiImageTab({ improvePrompt }: AiImageTabProps) {
  const { theme } = useTheme()
  const fileInputRef = useRef<HTMLInputElement>(null)

  // State management
  const [imagePrompt, setImagePrompt] = useState("")
  const [isGeneratingImages, setIsGeneratingImages] = useState(false)
  const [generatedImages, setGeneratedImages] = useState<string[]>([])
  const [isImprovingImagePrompt, setIsImprovingImagePrompt] = useState(false)
  const [logoUrl, setLogoUrl] = useState<string>("")
  const [overlayPosition, setOverlayPosition] = useState("bottom-right")
  const [combinedPreviews, setCombinedPreviews] = useState<string[]>([])
  const [selectedImages, setSelectedImages] = useState<number[]>([])
  const [activeTab, setActiveTab] = useState("original")
  const [isSaving, setIsSaving] = useState(false)
  const [promptHistory, setPromptHistory] = useState<string[]>([])
  const [logoSize, setLogoSize] = useState(20) // As percentage of image width
  const [toastMessage, setToastMessage] = useState<{title: string, description: string, type: 'success' | 'error'} | null>(null)
  const [imageFormat, setImageFormat] = useState("1:1") // Default to square

  // Show toast notification
  const showToast = (title: string, description: string, type: 'success' | 'error') => {
    setToastMessage({ title, description, type })
    setTimeout(() => setToastMessage(null), 3000)
  }

  // Toggle selection for a given image index
  function toggleImageSelected(index: number) {
    setSelectedImages((prev) =>
      prev.includes(index) ? prev.filter((i) => i !== index) : [...prev, index]
    )
  }

  // Handle clear selections
  function clearSelections() {
    setSelectedImages([])
  }

  // Handle select all
  function selectAll() {
    // Fixed iterator issue by using Array.from instead
    const allIndices = Array.from({ length: generatedImages.length }, (_, i) => i)
    setSelectedImages(allIndices)
  }

  // Save prompt to history
  function savePromptToHistory(prompt: string) {
    const trimmedPrompt = prompt.trim()
    if (trimmedPrompt && !promptHistory.includes(trimmedPrompt)) {
      setPromptHistory(prev => [trimmedPrompt, ...prev.slice(0, 4)])
    }
  }

  // Image generation
  async function handleImageGenerate() {
    if (!imagePrompt.trim()) {
      showToast("Missing prompt", "Please enter an image description first.", "error")
      return
    }
    
    setIsGeneratingImages(true)
    
    try {
      savePromptToHistory(imagePrompt)
      
      // Pass the imageFormat as the second parameter
      const result = await generateImages(imagePrompt, imageFormat as AspectRatio)
      if (result.success && result.images) {
        const validUrls = result.images.filter((url: unknown) => typeof url === "string") as string[]
        setGeneratedImages(validUrls)
        setCombinedPreviews([])
        setSelectedImages([])
        
        showToast(
          "Images generated", 
          `Created ${validUrls.length} image${validUrls.length !== 1 ? 's' : ''} successfully`, 
          "success"
        )
      } else {
        throw new Error(result.error || "Failed to generate images.")
      }
    } catch (err) {
      console.error("Error generating images:", err)
      showToast(
        "Generation failed", 
        "Unable to create images. Please try again with a different prompt.", 
        "error"
      )
    } finally {
      setIsGeneratingImages(false)
    }
  }

  // Improve prompt
  async function handleImproveImagePrompt() {
    if (!imagePrompt.trim()) {
      showToast("No prompt to improve", "Please enter an image description first.", "error")
      return
    }
    
    setIsImprovingImagePrompt(true)
    
    try {
      const improved = await improvePrompt(imagePrompt)
      setImagePrompt(improved)
      showToast(
        "Prompt enhanced", 
        "Your description has been improved with AI assistance.", 
        "success"
      )
    } catch (err) {
      console.error("Error improving image prompt:", err)
      showToast(
        "Enhancement failed", 
        "Unable to improve your prompt. Please try again.", 
        "error"
      )
    } finally {
      setIsImprovingImagePrompt(false)
    }
  }

  // Logo upload
  function handleLogoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0]
      
      // Validate file size (5MB max)
      if (file.size > 5 * 1024 * 1024) {
        showToast("File too large", "Logo file must be smaller than 5MB.", "error")
        return
      }
      
      const reader = new FileReader()
      reader.onload = () => {
        if (reader.result) {
          setLogoUrl(reader.result as string)
          showToast(
            "Logo uploaded", 
            "Your logo has been added and can be positioned on images.", 
            "success"
          )
        }
      }
      reader.readAsDataURL(file)
    }
  }

  // Trigger file input click
  function handleLogoButtonClick() {
    if (fileInputRef.current) {
      fileInputRef.current.click()
    }
  }

  // Clear logo
  function handleClearLogo() {
    setLogoUrl("")
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
    showToast("Logo removed", "Your logo has been cleared.", "success")
  }

  // Combine images (wrapped in useCallback to prevent dependency warnings)
  const combineImages = useCallback(async (backgroundUrl: string, overlayUrl: string, position: string) => {
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
          // Calculate logo size based on percentage setting
          const maxWidth = Math.floor(canvas.width * (logoSize / 100))
          
          // Calculate aspect-correct height
          const aspectRatio = overlay.width / overlay.height
          const scaledWidth = Math.min(maxWidth, overlay.width)
          const scaledHeight = scaledWidth / aspectRatio
          
          let x = 0
          let y = 0
          const padding = Math.floor(canvas.width * 0.03) // 3% padding

          // Decide Y
          if (position.includes("bottom")) {
            y = canvas.height - scaledHeight - padding
          } else if (position.includes("middle") || position.includes("center")) {
            y = (canvas.height - scaledHeight) / 2
          } else {
            y = padding // top with padding
          }

          // Decide X
          if (position.includes("right")) {
            x = canvas.width - scaledWidth - padding
          } else if (position.includes("center")) {
            x = (canvas.width - scaledWidth) / 2
          } else {
            x = padding // left with padding
          }

          ctx.drawImage(overlay, x, y, scaledWidth, scaledHeight)
          const finalUrl = canvas.toDataURL("image/png")
          resolve(finalUrl)
        }
        overlay.onerror = (err) => reject(err)
        overlay.src = overlayUrl
      }

      background.onerror = (err) => reject(err)
      background.src = backgroundUrl
    })
  }, [logoSize])

  // Update logo previews
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
  }, [generatedImages, logoUrl, overlayPosition, logoSize, combineImages])

  // Download image
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

      showToast("Download complete", "Image saved successfully to your device.", "success")
    } catch (error) {
      console.error("Error downloading image:", error)
      showToast("Download failed", "Unable to download the image. Please try again.", "error")
    }
  }

  // Download with logo
  async function handleDownloadWithLogo(aiImageUrl: string, index: number) {
    if (!logoUrl) {
      showToast("Logo missing", "Please upload a logo first.", "error")
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

      showToast("Download complete", "Image with logo saved successfully to your device.", "success")
    } catch (err) {
      console.error("Error combining/downloading image:", err)
      showToast("Download failed", "Unable to download the image with logo. Please try again.", "error")
    }
  }

  // Save to library
  async function handleSaveSelectedImagesToLibrary() {
    if (selectedImages.length === 0) {
      showToast("No images selected", "Please select at least one image to save to your library.", "error")
      return
    }

    setIsSaving(true)

    try {
      const formData = new FormData()
      formData.append("userId", "user123")
      formData.append("type", "image")

      // Use images from the active tab (original or with logo)
      const sourceArray = activeTab === "withLogo" && combinedPreviews.length > 0 
        ? combinedPreviews 
        : generatedImages

      for (let i = 0; i < selectedImages.length; i++) {
        const index = selectedImages[i]
        const img = sourceArray[index]

        if (img.startsWith("data:image")) {
          const file = dataURLtoFile(img, `selected_${Date.now()}_${index}.png`, "image/png")
          formData.append("files", file)
        } else {
          const file = await urlToFile(img, `selected_${Date.now()}_${index}.png`)
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
        `${selectedImages.length} image${selectedImages.length !== 1 ? 's' : ''} saved to your content library.`, 
        "success"
      )

      clearSelections()
    } catch (err) {
      console.error("Error saving images:", err)
      showToast("Save failed", "Unable to save images to your library. Please try again.", "error")
    } finally {
      setIsSaving(false)
    }
  }

  const isDarkMode = theme === "dark"

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
            <ImagePlus className={`size-5 ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`} />
            <span className={isDarkMode ? 'text-white' : 'text-gray-900'}>AI Image Generator</span>
          </h2>
          <p className={`text-sm mt-1.5 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
            Create professional images with AI and customize them with your branding
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          {generatedImages.length > 0 && (
            <span className={`inline-flex text-xs font-medium px-2.5 py-0.5 rounded-full ${
              isDarkMode ? 'bg-blue-900 text-blue-200' : 'bg-blue-100 text-blue-800'
            }`}>
              {generatedImages.length} image{generatedImages.length !== 1 ? 's' : ''} generated
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
                <label htmlFor="imagePrompt" className={`text-sm font-medium ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}>
                  Describe the image you want
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
                id="imagePrompt"
                value={imagePrompt}
                onChange={(e) => setImagePrompt(e.target.value)}
                placeholder="A professional image of a business person working in a modern office, soft lighting, deep focus..."
                className={`w-full min-h-[120px] resize-none p-3 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none ${
                  isDarkMode 
                    ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                    : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'
                }`}
              />

              <div className="flex flex-col gap-3">
                <div className={`space-y-2 ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}>
                  <label htmlFor="imageFormat" className="block text-sm font-medium">
                    Image Format
                  </label>
                  <select
                    id="imageFormat"
                    value={imageFormat}
                    onChange={(e) => setImageFormat(e.target.value)}
                    className={`w-full p-2 text-sm rounded-md ${
                      isDarkMode
                        ? 'bg-gray-700 border-gray-600 text-gray-200'
                        : 'bg-white border-gray-300 text-gray-700'
                    }`}
                  >
                    <option value="1:1">Square (1:1)</option>
                    <option value="16:9">Landscape (16:9)</option>
                    <option value="9:16">Portrait (9:16)</option>
                    <option value="4:3">Landscape (4:3)</option>
                    <option value="3:4">Portrait (3:4)</option>
                    <option value="2:3">Portrait (2:3)</option>
                    <option value="3:2">Landscape (3:2)</option>
                  </select>
                </div>
              </div>
              
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
                        onClick={() => setImagePrompt(prompt)}
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
                onClick={handleImproveImagePrompt}
                disabled={!imagePrompt.trim() || isImprovingImagePrompt}
                className={`flex justify-center items-center w-full py-2 px-4 border rounded-md text-sm font-medium 
                  ${!imagePrompt.trim() || isImprovingImagePrompt 
                    ? isDarkMode 
                      ? 'bg-gray-700 text-gray-500 cursor-not-allowed border-gray-700' 
                      : 'bg-gray-100 text-gray-400 cursor-not-allowed border-gray-200'
                    : isDarkMode
                      ? 'bg-gray-700 text-gray-200 hover:bg-gray-600 border-gray-600' 
                      : 'bg-white text-gray-700 hover:bg-gray-50 border-gray-300'
                  }`}
              >
                <Magic className="mr-2 size-4" />
                {isImprovingImagePrompt ? "Enhancing..." : "Enhance prompt with AI"}
              </button>

              <button
                type="button"
                onClick={handleImageGenerate}
                disabled={!imagePrompt.trim() || isGeneratingImages}
                className={`flex justify-center items-center w-full py-2 px-4 rounded-md text-sm font-medium 
                  ${!imagePrompt.trim() || isGeneratingImages 
                    ? isDarkMode
                      ? 'bg-blue-800 cursor-not-allowed text-blue-300'
                      : 'bg-blue-300 cursor-not-allowed text-white'
                    : isDarkMode
                      ? 'bg-blue-600 hover:bg-blue-700 text-white'
                      : 'bg-blue-600 hover:bg-blue-700 text-white'
                  }`}
              >
                <ImagePlus className="mr-2 size-4" />
                {isGeneratingImages ? "Generating..." : "Create images"}
              </button>
            </div>
            
            <hr className={isDarkMode ? 'border-gray-700' : 'border-gray-200'} />
            
            {/* Logo and branding section */}
            <div className="space-y-4">
              <div>
                <h3 className={`text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}>Brand your images</h3>
                
                <div className="flex items-center gap-2">
                  <button 
                    type="button"
                    onClick={handleLogoButtonClick}
                    className={`flex items-center justify-center py-1.5 px-3 text-sm font-medium rounded-md flex-1 
                      ${logoUrl 
                        ? isDarkMode
                          ? 'bg-gray-700 text-gray-200 border border-gray-600 hover:bg-gray-600'
                          : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                        : isDarkMode
                          ? 'bg-blue-600 hover:bg-blue-700 text-white'
                          : 'bg-blue-600 hover:bg-blue-700 text-white'
                      }`}
                  >
                    <Upload className="mr-2 size-4" />
                    {logoUrl ? "Change logo" : "Upload logo"}
                  </button>
                  
                  {logoUrl && (
                    <button
                      type="button"
                      onClick={handleClearLogo}
                      className={`py-1.5 px-3 text-sm font-medium rounded-md ${
                        isDarkMode
                          ? 'bg-gray-700 text-gray-200 border border-gray-600 hover:bg-gray-600'
                          : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      Clear
                    </button>
                  )}
                  
                  <input 
                    type="file" 
                    accept="image/*" 
                    ref={fileInputRef}
                    onChange={handleLogoUpload} 
                    className="hidden" 
                  />
                </div>
                
                {logoUrl && (
                  <div className={`mt-3 p-2 rounded-md ${
                    isDarkMode ? 'bg-gray-700 border border-gray-600' : 'bg-gray-50 border border-gray-200'
                  }`}>
                    <div className="flex items-center gap-3">
                      <div className={`relative size-12 rounded-md overflow-hidden ${
                        isDarkMode ? 'bg-gray-800 border border-gray-600' : 'bg-white border border-gray-200'
                      }`}>
                        <NextImage
                          src={logoUrl}
                          alt="Your logo"
                          fill
                          sizes="48px"
                          className="object-contain"
                        />
                      </div>
                      <div className="flex-1">
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label htmlFor="logo-position" className={`text-xs block mb-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>Position</label>
                            <select 
                              id="logo-position" 
                              value={overlayPosition} 
                              onChange={(e) => setOverlayPosition(e.target.value)}
                              className={`w-full h-8 px-2 py-1 text-sm rounded-md ${
                                isDarkMode
                                  ? 'bg-gray-800 border-gray-600 text-gray-200'
                                  : 'bg-white border-gray-300 text-gray-700'
                              }`}
                            >
                              <option value="top-left">Top Left</option>
                              <option value="top-center">Top Center</option>
                              <option value="top-right">Top Right</option>
                              <option value="middle-center">Center</option>
                              <option value="bottom-left">Bottom Left</option>
                              <option value="bottom-center">Bottom Center</option>
                              <option value="bottom-right">Bottom Right</option>
                            </select>
                          </div>
                          <div>
                            <label htmlFor="logo-size" className={`text-xs block mb-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>Size (%)</label>
                            <select 
                              id="logo-size" 
                              value={logoSize.toString()} 
                              onChange={(e) => setLogoSize(parseInt(e.target.value))}
                              className={`w-full h-8 px-2 py-1 text-sm rounded-md ${
                                isDarkMode
                                  ? 'bg-gray-800 border-gray-600 text-gray-200'
                                  : 'bg-white border-gray-300 text-gray-700'
                              }`}
                            >
                              <option value="10">10%</option>
                              <option value="15">15%</option>
                              <option value="20">20%</option>
                              <option value="25">25%</option>
                              <option value="30">30%</option>
                            </select>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
          
          {/* Right panel: Generated images display */}
          <div className="lg:col-span-2">
            {generatedImages.length === 0 ? (
              <div className={`border border-dashed rounded-lg p-8 flex flex-col items-center justify-center h-full min-h-[300px] text-center ${
                isDarkMode ? 'border-gray-700' : 'border-gray-200'
              }`}>
                <div className={`p-3 rounded-full mb-3 ${isDarkMode ? 'bg-blue-900' : 'bg-blue-100'}`}>
                  <ImagePlus className={`size-6 ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`} />
                </div>
                <h3 className={`text-lg font-medium mb-1 ${isDarkMode ? 'text-gray-200' : 'text-gray-800'}`}>No images generated yet</h3>
                <p className={`text-sm max-w-md mb-4 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  Enter a descriptive prompt and click &ldquo;Create images&rdquo; to generate AI images for your project.
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
                            onClick={() => setActiveTab("original")}
                            className={`py-2 px-4 text-sm font-medium border-b-2 ${
                              activeTab === "original" 
                                ? isDarkMode
                                  ? 'border-blue-500 text-blue-400'
                                  : 'border-blue-600 text-blue-600'
                                : isDarkMode
                                  ? 'border-transparent text-gray-400 hover:text-gray-300'
                                  : 'border-transparent text-gray-500 hover:text-gray-700'
                            }`}
                          >
                            Original
                          </button>
                          
                          {logoUrl && combinedPreviews.length > 0 && (
                            <button
                              type="button"
                              onClick={() => setActiveTab("withLogo")}
                              className={`py-2 px-4 text-sm font-medium border-b-2 ${
                                activeTab === "withLogo" 
                                  ? isDarkMode
                                    ? 'border-blue-500 text-blue-400'
                                    : 'border-blue-600 text-blue-600'
                                  : isDarkMode
                                    ? 'border-transparent text-gray-400 hover:text-gray-300'
                                    : 'border-transparent text-gray-500 hover:text-gray-700'
                              }`}
                            >
                              With Logo
                            </button>
                          )}
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <div className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                            {selectedImages.length} selected
                          </div>
                          <button 
                            type="button"
                            onClick={selectAll}
                            disabled={generatedImages.length === 0}
                            className={`py-1 px-2 text-xs font-medium rounded border 
                              ${generatedImages.length === 0 
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
                          {selectedImages.length > 0 && (
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
                      {activeTab === "original" && (
                        <div className={`grid grid-cols-2 md:grid-cols-2 gap-3 ${
                          imageFormat === "9:16" || imageFormat === "2:3" || imageFormat === "3:4" 
                            ? "md:grid-cols-3" // More columns for portrait images
                            : "md:grid-cols-2" // Fewer columns for landscape images
                        }`}>
                          {generatedImages.map((imgUrl, i) => {
                            const isSelected = selectedImages.includes(i)
                            return (
                              <div
                                key={i}
                                className={`relative ${getAspectRatioClass(imageFormat)} rounded-md overflow-hidden group cursor-pointer ${
                                  isSelected 
                                    ? "ring-2 ring-blue-500 ring-offset-2" 
                                    : isDarkMode ? "border-gray-700 border" : "border-gray-300 border"
                                }`}
                                onClick={() => toggleImageSelected(i)}
                              >
                                <NextImage
                                  src={imgUrl}
                                  alt={`Generated image ${i+1}`}
                                  fill
                                  sizes="(max-width: 768px) 100vw, 448px"
                                  className="object-contain"
                                />
                                
                                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100">
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleDownload(imgUrl, i);
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
                      )}
                      
                      {activeTab === "withLogo" && logoUrl && combinedPreviews.length > 0 && (
                        <div className={`grid grid-cols-2 md:grid-cols-2 gap-3 ${
                          imageFormat === "9:16" || imageFormat === "2:3" || imageFormat === "3:4" 
                            ? "md:grid-cols-3" // More columns for portrait images
                            : "md:grid-cols-2" // Fewer columns for landscape images
                        }`}>
                          {combinedPreviews.map((previewUrl, i) => {
                            const isSelected = selectedImages.includes(i)
                            return (
                              <div
                                key={i}
                                className={`relative ${getAspectRatioClass(imageFormat)} rounded-md overflow-hidden group cursor-pointer ${
                                  isSelected 
                                    ? "ring-2 ring-blue-500 ring-offset-2" 
                                    : isDarkMode ? "border-gray-700 border" : "border-gray-300 border"
                                }`}
                                onClick={() => toggleImageSelected(i)}
                              >
                                <NextImage
                                  src={previewUrl}
                                  alt={`Branded image ${i+1}`}
                                  fill
                                  sizes="(max-width: 768px) 100vw, 448px"
                                  className="object-contain"
                                />
                                
                                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100">
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleDownloadWithLogo(generatedImages[i], i);
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
                      )}
                    </div>
                  </div>
                </div>
                
                {generatedImages.length > 0 && (
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
      
      {generatedImages.length > 0 && (
        <div className={`flex justify-between items-center border-t p-4 ${
          isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-200'
        }`}>
          <div className="flex items-center text-xs text-gray-500">
            <span className={`mr-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              Powered by Ideogram AI
            </span>
            <NextImage
              src="/ideogramlogo.png"
              alt="Ideogram Logo"
              width={60}
              height={60}
            />
          </div>
          
          <button 
            type="button"
            onClick={handleSaveSelectedImagesToLibrary}
            disabled={selectedImages.length === 0 || isSaving}
            className={`flex items-center gap-2 py-2 px-4 rounded-md text-sm font-medium 
              ${selectedImages.length === 0 || isSaving
                ? isDarkMode
                  ? 'bg-blue-800 cursor-not-allowed text-blue-300'
                  : 'bg-blue-300 cursor-not-allowed text-white'
                : 'bg-blue-600 hover:bg-blue-700 text-white'}`}
          >
            <Save className="size-4" />
            {isSaving ? 'Saving...' : `Save ${selectedImages.length > 0 ? selectedImages.length : ''} to Library`}
          </button>
        </div>
      )}
    </div>
  )
}