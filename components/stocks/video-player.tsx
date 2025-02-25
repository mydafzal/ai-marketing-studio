"use client"

import { Button } from "@/components/ui/button"
import React, { useState, useRef, useEffect } from "react"
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize,
  Minimize,
  SkipBack,
  SkipForward,
} from "lucide-react"

interface VideoPlayerProps {
  src?: string
  title?: string
  width?: string
  height?: string
  thumbnail?: string
  onError?: (error: Error) => void
  className?: string
  videoId?: string
  autoPlay?: boolean
  muted?: boolean
}

const VideoPlayer: React.FC<VideoPlayerProps> = ({
  src,
  title,
  width = "w-full",
  height = "h-auto",
  thumbnail,
  onError,
  className,
  videoId,
  autoPlay = false,
  muted = false,
}) => {
  const [srcUrl, setSrcUrl] = useState(src)
  const [isPlaying, setIsPlaying] = useState(autoPlay)
  const [isMuted, setIsMuted] = useState(muted)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [progress, setProgress] = useState(0)
  const videoRef = useRef<HTMLVideoElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  // 1) Fetch video when videoId is provided
  useEffect(() => {
    if (videoId && !srcUrl) {
      fetchVideo()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [videoId])

  // 2) Handle autoPlay (and attempt silent playback) once the video source is set
  useEffect(() => {
    if (srcUrl && autoPlay && videoRef.current) {
      // Browsers require muted for autoplay, so ensure muted is true
      videoRef.current.muted = true
      videoRef.current
        .play()
        .then(() => {
          setIsPlaying(true)
        })
        .catch((err) => {
          console.warn("Autoplay failed:", err)
        })
    }
  }, [srcUrl, autoPlay])

  // 3) Ensure the video loops if autoPlay is on
  useEffect(() => {
    if (videoRef.current) {
      // If user sets autoPlay = true, we loop
      videoRef.current.loop = !!autoPlay
    }
  }, [autoPlay])

  // 4) Update muted state whenever the 'muted' prop changes
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.muted = muted
      setIsMuted(muted)
    }
  }, [muted])

  // --- Helper to fetch the remote video URL ---
  const fetchVideo = () => {
    fetch(`/api/fasty-bot/proxy-get-video-detail?video_id=${videoId}`)
      .then((response) => response.json())
      .then((videoDetail) => {
        if (videoDetail?.source) {
          setSrcUrl(videoDetail.source)
        }
      })
      .catch((error) => {
        console.error("Error fetching video detail:", error)
      })
  }

  const handleClick = () => {
    // If we haven't loaded a videoUrl yet, fetch it
    if (!srcUrl) {
      fetchVideo()
    }
  }

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause()
      } else {
        videoRef.current.play()
      }
      setIsPlaying(!isPlaying)
    }
  }

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted
      setIsMuted(!isMuted)
    }
  }

  const toggleFullscreen = () => {
    if (containerRef.current) {
      if (!document.fullscreenElement) {
        containerRef.current.requestFullscreen()
        setIsFullscreen(true)
      } else {
        document.exitFullscreen()
        setIsFullscreen(false)
      }
    }
  }

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      const progressValue =
        (videoRef.current.currentTime / videoRef.current.duration) * 100
      setProgress(progressValue)
    }
  }

  const handleSkip = (seconds: number) => {
    if (videoRef.current) {
      videoRef.current.currentTime += seconds
    }
  }

  return (
    <div
      ref={containerRef}
      className={`relative video-container group rounded-xl bg-zinc-950 shadow-lg overflow-hidden ${width} ${height} ${className}`}
    >
      {/* Video Element */}
      <video
        ref={videoRef}
        className="h-full w-full object-contain"
        poster={thumbnail}
        onTimeUpdate={handleTimeUpdate}
        onError={() => onError?.(new Error("Video playback error"))}
        // We rely on effect-based approach for controlling 'muted' & 'loop'
        muted={isMuted}
        playsInline
      >
        {srcUrl && <source src={srcUrl} type="video/mp4" />}
        Your browser does not support the video tag.
      </video>

      {/* Button to fetch and display video if there's no src yet */}
      {!srcUrl && (
        <Button
          className="absolute left-1/2 top-1/2 translate-x-[-50%] translate-y-[-50%]"
          size="sm"
          onClick={handleClick}
        >
          Show
        </Button>
      )}

      {/* Title Bar */}
      {title && (
        <div className="absolute left-0 right-0 top-0 bg-gradient-to-b from-zinc-900/80 to-transparent p-4">
          <h3 className="font-medium text-zinc-100">{title}</h3>
        </div>
      )}

      {/* Controls Overlay */}
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-zinc-900/80 to-transparent p-4 opacity-0 transition-opacity group-hover:opacity-100">
        {/* Progress Bar */}
        <div className="mb-4 h-1 w-full cursor-pointer rounded-full bg-zinc-700">
          <div
            className="h-full rounded-full bg-green-500"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Control Buttons */}
        <div className="flex items-center gap-4">
          <button
            onClick={togglePlay}
            className="rounded-full p-2 transition-colors hover:bg-zinc-800/50"
          >
            {isPlaying ? (
              <Pause className="size-5 text-zinc-100" />
            ) : (
              <Play className="size-5 text-zinc-100" />
            )}
          </button>

          <button
            onClick={() => handleSkip(-10)}
            className="rounded-full p-2 transition-colors hover:bg-zinc-800/50"
          >
            <SkipBack className="size-5 text-zinc-100" />
          </button>

          <button
            onClick={() => handleSkip(10)}
            className="rounded-full p-2 transition-colors hover:bg-zinc-800/50"
          >
            <SkipForward className="size-5 text-zinc-100" />
          </button>

          <button
            onClick={toggleMute}
            className="rounded-full p-2 transition-colors hover:bg-zinc-800/50"
          >
            {isMuted ? (
              <VolumeX className="size-5 text-zinc-100" />
            ) : (
              <Volume2 className="size-5 text-zinc-100" />
            )}
          </button>

          <div className="flex-1" />

          <button
            onClick={toggleFullscreen}
            className="rounded-full p-2 transition-colors hover:bg-zinc-800/50"
          >
            {isFullscreen ? (
              <Minimize className="size-5 text-zinc-100" />
            ) : (
              <Maximize className="size-5 text-zinc-100" />
            )}
          </button>
        </div>
      </div>
    </div>
  )
}

// Named export
export { VideoPlayer }
