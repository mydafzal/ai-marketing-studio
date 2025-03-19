"use client"

import React, { useState, useEffect } from "react"
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select"
import { IMAGE_AD_FORMATS, VIDEO_AD_FORMATS, AD_FORMAT_LABELS } from "./types"

interface AdPreviewProps {
  creativeId: string
  type: "image" | "video"
}

export const AdPreview: React.FC<AdPreviewProps> = ({ creativeId, type }) => {
  const [adFormat, setAdFormat] = useState(type === 'video' ? 'INSTAGRAM_STANDARD' : 'INSTAGRAM_STANDARD')
  const [previewHtml, setPreviewHtml] = useState<string>("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const formats = type === 'video' ? VIDEO_AD_FORMATS : IMAGE_AD_FORMATS

  useEffect(() => {
    const fetchPreview = async () => {
      if (!creativeId) return

      setIsLoading(true)
      setError(null)

      try {
        const response = await fetch(`/api/fasty-bot/proxy-get-ad-creative-preview?creative_id=${creativeId}&ad_format=${adFormat}`)
        if (!response.ok) {
          throw new Error(`Failed to fetch preview: ${response.statusText}`)
        }

        const data = await response.json()
        if (data.success && data.preview_html) {
          setPreviewHtml(data.preview_html)
        } else {
          throw new Error("Preview data not available")
        }
      } catch (err) {
        console.error("Error fetching preview:", err)
        setError(err instanceof Error ? err.message : "Failed to load preview")
      } finally {
        setIsLoading(false)
      }
    }

    fetchPreview()
  }, [creativeId, adFormat])

  // Safely render HTML content
  const renderHtml = () => {
    return { __html: previewHtml }
  }

  return (
    <div className="flex flex-col items-center w-full space-y-4">
      <div className="w-full max-w-md">
        <Select value={adFormat} onValueChange={setAdFormat}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select format" />
          </SelectTrigger>
          <SelectContent>
            {formats.map((format) => (
              <SelectItem key={format} value={format}>
                {/* Fix for the TypeScript error with type assertion */}
                {AD_FORMAT_LABELS[format as keyof typeof AD_FORMAT_LABELS]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="relative w-full bg-zinc-50 dark:bg-zinc-800 rounded-md overflow-hidden min-h-[400px] flex items-center justify-center">
        {isLoading ? (
          <div className="flex items-center justify-center size-full">
            <div className="animate-spin rounded-full size-12 border-b-2 border-primary"></div>
          </div>
        ) : error ? (
          <div className="text-red-500 p-4 text-center">
            {error}
          </div>
        ) : (
          <div 
            className="size-full flex items-center justify-center" 
            dangerouslySetInnerHTML={renderHtml()} 
          />
        )}
      </div>
    </div>
  )
}