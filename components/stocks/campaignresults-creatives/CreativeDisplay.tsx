"use client"

import React from "react"
import Image from "next/image"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { 
  Award, 
  Edit2, 
  Eye, 
  EyeOff, 
  ThumbsUp, 
  Eye as EyeIcon, 
  Clock, 
  DollarSign, 
  Target 
} from "lucide-react"
import { VideoPlayer } from "@/components/stocks/video-player"
import { EnhancedMetricItem } from "./EnhancedMetricItem"
import { AdCreative, formatAdName } from "./types"

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
  const aspectRatioClass =
    creative.type === "video" ? "aspect-[9/16]" : "aspect-square"

  return (
    <div
      className={`
        group mx-auto flex max-w-[900px]
        flex-row items-start
        overflow-hidden rounded-xl
        border transition-all duration-300 hover:shadow-xl
        dark:border-zinc-600
        hover:scale-[1.02]
        ${
          isTopPerformer
            ? "bg-gradient-to-r from-zinc-50 to-yellow-50 dark:from-zinc-700 dark:to-zinc-600 ring-4 ring-yellow-300/50"
            : isSecondBest
            ? "bg-gradient-to-r from-zinc-50 to-blue-50 dark:from-zinc-700 dark:to-zinc-600 ring-4 ring-blue-300/50"
            : "bg-white shadow-md dark:bg-zinc-700"
        }
      `}
    >
      {/* LEFT SIDE: Media Container */}
      <div
        className={`
          relative w-1/2 min-h-[300px] max-w-[400px]
          border-r border-zinc-300 dark:border-zinc-600
          bg-black
        `}
      >
        <div className={`relative h-full w-full ${aspectRatioClass}`}>
          {creative.type === "video" ? (
            <VideoPlayer
              videoId={creative.videoId}
              className="size-full object-contain"
              height="h-full"
              key={creative.id}
              autoPlay
              muted
            />
          ) : (
            <Image
              src={creative.url ?? "/placeholder.jpg"}
              alt={creative.name}
              fill
              className="object-cover"
              priority
            />
          )}
        </div>

        {/* Status badge */}
        <div className="absolute top-3 left-3">
          <Badge
            className={`
              text-xs font-medium
              ${
                creative.status === "ACTIVE"
                  ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                  : "bg-zinc-100 text-zinc-600 dark:bg-zinc-700 dark:text-zinc-300"
              }
            `}
          >
            {creative.status === "ACTIVE" ? "Active" : "Inactive"}
          </Badge>
        </div>

        {/* Performance badges */}
        {isTopPerformer && (
          <div className="absolute top-3 right-3 flex items-center space-x-2 rounded-full bg-gradient-to-r from-yellow-500 to-amber-500 px-3 py-1 text-black shadow-lg">
            <Award className="size-4" />
            <span className="text-sm font-bold">Top Performer</span>
          </div>
        )}
        {isSecondBest && !isTopPerformer && (
          <div className="absolute top-3 right-3 flex items-center space-x-2 rounded-full bg-gradient-to-r from-slate-300 to-blue-300 px-3 py-1 text-black shadow-lg">
            <Award className="size-4" />
            <span className="text-sm font-bold">Runner Up</span>
          </div>
        )}
      </div>

      {/* RIGHT SIDE: Title & stacked metrics */}
      <div className="flex w-1/2 flex-col space-y-4 p-5">
        <h5 className="truncate text-lg font-semibold text-zinc-800 dark:text-zinc-200">
          {formatAdName(creative.name)}
        </h5>

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
        <div className="mt-2 flex space-x-2 border-t border-zinc-100 pt-2 dark:border-zinc-600">
          <Button
            onClick={onViewDetails}
            variant="outline"
            size="sm"
            className="flex-1"
          >
            <Edit2 className="mr-1.5 size-4" />
            See Details
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
  )
}