"use client"

import React, { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { VideoUploader } from "@/components/video-uploader"
import { VideoPlayer } from "@/components/stocks/video-player"
import { 
  Video, 
  Save, 
  Download, 
  Trash2, 
  AlertCircle, 
  Info
} from "lucide-react"
import { toast } from "sonner"

export default function VideoUploadTab() {
  const [uploadedVideos, setUploadedVideos] = useState<{url: string, id: string}[]>([])
  const [selectedVideos, setSelectedVideos] = useState<number[]>([])
  const [isSaving, setIsSaving] = useState(false)
  
  // Handle successful video upload
  const handleVideoUploaded = (videoUrl: string, videoId: string) => {
    setUploadedVideos(prev => [...prev, { url: videoUrl, id: videoId }])
  }
  
  // Toggle selection for a given video index
  const toggleVideoSelected = (index: number) => {
    setSelectedVideos((prev) =>
      prev.includes(index) ? prev.filter((i) => i !== index) : [...prev, index]
    )
  }
  
  // Clear selections
  const clearSelections = () => {
    setSelectedVideos([])
  }
  
  // Select all videos
  const selectAll = () => {
    const allIndices = Array.from({ length: uploadedVideos.length }, (_, i) => i)
    setSelectedVideos(allIndices)
  }
  
  // Delete video
  const handleDeleteVideo = (index: number) => {
    setUploadedVideos(prev => prev.filter((_, i) => i !== index))
    setSelectedVideos(prev => prev.filter(i => i !== index).map(i => i > index ? i - 1 : i))
  }
  
  // Download video
  const handleDownload = async (videoUrl: string, index: number) => {
    try {
      const response = await fetch(videoUrl)
      if (!response.ok) throw new Error("Failed to fetch video for download")

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.href = url
      link.download = `video-${index + 1}.mp4`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)

      toast.success("Download complete", {
        description: "Video saved successfully to your device."
      })
    } catch (error) {
      console.error("Error downloading video:", error)
      toast.error("Download failed", {
        description: "Unable to download the video. Please try again."
      })
    }
  }
  
  // Save to library
  const handleSaveSelectedVideosToLibrary = async () => {
    if (selectedVideos.length === 0) {
      toast.error("No videos selected", {
        description: "Please select at least one video to save to your library."
      })
      return
    }

    setIsSaving(true)

    try {
      const formData = new FormData()
      formData.append("type", "video")

      let savedCount = 0
      for (let i = 0; i < selectedVideos.length; i++) {
        const index = selectedVideos[i]
        const videoItem = uploadedVideos[index]

        if (videoItem) {
          try {
            // Fetch the video file
            const response = await fetch(videoItem.url)
            if (!response.ok) throw new Error(`Failed to fetch video ${index}`)

            const blob = await response.blob()
            const file = new File([blob], `video_${Date.now()}_${index}.mp4`, { type: "video/mp4" })
            formData.append("files", file)
            savedCount++
          } catch (error) {
            console.error(`Error preparing video ${index} for library:`, error)
          }
        }
      }

      if (savedCount === 0) {
        throw new Error("Failed to prepare any videos for saving")
      }

      const res = await fetch("/api/content-library-upload", {
        method: "POST",
        body: formData
      })

      if (!res.ok) {
        throw new Error(`Upload failed: ${res.statusText}`)
      }

      await res.json()
      
      toast.success("Saved to library", {
        description: `${savedCount} video${savedCount !== 1 ? 's' : ''} saved to your content library.`
      })

      clearSelections()
    } catch (err) {
      console.error("Error saving videos:", err)
      toast.error("Save failed", {
        description: "Unable to save videos to your library. Please try again."
      })
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="w-full shadow-sm rounded-lg border border-[#2A2E3A] bg-[#151925]">
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b border-[#2A2E3A]">
        <div>
          <h2 className="flex items-center gap-2 text-xl font-bold">
            <Video className="size-5 text-[#4BF29C]" />
            <span className="text-white">Video Uploader</span>
          </h2>
          <p className="text-sm mt-1.5 text-[#8A8F99]">
            Upload videos for your social media campaigns
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          {uploadedVideos.length > 0 && (
            <span className="inline-flex text-xs font-medium px-2.5 py-0.5 rounded-full bg-[#1A3029] text-[#4BF29C]">
              {uploadedVideos.length} video{uploadedVideos.length !== 1 ? 's' : ''} uploaded
            </span>
          )}
        </div>
      </div>
      
      <hr className="border-[#2A2E3A]" />
      
      {/* Main content */}
      <div className="p-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left panel: Upload component */}
          <div className="lg:col-span-1 space-y-5">
            <VideoUploader onVideoUploaded={handleVideoUploaded} />
            
            <div className="mt-6 p-4 rounded-lg bg-[#1A1D29] border-[#2A2E3A] border">
              <div className="flex">
                <div className="flex-shrink-0 mr-3 text-[#4BF29C]">
                  <Info className="size-5" />
                </div>
                <div>
                  <h3 className="text-sm font-medium text-white">
                    Video upload tips
                  </h3>
                  <ul className="mt-1 text-sm text-[#ADB0B8] list-disc list-inside space-y-1">
                    <li>Use high-quality videos with clear visuals</li>
                    <li>Keep videos under 60 seconds for best performance</li>
                    <li>Supported formats: MP4, MOV, WebM</li>
                    <li>Maximum file size: 300MB</li>
                  </ul>
                </div>
              </div>
            </div>
            
            {/* Video format warning */}
            <div className="p-4 rounded-lg bg-[#1A1D29] border-[#FF7D5A] border">
              <div className="flex">
                <div className="flex-shrink-0 mr-3 text-[#FF7D5A]">
                  <AlertCircle className="size-5" />
                </div>
                <div>
                  <h3 className="text-sm font-medium text-white">
                    Video copyright notice
                  </h3>
                  <div className="mt-1 text-sm text-[#ADB0B8]">
                    Ensure you have the rights to use all uploaded videos in your advertising campaigns.
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Right panel: Uploaded videos */}
          <div className="lg:col-span-2">
            {uploadedVideos.length === 0 ? (
              <div className="border border-dashed border-[#2A2E3A] rounded-lg p-8 flex flex-col items-center justify-center h-full min-h-[400px] text-center">
                <div className="p-3 rounded-full mb-3 bg-[#1A3029]">
                  <Video className="size-6 text-[#4BF29C]" />
                </div>
                <h3 className="text-lg font-medium mb-1 text-white">No videos uploaded yet</h3>
                <p className="text-sm max-w-md mb-4 text-[#8A8F99]">
                  Upload your marketing videos to use them in your campaigns. Videos will appear here after upload.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex flex-col w-full">
                    <div className="border-b border-[#2A2E3A]">
                      <div className="flex items-center justify-between">
                        <div className="flex">
                          <button
                            type="button"
                            className="py-2 px-4 text-sm font-medium border-b-2 border-[#4BF29C] text-[#4BF29C]"
                          >
                            Uploaded Videos
                          </button>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <div className="text-xs text-[#8A8F99]">
                            {selectedVideos.length} selected
                          </div>
                          <button 
                            type="button"
                            onClick={selectAll}
                            disabled={uploadedVideos.length === 0}
                            className={`py-1 px-2 text-xs font-medium rounded border 
                              ${uploadedVideos.length === 0 
                                ? 'bg-[#1A1D29] text-[#8A8F99] cursor-not-allowed border-[#2A2E3A]'
                                : 'bg-[#1A1D29] text-white hover:bg-[#252836] border-[#2A2E3A]'
                              }`}
                          >
                            Select all
                          </button>
                          {selectedVideos.length > 0 && (
                            <button 
                              type="button"
                              onClick={clearSelections}
                              className="py-1 px-2 text-xs font-medium rounded bg-[#1A1D29] text-white hover:bg-[#252836] border border-[#2A2E3A]"
                            >
                              Clear
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                      
                    <div className="mt-3">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {uploadedVideos.map((video, i) => {
                          const isSelected = selectedVideos.includes(i)
                          
                          return (
                            <div
                              key={i}
                              className={`relative rounded-md overflow-hidden group cursor-pointer ${
                                isSelected 
                                  ? "ring-2 ring-[#4BF29C] ring-offset-2 ring-offset-[#151925]" 
                                  : "border-[#2A2E3A] border"
                              }`}
                              onClick={() => toggleVideoSelected(i)}
                            >
                              <VideoPlayer
                                src={video.url}
                                videoId={video.id}
                                height="h-[200px]"
                                className="w-full"
                                thumbnail=""
                                autoPlay={false}
                                muted={true}
                              />
                              
                              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100">
                                <div className="absolute bottom-2 right-2 flex gap-1">
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleDownload(video.url, i);
                                    }}
                                    className="py-1 px-2 text-xs font-medium bg-[#1A1D29] text-white rounded-md shadow hover:bg-[#252836] border border-[#2A2E3A] flex items-center"
                                  >
                                    <Download className="mr-1 size-3" />
                                    Download
                                  </button>
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleDeleteVideo(i);
                                    }}
                                    className="py-1 px-2 text-xs font-medium bg-[#1A1D29] text-[#FF7D5A] rounded-md shadow hover:bg-[#252836] border border-[#2A2E3A] flex items-center"
                                  >
                                    <Trash2 className="mr-1 size-3" />
                                    Delete
                                  </button>
                                </div>
                              </div>
                              
                              {isSelected && (
                                <div className="absolute top-2 left-2 bg-[#4BF29C] text-[#0A0C14] rounded-full p-1">
                                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M13.3332 4.66667L6.6665 11.3333L3.33317 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                  </svg>
                                </div>
                              )}
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Footer with save to library button */}
      {uploadedVideos.length > 0 && (
        <div className="flex justify-between items-center border-t border-[#2A2E3A] p-4 bg-[#1A1D29]">
          <div className="flex items-center text-xs text-[#8A8F99]">
            <span className="mr-1">
              {uploadedVideos.length} video{uploadedVideos.length !== 1 ? 's' : ''} available
            </span>
          </div>
          
          <button 
            type="button"
            onClick={handleSaveSelectedVideosToLibrary}
            disabled={selectedVideos.length === 0 || isSaving}
            className={`flex items-center gap-2 py-2 px-4 rounded-md text-sm font-medium 
              ${selectedVideos.length === 0 || isSaving
                ? 'bg-[#1A3029] cursor-not-allowed text-[#4BF29C]/50'
                : 'bg-[#4BF29C] hover:bg-[#3AD98C] text-[#0A0C14]'}`}
          >
            <Save className="size-4" />
            {isSaving ? 'Saving...' : `Save ${selectedVideos.length > 0 ? selectedVideos.length : ''} to Library`}
          </button>
        </div>
      )}
    </div>
  )
}