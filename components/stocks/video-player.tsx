import React, { useState, useRef } from 'react';
import { Play, Pause, Volume2, VolumeX, Maximize, Minimize, SkipBack, SkipForward } from 'lucide-react';

interface VideoPlayerProps {
  src: string;
  title?: string;
  width?: string;
  height?: string;
  thumbnail?: string;
  onError?: (error: Error) => void;
}

const VideoPlayer: React.FC<VideoPlayerProps> = ({
  src,
  title,
  width = 'w-full',
  height = 'h-auto',
  thumbnail,
  onError
}) => {
  // ... [previous implementation remains the same]
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [progress, setProgress] = useState(0);
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // ... [all the same functions and implementation]
  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const toggleFullscreen = () => {
    if (containerRef.current) {
      if (!document.fullscreenElement) {
        containerRef.current.requestFullscreen();
        setIsFullscreen(true);
      } else {
        document.exitFullscreen();
        setIsFullscreen(false);
      }
    }
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      const progress = (videoRef.current.currentTime / videoRef.current.duration) * 100;
      setProgress(progress);
    }
  };

  const handleSkip = (seconds: number) => {
    if (videoRef.current) {
      videoRef.current.currentTime += seconds;
    }
  };

  return (
    <div 
      ref={containerRef}
      className={`relative group bg-zinc-950 rounded-xl shadow-lg overflow-hidden ${width} ${height}`}
    >
      {/* Video Element */}
      <video
        ref={videoRef}
        className="w-full h-full object-contain"
        poster={thumbnail}
        onTimeUpdate={handleTimeUpdate}
        onError={(e) => onError?.(new Error('Video playback error'))}
      >
        <source src={src} type="video/mp4" />
        Your browser does not support the video tag.
      </video>

      {/* Title Bar */}
      {title && (
        <div className="absolute top-0 left-0 right-0 p-4 bg-gradient-to-b from-zinc-900/80 to-transparent">
          <h3 className="text-zinc-100 font-medium">{title}</h3>
        </div>
      )}

      {/* Controls Overlay */}
      <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-zinc-900/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
        {/* Progress Bar */}
        <div className="w-full h-1 bg-zinc-700 rounded-full mb-4 cursor-pointer">
          <div 
            className="h-full bg-green-500 rounded-full"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Control Buttons */}
        <div className="flex items-center gap-4">
          <button 
            onClick={togglePlay}
            className="p-2 rounded-full hover:bg-zinc-800/50 transition-colors"
          >
            {isPlaying ? (
              <Pause className="size-5 text-zinc-100" />
            ) : (
              <Play className="size-5 text-zinc-100" />
            )}
          </button>

          <button 
            onClick={() => handleSkip(-10)}
            className="p-2 rounded-full hover:bg-zinc-800/50 transition-colors"
          >
            <SkipBack className="size-5 text-zinc-100" />
          </button>

          <button 
            onClick={() => handleSkip(10)}
            className="p-2 rounded-full hover:bg-zinc-800/50 transition-colors"
          >
            <SkipForward className="size-5 text-zinc-100" />
          </button>

          <button 
            onClick={toggleMute}
            className="p-2 rounded-full hover:bg-zinc-800/50 transition-colors"
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
            className="p-2 rounded-full hover:bg-zinc-800/50 transition-colors"
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
  );
};

// Changed from 'export default VideoPlayer' to named export
export { VideoPlayer };