interface VideoPlayerProps {
  src: string
  width?: string
  height?: string
}

const VideoPlayer: React.FC<VideoPlayerProps> = ({
  src,
  width = 'w-full',
  height = 'h-auto'
}) => {
  return (
    <div className={`video-container ${width} ${height}`}>
      <video controls preload="metadata" className="rounded-lg shadow-md">
        <source src={src} type="video/mp4" />
        Your browser does not support the video tag.
      </video>
    </div>
  )
}

export { VideoPlayer }
