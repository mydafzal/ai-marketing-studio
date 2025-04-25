"use client"

import React, { useState, useRef, useEffect } from "react"
import NextImage from "next/image"
import { AlertCircle, Download, ImagePlus, Save, Upload, Info, CheckCircle2, Sparkles, X, Maximize2, X as XIcon } from "lucide-react"
import { useTheme } from "next-themes"
import { generateImages, AspectRatio } from "@/app/actions/generate-image"

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
    throw new Error(`Failed to fetch image from ${url}`)
  }
  const blob = await response.blob()
  const type = blob.type || "image/png"
  return new File([blob], fileName, { type })
}

interface AiCreativeDirectorTabProps {
  improvePrompt: (prompt: string) => Promise<string>
}

export default function AiCreativeDirectorTab({ improvePrompt }: AiCreativeDirectorTabProps) {
  const { theme } = useTheme()
  const isDarkMode = theme === "dark"
  const fileInputRefs = useRef<(HTMLInputElement | null)[]>([null, null, null, null, null])

  // State management
  const [imagePrompt, setImagePrompt] = useState("")
  const [isGeneratingImages, setIsGeneratingImages] = useState(false)
  const [referenceImages, setReferenceImages] = useState<File[]>([])
  const [generatedImages, setGeneratedImages] = useState<string[]>([])
  const [isImprovingImagePrompt, setIsImprovingImagePrompt] = useState(false)
  const [selectedImages, setSelectedImages] = useState<number[]>([])
  const [isSaving, setIsSaving] = useState(false)
  const [toastMessage, setToastMessage] = useState<{title: string, description: string, type: 'success' | 'error'} | null>(null)
  const [imageFormat, setImageFormat] = useState<AspectRatio>("1:1") // Default to square
  const [previewImage, setPreviewImage] = useState<string | null>(null) // For the image preview modal

  // Show toast notification
  const showToast = (title: string, description: string, type: 'success' | 'error') => {
    setToastMessage({ title, description, type })
    setTimeout(() => setToastMessage(null), 3000)
  }

  // Handle file input change for reference images
  const handleReferenceImageUpload = (index: number) => (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0]
      
      // Validate file size (5MB max)
      if (file.size > 5 * 1024 * 1024) {
        showToast("File too large", "Image file must be smaller than 5MB.", "error")
        return
      }
      
      // Create a copy of the current reference images
      const newReferenceImages = [...referenceImages]
      // Set the file at the specified index
      newReferenceImages[index] = file
      // Update state
      setReferenceImages(newReferenceImages)
      
      showToast("Reference image added", "Your reference image has been uploaded.", "success")
    }
  }

  // Trigger file input click
  const handleImageButtonClick = (index: number) => () => {
    if (fileInputRefs.current[index]) {
      fileInputRefs.current[index]?.click()
    }
  }

  // Remove a reference image
  const handleRemoveReferenceImage = (index: number) => {
    const newReferenceImages = [...referenceImages]
    newReferenceImages[index] = undefined as unknown as File
    setReferenceImages(newReferenceImages)
    
    // Also clear the file input
    if (fileInputRefs.current[index]) {
      (fileInputRefs.current[index] as HTMLInputElement).value = ""
    }
  }

  // Improve prompt with AI
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

  // Generate images based on reference images
  async function handleGenerateImagesWithReferences() {
    const filledReferenceImages = referenceImages.filter(img => img)
    
    if (!imagePrompt.trim()) {
      showToast("Missing prompt", "Please enter an image description first.", "error")
      return
    }
    
    if (filledReferenceImages.length === 0) {
      showToast("Missing reference images", "Please upload at least one reference image.", "error")
      return
    }
    
    setIsGeneratingImages(true)
    
    try {
      // Create form data to send to the server
      const formData = new FormData()
      formData.append('prompt', imagePrompt)
      formData.append('aspectRatio', imageFormat)
      formData.append('numberOfImages', '10')
      
      // Add reference images to the form data
      filledReferenceImages.forEach((img, index) => {
        formData.append(`referenceImage${index}`, img)
      })
      
      // Call our specialized API endpoint for generating images from references
      const response = await fetch('/api/generate-image-from-references', {
        method: 'POST',
        body: formData,
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to generate images with references.")
      }
      
      const result = await response.json()
      
      if (result.success && result.images) {
        const validUrls = result.images.filter((url: unknown) => typeof url === "string") as string[]
        setGeneratedImages(validUrls)
        setSelectedImages([])
        
        showToast(
          "Images generated", 
          `Created ${validUrls.length} image${validUrls.length !== 1 ? 's' : ''} based on your references`, 
          "success"
        )
      } else {
        throw new Error(result.error || "Failed to generate images with references.")
      }
    } catch (err) {
      console.error("Error generating images with references:", err)
      showToast(
        "Generation failed", 
        "Unable to create images. Please try again with different references or prompt.", 
        "error"
      )
    } finally {
      setIsGeneratingImages(false)
    }
  }

  // Open image preview modal
  const openImagePreview = (imageUrl: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent toggling selection
    setPreviewImage(imageUrl);
  };

  // Close image preview modal
  const closeImagePreview = () => {
    setPreviewImage(null);
  };

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
    const allIndices = Array.from({ length: generatedImages.length }, (_, i) => i)
    setSelectedImages(allIndices)
  }

  // Download image
  async function handleDownload(imageUrl: string, index: number) {
    try {
      const response = await fetch(imageUrl)
      if (!response.ok) throw new Error("Failed to fetch image for download")

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.href = url
      link.download = `creative-director-image-${index + 1}.png`
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

      for (let i = 0; i < selectedImages.length; i++) {
        const index = selectedImages[i]
        const img = generatedImages[index]

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

  return (
    <div className={`w-full shadow-sm rounded-lg border ${isDarkMode ? 'bg-container-bg border-border-dark' : 'bg-white border-gray-200'}`}>
      {/* Toast notification */}
      {toastMessage && (
        <div className={`fixed top-4 right-4 z-50 p-4 rounded-md shadow-md transition-all ${
          toastMessage.type === 'success' 
            ? isDarkMode ? 'bg-primary-green/20 border border-primary-green/60' : 'bg-green-100 border border-green-300' 
            : isDarkMode ? 'bg-coral/20 border border-coral/60' : 'bg-red-100 border border-red-300'
        }`}>
          <div className="flex items-start gap-2">
            <div className={toastMessage.type === 'success' 
              ? isDarkMode ? 'text-primary-green' : 'text-green-600' 
              : isDarkMode ? 'text-coral' : 'text-red-600'}>
              {toastMessage.type === 'success' ? <CheckCircle2 className="size-5" /> : <AlertCircle className="size-5" />}
            </div>
            <div>
              <h3 className={`font-medium text-sm ${toastMessage.type === 'success' 
                ? isDarkMode ? 'text-primary-green' : 'text-green-800' 
                : isDarkMode ? 'text-coral' : 'text-red-800'}`}>
                {toastMessage.title}
              </h3>
              <p className={`text-sm ${toastMessage.type === 'success' 
                ? isDarkMode ? 'text-text-white' : 'text-green-700' 
                : isDarkMode ? 'text-text-white' : 'text-red-700'}`}>
                {toastMessage.description}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className={`flex items-center justify-between p-6 border-b ${isDarkMode ? 'border-border-dark' : 'border-gray-200'}`}>
        <div>
          <h2 className="flex items-center gap-2 text-xl font-bold">
            <Sparkles className={`size-5 ${isDarkMode ? 'text-primary-green' : 'text-blue-600'}`} />
            <span className={isDarkMode ? 'text-text-white' : 'text-gray-900'}>AI Creative Director</span>
          </h2>
          <p className={`text-sm mt-1.5 ${isDarkMode ? 'text-text-light-gray' : 'text-gray-500'}`}>
            Create professional images based on reference images you upload
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          {generatedImages.length > 0 && (
            <span className={`inline-flex text-xs font-medium px-2.5 py-0.5 rounded-full ${
              isDarkMode ? 'bg-primary-green/20 text-primary-green' : 'bg-blue-100 text-blue-800'
            }`}>
              {generatedImages.length} image{generatedImages.length !== 1 ? 's' : ''} generated
            </span>
          )}
        </div>
      </div>
      
      <hr className={isDarkMode ? 'border-border-dark' : 'border-gray-200'} />
      
      {/* Main content */}
      <div className="p-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left panel: Reference images and prompt */}
          <div className="lg:col-span-1 space-y-5">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className={`text-base font-medium ${isDarkMode ? 'text-text-white' : 'text-gray-700'}`}>
                  Upload Reference Images
                </h3>
                
                <button 
                  type="button" 
                  className={isDarkMode ? 'text-text-light-gray hover:text-text-white' : 'text-gray-500 hover:text-gray-700'}
                  title="Tips for better results"
                >
                  <Info className="size-4" />
                </button>
              </div>
              
              <p className={`text-sm ${isDarkMode ? 'text-text-light-gray' : 'text-gray-500'}`}>
                Upload up to 5 reference images. The AI will create images inspired by these references.
              </p>
              
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-2">
                {Array.from({ length: 5 }).map((_, index) => (
                  <div 
                    key={index} 
                    className={`relative border-2 rounded-md aspect-square overflow-hidden ${
                      referenceImages[index] 
                        ? isDarkMode ? 'border-primary-green/60' : 'border-green-300' 
                        : isDarkMode ? 'border-dashed border-border-dark' : 'border-dashed border-gray-300'
                    }`}
                  >
                    {referenceImages[index] ? (
                      <>
                        <NextImage
                          src={URL.createObjectURL(referenceImages[index])}
                          alt={`Reference image ${index + 1}`}
                          fill
                          className="object-cover"
                        />
                        <button
                          onClick={() => handleRemoveReferenceImage(index)}
                          className={`absolute top-1 right-1 rounded-full p-1 ${
                            isDarkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-700'
                          }`}
                          title="Remove reference image"
                        >
                          <X className="size-4" />
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={handleImageButtonClick(index)}
                        className={`flex flex-col items-center justify-center w-full h-full p-2 ${
                          isDarkMode ? 'text-text-light-gray hover:text-text-white' : 'text-gray-500 hover:text-gray-700'
                        }`}
                      >
                        <Upload className="size-5 mb-1" />
                        <span className="text-xs font-medium text-center">Image {index + 1}</span>
                      </button>
                    )}
                    <input
                      type="file"
                      accept="image/*"
                      ref={el => fileInputRefs.current[index] = el}
                      onChange={handleReferenceImageUpload(index)}
                      className="hidden"
                    />
                  </div>
                ))}
              </div>
            </div>
            
            <hr className={isDarkMode ? 'border-border-dark' : 'border-gray-200'} />
            
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label htmlFor="imagePrompt" className={`text-sm font-medium ${isDarkMode ? 'text-text-white' : 'text-gray-700'}`}>
                  Describe what you want to create
                </label>
              </div>

              <textarea
                id="imagePrompt"
                value={imagePrompt}
                onChange={(e) => setImagePrompt(e.target.value)}
                placeholder="Describe the kind of image you want to create based on your reference images..."
                className={`w-full min-h-[120px] resize-none p-3 rounded-md focus:ring-2 focus:ring-primary-green focus:border-primary-green outline-none ${
                  isDarkMode 
                    ? 'bg-dark-bg border-border-dark text-text-white placeholder-text-light-gray' 
                    : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'
                }`}
              />

              <div className="flex flex-col gap-3">
                <div className={`space-y-2 ${isDarkMode ? 'text-text-white' : 'text-gray-700'}`}>
                  <label htmlFor="imageFormat" className="block text-sm font-medium">
                    Image Format
                  </label>
                  <select
                    id="imageFormat"
                    value={imageFormat}
                    onChange={(e) => setImageFormat(e.target.value as AspectRatio)}
                    className={`w-full p-2 text-sm rounded-md ${
                      isDarkMode
                        ? 'bg-dark-bg border-border-dark text-text-white'
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
            </div>
            
            <div className="flex flex-col gap-3">
              <button
                type="button"
                onClick={handleImproveImagePrompt}
                disabled={!imagePrompt.trim() || isImprovingImagePrompt}
                className={`flex justify-center items-center w-full py-2 px-4 border rounded-md text-sm font-medium 
                  ${!imagePrompt.trim() || isImprovingImagePrompt 
                    ? isDarkMode 
                      ? 'bg-dark-bg text-text-light-gray cursor-not-allowed border-border-dark' 
                      : 'bg-gray-100 text-gray-400 cursor-not-allowed border-gray-200'
                    : isDarkMode
                      ? 'bg-dark-bg text-text-white hover:bg-light-container border-border-dark' 
                      : 'bg-white text-gray-700 hover:bg-gray-50 border-gray-300'
                  }`}
              >
                <Sparkles className="mr-2 size-4" />
                {isImprovingImagePrompt ? "Enhancing..." : "Enhance prompt with AI"}
              </button>

              <button
                type="button"
                onClick={handleGenerateImagesWithReferences}
                disabled={!imagePrompt.trim() || referenceImages.filter(img => img).length === 0 || isGeneratingImages}
                className={`flex justify-center items-center w-full py-2 px-4 rounded-md text-sm font-medium 
                  ${!imagePrompt.trim() || referenceImages.filter(img => img).length === 0 || isGeneratingImages 
                    ? isDarkMode
                      ? 'bg-primary-green/50 cursor-not-allowed text-text-white/70'
                      : 'bg-blue-300 cursor-not-allowed text-white'
                    : isDarkMode
                      ? 'bg-primary-green hover:bg-primary-green/90 text-deep-black'
                      : 'bg-blue-600 hover:bg-blue-700 text-white'
                  }`}
              >
                <ImagePlus className="mr-2 size-4" />
                {isGeneratingImages ? "Generating..." : "Create 10 images"}
              </button>
            </div>
          </div>
          
          {/* Right panel: Generated images display */}
          <div className="lg:col-span-2">
            {generatedImages.length === 0 ? (
              <div className={`border border-dashed rounded-lg p-8 flex flex-col items-center justify-center h-full min-h-[300px] text-center ${
                isDarkMode ? 'border-gray-700' : 'border-gray-200'
              }`}>
                <div className={`p-3 rounded-full mb-3 ${isDarkMode ? 'bg-blue-900' : 'bg-blue-100'}`}>
                  <Sparkles className={`size-6 ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`} />
                </div>
                <h3 className={`text-lg font-medium mb-1 ${isDarkMode ? 'text-gray-200' : 'text-gray-800'}`}>No images generated yet</h3>
                <p className={`text-sm max-w-md mb-4 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  Upload reference images, enter a descriptive prompt and click "Create images" to generate AI images inspired by your references.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex flex-col w-full">
                    <div className={`border-b ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                      <div className="flex items-center justify-between">
                        <div className="flex">
                          <div className="py-2 px-4 text-sm font-medium border-b-2 border-blue-600 text-blue-600">
                            AI Generated Images
                          </div>
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
                      <div className={`grid grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-3`}>
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
                                <div className="absolute bottom-2 right-2 flex space-x-2">
                                  <button
                                    type="button"
                                    onClick={(e) => openImagePreview(imgUrl, e)}
                                    className="py-1 px-3 text-xs font-medium bg-white text-gray-700 rounded-md shadow hover:bg-gray-50 flex items-center"
                                  >
                                    <Maximize2 className="mr-1 size-4" />
                                    Preview
                                  </button>
                                  
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleDownload(imgUrl, i);
                                    }}
                                    className="py-1 px-3 text-xs font-medium bg-white text-gray-700 rounded-md shadow hover:bg-gray-50 flex items-center"
                                  >
                                    <Download className="mr-1 size-4" />
                                    Download
                                  </button>
                                </div>
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
                        Always verify you have the appropriate rights to use AI-generated content and uploaded reference images in your projects.
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
          <div></div>
          
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

      {/* Image Preview Modal */}
      {previewImage && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/75"
          onClick={closeImagePreview}
        >
          <div 
            className={`relative max-w-4xl max-h-[90vh] ${
              isDarkMode ? 'bg-gray-900' : 'bg-white'
            } p-2 rounded-lg shadow-2xl`}
            onClick={(e) => e.stopPropagation()} // Prevent closing when clicking inside
          >
            <button 
              onClick={closeImagePreview}
              className={`absolute top-3 right-3 z-10 rounded-full p-1.5 ${
                isDarkMode 
                  ? 'bg-gray-800 text-gray-300 hover:bg-gray-700' 
                  : 'bg-white text-gray-700 hover:bg-gray-100'
              }`}
            >
              <XIcon className="size-5" />
            </button>
            
            <div className="relative w-full max-h-[80vh]">
              <NextImage
                src={previewImage}
                alt="Image preview"
                width={1000}
                height={1000}
                className="rounded-md object-contain mx-auto max-h-[80vh] w-auto"
              />
            </div>
            
            <div className={`flex justify-end mt-4 gap-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              <button 
                className={`flex items-center gap-1.5 py-2 px-4 rounded-md ${
                  isDarkMode 
                    ? 'bg-gray-800 hover:bg-gray-700' 
                    : 'bg-gray-100 hover:bg-gray-200'
                }`}
                onClick={closeImagePreview}
              >
                Close
              </button>
              <button 
                className={`flex items-center gap-1.5 py-2 px-4 rounded-md ${
                  isDarkMode 
                    ? 'bg-blue-600 hover:bg-blue-700 text-white' 
                    : 'bg-blue-600 hover:bg-blue-700 text-white'
                }`}
                onClick={() => {
                  if (previewImage) {
                    handleDownload(previewImage, 0);
                  }
                }}
              >
                <Download className="size-4" />
                Download
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}