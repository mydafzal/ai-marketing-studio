"use client"

import React, { useState, useRef, useEffect, useCallback } from "react"
import NextImage from "next/image"
import { AlertCircle, Download, ImagePlus, Save, Upload, Info, CheckCircle2, Sparkles, X, Maximize2, X as XIcon, ArrowRight } from "lucide-react"
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
  const logoFileInputRef = useRef<HTMLInputElement>(null)
  const previewRefs = useRef<(HTMLDivElement | null)[]>([])

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
  const [approachMethod, setApproachMethod] = useState<"combined" | "variations" | "text-only">("combined") // AI approach method
  
  // Logo functionality state
  const [logoUrl, setLogoUrl] = useState<string>("")
  const [overlayPosition, setOverlayPosition] = useState("bottom-right")
  const [logoSize, setLogoSize] = useState(20) // As percentage of image width
  const [combinedPreviews, setCombinedPreviews] = useState<string[]>([])
  const [isCustomPosition, setIsCustomPosition] = useState(false)
  const [logoPositions, setLogoPositions] = useState<{ [key: number]: { x: number, y: number } }>({})
  const [isDraggingLogo, setIsDraggingLogo] = useState(false)
  const [dragStartPos, setDragStartPos] = useState({ x: 0, y: 0 })
  const [isDragUpdatePending, setIsDragUpdatePending] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [isResizingLogo, setIsResizingLogo] = useState(false)
  const [draggedImageIndex, setDraggedImageIndex] = useState<number | null>(null)
  
  // Step-by-step process state
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3 | 4>(1)

  // Show toast notification
  const showToast = (title: string, description: string, type: 'success' | 'error') => {
    setToastMessage({ title, description, type })
    setTimeout(() => setToastMessage(null), 3000)
  }

  // Handle file input change for multiple reference images at once
  const handleReferenceImagesUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      // Convert FileList to array for easier handling
      const fileArray = Array.from(e.target.files).slice(0, 5) // Limit to 5 images
      
      // Validate file sizes (5MB max each)
      const oversizedFiles = fileArray.filter(file => file.size > 5 * 1024 * 1024)
      if (oversizedFiles.length > 0) {
        showToast("Files too large", `${oversizedFiles.length} image(s) exceed the 5MB size limit and were skipped.`, "error")
      }
      
      // Filter out oversized files
      const validFiles = fileArray.filter(file => file.size <= 5 * 1024 * 1024)
      
      // Set the valid files as reference images
      setReferenceImages(validFiles)
      
      showToast(
        "Reference images added", 
        `Added ${validFiles.length} reference image${validFiles.length !== 1 ? 's' : ''}.`, 
        "success"
      )
    }
  }

  // Trigger file input click for multi-upload
  const handleImageButtonClick = () => {
    if (fileInputRefs.current[0]) {
      fileInputRefs.current[0]?.click()
    }
  }

  // Clear all reference images
  const handleClearAllReferenceImages = () => {
    setReferenceImages([])
    
    // Also clear the file input
    if (fileInputRefs.current[0]) {
      (fileInputRefs.current[0] as HTMLInputElement).value = ""
    }
  }
  
  // Remove a specific reference image
  const handleRemoveReferenceImage = (index: number) => {
    const newReferenceImages = [...referenceImages]
    newReferenceImages.splice(index, 1) // Remove the image at the specified index
    setReferenceImages(newReferenceImages)
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

  // Generate images based on text prompt or reference images
  async function handleGenerateImages() {
    if (!imagePrompt.trim()) {
      showToast("Missing prompt", "Please enter an image description first.", "error")
      return
    }
    
    // If we're not using text-only mode, verify reference images exist
    if (approachMethod !== "text-only") {
      const filledReferenceImages = referenceImages.filter(img => img)
      if (filledReferenceImages.length === 0) {
        showToast("Missing reference images", "Please upload at least one reference image or switch to Text Only mode.", "error")
        return
      }
    }
    
    setIsGeneratingImages(true)
    
    try {
      if (approachMethod === "text-only") {
        // Text-only approach - use standard image generation without references
        console.log("Using text-only approach method")
        const result = await generateImages(imagePrompt, imageFormat, 4) // Reduced from 10 to 4 for faster processing
        
        if (result.success && result.images) {
          const validUrls = result.images.filter((url: unknown) => typeof url === "string") as string[]
          setGeneratedImages(validUrls)
          setSelectedImages([])
          setLogoPositions({}) // Reset custom logo positions for new images
          setCombinedPreviews([]) // Reset combined previews
          
          showToast(
            "Images generated", 
            `Created ${validUrls.length} image${validUrls.length !== 1 ? 's' : ''} based on your text prompt`, 
            "success"
          )
          
          // Move to the next step automatically when images are generated
          if (currentStep === 3) {
            setTimeout(() => {
              if (validUrls.length > 0) {
                goToNextStep();
              }
            }, 1000);
          }
        } else {
          throw new Error(result.error || "Failed to generate images from text.")
        }
      } else {
        // Reference image approaches
        const filledReferenceImages = referenceImages.filter(img => img)
        
        // Create form data to send to the server
        const formData = new FormData()
        formData.append('prompt', imagePrompt)
        formData.append('aspectRatio', imageFormat)
        formData.append('numberOfImages', '4') // Reduced from 10 to 4 for faster processing
        
        // Add reference images to the form data
        filledReferenceImages.forEach((img, index) => {
          formData.append(`referenceImage${index}`, img)
        })
        
        // Use the approach selected by the user
        let response;
        if (approachMethod === "combined") {
          console.log("Using combined approach method")
          response = await fetch('/api/generate-image-from-references', {
            method: 'POST',
            body: formData,
          })
        } else {
          console.log("Using variations approach method")
          response = await fetch('/api/generate-images-with-variation', {
            method: 'POST',
            body: formData,
          })
        }
        
        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || "Failed to generate images with references.")
        }
        
        const result = await response.json()
        
        if (result.success && result.images) {
          const validUrls = result.images.filter((url: unknown) => typeof url === "string") as string[]
          setGeneratedImages(validUrls)
          setSelectedImages([])
          setLogoPositions({}) // Reset custom logo positions for new images
          setCombinedPreviews([]) // Reset combined previews
          
          showToast(
            "Images generated", 
            `Created ${validUrls.length} image${validUrls.length !== 1 ? 's' : ''} based on your references`, 
            "success"
          )
          
          // Move to the next step automatically when images are generated
          if (currentStep === 3) {
            setTimeout(() => {
              if (validUrls.length > 0) {
                goToNextStep();
              }
            }, 1000);
          }
        } else {
          throw new Error(result.error || "Failed to generate images with references.")
        }
      }
    } catch (err) {
      console.error("Error generating images:", err)
      showToast(
        "Generation failed", 
        "Unable to create images. Please try again with different parameters.", 
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

  // Initialize previewRefs when images change
  useEffect(() => {
    // Reset refs array when number of images changes
    previewRefs.current = Array(combinedPreviews.length).fill(null)
  }, [combinedPreviews.length])

  // Logo position handling with transition
  const handlePositionChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newPosition = e.target.value
    
    // Prevent preview updates during position changes
    setIsDragUpdatePending(true)
    
    // Update the position setting
    setOverlayPosition(newPosition)
    setIsCustomPosition(newPosition === "custom")
    
    // Reset custom position when switching to a preset position
    if (newPosition !== "custom") {
      setLogoPositions({})
    }
    
    // Allow preview to update after a short delay
    setTimeout(() => {
      setIsDragUpdatePending(false)
    }, 100)
  }

  // Enhanced handling of logo size changes 
  const handleLogoSizeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newSize = parseInt(e.target.value)
    
    // Notify the UI that we're changing size to trigger animations
    setIsResizingLogo(true)
    
    // If we're in custom position mode, prevent preview regeneration
    if (isCustomPosition) {
      setIsDragUpdatePending(true)
    }
    
    // Update the size state
    setLogoSize(newSize)
    
    // Clear the resizing flag after animation completes
    setTimeout(() => {
      setIsResizingLogo(false)
      
      // If in custom position mode, allow previews to update after the size change
      if (isCustomPosition) {
        setIsDragUpdatePending(false)
      }
    }, 250) // Slightly longer than the CSS transition
  }

  // Start dragging the logo
  const handleLogoMouseDown = (e: React.MouseEvent, imageIndex: number) => {
    if (!isCustomPosition) return
    
    e.preventDefault()
    e.stopPropagation() // Prevent selection toggle
    
    // Immediately prevent any preview updates to avoid showing duplicate logos
    setIsDragUpdatePending(true)
    
    const previewElement = previewRefs.current[imageIndex]
    if (!previewElement) return
    
    // Get the element's position information
    const rect = previewElement.getBoundingClientRect()
    
    // Create starting point directly at the mouse position relative to the container
    const newPosition = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    }
    
    // Store position for this specific image
    setLogoPositions(prev => ({
      ...prev,
      [imageIndex]: newPosition
    }))
    
    setIsDraggingLogo(true)
    setDraggedImageIndex(imageIndex)
    
    // Set starting point for drag
    setDragStartPos({
      x: e.clientX,
      y: e.clientY
    })
  }

  // Handle logo movement
  const handleLogoMouseMove = useCallback((e: MouseEvent) => {
    if (!isDraggingLogo || !isCustomPosition || draggedImageIndex === null) return
    
    const previewElement = previewRefs.current[draggedImageIndex]
    if (!previewElement) return
    
    const rect = previewElement.getBoundingClientRect()
    
    // Calculate new position directly from mouse position
    const newPosition = {
      x: Math.max(0, Math.min(rect.width, e.clientX - rect.left)),
      y: Math.max(0, Math.min(rect.height, e.clientY - rect.top))
    }
    
    // Update position for the specific image being dragged
    setLogoPositions(prev => ({
      ...prev,
      [draggedImageIndex]: newPosition
    }))
  }, [isDraggingLogo, isCustomPosition, draggedImageIndex])

  // End dragging
  const handleLogoMouseUp = useCallback(() => {
    if (isDraggingLogo) {
      setIsDraggingLogo(false)
      setDraggedImageIndex(null)
      
      // Use a slightly longer timeout to ensure all state updates are processed
      // before allowing preview regeneration
      setTimeout(() => {
        setIsDragUpdatePending(false)
      }, 100)
    }
  }, [isDraggingLogo])

  // Mobile touch events
  const handleLogoTouchStart = (e: React.TouchEvent, imageIndex: number) => {
    if (!isCustomPosition) return
    
    e.preventDefault()
    e.stopPropagation()
    
    // Immediately prevent preview updates
    setIsDragUpdatePending(true)
    
    const previewElement = previewRefs.current[imageIndex]
    if (!previewElement) return
    
    const rect = previewElement.getBoundingClientRect()
    const touch = e.touches[0]
    
    // Position at the touch point
    const newPosition = {
      x: touch.clientX - rect.left,
      y: touch.clientY - rect.top
    }
    
    setLogoPositions(prev => ({
      ...prev,
      [imageIndex]: newPosition
    }))
    
    setIsDraggingLogo(true)
    setDraggedImageIndex(imageIndex)
    
    setDragStartPos({
      x: touch.clientX,
      y: touch.clientY
    })
  }

  const handleLogoTouchMove = useCallback((e: TouchEvent) => {
    if (!isDraggingLogo || !isCustomPosition || draggedImageIndex === null) return
    
    const previewElement = previewRefs.current[draggedImageIndex]
    if (!previewElement) return
    
    const rect = previewElement.getBoundingClientRect()
    const touch = e.touches[0]
    
    // Calculate new position directly from touch position
    const newPosition = {
      x: Math.max(0, Math.min(rect.width, touch.clientX - rect.left)),
      y: Math.max(0, Math.min(rect.height, touch.clientY - rect.top))
    }
    
    // Update position for the specific image being dragged
    setLogoPositions(prev => ({
      ...prev,
      [draggedImageIndex]: newPosition
    }))
    
    e.preventDefault() // Prevent scrolling while dragging
  }, [isDraggingLogo, isCustomPosition, draggedImageIndex])

  // Touch end handling
  const handleLogoTouchEnd = useCallback(() => {
    if (isDraggingLogo) {
      setIsDraggingLogo(false)
      setDraggedImageIndex(null)
      
      setTimeout(() => {
        setIsDragUpdatePending(false)
      }, 100)
    }
  }, [isDraggingLogo])

  // Cancel dragging if mouse leaves the document
  const handleMouseLeave = useCallback((e: MouseEvent) => {
    // Check if the mouse has left the document
    if (isDraggingLogo && (e.clientY <= 0 || e.clientY >= window.innerHeight || 
        e.clientX <= 0 || e.clientX >= window.innerWidth)) {
      setIsDraggingLogo(false)
      setDraggedImageIndex(null)
      
      setTimeout(() => {
        setIsDragUpdatePending(false)
      }, 100)
    }
  }, [isDraggingLogo])

  // Add event listeners for drag and drop
  useEffect(() => {
    if (isCustomPosition) {
      document.addEventListener('mousemove', handleLogoMouseMove)
      document.addEventListener('mouseup', handleLogoMouseUp)
      document.addEventListener('touchmove', handleLogoTouchMove, { passive: false })
      document.addEventListener('touchend', handleLogoTouchEnd)
      document.addEventListener('mouseleave', handleMouseLeave)
    }
    
    return () => {
      document.removeEventListener('mousemove', handleLogoMouseMove)
      document.removeEventListener('mouseup', handleLogoMouseUp)
      document.removeEventListener('touchmove', handleLogoTouchMove)
      document.removeEventListener('touchend', handleLogoTouchEnd)
      document.removeEventListener('mouseleave', handleMouseLeave)
    }
  }, [isCustomPosition, isDraggingLogo, handleLogoMouseMove, handleLogoMouseUp, 
      handleLogoTouchMove, handleLogoTouchEnd, handleMouseLeave])

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

  // Trigger file input click for logo
  function handleLogoButtonClick() {
    if (logoFileInputRef.current) {
      logoFileInputRef.current.click()
    }
  }

  // Clear logo
  function handleClearLogo() {
    setLogoUrl("")
    if (logoFileInputRef.current) {
      logoFileInputRef.current.value = ""
    }
    showToast("Logo removed", "Your logo has been cleared.", "success")
  }

  // Combine images with logo overlay
  const combineImages = useCallback(async (backgroundUrl: string, overlayUrl: string, position: string, imageIndex: number) => {
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

          if (position === "custom" && isCustomPosition) {
            // Use the specific position for this image index
            const customPos = logoPositions[imageIndex]
            if (customPos) {
              // Get reference to preview container to calculate percentage position
              const previewElement = previewRefs.current[imageIndex]
              if (previewElement) {
                // Get container dimensions
                const containerWidth = previewElement.offsetWidth
                const containerHeight = previewElement.offsetHeight
                
                // Calculate position as a percentage of container dimensions
                const relativeX = customPos.x / containerWidth
                const relativeY = customPos.y / containerHeight
                
                // Apply percentage to actual canvas dimensions
                x = (canvas.width * relativeX) - (scaledWidth / 2)
                y = (canvas.height * relativeY) - (scaledHeight / 2)
                
                // Ensure the logo stays within the image boundaries
                x = Math.max(padding, Math.min(canvas.width - scaledWidth - padding, x))
                y = Math.max(padding, Math.min(canvas.height - scaledHeight - padding, y))
              }
            } else {
              // Default to center if no custom position set
              x = (canvas.width - scaledWidth) / 2
              y = (canvas.height - scaledHeight) / 2
            }
          } else {
            // Decide Y position for preset positions
            if (position.includes("bottom")) {
              y = canvas.height - scaledHeight - padding
            } else if (position.includes("middle") || position === "center") {
              y = (canvas.height - scaledHeight) / 2
            } else if (position.includes("top")) {
              y = padding
            }

            // Decide X position for preset positions
            if (position.includes("right")) {
              x = canvas.width - scaledWidth - padding
            } else if (position.includes("center")) {
              x = (canvas.width - scaledWidth) / 2
            } else if (position.includes("left")) {
              x = padding
            }
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
  }, [logoSize, isCustomPosition, logoPositions])

  // Generate logo previews
  useEffect(() => {
    // Skip preview updates if we're in the middle of dragging
    if (isDragUpdatePending) return
    
    // Prevent unnecessary preview generation when nothing has changed
    const generatePreviews = async () => {
      if (!logoUrl || generatedImages.length === 0) {
        setCombinedPreviews([])
        return
      }
      
      try {
        // Show loading state during generation
        setIsProcessing(true)
        
        const newPreviews: string[] = []
        for (let i = 0; i < generatedImages.length; i++) {
          const combined = await combineImages(generatedImages[i], logoUrl, overlayPosition, i)
          newPreviews.push(combined)
        }
        
        setCombinedPreviews(newPreviews)
      } catch (err) {
        console.error("Error combining for previews:", err)
        showToast("Preview error", "Failed to generate logo previews. Please try again.", "error")
      } finally {
        setIsProcessing(false)
      }
    }

    const debounceTimeout = setTimeout(() => {
      generatePreviews()
    }, 200) // Add small debounce for better performance
    
    return () => {
      clearTimeout(debounceTimeout)
    }
  }, [
    generatedImages, 
    logoUrl, 
    overlayPosition, 
    logoSize, 
    combineImages, 
    logoPositions, 
    isDragUpdatePending,
    showToast
  ])

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
  
  // Download with logo
  async function handleDownloadWithLogo(aiImageUrl: string, index: number) {
    if (!logoUrl) {
      showToast("Logo missing", "Please upload a logo first.", "error")
      return
    }
    try {
      const finalUrl = await combineImages(aiImageUrl, logoUrl, overlayPosition, index)
      const res = await fetch(finalUrl)
      if (!res.ok) throw new Error("Failed to fetch combined image for download")

      const blob = await res.blob()
      const tempUrl = window.URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.href = tempUrl
      link.download = `creative-director-image-${index + 1}-with-logo.png`
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

  // LogoDragIndicator component for custom positioning
  const LogoDragIndicator = ({ imageIndex }: { imageIndex: number }) => {
    if (!isCustomPosition || !logoUrl) return null
    
    // Get the reference to this specific image container
    const previewRef = previewRefs.current[imageIndex]
    if (!previewRef) return null
    
    // Get position for this specific image, or use defaults
    const position = logoPositions[imageIndex] || { 
      // Default to center if no position set
      x: previewRef.offsetWidth / 2,
      y: previewRef.offsetHeight / 2
    }
    
    const isDragging = isDraggingLogo && draggedImageIndex === imageIndex
    
    // Calculate exact pixel size for the logo based on container width and logo size percentage
    const containerWidth = previewRef.offsetWidth
    const exactLogoWidth = Math.floor(containerWidth * (logoSize / 100))
    
    return (
      <>
        {/* Full overlay to completely hide the underlying image during any drag operation */}
        {isDragUpdatePending && (
          <div 
            className="absolute inset-0 z-0 pointer-events-none"
            style={{ 
              backgroundColor: isDarkMode ? 'rgba(17, 24, 39, 0.85)' : 'rgba(243, 244, 246, 0.85)',
              backgroundImage: `url(${generatedImages[imageIndex]})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              filter: 'blur(1px) brightness(0.7)'
            }}
          >
            {/* This intentionally leaves nothing inside to ensure the original image 
                is completely covered but still visible as a backdrop */}
          </div>
        )}
        
        {/* Instruction text during dragging or resizing */}
        {isDragUpdatePending && (
          <div className="absolute top-2 left-0 right-0 z-10 text-center pointer-events-none">
            <div className={`inline-block text-sm font-medium py-1 px-3 rounded-md ${
              isDarkMode ? 'bg-gray-800 text-gray-200' : 'bg-white text-gray-700'
            }`}>
              {isDraggingLogo ? 'Drag to position logo' : `Logo size: ${logoSize}%`}
            </div>
          </div>
        )}
        
        {/* Draggable logo indicator with exact size matching */}
        <div 
          className={`absolute z-20 ${
            isDragging ? 'cursor-grabbing' : 'cursor-grab'
          }`}
          style={{ 
            width: `${exactLogoWidth}px`, // Use exact pixel width instead of percentage
            left: position.x,
            top: position.y,
            transform: 'translate(-50%, -50%)',
            touchAction: 'none',
            opacity: 1,
            transition: isDragging 
              ? 'none' 
              : 'all 0.15s ease-out'
          }}
          onMouseDown={(e) => {
            e.preventDefault();
            e.stopPropagation();
            handleLogoMouseDown(e, imageIndex);
          }}
          onTouchStart={(e) => {
            e.preventDefault();
            e.stopPropagation();
            handleLogoTouchStart(e, imageIndex);
          }}
        >
          <NextImage
            src={logoUrl}
            alt="Draggable logo"
            width={exactLogoWidth}
            height={exactLogoWidth}
            className="w-full h-auto object-contain pointer-events-none"
            draggable={false}
            style={{
              filter: `drop-shadow(0 0 3px ${isDarkMode ? 'rgba(255, 255, 255, 0.3)' : 'rgba(0, 0, 0, 0.3)'})`
            }}
          />
          
          {(imageIndex === 0 && !isDraggingLogo && !Object.keys(logoPositions).length) && (
            <div className={`absolute -top-8 left-1/2 transform -translate-x-1/2 whitespace-nowrap text-xs font-medium px-2 py-1 rounded-md ${
              isDarkMode ? 'bg-blue-600 text-white' : 'bg-blue-100 text-blue-800'
            }`}>
              Drag me to position
            </div>
          )}
        </div>
      </>
    )
  }

  // Save to library
  async function handleSaveSelectedImagesToLibrary(useLogoImages: boolean = false) {
    if (selectedImages.length === 0) {
      showToast("No images selected", "Please select at least one image to save to your library.", "error")
      return
    }

    setIsSaving(true)

    try {
      const formData = new FormData()
      formData.append("userId", "user123")
      formData.append("type", "image")

      // Use images with logos if specified and available
      const sourceArray = useLogoImages && combinedPreviews.length > 0 
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

  // Move to next step
  const goToNextStep = () => {
    if (currentStep === 1) {
      if (approachMethod !== "text-only" && referenceImages.length === 0) {
        showToast("Missing reference images", "Please upload at least one reference image or switch to Text Only mode.", "error")
        return
      }
      setCurrentStep(2)
    } else if (currentStep === 2) {
      if (!imagePrompt.trim()) {
        showToast("Missing prompt", "Please enter an image description first.", "error")
        return
      }
      setCurrentStep(3)
    } else if (currentStep === 3) {
      // Go to the optional logo step if there are generated images
      if (generatedImages.length === 0) {
        showToast("No images generated", "Please generate images first.", "error")
        return
      }
      setCurrentStep(4)
    }
  }

  // Move to previous step
  const goToPreviousStep = () => {
    if (currentStep === 2) {
      setCurrentStep(1)
    } else if (currentStep === 3) {
      setCurrentStep(2)
    } else if (currentStep === 4) {
      setCurrentStep(3)
    }
  }

  // Step 1: Component for selecting creation method
  const StepOneComponent = () => (
    <div className="space-y-6">
      <div className="space-y-2">
        <h3 className={`text-lg font-semibold ${isDarkMode ? 'text-text-white' : 'text-gray-800'}`}>
          Step 1: Choose Creation Method
        </h3>
        <p className={`text-sm ${isDarkMode ? 'text-text-light-gray' : 'text-gray-500'}`}>
          Select how you want to create your AI images
        </p>
      </div>

      <div className="flex flex-col space-y-4">
        <button 
          type="button"
          className={`flex items-center p-4 rounded-lg border ${
            approachMethod === "text-only"
              ? isDarkMode 
                ? 'bg-primary-green/20 border-primary-green text-text-white' 
                : 'bg-blue-50 border-blue-300 text-blue-700'
              : isDarkMode 
                ? 'bg-dark-bg hover:bg-light-container border-border-dark' 
                : 'bg-white hover:bg-gray-50 border-gray-200'
          }`}
          onClick={() => setApproachMethod("text-only")}
        >
          <div className={`rounded-full p-2 mr-3 ${
            approachMethod === "text-only"
              ? isDarkMode ? 'bg-primary-green/30' : 'bg-blue-100'
              : isDarkMode ? 'bg-gray-700' : 'bg-gray-100'
          }`}>
            <Sparkles className={`size-5 ${
              approachMethod === "text-only"
                ? isDarkMode ? 'text-primary-green' : 'text-blue-600'
                : isDarkMode ? 'text-gray-300' : 'text-gray-500'
            }`} />
          </div>
          <div className="flex-1">
            <h4 className={`font-medium ${isDarkMode ? 'text-text-white' : 'text-gray-800'}`}>Text Only</h4>
            <p className={`text-sm ${isDarkMode ? 'text-text-light-gray' : 'text-gray-500'}`}>
              Create images using only a text description
            </p>
          </div>
          {approachMethod === "text-only" && (
            <CheckCircle2 className={`size-5 ${isDarkMode ? 'text-primary-green' : 'text-blue-600'}`} />
          )}
        </button>

        <button
          type="button"
          className={`flex items-center p-4 rounded-lg border ${
            approachMethod === "combined"
              ? isDarkMode 
                ? 'bg-primary-green/20 border-primary-green text-text-white' 
                : 'bg-blue-50 border-blue-300 text-blue-700'
              : isDarkMode 
                ? 'bg-dark-bg hover:bg-light-container border-border-dark' 
                : 'bg-white hover:bg-gray-50 border-gray-200'
          }`}
          onClick={() => setApproachMethod("combined")}
        >
          <div className={`rounded-full p-2 mr-3 ${
            approachMethod === "combined"
              ? isDarkMode ? 'bg-primary-green/30' : 'bg-blue-100'
              : isDarkMode ? 'bg-gray-700' : 'bg-gray-100'
          }`}>
            <ImagePlus className={`size-5 ${
              approachMethod === "combined"
                ? isDarkMode ? 'text-primary-green' : 'text-blue-600'
                : isDarkMode ? 'text-gray-300' : 'text-gray-500'
            }`} />
          </div>
          <div className="flex-1">
            <h4 className={`font-medium ${isDarkMode ? 'text-text-white' : 'text-gray-800'}`}>Combined Analysis</h4>
            <p className={`text-sm ${isDarkMode ? 'text-text-light-gray' : 'text-gray-500'}`}>
              Analyzes all reference images together for cohesive results
            </p>
          </div>
          {approachMethod === "combined" && (
            <CheckCircle2 className={`size-5 ${isDarkMode ? 'text-primary-green' : 'text-blue-600'}`} />
          )}
        </button>

        <button
          type="button"
          className={`flex items-center p-4 rounded-lg border ${
            approachMethod === "variations"
              ? isDarkMode 
                ? 'bg-primary-green/20 border-primary-green text-text-white' 
                : 'bg-blue-50 border-blue-300 text-blue-700'
              : isDarkMode 
                ? 'bg-dark-bg hover:bg-light-container border-border-dark' 
                : 'bg-white hover:bg-gray-50 border-gray-200'
          }`}
          onClick={() => setApproachMethod("variations")}
        >
          <div className={`rounded-full p-2 mr-3 ${
            approachMethod === "variations"
              ? isDarkMode ? 'bg-primary-green/30' : 'bg-blue-100'
              : isDarkMode ? 'bg-gray-700' : 'bg-gray-100'
          }`}>
            <ImagePlus className={`size-5 ${
              approachMethod === "variations"
                ? isDarkMode ? 'text-primary-green' : 'text-blue-600'
                : isDarkMode ? 'text-gray-300' : 'text-gray-500'
            }`} />
          </div>
          <div className="flex-1">
            <h4 className={`font-medium ${isDarkMode ? 'text-text-white' : 'text-gray-800'}`}>Individual Variations</h4>
            <p className={`text-sm ${isDarkMode ? 'text-text-light-gray' : 'text-gray-500'}`}>
              Create variations of each reference image for diverse results
            </p>
          </div>
          {approachMethod === "variations" && (
            <CheckCircle2 className={`size-5 ${isDarkMode ? 'text-primary-green' : 'text-blue-600'}`} />
          )}
        </button>
      </div>

      {approachMethod !== "text-only" && (
        <div className="space-y-4 mt-4">
          <div className="space-y-2">
            <h3 className={`text-base font-medium ${isDarkMode ? 'text-text-white' : 'text-gray-700'}`}>
              Reference Images
            </h3>
            <p className={`text-sm ${isDarkMode ? 'text-text-light-gray' : 'text-gray-500'}`}>
              Upload up to 5 reference images for the AI to analyze
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleImageButtonClick}
              className={`flex items-center justify-center px-4 py-2 rounded-md ${
                isDarkMode 
                  ? 'bg-primary-green/20 text-primary-green hover:bg-primary-green/30 border border-primary-green/40' 
                  : 'bg-blue-50 text-blue-600 hover:bg-blue-100 border border-blue-200'
              }`}
            >
              <Upload className="size-5 mr-2" />
              <span className="font-medium">Upload Reference Images</span>
            </button>
            
            {referenceImages.length > 0 && (
              <button
                type="button"
                onClick={handleClearAllReferenceImages}
                className={`px-3 py-2 rounded-md text-sm ${
                  isDarkMode 
                    ? 'bg-dark-bg text-text-light-gray hover:bg-light-container border border-border-dark' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-300'
                }`}
              >
                Clear All
              </button>
            )}
            
            <input
              type="file"
              accept="image/*"
              multiple
              ref={(el: HTMLInputElement | null) => {
                if (el) fileInputRefs.current[0] = el;
              }}
              onChange={handleReferenceImagesUpload}
              className="hidden"
              id="referenceImagesInput"
            />
          </div>

          {/* Reference images display */}
          {referenceImages.length > 0 && (
            <div className="mt-4">
              <div className={`text-sm font-medium mb-2 ${isDarkMode ? 'text-text-white' : 'text-gray-700'}`}>
                {referenceImages.length} Reference Image{referenceImages.length !== 1 ? 's' : ''} Uploaded
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {referenceImages.map((image, index) => (
                  <div 
                    key={index} 
                    className={`relative border-2 rounded-md aspect-square overflow-hidden ${
                      isDarkMode ? 'border-primary-green/60' : 'border-green-300'
                    }`}
                  >
                    <NextImage
                      src={URL.createObjectURL(image)}
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
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Empty state when no images uploaded */}
          {referenceImages.length === 0 && (
            <div className={`mt-4 border-2 border-dashed rounded-lg p-6 text-center ${
              isDarkMode ? 'border-border-dark bg-dark-bg/50' : 'border-gray-300 bg-gray-50'
            }`}>
              <Upload className={`size-10 mx-auto mb-3 ${
                isDarkMode ? 'text-text-light-gray' : 'text-gray-400'
              }`} />
              <p className={`text-sm font-medium ${
                isDarkMode ? 'text-text-white' : 'text-gray-700'
              }`}>
                No reference images uploaded yet
              </p>
              <p className={`text-xs mt-1 ${
                isDarkMode ? 'text-text-light-gray' : 'text-gray-500'
              }`}>
                Upload up to 5 images to get started
              </p>
            </div>
          )}
        </div>
      )}

      <div className="flex justify-end pt-4">
        <button
          type="button"
          onClick={goToNextStep}
          className={`flex items-center justify-center px-4 py-2 rounded-md ${
            approachMethod !== "text-only" && referenceImages.length === 0
              ? isDarkMode
                ? 'bg-primary-green/50 cursor-not-allowed text-text-white/70'
                : 'bg-blue-300 cursor-not-allowed text-white'
              : isDarkMode
                ? 'bg-primary-green hover:bg-primary-green/90 text-deep-black'
                : 'bg-blue-600 hover:bg-blue-700 text-white'
          }`}
          disabled={approachMethod !== "text-only" && referenceImages.length === 0}
        >
          Next: Describe Your Image
          <ArrowRight className="ml-2 size-4" />
        </button>
      </div>
    </div>
  )

  // Step 2: Component for entering prompt and image format
  const StepTwoComponent = () => (
    <div className="space-y-6">
      <div className="space-y-2">
        <h3 className={`text-lg font-semibold ${isDarkMode ? 'text-text-white' : 'text-gray-800'}`}>
          Step 2: Describe Your Image
        </h3>
        <p className={`text-sm ${isDarkMode ? 'text-text-light-gray' : 'text-gray-500'}`}>
          Tell us what kind of image you want to create
        </p>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <label htmlFor="imagePrompt" className={`text-sm font-medium ${isDarkMode ? 'text-text-white' : 'text-gray-700'}`}>
            Image Description
          </label>
          <div className="relative">
            {approachMethod === "text-only" ? (
              <textarea 
                id="imagePrompt"
                placeholder="Describe the image you want the AI to generate..."
                value={imagePrompt}
                onChange={(e) => setImagePrompt(e.target.value)}
                className={`w-full p-3 rounded-md focus:ring-2 focus:ring-primary-green focus:border-primary-green outline-none border-2 z-10 min-h-[120px] ${
                  isDarkMode 
                    ? 'bg-dark-bg border-border-dark text-text-white placeholder-text-light-gray' 
                    : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'
                }`}
                style={{ position: "relative" }}
              />
            ) : (
              <input 
                type="text"
                id="imagePrompt"
                placeholder="Describe what you want to create based on your reference images..."
                value={imagePrompt}
                onChange={(e) => setImagePrompt(e.target.value)}
                className={`w-full p-3 rounded-md focus:ring-2 focus:ring-primary-green focus:border-primary-green outline-none border-2 z-10 ${
                  isDarkMode 
                    ? 'bg-dark-bg border-border-dark text-text-white placeholder-text-light-gray' 
                    : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'
                }`}
                style={{ position: "relative" }}
              />
            )}
          </div>
        </div>

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

      <div className="flex justify-between pt-4">
        <button
          type="button"
          onClick={goToPreviousStep}
          className={`flex items-center justify-center px-4 py-2 border rounded-md ${
            isDarkMode
              ? 'bg-dark-bg text-text-white hover:bg-light-container border-border-dark' 
              : 'bg-white text-gray-700 hover:bg-gray-50 border-gray-300'
          }`}
        >
          Back
        </button>
        <button
          type="button"
          onClick={goToNextStep}
          disabled={!imagePrompt.trim()}
          className={`flex items-center justify-center px-4 py-2 rounded-md ${
            !imagePrompt.trim()
              ? isDarkMode
                ? 'bg-primary-green/50 cursor-not-allowed text-text-white/70'
                : 'bg-blue-300 cursor-not-allowed text-white'
              : isDarkMode
                ? 'bg-primary-green hover:bg-primary-green/90 text-deep-black'
                : 'bg-blue-600 hover:bg-blue-700 text-white'
          }`}
        >
          Next: Generate Images
          <ArrowRight className="ml-2 size-4" />
        </button>
      </div>
    </div>
  )

  // Step 3: Component for generating and viewing images
  const StepThreeComponent = () => (
    <div className="space-y-6">
      <div className="space-y-2">
        <h3 className={`text-lg font-semibold ${isDarkMode ? 'text-text-white' : 'text-gray-800'}`}>
          Step 3: Generate & Save Images
        </h3>
        <p className={`text-sm ${isDarkMode ? 'text-text-light-gray' : 'text-gray-500'}`}>
          Create your AI-generated images
        </p>
      </div>

      <div className="space-y-4">
        <button
          type="button"
          onClick={handleGenerateImages}
          disabled={isGeneratingImages}
          className={`flex justify-center items-center w-full py-2 px-4 rounded-md text-sm font-medium ${
            isGeneratingImages 
              ? isDarkMode
                ? 'bg-primary-green/50 cursor-not-allowed text-text-white/70'
                : 'bg-blue-300 cursor-not-allowed text-white'
              : isDarkMode
                ? 'bg-primary-green hover:bg-primary-green/90 text-deep-black'
                : 'bg-blue-600 hover:bg-blue-700 text-white'
            }`}
        >
          <ImagePlus className="mr-2 size-4" />
          {isGeneratingImages 
            ? "Generating..." 
            : `Create ${approachMethod === "text-only" ? "AI Images" : "Images from References"}`}
        </button>

        {/* Additional information for text-only mode */}
        {approachMethod === "text-only" && !generatedImages.length && !isGeneratingImages && (
          <div className={`mt-3 p-3 rounded-lg border ${
            isDarkMode 
              ? 'bg-blue-900/20 border-blue-800/40 text-blue-200' 
              : 'bg-blue-50 border-blue-200 text-blue-700'
          }`}>
            <p className="text-sm">
              <Info className="inline-block mr-1.5 size-4 align-text-bottom" />
              When using the Text-Only mode, you can create AI-generated images based purely on your text description. 
              Be as detailed as possible for best results.
            </p>
          </div>
        )}

        {generatedImages.length > 0 && (
          <div className="mt-3">
            <div className="flex items-center justify-between mb-2">
              <div className={`text-sm font-medium ${isDarkMode ? 'text-text-white' : 'text-gray-700'}`}>
                {selectedImages.length} of {generatedImages.length} selected
              </div>
              <div className="flex items-center gap-2">
                <button 
                  type="button"
                  onClick={selectAll}
                  className={`py-1 px-2 text-xs font-medium rounded border ${
                    isDarkMode
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

            <button 
              type="button"
              onClick={() => handleSaveSelectedImagesToLibrary(false)}
              disabled={selectedImages.length === 0 || isSaving}
              className={`flex items-center justify-center w-full gap-2 py-2 px-4 rounded-md text-sm font-medium mb-3 ${
                selectedImages.length === 0 || isSaving
                  ? isDarkMode
                    ? 'bg-blue-800 cursor-not-allowed text-blue-300'
                    : 'bg-blue-300 cursor-not-allowed text-white'
                  : 'bg-blue-600 hover:bg-blue-700 text-white'}`}
            >
              <Save className="size-4" />
              {isSaving ? 'Saving...' : `Save ${selectedImages.length > 0 ? selectedImages.length : ''} to Library`}
            </button>

            {/* Display loading or processing message while generating */}
            {isGeneratingImages && (
              <div className={`mt-3 flex items-center justify-center p-3 rounded-md ${
                isDarkMode ? 'bg-gray-800 text-text-white' : 'bg-gray-100 text-gray-700'
              }`}>
                <div className="animate-spin mr-2">
                  <svg className="size-5" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                </div>
                <span>Processing your request...</span>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="flex justify-between pt-4">
        <button
          type="button"
          onClick={goToPreviousStep}
          className={`flex items-center justify-center px-4 py-2 border rounded-md ${
            isDarkMode
              ? 'bg-dark-bg text-text-white hover:bg-light-container border-border-dark' 
              : 'bg-white text-gray-700 hover:bg-gray-50 border-gray-300'
          }`}
        >
          Back
        </button>
        
        {generatedImages.length > 0 && (
          <button
            type="button"
            onClick={goToNextStep}
            className={`flex items-center justify-center px-4 py-2 rounded-md ${
              isDarkMode
                ? 'bg-primary-green hover:bg-primary-green/90 text-deep-black'
                : 'bg-blue-600 hover:bg-blue-700 text-white'
            }`}
          >
            Next: Add Logo (Optional)
            <ArrowRight className="ml-2 size-4" />
          </button>
        )}
      </div>
    </div>
  )
  
  // Step 4: Component for logo functionality
  const StepFourComponent = () => (
    <div className="space-y-6">
      <div className="space-y-2">
        <h3 className={`text-lg font-semibold ${isDarkMode ? 'text-text-white' : 'text-gray-800'}`}>
          Step 4: Add Your Logo (Optional)
        </h3>
        <p className={`text-sm ${isDarkMode ? 'text-text-light-gray' : 'text-gray-500'}`}>
          Customize your AI-generated images with your brand logo
        </p>
      </div>

      {/* Show message if no images have been generated */}
      {generatedImages.length === 0 ? (
        <div className={`p-4 border rounded-md ${
          isDarkMode ? 'bg-amber-900/20 border-amber-800/30 text-amber-200' : 'bg-amber-50 border-amber-200 text-amber-800'
        }`}>
          <div className="flex items-start gap-2">
            <AlertCircle className="size-5 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium">No images to customize</p>
              <p className="text-sm mt-1">Please go back to step 3 and generate some images first.</p>
              <button
                type="button"
                onClick={() => setCurrentStep(3)}
                className={`mt-3 px-3 py-1.5 text-sm rounded-md ${
                  isDarkMode
                    ? 'bg-amber-800/30 hover:bg-amber-800/50 text-amber-100'
                    : 'bg-amber-100 hover:bg-amber-200 text-amber-800'
                }`}
              >
                Go to image generation
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <button 
              type="button"
              onClick={handleLogoButtonClick}
              className={`flex items-center justify-center py-1.5 px-3 text-sm font-medium rounded-md flex-1 
                ${logoUrl 
                  ? isDarkMode
                    ? 'bg-dark-bg text-text-white border border-border-dark hover:bg-light-container'
                    : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                  : isDarkMode
                    ? 'bg-primary-green hover:bg-primary-green/90 text-deep-black'
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
                    ? 'bg-dark-bg text-text-white border border-border-dark hover:bg-light-container'
                    : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                }`}
              >
                Clear
              </button>
            )}
            
            <input 
              type="file" 
              accept="image/*" 
              ref={logoFileInputRef}
              onChange={handleLogoUpload} 
              className="hidden"
              id="logoInput"
            />
          </div>
          
          {!logoUrl && (
            <div className={`p-3 rounded-md ${
              isDarkMode ? 'bg-gray-700 border border-gray-600' : 'bg-gray-50 border border-gray-200'
            }`}>
              <p className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                <Info className="inline-block mr-1.5 size-4 align-text-bottom" />
                Adding your logo to AI-generated images helps establish brand consistency and recognition. 
                Upload your logo file to get started.
              </p>
            </div>
          )}
          
          {logoUrl && (
            <div className={`mt-3 p-3 rounded-md ${
              isDarkMode ? 'bg-gray-700 border border-gray-600' : 'bg-gray-50 border border-gray-200'
            }`}>
              <div className="flex items-center gap-3">
                <div className={`relative size-16 rounded-md overflow-hidden ${
                  isDarkMode ? 'bg-gray-800 border border-gray-600' : 'bg-white border border-gray-200'
                }`}>
                  <NextImage
                    src={logoUrl}
                    alt="Your logo"
                    fill
                    sizes="64px"
                    className="object-contain"
                  />
                </div>
                <div className="flex-1">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label htmlFor="logo-position" className={`text-xs block mb-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>Position</label>
                      <select 
                        id="logo-position" 
                        value={overlayPosition} 
                        onChange={handlePositionChange}
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
                        <option value="custom">Custom (Drag & Drop)</option>
                      </select>
                    </div>
                    <div>
                      <label htmlFor="logo-size" className={`text-xs block mb-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>Size (%)</label>
                      <select 
                        id="logo-size" 
                        value={logoSize.toString()} 
                        onChange={handleLogoSizeChange}
                        className={`w-full h-8 px-2 py-1 text-sm rounded-md ${
                          isDarkMode
                            ? 'bg-gray-800 border-gray-600 text-gray-200'
                            : 'bg-white border-gray-300 text-gray-700'
                        }`}
                      >
                        <option value="5">5%</option>
                        <option value="10">10%</option>
                        <option value="15">15%</option>
                        <option value="20">20%</option>
                        <option value="25">25%</option>
                        <option value="30">30%</option>
                        <option value="40">40%</option>
                        <option value="50">50%</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>
              
              {isCustomPosition && (
                <div className={`mt-2 p-2 rounded ${
                  isDarkMode ? 'bg-blue-900/30 border border-blue-800 text-blue-200' : 'bg-blue-50 border border-blue-100 text-blue-700'
                }`}>
                  <p className="text-xs flex items-center">
                    <Info className="size-3 mr-1 flex-shrink-0" />
                    Click and drag to position your logo on each image
                  </p>
                </div>
              )}
            </div>
          )}
          
          {combinedPreviews.length > 0 && (
            <div className="mt-3">
              <div className="flex items-center justify-between mb-2">
                <div className={`text-sm font-medium ${isDarkMode ? 'text-text-white' : 'text-gray-700'}`}>
                  {selectedImages.length} of {combinedPreviews.length} selected
                </div>
                <div className="flex items-center gap-2">
                  <button 
                    type="button"
                    onClick={selectAll}
                    className={`py-1 px-2 text-xs font-medium rounded border ${
                      isDarkMode
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

              <button 
                type="button"
                onClick={() => handleSaveSelectedImagesToLibrary(true)}
                disabled={selectedImages.length === 0 || isSaving}
                className={`flex items-center justify-center w-full gap-2 py-2 px-4 rounded-md text-sm font-medium mb-3 
                  ${selectedImages.length === 0 || isSaving
                    ? isDarkMode
                      ? 'bg-blue-800 cursor-not-allowed text-blue-300'
                      : 'bg-blue-300 cursor-not-allowed text-white'
                    : 'bg-blue-600 hover:bg-blue-700 text-white'}`}
              >
                <Save className="size-4" />
                {isSaving ? 'Saving...' : `Save ${selectedImages.length > 0 ? selectedImages.length : ''} to Library with Logo`}
              </button>
            </div>
          )}
          
          {logoUrl && combinedPreviews.length === 0 && isProcessing && (
            <div className={`mt-3 flex items-center justify-center p-3 rounded-md ${
              isDarkMode ? 'bg-gray-800 text-text-white' : 'bg-gray-100 text-gray-700'
            }`}>
              <div className="animate-spin mr-2">
                <svg className="size-5" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              </div>
              <span>Generating logo previews...</span>
            </div>
          )}
          
          {logoUrl && generatedImages.length > 0 && combinedPreviews.length === 0 && !isProcessing && (
            <div className={`mt-3 p-3 rounded-md border ${
              isDarkMode ? 'bg-amber-900/20 border-amber-800/30 text-amber-200' : 'bg-amber-50 border-amber-200 text-amber-800'
            }`}>
              <p className="text-sm flex items-center">
                <AlertCircle className="size-4 mr-1.5 flex-shrink-0" />
                Logo preview generation is taking longer than expected. Please wait a moment.
              </p>
            </div>
          )}
        </div>
      )}

      <div className="flex justify-between pt-4">
        <button
          type="button"
          onClick={goToPreviousStep}
          className={`flex items-center justify-center px-4 py-2 border rounded-md ${
            isDarkMode
              ? 'bg-dark-bg text-text-white hover:bg-light-container border-border-dark' 
              : 'bg-white text-gray-700 hover:bg-gray-50 border-gray-300'
          }`}
        >
          Back
        </button>
        
        {logoUrl && combinedPreviews.length > 0 && (
          <button
            type="button"
            onClick={() => handleSaveSelectedImagesToLibrary(true)}
            disabled={selectedImages.length === 0 || isSaving}
            className={`flex items-center justify-center gap-2 px-4 py-2 rounded-md ${
              selectedImages.length === 0 || isSaving
                ? isDarkMode
                  ? 'bg-green-800 cursor-not-allowed text-green-300'
                  : 'bg-green-300 cursor-not-allowed text-white'
                : isDarkMode
                  ? 'bg-green-600 hover:bg-green-700 text-white'
                  : 'bg-green-600 hover:bg-green-700 text-white'
            }`}
          >
            <Save className="size-4" />
            Finalize & Save to Library
          </button>
        )}
      </div>
    </div>
  )

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
          {/* Left panel: Step-by-step process */}
          <div className="lg:col-span-1 space-y-5">
            {/* Step progress indicators */}
            <div className="flex mb-6">
              <div className="flex flex-col items-center flex-1">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  currentStep >= 1
                    ? isDarkMode ? 'bg-primary-green text-deep-black' : 'bg-blue-600 text-white'
                    : isDarkMode ? 'bg-gray-700 text-gray-400' : 'bg-gray-200 text-gray-600'
                }`}>
                  1
                </div>
                <span className={`text-xs mt-1 ${
                  currentStep >= 1 
                    ? isDarkMode ? 'text-text-white' : 'text-gray-700' 
                    : isDarkMode ? 'text-gray-500' : 'text-gray-400'
                }`}>Method</span>
              </div>
              <div className={`flex-1 relative top-4 ${
                currentStep > 1
                  ? isDarkMode ? 'border-t-2 border-primary-green' : 'border-t-2 border-blue-600'
                  : isDarkMode ? 'border-t border-gray-700' : 'border-t border-gray-300'
              }`} />
              <div className="flex flex-col items-center flex-1">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  currentStep >= 2
                    ? isDarkMode ? 'bg-primary-green text-deep-black' : 'bg-blue-600 text-white'
                    : isDarkMode ? 'bg-gray-700 text-gray-400' : 'bg-gray-200 text-gray-600'
                }`}>
                  2
                </div>
                <span className={`text-xs mt-1 ${
                  currentStep >= 2
                    ? isDarkMode ? 'text-text-white' : 'text-gray-700' 
                    : isDarkMode ? 'text-gray-500' : 'text-gray-400'
                }`}>Describe</span>
              </div>
              <div className={`flex-1 relative top-4 ${
                currentStep > 2
                  ? isDarkMode ? 'border-t-2 border-primary-green' : 'border-t-2 border-blue-600'
                  : isDarkMode ? 'border-t border-gray-700' : 'border-t border-gray-300'
              }`} />
              <div className="flex flex-col items-center flex-1">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  currentStep >= 3
                    ? isDarkMode ? 'bg-primary-green text-deep-black' : 'bg-blue-600 text-white'
                    : isDarkMode ? 'bg-gray-700 text-gray-400' : 'bg-gray-200 text-gray-600'
                }`}>
                  3
                </div>
                <span className={`text-xs mt-1 ${
                  currentStep >= 3
                    ? isDarkMode ? 'text-text-white' : 'text-gray-700' 
                    : isDarkMode ? 'text-gray-500' : 'text-gray-400'
                }`}>Generate</span>
              </div>
              <div className={`flex-1 relative top-4 ${
                currentStep > 3
                  ? isDarkMode ? 'border-t-2 border-primary-green' : 'border-t-2 border-blue-600'
                  : isDarkMode ? 'border-t border-gray-700' : 'border-t border-gray-300'
              }`} />
              <div className="flex flex-col items-center flex-1">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  currentStep >= 4
                    ? isDarkMode ? 'bg-primary-green text-deep-black' : 'bg-blue-600 text-white'
                    : isDarkMode ? 'bg-gray-700 text-gray-400' : 'bg-gray-200 text-gray-600'
                }`}>
                  4
                </div>
                <span className={`text-xs mt-1 ${
                  currentStep >= 4
                    ? isDarkMode ? 'text-text-white' : 'text-gray-700' 
                    : isDarkMode ? 'text-gray-500' : 'text-gray-400'
                }`}>Logo</span>
              </div>
            </div>

            {/* Render different content based on current step */}
            {currentStep === 1 && <StepOneComponent />}
            {currentStep === 2 && <StepTwoComponent />}
            {currentStep === 3 && <StepThreeComponent />}
            {currentStep === 4 && <StepFourComponent />}
          </div>
          
          {/* Right panel: Generated images display. */}
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
                  {approachMethod === "text-only" 
                    ? "Follow the steps to describe and generate AI images based on your text prompt." 
                    : "Follow the steps to upload reference images, describe what you want, and generate AI images."}
                </p>
                <div className={`text-xs p-3 rounded-lg ${isDarkMode ? 'bg-gray-800' : 'bg-gray-100'}`}>
                  <span className="font-medium">Current step:</span> {currentStep === 1 ? "Choose your creation method" : currentStep === 2 ? "Describe your image" : "Generate images"}
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex flex-col w-full">
                    <div className={`border-b ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                      <div className="flex items-center justify-between">
                        <div className="flex">
                          {currentStep === 4 && logoUrl ? (
                            <>
                              <div className={`py-2 px-4 text-sm font-medium border-b-2 ${
                                isDarkMode ? 'border-blue-500 text-blue-400' : 'border-blue-600 text-blue-600'
                              }`}>
                                Images with Logo
                              </div>
                            </>
                          ) : (
                            <div className="py-2 px-4 text-sm font-medium border-b-2 border-blue-600 text-blue-600">
                              AI Generated Images
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                      
                    <div className="mt-3">
                      {currentStep === 4 && logoUrl && combinedPreviews.length > 0 ? (
                        <div className={`grid grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-3`}>
                          {combinedPreviews.map((imgUrl, i) => {
                            const isSelected = selectedImages.includes(i)
                            return (
                              <div
                                key={i}
                                ref={el => { previewRefs.current[i] = el; }}
                                className={`relative ${getAspectRatioClass(imageFormat)} rounded-md overflow-hidden group cursor-pointer ${
                                  isSelected 
                                    ? "ring-2 ring-blue-500 ring-offset-2" 
                                    : isDarkMode ? "border-gray-700 border" : "border-gray-300 border"
                                }`}
                                onClick={() => toggleImageSelected(i)}
                                style={{ touchAction: isCustomPosition ? 'none' : 'auto' }}
                              >
                                <NextImage
                                  src={imgUrl}
                                  alt={`Generated image with logo ${i+1}`}
                                  fill
                                  sizes="(max-width: 768px) 100vw, 448px"
                                  className="object-contain"
                                />
                                
                                {/* Logo Drag Indicator (only shown when custom position is selected) */}
                                {isCustomPosition && <LogoDragIndicator imageIndex={i} />}
                                
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
                                        handleDownloadWithLogo(generatedImages[i], i);
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
                      ) : (
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
              type="button"
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
                type="button"
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
                type="button"
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