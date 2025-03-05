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
   */
  useEffect(() => {
    if (!baseImage || !baseCanvasRef.current || !maskCanvasRef.current) return

    // Draw onto base canvas
    const baseCanvas = baseCanvasRef.current
    const baseCtx = baseCanvas.getContext("2d")
    
    // Important: Set the canvas dimensions to match the actual image dimensions
    baseCanvas.width = baseImage.width
    baseCanvas.height = baseImage.height
    
    // Store these dimensions for scaling calculations
    setCanvasDimensions({ width: baseImage.width, height: baseImage.height })
    
    baseCtx?.drawImage(baseImage, 0, 0)

    // Initialize mask to transparent
    const maskCanvas = maskCanvasRef.current
    const maskCtx = maskCanvas.getContext("2d")
    maskCanvas.width = baseImage.width
    maskCanvas.height = baseImage.height
    
    // Clear any previous content
    maskCtx?.clearRect(0, 0, baseImage.width, baseImage.height)
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

  /** Brush painting logic: black => inpaint region, white => keep */
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

    const ctx = maskCanvasRef.current.getContext("2d")
    if (!ctx) return

    // Set opacity for the brush strokes
    ctx.globalAlpha = 0.5
    
    // Paint semi-transparent black to indicate the region to inpaint
    ctx.fillStyle = "#000000"
    ctx.beginPath()
    
    // Use the actual brush size scaled to match the canvas
    const scaledBrushSize = brushSize / scaleFactor
    ctx.arc(x, y, scaledBrushSize, 0, 2 * Math.PI)
    ctx.fill()
    
    // Reset opacity for other operations
    ctx.globalAlpha = 1.0
  }

  /** Get mask canvas data URL */
  function getMaskCanvasDataURL() {
    if (!maskCanvasRef.current) return null
    
    // For the mask, we need to prepare it for the API by making the brushed areas solid black
    // and the untouched areas solid white
    const maskCanvas = maskCanvasRef.current
    const tempCanvas = document.createElement('canvas')
    tempCanvas.width = maskCanvas.width
    tempCanvas.height = maskCanvas.height
    
    const tempCtx = tempCanvas.getContext('2d')
    if (!tempCtx) return null
    
    // Fill with white first (untouched areas)
    tempCtx.fillStyle = "#FFFFFF"
    tempCtx.fillRect(0, 0, tempCanvas.width, tempCanvas.height)
    
    // Draw the mask canvas with full opacity
    tempCtx.drawImage(maskCanvas, 0, 0)
    
    return tempCanvas.toDataURL("image/png")
  }

  /** Call the server action to do inpainting */
  async function handleInpaint() {
    if (!baseImageData) {
      showToast("Missing image", "Please upload and paint on an image first.", "error")
      return
    }
    if (!prompt.trim()) {
      showToast("Missing prompt", "Describe how to inpaint your image.", "error")
      return
    }

    setIsProcessing(true)

    try {
      // Make sure we have data URLs for both the image and mask
      if (!baseImageData || !baseImageData.startsWith('data:')) {
        throw new Error("Invalid base image format: must be a data URL")
      }
      
      const base64Mask = getMaskCanvasDataURL()
      if (!base64Mask || !base64Mask.startsWith('data:')) {
        throw new Error("Invalid mask format: must be a data URL")
      }

      const res = await inpaintImage(prompt, baseImageData, base64Mask)
      if (res.success && res.image) {
        setInpaintResult(res.image)
        showToast("Success", "Inpainting completed!", "success")
      } else {
        throw new Error(res.error || "Inpainting failed")
      }
    } catch (err) {
      console.error("Error in inpainting:", err)
      showToast("Error", String(err), "error")
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

  /** Download the inpainted result directly without page navigation */
  function handleDownloadResult() {
    if (!inpaintResult) return
    
    // Create a temporary link and trigger download
    const link = document.createElement('a')
    link.href = inpaintResult
    link.download = `inpainted-${new Date().getTime()}.png`
    link.target = "_blank" // This prevents browser from navigating
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    
    showToast("Download Started", "Your inpainted image is being downloaded", "success")
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
        isDarkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"
      }`}
    >
      {/* Toast notification */}
      {toastMessage && (
        <div
          className={`fixed top-4 right-4 z-50 p-4 rounded-md shadow-md transition-all ${
            toastMessage.type === "success"
              ? isDarkMode
                ? "bg-green-900 border border-green-700"
                : "bg-green-100 border border-green-300"
              : isDarkMode
              ? "bg-red-900 border border-red-700"
              : "bg-red-100 border border-red-300"
          }`}
        >
          <div className="flex items-start gap-2">
            <div
              className={
                toastMessage.type === "success"
                  ? isDarkMode
                    ? "text-green-400"
                    : "text-green-600"
                  : isDarkMode
                  ? "text-red-400"
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
                      ? "text-green-200"
                      : "text-green-800"
                    : isDarkMode
                    ? "text-red-200"
                    : "text-red-800"
                }`}
              >
                {toastMessage.title}
              </h3>
              <p
                className={`text-sm ${
                  toastMessage.type === "success"
                    ? isDarkMode
                      ? "text-green-300"
                      : "text-green-700"
                    : isDarkMode
                    ? "text-red-300"
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
          isDarkMode ? "border-gray-700" : "border-gray-200"
        }`}
      >
        <div>
          <h2 className="flex items-center gap-2 text-xl font-bold">
            <Brush className={`size-5 ${isDarkMode ? "text-blue-400" : "text-blue-600"}`} />
            <span className={isDarkMode ? "text-white" : "text-gray-900"}>AI Image Inpainting</span>
          </h2>
          <p className={`text-sm mt-1.5 ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
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
                  isDarkMode ? "text-gray-200" : "text-gray-700"
                }`}
              >
                Upload image
              </label>
              <div className="flex items-center gap-2">
                <label
                  className={`cursor-pointer inline-flex items-center px-3 py-2 text-sm font-medium rounded-md ${
                    isDarkMode
                      ? "bg-gray-700 text-gray-200 border border-gray-600 hover:bg-gray-600"
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
                    isDarkMode ? "text-gray-200" : "text-gray-700"
                  }`}
                >
                  Describe your changes
                </label>
                <textarea
                  id="inpaintPrompt"
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder='e.g. Remove the person on the left and fill with a background of skyscrapers'
                  className={`w-full min-h-[100px] resize-none p-3 rounded-md outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    isDarkMode
                      ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400"
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
                        ? "bg-gray-700 text-gray-500 cursor-not-allowed border-gray-700"
                        : "bg-gray-100 text-gray-400 cursor-not-allowed border-gray-200"
                      : isDarkMode
                      ? "bg-gray-700 text-gray-200 hover:bg-gray-600 border-gray-600"
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
                  isDarkMode ? "text-gray-200" : "text-gray-700"
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
                className={`text-xs ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}
              >
                {brushSize}px
              </span>
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
                      ? "bg-gray-700 text-gray-500 cursor-not-allowed border-gray-700"
                      : "bg-gray-100 text-gray-400 cursor-not-allowed border-gray-200"
                    : isDarkMode
                    ? "bg-gray-700 text-gray-200 hover:bg-gray-600 border-gray-600"
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
                      ? "bg-blue-800 cursor-not-allowed text-blue-300"
                      : "bg-blue-300 cursor-not-allowed text-white"
                    : isDarkMode
                    ? "bg-blue-600 hover:bg-blue-700 text-white"
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
                isDarkMode ? "bg-blue-900/30 text-blue-200" : "bg-blue-50 text-blue-800"
              }`}>
                <div className="flex gap-2 items-start">
                  <Info className="size-4 mt-0.5 flex-shrink-0" />
                  <p>Brush over the areas you want to replace or remove. These areas will appear darker.</p>
                </div>
              </div>
            )}
            
            {/* New layout: side-by-side canvases */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Input Canvas area */}
              <div
                ref={containerRef}
                className={`border rounded-lg p-4 flex flex-col gap-4 ${
                  isDarkMode ? "border-gray-700 bg-gray-800" : "border-gray-200 bg-gray-50"
                }`}
              >
                <h3
                  className={`text-md font-medium ${
                    isDarkMode ? "text-gray-200" : "text-gray-800"
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
                    <p className={isDarkMode ? "text-gray-400" : "text-gray-500"}>
                      No image loaded. Please upload an image to begin inpainting.
                    </p>
                  </div>
                )}
              </div>

              {/* Result preview - side by side now */}
              <div
                className={`border rounded-lg p-4 flex flex-col gap-4 ${
                  isDarkMode ? "border-gray-700 bg-gray-800" : "border-gray-200 bg-gray-50"
                }`}
              >
                <div className="flex justify-between items-center">
                  <h3
                    className={`text-md font-medium ${
                      isDarkMode ? "text-gray-200" : "text-gray-800"
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
                            ? "bg-green-600 text-white hover:bg-green-700"
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
                            ? "bg-blue-600 text-white hover:bg-blue-700"
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
                        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
                        <p className={isDarkMode ? "text-gray-300" : "text-gray-600"}>
                          Processing your image...
                        </p>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center gap-2">
                        <ArrowLeft className={`size-5 ${isDarkMode ? "text-gray-400" : "text-gray-500"}`} />
                        <p className={isDarkMode ? "text-gray-400" : "text-gray-500"}>
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
          isDarkMode ? "bg-gray-800 border-gray-700" : "bg-gray-50 border-gray-200"
        }`}
      >
        {/* "powered by" section */}
        <div className="flex items-center gap-2 text-xs">
          <span className={isDarkMode ? "text-gray-400" : "text-gray-500"}>
            Powered by Ideogram AI
          </span>
          <NextImage
            src="/ideogramlogo.png"
            alt="Ideogram Logo"
            width={60}
            height={60}
          />
        </div>
      </div>
    </div>
  )
}