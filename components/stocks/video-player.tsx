'use client'

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';

interface VideoPlayerProps {
  src?: string
  width?: string
  height?: string
  className?: string
  videoId?: string
}

const VideoPlayer: React.FC<VideoPlayerProps> = ({
  src,
  width = 'w-full',
  height = 'h-auto',
  className,
  videoId
}) => {
  const [srcUrl, setSrcUrl] = useState(src);

  const handleClick = () => {
    if (srcUrl) return;

    fetch(`/api/fasty-bot/proxy-get-video-detail?video_id=${videoId}`)
      .then(response => response.json())
      .then(videoDetail => {
        if (videoDetail?.source) {
          setSrcUrl(videoDetail.source)
        }
      })
      .catch(error => {
        console.error('Error fetching video detail:', error);
      });
  }

  return (
    <div className={`relative video-container ${width} ${height} ${className}`}>
      <video controls preload="metadata" className="h-full rounded-lg shadow-md w-full">
        {!!srcUrl && <source src={srcUrl} type="video/mp4" />}
        Your browser does not support the video tag.
      </video>
      {!srcUrl && (
        <Button
          className="absolute left-[50%] top-[50%] translate-x-[-50%] translate-y-[-50%]"
          size="sm"
          onClick={handleClick}
        >Show</Button>
      )}
    </div>
  )
}

export { VideoPlayer }
