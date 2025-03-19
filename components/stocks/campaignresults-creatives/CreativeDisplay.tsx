"use client"

import React, { useState, useEffect, useCallback } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select"
import { 
  Award, 
  Edit2, Eye, 
  EyeOff, 
  ThumbsUp, 
  Eye as EyeIcon, 
  Clock, 
  DollarSign, 
  Target 
} from "lucide-react"
import { EnhancedMetricItem } from "./EnhancedMetricItem"
import { AdCreative, formatAdName, VIDEO_AD_FORMATS, IMAGE_AD_FORMATS, AD_FORMAT_LABELS } from "./types"

interface CreativeDisplayProps {
  creative: AdCreative
  isTopPerformer: boolean
  isSecondBest: boolean
  onViewDetails: () => void
  onTogglePublish: () => void
}

export const CreativeDisplay: React.FC<CreativeDisplayProps> = ({
  creative,
  isTopPerformer,
  isSecondBest,
  onViewDetails,
  onTogglePublish,
}) => {
  const [adFormat, setAdFormat] = useState(creative.type === 'video' ? 'INSTAGRAM_STANDARD' : 'INSTAGRAM_STANDARD')
  const [previewHtml, setPreviewHtml] = useState<string>("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const formats = creative.type === 'video' ? VIDEO_AD_FORMATS : IMAGE_AD_FORMATS

  const fetchPreview = useCallback(async () => {
    if (!creative.id) return
    
    setIsLoading(true)
    setError(null)

    try {
      console.log(`Fetching preview for creative ${creative.id} with format ${adFormat}`)
      const response = await fetch(`/api/fasty-bot/proxy-get-ad-creative-preview?creative_id=${creative.id}&ad_format=${adFormat}`)
      
      if (!response.ok) {
        const errorText = await response.text()
        console.error(`API error (${response.status}):`, errorText)
        throw new Error(`Failed to fetch preview: ${response.status} ${response.statusText}`)
      }

      const data = await response.json()
      console.log("Preview response:", data)
      
      if (data.success) {
        // Handle possible response formats from the campaign-creation-flow endpoint
        if (data.preview_html) {
          setPreviewHtml(data.preview_html)
        } else if (data.response_data?.data?.[0]?.body) {
          setPreviewHtml(data.response_data.data[0].body)
        } else {
          throw new Error("No preview HTML found in response")
        }
      } else {
        console.error("Preview data invalid structure:", data)
        throw new Error(data.error || data.details || "Preview data not available")
      }
    } catch (err) {
      console.error("Error fetching preview:", err)
      setError(err instanceof Error ? err.message : "Failed to load preview")
    } finally {
      setIsLoading(false)
    }
  }, [creative.id, adFormat])

  useEffect(() => {
    fetchPreview()
  }, [fetchPreview])

  // Safely render HTML content
  const renderHtml = () => {
    return { __html: previewHtml }
  }

  return (
    <div
      className={`
        group mx-auto flex max-w-[900px] flex-col
        overflow-hidden rounded-xl
        border transition-all duration-300 hover:shadow-xl
        dark:border-zinc-600
        hover:scale-[1.01]
        ${
          isTopPerformer
            ? "bg-gradient-to-r from-zinc-50 to-yellow-50 dark:from-zinc-700 dark:to-zinc-600 ring-4 ring-yellow-300/50"
            : isSecondBest
            ? "bg-gradient-to-r from-zinc-50 to-blue-50 dark:from-zinc-700 dark:to-zinc-600 ring-4 ring-blue-300/50"
            : "bg-white shadow-md dark:bg-zinc-700"
        }
      `}
    >
      {/* HEADER: Title & Format Selector */}
      <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-600 px-5 py-3">
        <div className="flex items-center space-x-2">
          <h5 className="truncate text-lg font-semibold text-zinc-800 dark:text-zinc-200">
            {formatAdName(creative.name)}
          </h5>
          <Badge
            className={`
              text-xs font-medium ml-2
              ${
                creative.status === "ACTIVE"
                  ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                  : "bg-zinc-100 text-zinc-600 dark:bg-zinc-700 dark:text-zinc-300"
              }
            `}
          >
            {creative.status === "ACTIVE" ? "Active" : "Inactive"}
          </Badge>
          
          {/* Performance badges */}
          {isTopPerformer && (
            <Badge className="bg-gradient-to-r from-yellow-500 to-amber-500 ml-1 text-black">
              <Award className="size-3 mr-1" />
              Top Performer
            </Badge>
          )}
          {isSecondBest && !isTopPerformer && (
            <Badge className="bg-gradient-to-r from-slate-300 to-blue-300 ml-1 text-black">
              <Award className="size-3 mr-1" />
              Runner Up
            </Badge>
          )}
        </div>
        
        <div className="w-[200px]">
          <Select value={adFormat} onValueChange={(value) => {
            setAdFormat(value)
          }}>
            <SelectTrigger className="h-8">
              <SelectValue placeholder="Select format" />
            </SelectTrigger>
            <SelectContent>
              {formats.map((format) => (
                <SelectItem key={format} value={format}>
                  {AD_FORMAT_LABELS[format]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* BODY: Preview and Metrics */}
      <div className="flex flex-row">
        {/* LEFT SIDE: Ad Preview */}
        <div className="w-1/2 border-r border-zinc-200 dark:border-zinc-600 min-h-[500px] p-4">
          <div className="h-full flex items-center justify-center bg-zinc-50 dark:bg-zinc-800 rounded-md overflow-hidden">
            {isLoading ? (
              <div className="flex items-center justify-center h-full w-full">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
              </div>
            ) : error ? (
              <div className="text-red-500 p-4 text-center">
                {error}
              </div>
            ) : (
              <div 
                className="w-full h-full flex items-center justify-center" 
                dangerouslySetInnerHTML={renderHtml()} 
              />
            )}
          </div>
        </div>

        {/* RIGHT SIDE: Metrics */}
        <div className="w-1/2 flex flex-col space-y-2 p-4">
          <EnhancedMetricItem
            icon={<EyeIcon className="size-4" />}
            label="Impressions"
            value={creative.metrics.impressions.toLocaleString()}
            percent={12}
            miniChart="sparkline"
          />
          <EnhancedMetricItem
            icon={<ThumbsUp className="size-4" />}
            label="Engagement"
            value={creative.metrics.engagement.toLocaleString()}
            percent={8}
            miniChart="bar"
            isPositive
          />
          <EnhancedMetricItem
            icon={<Clock className="size-4" />}
            label="Watch Time (s)"
            value={creative.metrics.watchTime.toFixed(1)}
            percent={-5}
            miniChart="area"
            isPositive={false}
          />
          <EnhancedMetricItem
            icon={<DollarSign className="size-4" />}
            label="CPC"
            value={`$${creative.metrics.costPerClick.toFixed(2)}`}
            percent={-3}
            miniChart="line"
            isPositive
          />
          <EnhancedMetricItem
            icon={<Target className="size-4" />}
            label="Conversions / Leads"
            value={`${creative.metrics.conversions}/${creative.metrics.leads}`}
            percent={7}
            miniChart="bar"
            isPositive
          />

          {/* Action buttons */}
          <div className="mt-auto pt-2 flex space-x-2 border-t border-zinc-100 dark:border-zinc-600">
            <Button
              onClick={onViewDetails}
              variant="outline"
              size="sm"
              className="flex-1"
            >
              <Eye className="mr-1.5 size-4" />
              More Details
            </Button>
            <Button
              onClick={onTogglePublish}
              variant={creative.status === "ACTIVE" ? "destructive" : "default"}
              size="sm"
              className={`
                flex-1
                ${
                  creative.status !== "ACTIVE" &&
                  "bg-green-600 hover:bg-green-700 text-white"
                }
              `}
            >
              {creative.status === "ACTIVE" ? (
                <>
                  <EyeOff className="mr-1.5 size-4" />
                  Pause
                </>
              ) : (
                <>
                  <EyeIcon className="mr-1.5 size-4" />
                  Activate
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}