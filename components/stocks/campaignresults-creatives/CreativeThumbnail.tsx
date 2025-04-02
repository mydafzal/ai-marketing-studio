"use client"

import React from "react"
import Image from "next/image"
import { VideoPlayer } from "@/components/stocks/video-player"
import { AdCreative } from "./types"

interface CreativeThumbnailProps {
  creative?: AdCreative
  size?: number
}

export const CreativeThumbnail: React.FC<CreativeThumbnailProps> = ({ 
  creative, 
  size = 50 
}) => {
  if (!creative) return null

  return (
    <div
      className="relative mr-3 inline-block overflow-hidden rounded-md border border-zinc-300 dark:border-zinc-600 align-middle"
      style={{ width: size, height: size }}
    >
      {creative.type === "video" ? (
        <VideoPlayer
          videoId={creative.videoId}
          className="size-full object-cover"
          autoPlay
          muted
        />
      ) : (
        <Image
          src={creative.url ?? "/placeholder.jpg"}
          alt=""
          width={size}
          height={size}
          className="object-cover"
        />
      )}
    </div>
  )
}