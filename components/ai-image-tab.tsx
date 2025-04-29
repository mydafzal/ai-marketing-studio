"use client"

import React, { useState, useEffect, useRef, useCallback } from "react"
import NextImage from "next/image"
import { 
  AlertCircle, 
  Download, 
  ImagePlus, 
  Upload, 
  Info, 
  CheckCircle2, 
  Sparkles,
  Layers,
  Trash2,
  Wand2,
  ZoomIn
} from "lucide-react"
import ImagePreviewModal from "@/components/image-preview-modal"
import { useUsageStore } from "@/app/store/useUsageStore"
import { UpgradeModal } from "@/components/upgrade-modal"

// Helper function to resize an image to a maximum file size
async function resizeImageToMaxSize(file: File, maxSizeKB: number = 1024): Promise<File> {
  return new Promise((resolve, reject) => {
    // If file is already smaller than the max size, return it as is
    if (file.size <= maxSizeKB * 1024) {
      return resolve(file);
    }
    
    const reader = new FileReader();
    reader.readAsDataURL(file);
    
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      
      img.onload = () => {
        // Create a canvas to draw the resized image
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        
        // Calculate reduction ratio based on file size
        // This is an estimate - we'll iterate if needed
        let ratio = Math.sqrt((maxSizeKB * 1024) / file.size);
        
        // Start with this ratio, but cap at 1.0 (don't enlarge)
        ratio = Math.min(1.0, ratio);
        
        // Initial dimensions
        width = Math.floor(width * ratio);
        height = Math.floor(height * ratio);
        
        // Set canvas size
        canvas.width = width;
        canvas.height = height;
        
        // Draw image on canvas
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          return reject(new Error('Could not get canvas context'));
        }
        
        ctx.drawImage(img, 0, 0, width, height);
        
        // Try with different quality settings if needed
        let quality = 0.9;  // Start with high quality
        let iterations = 0;
        const maxIterations = 5;
        
        const tryCompression = () => {
          if (iterations >= maxIterations) {
            console.warn(`Could not compress image to target size after ${maxIterations} attempts`);
            // Return best effort
            return finalize();
          }
          
          // Convert to blob with the current quality
          canvas.toBlob(
            (blob) => {
              if (!blob) {
                return reject(new Error('Canvas toBlob returned null'));
              }
              
              // Check if we've reached the target size
              if (blob.size <= maxSizeKB * 1024 || iterations >= maxIterations - 1) {
                return finalize();
              }
              
              // If still too large, reduce quality and try again
              quality = Math.max(0.5, quality - 0.1);
              iterations++;
              tryCompression();
            },
            file.type,
            quality
          );
        };
        
        const finalize = () => {
          canvas.toBlob(
            (blob) => {
              if (!blob) {
                return reject(new Error('Canvas toBlob returned null'));
              }
              
              // Create a new File from the blob
              const newFile = new File([blob], file.name, {
                type: file.type,
                lastModified: Date.now()
              });
              
              resolve(newFile);
            },
            file.type,
            quality
          );
        };
        
        // Start the compression process
        tryCompression();
      };
      
      img.onerror = () => {
        reject(new Error('Failed to load image'));
      };
    };
    
    reader.onerror = () => {
      reject(new Error('Failed to read file'));
    };
  });
}
import { useTheme } from "next-themes"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
// Import the AspectRatio type along with the server actions
import { 
  generateImages, 
  generateImageVariants,
  generateImageVariation
} from "@/app/actions/generate-image"
// Import the AspectRatio type
import type { AspectRatio } from "@/app/actions/generate-image"

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

