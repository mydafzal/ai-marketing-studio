"use client"

import React, { useState, useRef, useEffect } from "react"
import NextImage from "next/image"
import { useTheme } from "next-themes"
import { AlertCircle, CheckCircle2, Brush, Upload, RefreshCw, Download, ArrowLeft, Info, Repeat } from "lucide-react"
import { inpaintImage } from "@/app/actions/generate-image" // Same file as generateImages

// If you want to let the user enhance the prompt, pass `improvePrompt` prop
interface AiImageInpaintProps {
  improvePrompt?: (prompt: string) => Promise<string>
}

export default function AiImageInpaint({ improvePrompt }: AiImageInpaintProps) {
  const { theme } = useTheme()
  const isDarkMode = theme === "dark"

  // Refs for base canvas & mask
  const baseCanvasRef = useRef<HTMLCanvasElement>(null)
  const maskCanvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  // Added state for canvas and display dimensions to handle scaling
  const [canvasDimensions, setCanvasDimensions] = useState({ width: 0, height: 0 })
  const [displayDimensions, setDisplayDimensions] = useState({ width: 0, height: 0 })
  const [scaleFactor, setScaleFactor] = useState(1)

  // Local states
  const [baseImageFile, setBaseImageFile] = useState<File | null>(null)
  const [baseImage, setBaseImage] = useState<HTMLImageElement | null>(null)
  const [baseImageData, setBaseImageData] = useState<string | null>(null)
  const [inpaintResult, setInpaintResult] = useState<string | null>(null)

  const [isDrawing, setIsDrawing] = useState(false)
  const [brushSize, setBrushSize] = useState(25)
  const [prompt, setPrompt] = useState("")
  const [isProcessing, setIsProcessing] = useState(false)
  const [toastMessage, setToastMessage] = useState<{
    title: string
    description: string
    type: "success" | "error"
  } | null>(null)

  /** Helper: show toast for success/error messages */
  function showToast(title: string, description: string, type: "success" | "error") {
    setToastMessage({ title, description, type })
    setTimeout(() => setToastMessage(null), 3000)
  }

  /** Handle user uploading an image file */
  function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    if (!e.target.files || e.target.files.length === 0) return
    const file = e.target.files[0]
    setBaseImageFile(file)

    // Preview it in <img> object
    const reader = new FileReader()
    reader.onload = () => {
      const imgDataUrl = reader.result as string
      setBaseImageData(imgDataUrl) // Store the data URL
      
      const img = new Image()
      img.onload = () => {
        setBaseImage(img)
        // Reset inpaint result when uploading a new image
        setInpaintResult(null)
      }
      img.src = imgDataUrl
    }
    reader.readAsDataURL(file)
  }

  /**
   * Calculate and update scale factor whenever relevant values change
   */
  useEffect(() => {
    if (!containerRef.current || !canvasDimensions.width || !canvasDimensions.height) return
    
    updateScaleFactor()
    
    // Add resize listener to update scaling when window resizes
    window.addEventListener('resize', updateScaleFactor)
    return () => window.removeEventListener('resize', updateScaleFactor)
  }, [canvasDimensions, containerRef.current])
  
  /** Update the scale factor based on container and canvas dimensions */
  function updateScaleFactor() {
    if (!containerRef.current || !canvasDimensions.width || !canvasDimensions.height) return

    const containerWidth = containerRef.current.clientWidth
    
    // Calculate how much we need to scale the canvas to fit in the container
    const scale = containerWidth / canvasDimensions.width
    
    setScaleFactor(scale)
    setDisplayDimensions({
      width: canvasDimensions.width * scale,
      height: canvasDimensions.height * scale
    })
  }

  /**
   * Once `baseImage` is loaded, draw it on the base canvas
   * and initialize the mask canvas to transparent.
   * This also creates a smaller version for the API in the background.
   */
  useEffect(() => {
    if (!baseImage || !baseCanvasRef.current || !maskCanvasRef.current) return

    // Draw onto base canvas at FULL RESOLUTION for user display
    const baseCanvas = baseCanvasRef.current
    const baseCtx = baseCanvas.getContext("2d")
    
    // Set the canvas to FULL image dimensions for user display
    baseCanvas.width = baseImage.width
    baseCanvas.height = baseImage.height
    
    // Store full dimensions for display and UI scaling
    setCanvasDimensions({ width: baseImage.width, height: baseImage.height })
    
    // Draw the image at full resolution for the user
    if (baseCtx) {
      baseCtx.imageSmoothingEnabled = true
      baseCtx.imageSmoothingQuality = 'high'
      baseCtx.drawImage(baseImage, 0, 0, baseImage.width, baseImage.height)
    }

    // Initialize mask to transparent with matching dimensions
    const maskCanvas = maskCanvasRef.current
    const maskCtx = maskCanvas.getContext("2d")
    maskCanvas.width = baseImage.width
    maskCanvas.height = baseImage.height
    
    // Clear any previous content
    maskCtx?.clearRect(0, 0, baseImage.width, baseImage.height)
    
    // We won't show a resizing notification to the user since they see the full resolution image
    // But we will resize in the background when sending to the API
  }, [baseImage])

  /** 
   * Convert screen coordinates to canvas coordinates 
   * This is crucial for images of any format/resolution
   */
  function getCanvasCoordinates(clientX: number, clientY: number): { x: number, y: number } {
    if (!maskCanvasRef.current) return { x: 0, y: 0 }
    
    const rect = maskCanvasRef.current.getBoundingClientRect()
    
    // Convert client coordinates to percentage of the displayed element
    const xPercent = (clientX - rect.left) / rect.width
    const yPercent = (clientY - rect.top) / rect.height
    
    // Convert percentage to actual canvas coordinates
    const x = xPercent * canvasDimensions.width
    const y = yPercent * canvasDimensions.height
    
    return { x, y }
  }

  /** 
   * Brush painting logic for OpenAI Edit API:
   * - We paint with black on the mask canvas to indicate the areas the user wants to change
   * - When preparing the final mask for the API, these black areas will be converted to transparent areas
   * - In OpenAI's format, transparent areas in the mask = areas to be edited/replaced
   */
  function handleMaskMouseDown(e: React.MouseEvent<HTMLCanvasElement>) {
    setIsDrawing(true)
    paintMask(e)
  }
  
  function handleMaskMouseMove(e: React.MouseEvent<HTMLCanvasElement>) {
    if (!isDrawing) return
    paintMask(e)
  }
  
  function handleMaskMouseUp() {
    setIsDrawing(false)
  }

  function paintMask(e: React.MouseEvent<HTMLCanvasElement>) {
    if (!maskCanvasRef.current || !baseImage) return

    // Get the correct canvas coordinates using our conversion function
    const { x, y } = getCanvasCoordinates(e.clientX, e.clientY)

    const ctx = maskCanvasRef.current.getContext("2d", { willReadFrequently: true })
    if (!ctx) return

    // Use FULLY OPAQUE, PURE RED with no transparency to ensure detection
    ctx.globalAlpha = 1.0
    ctx.globalCompositeOperation = 'source-over'
    
    // Use pure, bright red (#FF0000) - this ensures maximum red channel value
    ctx.fillStyle = "#FF0000"
    ctx.beginPath()
    
    // Draw the brush stroke at full resolution
    ctx.arc(x, y, brushSize, 0, 2 * Math.PI)
    ctx.fill()
    
    // Add a tiny black outline to the brush to make it more visible on different backgrounds
    ctx.strokeStyle = "rgba(0,0,0,0.5)"
    ctx.lineWidth = 1
    ctx.stroke()

    // Sample a pixel to check if the red is actually being drawn
    try {
      // Sample at the center of where we just painted
      const pixel = ctx.getImageData(Math.round(x), Math.round(y), 1, 1).data;
      console.log(`PAINTED RED: R:${pixel[0]}, G:${pixel[1]}, B:${pixel[2]}, A:${pixel[3]}`);
      
      // Verify the red channel is actually red (this helps detect canvas issues)
      if (pixel[0] < 200 || pixel[1] > 100 || pixel[2] > 100) {
        console.warn("Warning: Brush doesn't appear to be pure red as expected!");
        console.warn(`Got: R:${pixel[0]}, G:${pixel[1]}, B:${pixel[2]}, A:${pixel[3]}`);
      }
    } catch(e) {
      console.error("Couldn't sample pixel color:", e);
    }
  }

  /** 
   * Get mask canvas data URL 
   * For Ideogram (Replicate) inpainting:
   * - BLACK areas indicate regions to EDIT/REPLACE
   * - WHITE areas indicate regions to PRESERVE
   */
  function getMaskCanvasDataURL() {
    if (!maskCanvasRef.current) return null
    
    const maskCanvas = maskCanvasRef.current
    const tempCanvas = document.createElement('canvas')
    tempCanvas.width = maskCanvas.width
    tempCanvas.height = maskCanvas.height
    
    const tempCtx = tempCanvas.getContext('2d', { willReadFrequently: true, alpha: true })
    if (!tempCtx) return null
    
    // For Ideogram inpainting, we need white background (areas to preserve) with black brush marks (areas to inpaint)
    tempCtx.fillStyle = "#FFFFFF"
    tempCtx.fillRect(0, 0, tempCanvas.width, tempCanvas.height)
    
    // Now we need to get the mask data to create a transparency mask
    const maskCtx = maskCanvas.getContext('2d', { willReadFrequently: true })
    if (!maskCtx) return null
    
    // Get image data from our drawing canvas
    const maskData = maskCtx.getImageData(0, 0, maskCanvas.width, maskCanvas.height)
    const tempData = tempCtx.getImageData(0, 0, tempCanvas.width, tempCanvas.height)
    
    // First, check if we actually have any red pixels to detect
    // We'll do a thorough scan of the entire image
    let hasRedPixels = false;
    let redPixelSample = { r: 0, g: 0, b: 0, a: 0, index: 0 };
    let redPixelCount = 0;
    
    // Do a full scan of the entire image to count ALL red pixels
    for (let i = 0; i < maskData.data.length; i += 4) {
      // Look for ANY red-ish pixel with permissive thresholds
      if (maskData.data[i] > 80 && 
          maskData.data[i] > maskData.data[i+1] * 1.2 && 
          maskData.data[i] > maskData.data[i+2] * 1.2) {
        
        redPixelCount++;
        
        if (!hasRedPixels) {
          hasRedPixels = true;
          redPixelSample = {
            r: maskData.data[i],
            g: maskData.data[i+1],
            b: maskData.data[i+2],
            a: maskData.data[i+3],
            index: i
          };
        }
      }
    }
    
    console.log(`Full-res mask has ${redPixelCount} red pixels out of ${maskData.data.length/4} total pixels`);
    
    if (hasRedPixels) {
      const x = (redPixelSample.index/4) % maskCanvas.width;
      const y = Math.floor((redPixelSample.index/4) / maskCanvas.width);
      console.log(`Sample red pixel at (${Math.floor(x)},${Math.floor(y)}): R:${redPixelSample.r}, G:${redPixelSample.g}, B:${redPixelSample.b}, A:${redPixelSample.a}`);
    } else {
      console.warn("NO RED PIXELS FOUND in the mask canvas - check your brush stroke color!");
    }
    
    // For Ideogram inpainting:
    // - Black areas indicate regions to EDIT/REPLACE
    // - White areas indicate regions to PRESERVE
    
    let blackPixelCount = 0;
    
    // Process the mask - red brush strokes become BLACK (areas to inpaint)
    for (let i = 0; i < maskData.data.length; i += 4) {
      // Very permissive detection to catch any reddish pixels
      const isRed = (maskData.data[i] > 80 && 
                     maskData.data[i] > maskData.data[i+1] * 1.2 && 
                     maskData.data[i] > maskData.data[i+2] * 1.2);
      
      if (isRed) {
        // This was painted red - make it BLACK in the output (to be inpainted)
        tempData.data[i] = 0;     // R = 0 (black)
        tempData.data[i+1] = 0;   // G = 0 (black)
        tempData.data[i+2] = 0;   // B = 0 (black)
        tempData.data[i+3] = 255; // A = 255 (opaque)
        blackPixelCount++;
      }
      // All other pixels remain WHITE (default background color) to be preserved
    }
    
    console.log(`IDEOGRAM MASK: ${blackPixelCount} black pixels (areas to inpaint) of ${maskCanvas.width * maskCanvas.height} total (${(blackPixelCount / (maskCanvas.width * maskCanvas.height) * 100).toFixed(2)}%)`);
    
    // Small sanity check - warn if no pixels are marked to inpaint
    if (blackPixelCount === 0) {
      console.warn("WARNING: No black pixels found in mask! Nothing will be inpainted!");
    } else if (blackPixelCount === (maskCanvas.width * maskCanvas.height)) {
      console.warn("WARNING: Entire image is black! Everything will be replaced!");
    }
    
    // Put the processed image data back to our temp canvas
    tempCtx.putImageData(tempData, 0, 0)
    
    // DEBUG: Add visual confirmation - draw a border around the temp canvas
    tempCtx.strokeStyle = 'red';
    tempCtx.lineWidth = 2;
    tempCtx.strokeRect(2, 2, tempCanvas.width-4, tempCanvas.height-4);
    
    // Return the mask as a PNG data URL with proper transparency
    try {
      // For transparency to work, we need to use PNG format
      const dataUrl = tempCanvas.toDataURL("image/png");
      console.log("Mask generated successfully with PNG format");
      return dataUrl;
    } catch (e) {
      console.error("Error generating mask data URL:", e)
      return null
    }
  }
  
  /**
   * Get base canvas data URL with appropriate size constraints
   */
  function getBaseCanvasDataURL() {
    if (!baseCanvasRef.current) return null
    
    try {
      // Use a JPEG format for better compression when possible
      return baseCanvasRef.current.toDataURL("image/jpeg", 0.7)
    } catch (e) {
      console.error("Error generating base canvas data URL:", e)
      return null
    }
  }

  // No need for image resizing for Ideogram API
  
  /** Call the server action to do inpainting */
  async function handleInpaint() {
    if (!baseCanvasRef.current) {
      showToast("Missing image", "Please upload and paint on an image first.", "error")
      return
    }
    if (!prompt.trim()) {
      showToast("Missing prompt", "Describe how to inpaint your image.", "error")
      return
    }

    setIsProcessing(true)

    try {
      // Get the full resolution mask
      const mask = getMaskCanvasDataURL()
      if (!mask || !mask.startsWith('data:')) {
        throw new Error("Could not create mask data URL")
      }
      
      // Get the full resolution base image
      const baseImage = getBaseCanvasDataURL()
      if (!baseImage || !baseImage.startsWith('data:')) {
        throw new Error("Could not create base image data URL")
      }
      
      // Log info about the images
      console.log(`Base image size: ~${Math.round(baseImage.length / 1024)}KB`)
      console.log(`Mask size: ~${Math.round(mask.length / 1024)}KB`)
      console.log(`Original dimensions: ${canvasDimensions.width}x${canvasDimensions.height}`)
      
      /* DEBUG visualization commented out as requested
      // DEBUG: Create a simple visualization of the mask (optional)
      // Create a container for our debug display
      const debugContainer = document.createElement('div');
      debugContainer.style.position = 'fixed';
      debugContainer.style.bottom = '10px';
      debugContainer.style.right = '10px';
      debugContainer.style.zIndex = '9999';
      debugContainer.style.padding = '10px';
      debugContainer.style.backgroundColor = 'rgba(0,0,0,0.85)';
      debugContainer.style.borderRadius = '8px';
      debugContainer.style.display = 'flex';
      debugContainer.style.flexDirection = 'column';
      debugContainer.style.alignItems = 'center';
      debugContainer.style.boxShadow = '0 0 10px rgba(0,0,0,0.5)';
      debugContainer.style.maxWidth = '250px';
      
      // Create title
      const debugTitle = document.createElement('div');
      debugTitle.textContent = 'Ideogram Mask Preview';
      debugTitle.style.color = 'white';
      debugTitle.style.fontSize = '14px';
      debugTitle.style.fontWeight = 'bold';
      debugTitle.style.marginBottom = '8px';
      debugContainer.appendChild(debugTitle);
      
      // Show the mask image
      const debugMask = document.createElement('img');
      debugMask.src = mask;
      debugMask.style.width = '180px';
      debugMask.style.height = '180px';
      debugMask.style.border = '3px solid red';
      debugMask.style.backgroundColor = '#fff'; // White background to match the mask
      debugMask.style.objectFit = 'contain';
      debugContainer.appendChild(debugMask);
      
      // Add info about the mask format
      const pixelInfo = document.createElement('div');
      pixelInfo.style.color = 'white';
      pixelInfo.style.fontSize = '11px';
      pixelInfo.style.marginTop = '8px';
      pixelInfo.style.textAlign = 'center';
      pixelInfo.style.lineHeight = '1.3';
      
      // Add clear explanatory text
      pixelInfo.innerHTML = '<span style="color:#000000;font-weight:bold;background-color:#fff;padding:2px 4px;">BLACK AREAS = REGIONS TO CHANGE</span><br/>' +
                          '<span style="color:#fff;font-weight:bold;background-color:#000;padding:2px 4px;margin-top:4px;display:inline-block">WHITE AREAS = REGIONS TO PRESERVE</span><br/><br/>' +
                          'This mask is being sent to Ideogram for inpainting.';
                          
      debugContainer.appendChild(pixelInfo);
      
      // Add close button with better styling
      const closeButton = document.createElement('button');
      closeButton.textContent = 'Close Debug View';
      closeButton.style.marginTop = '10px';
      closeButton.style.padding = '5px 10px';
      closeButton.style.fontSize = '12px';
      closeButton.style.backgroundColor = '#444';
      closeButton.style.color = 'white';
      closeButton.style.border = 'none';
      closeButton.style.borderRadius = '4px';
      closeButton.style.cursor = 'pointer';
      closeButton.onmouseover = () => { closeButton.style.backgroundColor = '#666'; };
      closeButton.onmouseout = () => { closeButton.style.backgroundColor = '#444'; };
      closeButton.onclick = () => {
        try {
          document.body.removeChild(debugContainer);
        } catch (e) {
          console.error("Error removing debug container:", e);
        }
      };
      debugContainer.appendChild(closeButton);
      
      // Add to document
      document.body.appendChild(debugContainer);
      
      // Auto-remove after 20 seconds
      setTimeout(() => {
        try {
          document.body.removeChild(debugContainer);
        } catch (e) {
          console.error("Could not auto-remove debug visualization:", e);
        }
      }, 20000);
      */
      
      // Call the inpainting API with our full resolution images
      const res = await inpaintImage(prompt, baseImage, mask)
      if (res.success && res.image) {
        setInpaintResult(res.image)
        showToast("Success", "Inpainting completed!", "success")
      } else {
        throw new Error(res.error || "Inpainting failed")
      }
    } catch (err) {
      console.error("Error in inpainting:", err)
      
      // Format the error message to be more user-friendly
      let errorMessage = String(err)
      
      // Check if it's an API Error and try to extract a more specific message
      if (errorMessage.includes('API Error:')) {
        // Try to make it more user-friendly
        if (errorMessage.includes('Connection error')) {
          errorMessage = 'Connection error. Please check your internet connection and try again.'
        } else if (errorMessage.includes('insufficient_quota')) {
          errorMessage = 'API quota exceeded. Please try again later.'
        } else if (errorMessage.includes('invalid_request_error')) {
          errorMessage = 'Invalid request. The image dimensions or format may be unsupported.'
        }
      }
      
      // Show a friendly error message to the user
      showToast(
        "Image processing failed", 
        errorMessage.length > 100 ? errorMessage.substring(0, 100) + '...' : errorMessage, 
        "error"
      )
    } finally {
      setIsProcessing(false)
    }
  }

  /** Reset the mask canvas to allow redrawing */
  function handleResetMask() {
    if (!maskCanvasRef.current || !baseImage) return
    
    const maskCtx = maskCanvasRef.current.getContext("2d")
    if (!maskCtx) return
    
    // Clear the mask canvas
    maskCtx.clearRect(0, 0, maskCanvasRef.current.width, maskCanvasRef.current.height)
    
    showToast("Mask Reset", "You can now redraw your selection", "success")
  }

  /** Download the inpainted result directly as a file download */
  async function handleDownloadResult() {
    if (!inpaintResult) return
    
    try {
      // Fetch the image and create a blob from it
      const response = await fetch(inpaintResult)
      if (!response.ok) throw new Error("Failed to fetch image for download")
      
      const blob = await response.blob()
      
      // Create an object URL from the blob
      const url = window.URL.createObjectURL(blob)
      
      // Create a temporary link and trigger download
      const link = document.createElement('a')
      link.href = url
      link.download = `inpainted-${new Date().getTime()}.png`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      
      // Clean up by revoking the object URL
      window.URL.revokeObjectURL(url)
      
      showToast("Download complete", "Inpainted image saved successfully to your device.", "success")
    } catch (error) {
      console.error("Error downloading inpainted image:", error)
      showToast("Download failed", "Unable to download the inpainted image. Please try again.", "error")
    }
  }

  /** Continue editing the inpainted result by making it the new base image */
  async function handleContinueEditing() {
    if (!inpaintResult) return;
    
    try {
      setIsProcessing(true); // Add loading indicator while fetching
      
      // Fetch the image from the URL and convert to a data URL
      const response = await fetch(inpaintResult);
      const blob = await response.blob();
      
      // Create a FileReader to convert the blob to a data URL
      const reader = new FileReader();
      reader.onload = () => {
        const dataUrl = reader.result as string;
        
        // Set the data URL as our base image data
        setBaseImageData(dataUrl);
        
        // Create a new image
        const img = new Image();
        img.onload = () => {
          setBaseImage(img);
          setInpaintResult(null);
          
          // Clear the mask canvas
          if (maskCanvasRef.current) {
            const maskCtx = maskCanvasRef.current.getContext("2d");
            maskCtx?.clearRect(0, 0, maskCanvasRef.current.width, maskCanvasRef.current.height);
          }
          
          showToast("Ready to Edit", "You can now continue editing your image", "success");
          setIsProcessing(false);
        };
        img.src = dataUrl;
      };
      
      reader.readAsDataURL(blob);
    } catch (error) {
      console.error("Error converting image URL to data URL:", error);
      showToast("Error", "Failed to prepare image for continued editing", "error");
      setIsProcessing(false);
    }
  }

  /** Optional: Let user enhance the inpainting prompt with AI */
  async function handleEnhancePrompt() {
    if (!improvePrompt) return
    if (!prompt.trim()) {
      showToast("Empty prompt", "Enter a prompt to enhance.", "error")
      return
    }
    try {
      const newPrompt = await improvePrompt(prompt)
      setPrompt(newPrompt)
      showToast("Prompt enhanced", "Your prompt was improved with AI", "success")
    } catch (err) {
      console.error("Prompt enhance error:", err)
      showToast("Enhance error", "Could not improve prompt", "error")
    }
  }

  // The design below mimics your existing AiImageTab style:
  return (
    <div
      className={`w-full shadow-sm rounded-lg border ${
        isDarkMode ? "bg-container-bg border-border-dark" : "bg-white border-gray-200"
      }`}
    >
      {/* Toast notification */}
      {toastMessage && (
        <div
          className={`fixed top-4 right-4 z-50 p-4 rounded-md shadow-md transition-all ${
            toastMessage.type === "success"
              ? isDarkMode
                ? "bg-primary-green/20 border border-primary-green/60"
                : "bg-green-100 border border-green-300"
              : isDarkMode
              ? "bg-coral/20 border border-coral/60"
              : "bg-red-100 border border-red-300"
          }`}
        >
          <div className="flex items-start gap-2">
            <div
              className={
                toastMessage.type === "success"
                  ? isDarkMode
                    ? "text-primary-green"
                    : "text-green-600"
                  : isDarkMode
                  ? "text-coral"
                  : "text-red-600"
              }
            >
              {toastMessage.type === "success" ? (
                <CheckCircle2 className="size-5" />
              ) : (
                <AlertCircle className="size-5" />
              )}
            </div>
            <div>
              <h3
                className={`font-medium text-sm ${
                  toastMessage.type === "success"
                    ? isDarkMode
                      ? "text-primary-green"
                      : "text-green-800"
                    : isDarkMode
                    ? "text-coral"
                    : "text-red-800"
                }`}
              >
                {toastMessage.title}
              </h3>
              <p
                className={`text-sm ${
                  toastMessage.type === "success"
                    ? isDarkMode
                      ? "text-text-white"
                      : "text-green-700"
                    : isDarkMode
                    ? "text-text-white"
                    : "text-red-700"
                }`}
              >
                {toastMessage.description}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div
        className={`flex items-center justify-between p-6 border-b ${
          isDarkMode ? "border-border-dark" : "border-gray-200"
        }`}
      >
        <div>
          <h2 className="flex items-center gap-2 text-xl font-bold">
            <Brush className={`size-5 ${isDarkMode ? "text-primary-green" : "text-blue-600"}`} />
            <span className={isDarkMode ? "text-text-white" : "text-gray-900"}>AI Image Inpainting</span>
          </h2>
          <p className={`text-sm mt-1.5 ${isDarkMode ? "text-text-light-gray" : "text-gray-500"}`}>
            Remove or replace parts of an image by brushing them out and describing what you want
          </p>
        </div>
      </div>

      {/* Main */}
      <div className="p-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Left side controls */}
          <div className="lg:col-span-1 space-y-6">
            {/* Upload & prompt */}
            <div className="space-y-3">
              <label
                className={`block text-sm font-medium ${
                  isDarkMode ? "text-text-white" : "text-gray-700"
                }`}
              >
                Upload image
              </label>
              <div className="flex items-center gap-2">
                <label
                  className={`cursor-pointer inline-flex items-center px-3 py-2 text-sm font-medium rounded-md ${
                    isDarkMode
                      ? "bg-dark-bg text-text-white border border-border-dark hover:bg-light-container"
                      : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50"
                  }`}
                >
                  <Upload className="mr-2 size-4" />
                  Choose File
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleImageUpload}
                  />
                </label>
                {baseImageFile && (
                  <span className="text-xs">
                    {baseImageFile.name.length > 20
                      ? baseImageFile.name.slice(0, 20) + "..."
                      : baseImageFile.name}
                  </span>
                )}
              </div>

              <div className="space-y-2">
                <label
                  htmlFor="inpaintPrompt"
                  className={`text-sm font-medium ${
                    isDarkMode ? "text-text-white" : "text-gray-700"
                  }`}
                >
                  Describe what to add in the areas you painted red
                </label>
                <textarea
                  id="inpaintPrompt"
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder='e.g. A beautiful mountain landscape, or Replace with a bouquet of flowers, or Add a cute dog here'
                  className={`w-full min-h-[100px] resize-none p-3 rounded-md outline-none focus:ring-2 focus:ring-primary-green focus:border-primary-green ${
                    isDarkMode
                      ? "bg-dark-bg border-border-dark text-text-white placeholder-text-light-gray"
                      : "bg-white border-gray-300 text-gray-900 placeholder-gray-400"
                  }`}
                />
              </div>

              {/* Optional: Enhance Prompt */}
              {improvePrompt && (
                <button
                  type="button"
                  onClick={handleEnhancePrompt}
                  disabled={!prompt.trim() || isProcessing}
                  className={`flex items-center justify-center w-full py-2 px-4 border rounded-md text-sm font-medium ${
                    !prompt.trim() || isProcessing
                      ? isDarkMode
                        ? "bg-dark-bg text-text-light-gray cursor-not-allowed border-border-dark"
                        : "bg-gray-100 text-gray-400 cursor-not-allowed border-gray-200"
                      : isDarkMode
                      ? "bg-dark-bg text-text-white hover:bg-light-container border-border-dark"
                      : "bg-white text-gray-700 hover:bg-gray-50 border-gray-300"
                  }`}
                >
                  <RefreshCw className="mr-2 size-4" />
                  {isProcessing ? "Enhancing..." : "Enhance Prompt"}
                </button>
              )}
            </div>

            {/* Brush Size Slider */}
            <div className="space-y-2">
              <label
                className={`block text-sm font-medium ${
                  isDarkMode ? "text-text-white" : "text-gray-700"
                }`}
              >
                Brush Size
              </label>
              <input
                type="range"
                min={5}
                max={100}
                value={brushSize}
                onChange={(e) => setBrushSize(Number(e.target.value))}
                className="w-full"
              />
              <span
                className={`text-xs ${isDarkMode ? "text-text-light-gray" : "text-gray-500"}`}
              >
                {brushSize}px
              </span>
            </div>
            
            {/* Brush instructions */}
            <div className="space-y-2">
              <label
                className={`block text-sm font-medium ${
                  isDarkMode ? "text-text-white" : "text-gray-700"
                }`}
              >
                Brush Instructions
              </label>
              <div className={`p-2 text-xs rounded-md ${
                isDarkMode ? "bg-gray-700" : "bg-gray-100"
              }`}>
                Paint with red brush over areas you want to change. These areas will be replaced based on your prompt.
              </div>
            </div>

            {/* Reset and Inpaint buttons */}
            <div className="space-y-3">
              <button
                type="button"
                onClick={handleResetMask}
                disabled={!baseImage || isProcessing}
                className={`flex items-center justify-center w-full py-2 px-4 border rounded-md text-sm font-medium ${
                  !baseImage || isProcessing
                    ? isDarkMode
                      ? "bg-dark-bg text-text-light-gray cursor-not-allowed border-border-dark"
                      : "bg-gray-100 text-gray-400 cursor-not-allowed border-gray-200"
                    : isDarkMode
                    ? "bg-dark-bg text-text-white hover:bg-light-container border-border-dark"
                    : "bg-white text-gray-700 hover:bg-gray-50 border-gray-300"
                }`}
              >
                <RefreshCw className="mr-2 size-4" />
                Reset Selection
              </button>
              
              <button
                type="button"
                onClick={handleInpaint}
                disabled={!baseImage || !prompt.trim() || isProcessing}
                className={`flex items-center justify-center w-full py-2 px-4 rounded-md text-sm font-medium ${
                  !baseImage || !prompt.trim() || isProcessing
                    ? isDarkMode
                      ? "bg-primary-green/50 cursor-not-allowed text-text-white/70"
                      : "bg-blue-300 cursor-not-allowed text-white"
                    : isDarkMode
                    ? "bg-primary-green hover:bg-primary-green/90 text-deep-black"
                    : "bg-blue-600 hover:bg-blue-700 text-white"
                }`}
              >
                <Brush className="mr-2 size-4" />
                {isProcessing ? "Inpainting..." : "Inpaint"}
              </button>
            </div>
          </div>

          {/* Canvas and result area - now showing side by side */}
          <div className="lg:col-span-3 space-y-4">
            {/* Instructions */}
            {baseImage && (
              <div className={`p-3 rounded-lg text-sm ${
                isDarkMode ? "bg-primary-green/10 text-text-white" : "bg-blue-50 text-blue-800"
              }`}>
                <div className="flex gap-2 items-start">
                  <Info className="size-4 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium mb-1">How to use the inpainting tool:</p>
                    <ol className="list-decimal ml-4 space-y-1">
                      <li>Paint over the specific areas you want to replace (they will appear red)</li> 
                      <li>Describe what should replace these red areas in the prompt field</li>
                      <li>Click &ldquo;Inpaint&rdquo; to generate your edited image</li>
                    </ol>
                    <p className="mt-2 text-xs italic">Note: Only the red-painted areas will be changed with Ideogram&apos;s AI. The rest of the image will stay the same.</p>
                  </div>
                </div>
              </div>
            )}
            
            {/* New layout: side-by-side canvases */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Input Canvas area */}
              <div
                ref={containerRef}
                className={`border rounded-lg p-4 flex flex-col gap-4 ${
                  isDarkMode ? "border-border-dark bg-dark-bg" : "border-gray-200 bg-gray-50"
                }`}
              >
                <h3
                  className={`text-md font-medium ${
                    isDarkMode ? "text-text-white" : "text-gray-800"
                  }`}
                >
                  Input Image
                </h3>
                
                {/* Base canvas + mask overlay */}
                {baseImage ? (
                  <div className="relative">
                    {/* Display the base canvas */}
                    <canvas 
                      ref={baseCanvasRef} 
                      style={{
                        width: displayDimensions.width > 0 ? displayDimensions.width : 'auto',
                        height: displayDimensions.height > 0 ? displayDimensions.height : 'auto',
                      }}
                      className="w-full h-auto"
                    />

                    {/* Mask canvas on top for brushing */}
                    <canvas
                      ref={maskCanvasRef}
                      style={{
                        width: displayDimensions.width > 0 ? displayDimensions.width : 'auto',
                        height: displayDimensions.height > 0 ? displayDimensions.height : 'auto',
                      }}
                      className="absolute inset-0 cursor-crosshair w-full h-auto"
                      onMouseDown={handleMaskMouseDown}
                      onMouseMove={handleMaskMouseMove}
                      onMouseUp={handleMaskMouseUp}
                      onMouseLeave={handleMaskMouseUp}  // Stop drawing if mouse leaves canvas
                    />
                  </div>
                ) : (
                  <div className="text-center text-sm py-10">
                    <p className={isDarkMode ? "text-text-light-gray" : "text-gray-500"}>
                      No image loaded. Please upload an image to begin inpainting.
                    </p>
                  </div>
                )}
              </div>

              {/* Result preview - side by side now */}
              <div
                className={`border rounded-lg p-4 flex flex-col gap-4 ${
                  isDarkMode ? "border-border-dark bg-dark-bg" : "border-gray-200 bg-gray-50"
                }`}
              >
                <div className="flex justify-between items-center">
                  <h3
                    className={`text-md font-medium ${
                      isDarkMode ? "text-text-white" : "text-gray-800"
                    }`}
                  >
                    Inpainted Result
                  </h3>
                  
                  {inpaintResult && (
                    <div className="flex gap-2">
                      {/* Continue editing button */}
                      <button
                        onClick={handleContinueEditing}
                        className={`inline-flex items-center px-3 py-1 text-sm font-medium rounded-md ${
                          isDarkMode
                            ? "bg-primary-green text-deep-black hover:bg-primary-green/90"
                            : "bg-green-600 text-white hover:bg-green-700"
                        }`}
                      >
                        <Repeat className="mr-2 size-4" />
                        Continue Editing
                      </button>
                      
                      {/* Download button */}
                      <button
                        onClick={handleDownloadResult}
                        className={`inline-flex items-center px-3 py-1 text-sm font-medium rounded-md ${
                          isDarkMode
                            ? "bg-coral text-deep-black hover:bg-coral/90"
                            : "bg-blue-600 text-white hover:bg-blue-700"
                        }`}
                      >
                        <Download className="mr-2 size-4" />
                        Download
                      </button>
                    </div>
                  )}
                </div>
                
                {inpaintResult ? (
                  <div className="relative w-full h-auto flex items-center justify-center">
                    <img
                      src={inpaintResult}
                      alt="Inpainted result"
                      className="max-w-full h-auto rounded-md border object-contain"
                      style={{
                        maxHeight: displayDimensions.height > 0 ? displayDimensions.height : 'auto',
                      }}
                    />
                  </div>
                ) : (
                  <div className="text-center text-sm py-10 flex-grow flex flex-col items-center justify-center">
                    {isProcessing ? (
                      <div className="flex flex-col items-center gap-3">
                        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary-green"></div>
                        <p className={isDarkMode ? "text-text-white" : "text-gray-600"}>
                          Processing your image...
                        </p>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center gap-2">
                        <ArrowLeft className={`size-5 ${isDarkMode ? "text-text-light-gray" : "text-gray-500"}`} />
                        <p className={isDarkMode ? "text-text-light-gray" : "text-gray-500"}>
                          Use the controls to generate your inpainted image
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div
        className={`flex justify-end items-center border-t p-4 ${
          isDarkMode ? "bg-container-bg border-border-dark" : "bg-gray-50 border-gray-200"
        }`}
      >
        <div></div>
      </div>
    </div>
  )
}