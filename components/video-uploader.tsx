"use client"

import React, { useState, useRef, useCallback } from "react"
import { Progress } from "@/components/ui/progress"
import { Button } from "@/components/ui/button"
import { UploadCloud, AlertCircle, CheckCircle, Video } from "lucide-react"
import { toast } from "sonner"

interface VideoUploaderProps {
  onVideoUploaded?: (videoUrl: string, videoId: string) => void
  campaignSessionId?: string
  className?: string
}

export function VideoUploader({ onVideoUploaded, campaignSessionId, className }: VideoUploaderProps) {
  const [file, setFile] = useState<File | null>(null)
  const [dragActive, setDragActive] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [progress, setProgress] = useState(0)
  const [uploadSessionId, setUploadSessionId] = useState<string | null>(null)
  const [videoId, setVideoId] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  // Constants for chunked upload
  const CHUNK_SIZE = 4 * 1024 * 1024 // 4MB chunk size

  // Handle drag events
  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true)
    } else if (e.type === "dragleave") {
      setDragActive(false)
    }
  }, [])

  // Handle drop event
  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    
    const files = e.dataTransfer.files
    if (files && files.length > 0) {
      handleVideoFile(files[0])
    }
  }, [])

  // Process the video file (check type, size, etc.)
  const handleVideoFile = (file: File) => {
    // Check if it's a video file
    if (!file.type.startsWith('video/')) {
      setError("Please upload a video file")
      return
    }
    
    // Check file size (limit to 300MB)
    const fileSizeInMB = file.size / (1024 * 1024)
    if (fileSizeInMB > 300) {
      setError("Video file is too large. Maximum size is 300MB")
      return
    }
    
    setFile(file)
    setError(null)
    
    // Automatically start upload when file is selected
    uploadVideo(file)
  }

  // Handle file input change
  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleVideoFile(e.target.files[0])
    }
  }

  // Trigger file input click
  const handleButtonClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click()
    }
  }

  // Initialize video upload (get upload session)
  const initializeVideoUpload = async (file: File) => {
    try {
      const formData = new FormData()
      formData.append('file_size', String(file.size))
      
      // Get video dimensions
      const videoElement = document.createElement('video')
      const videoUrl = URL.createObjectURL(file)
      
      return new Promise<{sessionId: string, videoId: string}>((resolve, reject) => {
        videoElement.onloadedmetadata = async () => {
          const width = videoElement.videoWidth
          const height = videoElement.videoHeight
          URL.revokeObjectURL(videoUrl)
          
          // Add dimensions to form data
          formData.append('width', String(width))
          formData.append('height', String(height))
          
          // Add campaign session ID if provided
          if (campaignSessionId) {
            formData.append('campaign_session_id', campaignSessionId)
          }
          
          // Initialize upload
          try {
            const response = await fetch('/api/upload-video', {
              method: 'POST',
              body: formData
            })
            
            if (!response.ok) {
              throw new Error(`Upload initialization failed: ${response.status}`)
            }
            
            const result = await response.json()
            
            if (!result.success) {
              throw new Error(result.error || 'Failed to initialize upload')
            }
            
            // Extract IDs from response (handling different response structures)
            let uploadSessionId = ''
            let videoId = ''
            
            if (result.data && result.data.upload_session_id) {
              uploadSessionId = result.data.upload_session_id
            } else if (result.upload_session_id) {
              uploadSessionId = result.upload_session_id
            } else {
              throw new Error('No upload session ID found in response')
            }
            
            if (result.data && result.data.video_id) {
              videoId = result.data.video_id
            } else if (result.video_id) {
              videoId = result.video_id
            } else {
              throw new Error('No video ID found in response')
            }
            
            // Clean the video_id if it has a "video_" prefix
            if (typeof videoId === 'string' && videoId.startsWith('video_')) {
              videoId = videoId.substring(6)
            }
            
            resolve({ sessionId: uploadSessionId, videoId })
          } catch (error) {
            reject(error)
          }
        }
        
        videoElement.onerror = () => {
          URL.revokeObjectURL(videoUrl)
          reject(new Error('Could not load video metadata'))
        }
        
        videoElement.src = videoUrl
      })
    } catch (error) {
      console.error('Error initializing video upload:', error)
      throw error
    }
  }

  // Upload video in chunks
  const uploadChunks = async (file: File, uploadSessionId: string, videoId: string) => {
    const totalChunks = Math.ceil(file.size / CHUNK_SIZE)
    let startOffset = 0
    let chunkIndex = 0
    
    while (startOffset < file.size) {
      const endOffset = Math.min(startOffset + CHUNK_SIZE, file.size)
      const isLastChunk = endOffset === file.size
      const chunk = file.slice(startOffset, endOffset)
      
      // Create a proper Blob with file type
      const chunkBlob = new Blob([chunk], { type: file.type })
      
      const formData = new FormData()
      formData.append('file', chunkBlob, `chunk_${chunkIndex}.mp4`)
      formData.append('video_id', videoId)
      formData.append('start_offset', startOffset.toString())
      formData.append('finish', isLastChunk ? '1' : '0')
      formData.append('upload_session_id', uploadSessionId)
      
      // Add campaign session ID if provided
      if (campaignSessionId) {
        formData.append('campaign_session_id', campaignSessionId)
      }
      
      try {
        const response = await fetch('/api/upload-video', {
          method: 'POST',
          body: formData
        })
        
        if (!response.ok) {
          throw new Error(`Chunk upload failed: ${response.status}`)
        }
        
        const result = await response.json()
        
        // If it's the last chunk and successful, save final video ID
        if (isLastChunk && result.success) {
          // Extract final video_id if available
          let finalVideoId = videoId
          
          if (result.data && result.data.video_id) {
            finalVideoId = result.data.video_id
          } else if (result.video_id) {
            finalVideoId = result.video_id
          }
          
          // Clean the video_id if it has a "video_" prefix
          if (typeof finalVideoId === 'string' && finalVideoId.startsWith('video_')) {
            finalVideoId = finalVideoId.substring(6)
          }
          
          return finalVideoId
        }
        
        // Update progress (0-100%)
        chunkIndex++
        const newProgress = Math.floor((chunkIndex / totalChunks) * 100)
        setProgress(newProgress)
        
        // Move to next chunk
        startOffset = endOffset
      } catch (error) {
        console.error('Error uploading chunk:', error)
        throw error
      }
    }
    
    return videoId
  }

  // Main upload function
  const uploadVideo = async (videoFile: File) => {
    setUploading(true)
    setProgress(0)
    setError(null)
    
    try {
      toast.info("Video upload started", {
        description: "Your video is being processed"
      })
      
      // Step 1: Initialize upload
      setProgress(5)
      const { sessionId, videoId } = await initializeVideoUpload(videoFile)
      setUploadSessionId(sessionId)
      setVideoId(videoId)
      
      // Step 2: Upload chunks
      setProgress(10)
      const finalVideoId = await uploadChunks(videoFile, sessionId, videoId)
      
      // Step 3: Handle successful upload
      setProgress(100)
      setUploading(false)
      
      // Construct the video URL
      const videoUrl = `/api/fasty-bot/proxy-get-video-detail?video_id=${finalVideoId}`
      
      toast.success("Video upload completed", {
        description: "Your video is ready to use"
      })
      
      // Call the callback with the video URL and ID
      if (onVideoUploaded) {
        onVideoUploaded(videoUrl, finalVideoId)
      }
      
      return { videoUrl, videoId: finalVideoId }
    } catch (error: any) {
      setUploading(false)
      setProgress(0)
      setError(error.message || "Upload failed")
      
      toast.error("Video upload failed", {
        description: error.message || "Please try again"
      })
      
      console.error("Video upload error:", error)
      throw error
    }
  }

  return (
    <div className={`w-full ${className}`}>
      <div 
        className={`border-2 border-dashed rounded-lg p-6 text-center ${
          dragActive 
            ? "border-primary bg-primary/5" 
            : error 
              ? "border-red-500/50 bg-red-500/5" 
              : uploading 
                ? "border-blue-500/50 bg-blue-500/5" 
                : "border-gray-500/50 bg-gray-100/5 dark:border-gray-700 dark:bg-gray-800/20"
        } transition-colors duration-200 ease-in-out`}
        onDragEnter={handleDrag}
        onDragOver={handleDrag}
        onDragLeave={handleDrag}
        onDrop={handleDrop}
      >
        {!uploading && !file && (
          <div className="flex flex-col items-center justify-center space-y-4">
            <div className="p-3 rounded-full bg-primary/10 text-primary">
              <Video className="size-8" />
            </div>
            <div className="space-y-2">
              <h3 className="text-lg font-medium">Upload a video</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 max-w-xs mx-auto">
                Drag and drop a video file, or click to select
              </p>
              <p className="text-xs text-gray-400 dark:text-gray-500">
                MP4, MOV, or WebM up to 300MB
              </p>
            </div>
            <Button 
              type="button" 
              variant="outline" 
              onClick={handleButtonClick}
              className="mt-2"
            >
              <UploadCloud className="size-4 mr-2" />
              Select Video
            </Button>
            <input 
              type="file"
              ref={fileInputRef}
              className="hidden"
              accept="video/*"
              onChange={handleFileInputChange}
            />
          </div>
        )}
        
        {uploading && (
          <div className="space-y-4">
            <div className="flex items-center justify-center animate-pulse">
              <Video className="size-8 text-primary" />
            </div>
            <div className="space-y-2">
              <h3 className="text-lg font-medium">Uploading video...</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {file?.name}
              </p>
            </div>
            <div className="space-y-2 max-w-md mx-auto">
              <Progress value={progress} className="h-2" />
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {progress}% complete
              </p>
            </div>
          </div>
        )}
        
        {error && !uploading && (
          <div className="space-y-4 text-red-500">
            <AlertCircle className="size-8 mx-auto" />
            <div>
              <h3 className="text-lg font-medium">Upload failed</h3>
              <p className="text-sm mt-1">{error}</p>
            </div>
            <Button 
              variant="outline" 
              onClick={handleButtonClick}
              className="mt-2 border-red-500/50 text-red-500 hover:bg-red-500/10"
            >
              Try again
            </Button>
          </div>
        )}
        
        {file && !uploading && !error && (
          <div className="space-y-4 text-green-500">
            <CheckCircle className="size-8 mx-auto" />
            <div>
              <h3 className="text-lg font-medium">Upload successful</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                {file.name}
              </p>
            </div>
            <Button 
              variant="outline" 
              onClick={handleButtonClick}
              className="mt-2"
            >
              Upload another video
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}