// Loading screen component
const LoadingScreen = ({ isDarkMode, generationMode, numImages }: { isDarkMode: boolean, generationMode: 'text' | 'variations', numImages: number }) => {
  let statusText = '';
  let icon = null;
  
  switch(generationMode) {
    case 'text':
      statusText = `Creating ${numImages} images from your description...`;
      icon = <ImagePlus className={`size-10 mb-4 ${isDarkMode ? 'text-primary-green' : 'text-blue-500'}`} />;
      break;
    case 'variations':
      statusText = `Creating ${numImages} variations of your image...`;
      icon = <Magic className={`size-10 mb-4 ${isDarkMode ? 'text-primary-green' : 'text-blue-500'}`} />;
      break;
  }
  
  return (
    <div className={`flex flex-col items-center justify-center size-full min-h-[400px] ${
      isDarkMode ? 'bg-gray-800/50' : 'bg-gray-100/50'
    } rounded-lg border ${
      isDarkMode ? 'border-gray-700' : 'border-gray-300'
    }`}>
      {icon}
      
      <div className={`text-lg font-medium mb-2 ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}>
        {statusText}
      </div>
      
      <div className="relative w-48 h-2 bg-gray-300 rounded-full overflow-hidden">
        <div className={`absolute top-0 left-0 h-full ${
          isDarkMode ? 'bg-primary-green' : 'bg-blue-500'
        } animate-loading-bar`}></div>
      </div>
      
      <div className={`mt-6 text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
        <p>This may take a few moments...</p>
        <p className="mt-1">Please don&apos;t refresh the page.</p>
      </div>
    </div>
  );
}

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

// Function to convert a File to a base64 data URL
function fileToDataURL(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      if (reader.result && typeof reader.result === 'string') {
        resolve(reader.result)
      } else {
        reject(new Error('Failed to convert file to data URL'))
      }
    }
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
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
  // Usage tracking
  const { 
    fetchUsageData, 
    incrementImageCount, 
    isImageLimitReached,
    imageCount
  } = useUsageStore()
  
  // Modal for upgrade prompt
  const [showUpgradeModal, setShowUpgradeModal] = useState(false)
  
  // Fetch usage data on component mount
  useEffect(() => {
    fetchUsageData()
  }, [fetchUsageData])
  const { theme } = useTheme()
  const isDarkMode = theme === "dark"
  const fileInputRef = useRef<HTMLInputElement>(null)
  const multiImageFileInputRef = useRef<HTMLInputElement>(null)
  const previewRefs = useRef<(HTMLDivElement | null)[]>([])

  // State management
  const [generationMode, setGenerationMode] = useState<'text' | 'variations'>('text')
  const [imagePrompt, setImagePrompt] = useState("")
  const [isGeneratingImages, setIsGeneratingImages] = useState(false)
  const [generatedImages, setGeneratedImages] = useState<string[]>([])
  const [isImprovingImagePrompt, setIsImprovingImagePrompt] = useState(false)
  const [logoUrl, setLogoUrl] = useState<string>("")
  const [overlayPosition, setOverlayPosition] = useState("bottom-right")
  const [combinedPreviews, setCombinedPreviews] = useState<string[]>([])
  const [selectedImages, setSelectedImages] = useState<number[]>([])
  const [activeTab, setActiveTab] = useState("original")
  const [promptHistory, setPromptHistory] = useState<string[]>([])
  const [logoSize, setLogoSize] = useState(20) // As percentage of image width
  const [toastMessage, setToastMessage] = useState<{title: string, description: string, type: 'success' | 'error'} | null>(null)
  const [imageFormat, setImageFormat] = useState("1:1") // Default to square
  const [numGeneratedImages, setNumGeneratedImages] = useState<5 | 10>(5)
  
  // Reference images state
  const [referenceImages, setReferenceImages] = useState<File[]>([])
  const [referenceImagePreviews, setReferenceImagePreviews] = useState<string[]>([])
  
  // Drag and drop state
  const [customLogoPosition, setCustomLogoPosition] = useState({ x: 0, y: 0 })
  const [isDraggingLogo, setIsDraggingLogo] = useState(false)
  const [dragStartPos, setDragStartPos] = useState({ x: 0, y: 0 })
  const [isCustomPosition, setIsCustomPosition] = useState(false)
  const [draggedImageIndex, setDraggedImageIndex] = useState<number | null>(null)
  const [logoPositions, setLogoPositions] = useState<{ [key: number]: { x: number, y: number } }>({})
  const [isDragUpdatePending, setIsDragUpdatePending] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [isResizingLogo, setIsResizingLogo] = useState(false)

  // Initialize previewRefs when images change
  useEffect(() => {
    // Reset refs array when number of images changes
    previewRefs.current = Array(combinedPreviews.length).fill(null)
  }, [combinedPreviews.length])

  // Show toast notification
  const showToast = useCallback((title: string, description: string, type: 'success' | 'error') => {
    setToastMessage({ title, description, type })
    setTimeout(() => setToastMessage(null), 3000)
  }, [])

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

  // Logo position handling with improved transition
  const handlePositionChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newPosition = e.target.value
    
    // Prevent preview updates during position changes
    setIsDragUpdatePending(true)
    
    // Update the position setting
    setOverlayPosition(newPosition)
    setIsCustomPosition(newPosition === "custom")
    
    // Reset custom position when switching to a preset position
    if (newPosition !== "custom") {
      setCustomLogoPosition({ x: 0, y: 0 })
      setLogoPositions({})
    }
    
    // Allow preview to update after a short delay
    setTimeout(() => {
      setIsDragUpdatePending(false)
    }, 100)
  }

  // Enhanced handling of logo size changes for immediate visual feedback
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

  // Handle adding reference images for variants
  async function handleReferenceImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.files && e.target.files.length > 0) {
      const files = Array.from(e.target.files)
      
      // First validate file types - only allow image types that work well with the API
      const validTypeFiles = files.filter(file => {
        // Check MIME type
        if (!file.type.match(/^image\/(jpeg|png|webp|gif)$/)) {
          showToast(
            "Unsupported file type", 
            `${file.name} has unsupported type (${file.type}). Please use PNG or JPEG.`, 
            "error"
          )
          return false
        }
        return true
      })
      
      // Show validation message for files that are too large
      validTypeFiles.forEach(file => {
        if (file.size > 4 * 1024 * 1024) {
          showToast(
            "File will be resized", 
            `${file.name} (${(file.size / (1024 * 1024)).toFixed(1)}MB) will be automatically optimized for API compatibility.`, 
            "success"
          )
        }
      })
      
      if (validTypeFiles.length === 0) return
      
      try {
        // Show processing message for larger uploads
        if (validTypeFiles.some(file => file.size > 1 * 1024 * 1024)) {
          showToast(
            "Processing images",
            "Optimizing images for upload...",
            "success"
          )
        }
        
        // Resize any images that are too large (for API compatibility)
        // The user still sees the original quality in the UI
        const processedFiles = await Promise.all(
          validTypeFiles.map(async (file) => {
            try {
              // Target 1MB for production compatibility
              return await resizeImageToMaxSize(file, 1024)
            } catch (error) {
              console.error(`Error resizing ${file.name}:`, error)
              // Return original file as fallback
              return file
            }
          })
        )
        
        // Add to existing reference images (up to 4 total)
        const newReferenceImages = [...referenceImages, ...processedFiles].slice(0, 4)
        setReferenceImages(newReferenceImages)
        
        // Generate previews for the new images - create preview from original high quality image
        // This way the user sees the original quality in the UI
        Promise.all(
          validTypeFiles.map(file => fileToDataURL(file))
        ).then(dataUrls => {
          setReferenceImagePreviews(dataUrls)
        }).catch(error => {
          console.error("Error generating image previews:", error)
          showToast(
            "Preview error", 
            "Failed to create image previews. Please try different images.",
            "error"
          )
        })
        
        showToast(
          "Images uploaded", 
          `${validTypeFiles.length} reference image${validTypeFiles.length !== 1 ? 's' : ''} uploaded successfully.`, 
          "success"
        )
        
        // If we have at least one valid image, provide guidance
        if (validTypeFiles.length > 0 && !imagePrompt.trim()) {
          setTimeout(() => {
            showToast(
              "Next step", 
              "Now enter a descriptive prompt about what you want to create with these images.",
              "success"
            )
          }, 3500) // Show this message after the first toast disappears
        }
      } catch (error) {
        console.error("Error processing images:", error)
        showToast(
          "Upload error",
          "There was a problem processing the images. Please try again with different images.",
          "error"
        )
      }
    }
  }
  
  // Remove a reference image
  const handleRemoveReferenceImage = useCallback((index: number) => {
    setReferenceImages(prev => prev.filter((_, i) => i !== index))
    setReferenceImagePreviews(prev => prev.filter((_, i) => i !== index))
  }, [])
  
  // Clear all reference images
  const handleClearReferenceImages = useCallback(() => {
    setReferenceImages([])
    setReferenceImagePreviews([])
  }, [])

  // Start dragging the logo - with improved update prevention
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

  // End dragging - with improved cleanup
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

  // Mobile touch events - improved
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

  // Improved touch end handling
  const handleLogoTouchEnd = useCallback(() => {
    if (isDraggingLogo) {
      setIsDraggingLogo(false)
      setDraggedImageIndex(null)
      
      setTimeout(() => {
        setIsDragUpdatePending(false)
      }, 100)
    }
  }, [isDraggingLogo])

  // Enhancement: Cancel dragging if mouse leaves the document
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
  }, [isCustomPosition, isDraggingLogo, handleLogoMouseMove, handleLogoMouseUp, handleLogoTouchMove, handleLogoTouchEnd, handleMouseLeave])

  // Image generation from text prompt
  async function handleImageGenerate() {
    if (!imagePrompt.trim()) {
      showToast("Missing prompt", "Please enter an image description first.", "error")
      return
    }
    
    // Check if image limit reached
    if (isImageLimitReached) {
      setShowUpgradeModal(true)
      return
    }
    
    setIsGeneratingImages(true)
    
    try {
      savePromptToHistory(imagePrompt)
      
      // Pass the imageFormat as the second parameter and number of images as third parameter
      const result = await generateImages(imagePrompt, imageFormat as AspectRatio, numGeneratedImages)
      if (result.success && result.images) {
        const validUrls = result.images.filter((url: unknown) => typeof url === "string") as string[]
        setGeneratedImages(validUrls)
        setCombinedPreviews([])
        setSelectedImages([])
        setLogoPositions({}) // Reset custom logo positions for new images
        
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
      
      // Check if error is due to free plan limit
      const errorMessage = err instanceof Error ? err.message : String(err);
      if (errorMessage.includes("Free plan image generation limit reached")) {
        // Show the upgrade modal if limit is reached
        setShowUpgradeModal(true)
      } else {
        // Show regular error for other types of errors
        showToast(
          "Generation failed", 
          "Unable to create images. Please try again with a different prompt.", 
          "error"
        )
      }
    } finally {
      setIsGeneratingImages(false)
    }
  }

  // Generate image variants from reference images
  async function handleGenerateVariants() {
    if (!imagePrompt.trim()) {
      showToast("Missing prompt", "Please enter a description for the variants.", "error")
      return
    }
    
    if (referenceImages.length === 0) {
      showToast("No reference images", "Please upload at least one reference image.", "error")
      return
    }
    
    setIsGeneratingImages(true)
    
    try {
      savePromptToHistory(imagePrompt)
      
      // Validate images before sending
      // OpenAI requires image formats to be PNG, JPEG or WebP for gpt-image-1
      const validFileTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp']
      
      // Pre-process images to ensure they're valid
      const processedImages = referenceImages.filter(file => {
        // Check file type
        if (!validFileTypes.includes(file.type)) {
          showToast(
            "Unsupported file format", 
            `File "${file.name}" has type "${file.type}" which is not supported. Only PNG, JPEG and WebP are allowed.`, 
            "error"
          )
          return false
        }
        
        return true
      })
      
      // Check if we have at least one valid image
      if (processedImages.length === 0) {
        throw new Error("No valid reference images found after filtering. Please upload PNG, JPEG or WebP images.")
      }
      
      // First check if any images are larger than 1MB and need further processing
      const largeImages = processedImages.filter(file => file.size > 1 * 1024 * 1024);
      
      if (largeImages.length > 0) {
        console.log(`Found ${largeImages.length} large images that may need additional resizing`);
        // Show a toast only if we're going to do additional resizing
        showToast(
          "Optimizing images", 
          "Preparing images for API compatibility...",
          "success"
        );
      }
      
      // Convert all reference images to data URLs
      // Note: The images are already resized during upload, but we're checking again
      // to ensure they meet API requirements
      const referenceDataUrls = await Promise.all(
        processedImages.map(file => fileToDataURL(file))
      )
      
      console.log(`Sending ${referenceDataUrls.length} reference images for variant generation`)
      
      // Show detailed information to the user
      showToast(
        "Processing images", 
        `Creating variants from ${referenceDataUrls.length} reference image${referenceDataUrls.length > 1 ? 's' : ''}...`, 
        "success"
      )
      
      // Generate the variants using the OpenAI edit endpoint with multiple reference images
      console.log(`Calling generateImageVariants with ${referenceDataUrls.length} reference images`)
      try {
        const result = await generateImageVariants(
          imagePrompt, 
          referenceDataUrls, 
          imageFormat as AspectRatio,
          numGeneratedImages
        )
        
        if (!result) {
          throw new Error("No result returned from image generation")
        }
        
        if (result.success && result.images) {
          const validUrls = result.images.filter((url: unknown) => typeof url === "string") as string[]
          setGeneratedImages(validUrls)
          setCombinedPreviews([])
          setSelectedImages([])
          setLogoPositions({}) // Reset custom logo positions for new images
          
          showToast(
            "Variants generated", 
            `Created ${validUrls.length} image variant${validUrls.length !== 1 ? 's' : ''} successfully`, 
            "success"
          )
        } else {
          throw new Error(result.error || "Failed to generate image variants.")
        }
      } catch (innerErr) {
        console.error("Inner error in variant generation:", innerErr)
        throw innerErr
      }
    } catch (err) {
      console.error("Error generating image variants:", err)
      
      // Extract a more meaningful error message if possible
      let errorMessage = "Unable to create variants. Please try again with different images or prompt.";
      
      if (err instanceof Error) {
        // Clean up common API error messages to make them more user-friendly
        const msg = err.message;
        
        if (msg.includes("Invalid input image type")) {
          errorMessage = "One or more reference images has an invalid format. Try using PNG or JPEG images.";
        } else if (msg.includes("insufficient tokens")) {
          errorMessage = "API usage limit exceeded. Please try again later.";
        } else if (msg.includes("content policy") || msg.includes("content filter")) {
          errorMessage = "Your prompt or images may violate content policies. Please modify and try again.";
        } else if (msg.includes("network")) {
          errorMessage = "Network error occurred. Please check your internet connection and try again.";
        } else if (msg.length < 150) {
          // Only use API error message if it's reasonably short
          errorMessage = msg;
        }
      }
      
      showToast(
        "Generation failed", 
        errorMessage, 
        "error"
      )
    } finally {
      setIsGeneratingImages(false)
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
  
  // Trigger multi-image file input click
  function handleReferenceImageButtonClick() {
    if (multiImageFileInputRef.current) {
      multiImageFileInputRef.current.click()
    }
  }
  
  // Handle adding reference images for variations
  // This is intentionally empty as we're removing the duplicate function
  
  // Clear the source image for variations
  // Function removed
  
  // Render reference image thumbnails
  const renderReferenceImages = () => {
    return (
      <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-3">
        {referenceImagePreviews.map((preview, index) => (
          <div key={index} className="relative group">
            <div className={`${getAspectRatioClass(imageFormat)} rounded-md overflow-hidden border ${
              isDarkMode ? 'border-gray-700' : 'border-gray-300'
            }`}>
              <div className="absolute inset-0 z-10">
                <ImagePreviewModal
                  imageUrl={preview}
                  altText={`Reference image ${index+1}`}
                  className="absolute inset-0 z-20"
                >
                  <NextImage
                    src={preview}
                    alt={`Reference image ${index+1}`}
                    fill
                    className="object-cover"
                  />
                  <div className="absolute top-2 right-2 bg-black/50 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                    <ZoomIn className="size-3" />
                  </div>
                </ImagePreviewModal>
              </div>
              
              <NextImage
                src={preview}
                alt={`Reference image ${index+1}`}
                fill
                className="object-cover"
              />
            </div>
            <button
              type="button"
              onClick={() => handleRemoveReferenceImage(index)}
              className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity z-20"
            >
              <Trash2 className="size-3" />
            </button>
          </div>
        ))}
        
        {referenceImages.length < 4 && (
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className={`flex flex-col items-center justify-center ${getAspectRatioClass(imageFormat)} rounded-md border-2 border-dashed ${
              isDarkMode 
                ? 'border-gray-700 hover:border-gray-600 bg-gray-800/30' 
                : 'border-gray-300 hover:border-gray-400 bg-gray-50'
            }`}
          >
            <Upload className={`size-6 mb-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`} />
            <span className={`text-xs font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              Add image
            </span>
          </button>
        )}
      </div>
    )
  }

  // Generate image variations from reference images
  async function handleGenerateVariations() {
    if (referenceImages.length === 0) {
      showToast(
        "No reference images", 
        "Please upload at least one image to create variations.", 
        "error"
      )
      return
    }
    
    // Check if image limit reached
    if (isImageLimitReached) {
      setShowUpgradeModal(true)
      return
    }
    
    setIsGeneratingImages(true)
    
    try {
      // First check if any images are larger than 1MB and may need optimizing
      const largeImages = referenceImages.filter(file => file.size > 1 * 1024 * 1024);
      
      if (largeImages.length > 0) {
        console.log(`Found ${largeImages.length} large images that may need optimizing`);
        showToast(
          "Optimizing images", 
          "Preparing images for API compatibility...",
          "success"
        );
      }
      
      // Convert all reference images to data URLs
      // Note: The images should already be properly sized during upload
      const referenceDataUrls = await Promise.all(
        referenceImages.map(file => fileToDataURL(file))
      )
      
      // Pass the image data to the server action for processing using images.edit
      // Include the prompt if provided, otherwise use the default one in the function
      console.log(`Calling generateImageVariation with ${referenceDataUrls.length} reference images`)
      try {
        const result = await generateImageVariation(
          referenceDataUrls,
          imageFormat as AspectRatio,
          numGeneratedImages,
          imagePrompt.trim() || undefined // Use undefined to get the default prompt if empty
        )
        
        if (!result) {
          throw new Error("No result returned from image generation")
        }
        
        if (result.success && result.images) {
          const validUrls = result.images.filter((url: unknown) => typeof url === "string") as string[]
          setGeneratedImages(validUrls)
          setCombinedPreviews([])
          setSelectedImages([])
          setLogoPositions({}) // Reset custom logo positions for new images
          
          showToast(
            "Images generated", 
            `Created ${validUrls.length} image${validUrls.length !== 1 ? 's' : ''} successfully based on your reference images`, 
            "success"
          )
        } else {
          throw new Error(result.error || "Failed to generate images with reference images.")
        }
      } catch (innerErr) {
        console.error("Inner error in variation generation:", innerErr)
        
        // Check if error is due to free plan limit
        const innerErrorMessage = innerErr instanceof Error ? innerErr.message : String(innerErr);
        if (innerErrorMessage.includes("Free plan image generation limit reached")) {
          // Show the upgrade modal if limit is reached
          setShowUpgradeModal(true)
          return; // Exit early to prevent propagation
        }
        
        throw innerErr
      }
    } catch (err) {
      console.error("Error generating images with reference:", err)
      
      // Check if error is due to free plan limit
      const errorMessage = err instanceof Error ? err.message : String(err);
      if (errorMessage.includes("Free plan image generation limit reached")) {
        // Show the upgrade modal if limit is reached
        setShowUpgradeModal(true)
        return; // Exit early to prevent showing the error toast
      }
      
      // Extract error message
      let errorMessage = "Unable to create images. Please try again with different reference images.";
      const rawErrorMessage = err instanceof Error ? err.message : String(err);
      
      // Check if error is due to free plan limit
      if (rawErrorMessage.includes("Free plan image generation limit reached")) {
        // Show the upgrade modal if limit is reached
        setShowUpgradeModal(true)
        return; // Exit early to prevent showing the error toast
      }
      
      // For other types of errors, clean up and display a helpful message
      if (err instanceof Error) {
        // Clean up common API error messages
        const msg = err.message;
        
        if (msg.includes("content policy") || msg.includes("content filter")) {
          errorMessage = "Your request may violate content policies. Please try different reference images.";
        } else if (msg.includes("network") || msg.includes("connection")) {
          errorMessage = "Network error occurred. Please check your internet connection and try again.";
        } else if (msg.includes("Bad Request") || msg.includes("invalid")) {
          errorMessage = "Invalid request format. Please try with different images or resize them.";
        } else if (msg.includes("Too Many Requests")) {
          errorMessage = "Rate limit exceeded. Please try again in a few minutes.";
        } else if (msg.length < 150) {
          // Only use API error message if it's reasonably short
          errorMessage = msg;
        }
      }
      
      showToast("Generation failed", errorMessage, "error")
    } finally {
      setIsGeneratingImages(false)
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

  // Combine images with custom logo positioning
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

  // Updated useEffect for logo preview updates with more reliable handling
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
      const finalUrl = await combineImages(aiImageUrl, logoUrl, overlayPosition, index)
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

  // Library functions have been removed

  // Improved LogoDragIndicator component with exact size matching
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

  // Function removed to fix duplicate definition
  
  // Removed old renderVariationSourceImage function

  return (
    <div className={`w-full shadow-sm rounded-lg border ${isDarkMode ? 'bg-container-bg border-border-dark' : 'bg-white border-gray-200'}`}>
      {/* Upgrade Modal */}
      <UpgradeModal 
        isOpen={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
        usageType="images"
        currentCount={imageCount}
      />
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
            <Wand2 className={`size-5 ${isDarkMode ? 'text-primary-green' : 'text-blue-600'}`} />
            <span className={isDarkMode ? 'text-text-white' : 'text-gray-900'}>AI Creatives Director</span>
          </h2>
          <p className={`text-sm mt-1.5 ${isDarkMode ? 'text-text-light-gray' : 'text-gray-500'}`}>
            Create professional images using AI from text descriptions or reference images
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
      
      {/* Mode Selection Tabs */}
      <div className="px-6 pt-4">
        <Tabs value={generationMode} onValueChange={(value) => setGenerationMode(value as 'text' | 'variations')} className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-4">
            <TabsTrigger value="text" className="flex gap-2 items-center">
              <ImagePlus className="size-4" />
              Text to Image
            </TabsTrigger>
            <TabsTrigger value="variations" className="flex gap-2 items-center">
              <Magic className="size-4" />
              Reference Images
            </TabsTrigger>
          </TabsList>
          
          {/* Text to Image Tab Content */}
          <TabsContent value="text">
            <div className="text-sm text-muted-foreground mb-4">
              <div className={`p-3 rounded-lg ${isDarkMode ? 'bg-gray-800/50' : 'bg-gray-50'}`}>
                <p>Describe the image you want to create, and our AI will generate it for you. Be as detailed as possible for best results.</p>
              </div>
            </div>
          </TabsContent>
          
          {/* Image Variations Tab Content */}
          <TabsContent value="variations">
            <div className="text-sm text-muted-foreground mb-4">
              <div className={`p-3 rounded-lg ${isDarkMode ? 'bg-gray-800/50' : 'bg-gray-50'}`}>
                <p>Upload up to 4 reference images and our AI will generate creative images inspired by them. Perfect for creating variations of your ads, combining elements from competitor creatives, or generating gift baskets with your products.</p>
                <p className="mt-2 text-xs font-medium">
                  <span className={isDarkMode ? 'text-amber-400' : 'text-amber-600'}>Note:</span> Upload PNG, JPEG, or WebP images (max 20MB each). You can add up to 4 reference images.
                </p>
              </div>
            </div>
            
            {/* Source image uploader for variations */}
            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <label className={`text-sm font-medium ${isDarkMode ? 'text-text-white' : 'text-gray-700'}`}>
                  Reference Images (1-4)
                </label>
                {referenceImages.length > 0 && (
                  <button 
                    type="button"
                    onClick={handleClearReferenceImages}
                    className={`text-xs ${isDarkMode ? 'text-red-400 hover:text-red-300' : 'text-red-500 hover:text-red-600'}`}
                  >
                    Clear all
                  </button>
                )}
              </div>
              
              <input 
                type="file" 
                accept="image/png,image/jpeg,image/jpg,image/webp" 
                multiple
                ref={fileInputRef}
                onChange={handleReferenceImageUpload} 
                className="hidden" 
              />
              
              {renderReferenceImages()}
            </div>
          </TabsContent>
        </Tabs>
      </div>
      
      {/* Main content */}
      <div className="p-6 pt-0">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left panel: Prompt input and controls */}
          <div className="lg:col-span-1 space-y-5">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label htmlFor="imagePrompt" className={`text-sm font-medium ${isDarkMode ? 'text-text-white' : 'text-gray-700'}`}>
                  {generationMode === 'text' ? 'Describe the image you want' : 'Describe what to create from reference images'}
                </label>
                
                <button 
                  type="button" 
                  className={isDarkMode ? 'text-text-light-gray hover:text-text-white' : 'text-gray-500 hover:text-gray-700'}
                  title="Tips for better prompts"
                >
                  <Info className="size-4" />
                </button>
              </div>

              <textarea
                id="imagePrompt"
                value={imagePrompt}
                onChange={(e) => setImagePrompt(e.target.value)}
                placeholder={generationMode === 'text' 
                  ? "A professional image of a business person working in a modern office, soft lighting, deep focus..." 
                  : "Create a cohesive collection combining elements from the reference images in a professional style..."}
                className={`w-full min-h-[120px] resize-none p-3 rounded-md focus:ring-2 focus:ring-primary-green focus:border-primary-green outline-none ${
                  isDarkMode 
                    ? 'bg-dark-bg border-border-dark text-text-white placeholder-text-light-gray' 
                    : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'
                }`}
              />

              <div className="flex flex-col gap-3">
                <div className={`space-y-2 ${isDarkMode ? 'text-text-white' : 'text-gray-700'}`}>
                  <div className="flex justify-between items-center">
                    <label htmlFor="imageFormat" className="block text-sm font-medium">
                      Image Format
                    </label>
                    <div className="flex items-center gap-2">
                      <label className="text-sm">Number of images:</label>
                      <div className="flex">
                        <button 
                          type="button"
                          onClick={() => setNumGeneratedImages(5)}
                          className={`px-2 py-1 text-xs font-medium rounded-l-md ${
                            numGeneratedImages === 5 
                              ? isDarkMode ? 'bg-primary-green text-black' : 'bg-blue-600 text-white' 
                              : isDarkMode ? 'bg-gray-700 text-white' : 'bg-gray-200 text-gray-600'
                          }`}
                        >
                          5
                        </button>
                        <button 
                          type="button"
                          onClick={() => setNumGeneratedImages(10)}
                          className={`px-2 py-1 text-xs font-medium rounded-r-md ${
                            numGeneratedImages === 10 
                              ? isDarkMode ? 'bg-primary-green text-black' : 'bg-blue-600 text-white' 
                              : isDarkMode ? 'bg-gray-700 text-white' : 'bg-gray-200 text-gray-600'
                          }`}
                        >
                          10
                        </button>
                      </div>
                    </div>
                  </div>
                  <select
                    id="imageFormat"
                    value={imageFormat}
                    onChange={(e) => setImageFormat(e.target.value)}
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
              
              {promptHistory.length > 0 && (
                <div className="pt-1">
                  <div className={`text-xs flex items-center gap-1 mb-1.5 ${isDarkMode ? 'text-text-light-gray' : 'text-gray-500'}`}>
                    <Sparkles className="size-3" /> Recent prompts
                  </div>
                  <div className={`h-20 w-full overflow-y-auto rounded-md p-2 ${
                    isDarkMode ? 'border-border-dark border bg-dark-bg' : 'border border-gray-200 bg-white'
                  }`}>
                    {promptHistory.map((prompt, idx) => (
                      <button 
                        key={idx} 
                        type="button"
                        className={`w-full text-left text-xs py-1 px-2 mb-1 rounded ${
                          isDarkMode 
                            ? 'hover:bg-light-container text-text-light-gray' 
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
                      ? 'bg-dark-bg text-text-light-gray cursor-not-allowed border-border-dark' 
                      : 'bg-gray-100 text-gray-400 cursor-not-allowed border-gray-200'
                    : isDarkMode
                      ? 'bg-dark-bg text-text-white hover:bg-light-container border-border-dark' 
                      : 'bg-white text-gray-700 hover:bg-gray-50 border-gray-300'
                  }`}
              >
                <Magic className="mr-2 size-4" />
                {isImprovingImagePrompt ? "Enhancing..." : "Enhance prompt with AI"}
              </button>

              <button
                type="button"
                onClick={
                  generationMode === 'text' 
                    ? handleImageGenerate 
                    : handleGenerateVariations
                }
                disabled={
                  (generationMode === 'text' && !imagePrompt.trim()) || 
                  isGeneratingImages || 
                  (generationMode === 'variations' && referenceImages.length === 0)
                }
                className={`flex justify-center items-center w-full py-2 px-4 rounded-md text-sm font-medium 
                  ${(generationMode === 'text' && !imagePrompt.trim()) || 
                    isGeneratingImages || 
                    (generationMode === 'variations' && referenceImages.length === 0)
                    ? isDarkMode
                      ? 'bg-primary-green/50 cursor-not-allowed text-text-white/70'
                      : 'bg-blue-300 cursor-not-allowed text-white'
                    : isDarkMode
                      ? 'bg-primary-green hover:bg-primary-green/90 text-deep-black'
                      : 'bg-blue-600 hover:bg-blue-700 text-white'
                  }`}
              >
                {generationMode === 'text' 
                  ? <ImagePlus className="mr-2 size-4" />
                  : <Magic className="mr-2 size-4" />
                }
                {isGeneratingImages 
                  ? "Generating..." 
                  : generationMode === 'text' 
                    ? `Create ${numGeneratedImages} images`
                    : `Create ${numGeneratedImages} images from references`
                }
              </button>
            </div>
            
            <hr className={isDarkMode ? 'border-border-dark' : 'border-gray-200'} />
            
            {/* Logo and branding section */}
            <div className="space-y-4">
              <div>
                <h3 className={`text-sm font-medium mb-2 ${isDarkMode ? 'text-text-white' : 'text-gray-700'}`}>Brand your images</h3>
                
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
              </div>
            </div>
          </div>
          
          {/* Right panel: Generated images display */}
          <div className="lg:col-span-2">
            {isGeneratingImages ? (
              <LoadingScreen 
                isDarkMode={isDarkMode} 
                generationMode={generationMode} 
                numImages={numGeneratedImages} 
              />
            ) : generatedImages.length === 0 ? (
              <div className={`border border-dashed rounded-lg p-8 flex flex-col items-center justify-center h-full min-h-[300px] text-center ${
                isDarkMode ? 'border-gray-700' : 'border-gray-200'
              }`}>
                <div className={`p-3 rounded-full mb-3 ${isDarkMode ? 'bg-blue-900' : 'bg-blue-100'}`}>
                  <ImagePlus className={`size-6 ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`} />
                </div>
                <h3 className={`text-lg font-medium mb-1 ${isDarkMode ? 'text-gray-200' : 'text-gray-800'}`}>No images generated yet</h3>
                <p className={`text-sm max-w-md mb-4 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  {generationMode === 'text' 
                    ? "Enter a descriptive prompt and click \"Create images\" to generate AI images for your project."
                    : "Upload a source image and click \"Create variations\" to generate AI variations of your image."
                  }
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
                        <div className={`grid grid-cols-2 ${
                          imageFormat === "9:16" || imageFormat === "2:3" || imageFormat === "3:4" 
                            ? "md:grid-cols-3" // 3 columns for portrait images
                            : numGeneratedImages === 10 
                              ? "md:grid-cols-5" // 5 columns for landscape/square with 10 images 
                              : "md:grid-cols-5" // 5 columns for landscape/square with 5 images
                        } gap-3`}>
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
                                <div className="absolute inset-0 z-10">
                                  <ImagePreviewModal
                                    imageUrl={imgUrl}
                                    altText={`Generated image ${i+1}`}
                                    className="absolute inset-0 z-20"
                                  >
                                    <NextImage
                                      src={imgUrl}
                                      alt={`Generated image ${i+1}`}
                                      fill
                                      sizes="(max-width: 768px) 100vw, 448px"
                                      className="object-contain"
                                    />
                                    <div className="absolute top-2 right-2 bg-black/50 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                                      <ZoomIn className="size-4" />
                                    </div>
                                  </ImagePreviewModal>
                                </div>
                                
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
                        <div className={`grid grid-cols-2 ${
                          imageFormat === "9:16" || imageFormat === "2:3" || imageFormat === "3:4" 
                            ? "md:grid-cols-3" // 3 columns for portrait images
                            : numGeneratedImages === 10 
                              ? "md:grid-cols-5" // 5 columns for landscape/square with 10 images 
                              : "md:grid-cols-5" // 5 columns for landscape/square with 5 images
                        } gap-3`}>
                          {combinedPreviews.map((previewUrl, i) => {
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
                                <div className="absolute inset-0 z-10">
                                  <ImagePreviewModal
                                    imageUrl={previewUrl}
                                    altText={`Branded image ${i+1}`}
                                    className="absolute inset-0 z-20"
                                  >
                                    <NextImage
                                      src={previewUrl}
                                      alt={`Branded image ${i+1}`}
                                      fill
                                      sizes="(max-width: 768px) 100vw, 448px"
                                      className="object-contain"
                                    />
                                    <div className="absolute top-2 right-2 bg-black/50 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                                      <ZoomIn className="size-4" />
                                    </div>
                                  </ImagePreviewModal>
                                </div>
                                
                                <NextImage
                                  src={previewUrl}
                                  alt={`Branded image ${i+1}`}
                                  fill
                                  sizes="(max-width: 768px) 100vw, 448px"
                                  className="object-contain"
                                />
                                
                                {/* Logo Drag Indicator (only shown when custom position is selected) */}
                                {isCustomPosition && <LogoDragIndicator imageIndex={i} />}
                                
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
      
      {/* Footer section has been removed */}
    </div>
  )
}