'use client';

import { useState } from 'react';

interface VideoData {
  src: string;
  title: string;
  description: string;
  thumbnail?: string;
}

interface VideoCarouselProps {
  videos: VideoData[];
}

export default function VideoCarousel({ videos }: VideoCarouselProps) {
  const [currentVideo, setCurrentVideo] = useState(0);

  return (
    <div className="w-full mx-auto px-2 sm:px-4">
      {/* Main video display */}
      <div className="mb-4 sm:mb-8">
        <div className="bg-[#1A1D29] rounded-lg overflow-hidden border border-[#2A2E3A] shadow-lg">
          <div className="relative aspect-video">
            <iframe 
              src={videos[currentVideo].src} 
              width="100%" 
              height="100%" 
              frameBorder="0" 
              allow="autoplay; fullscreen; picture-in-picture; clipboard-write; encrypted-media" 
              className="absolute inset-0 w-full h-full"
            ></iframe>
          </div>
          <div className="p-3 sm:p-6">
            <h3 className="text-[#4BF29C] font-medium text-lg sm:text-xl">{videos[currentVideo].title}</h3>
            <p className="text-[#ADB0B8] mt-1 sm:mt-2 text-base sm:text-lg">{videos[currentVideo].description}</p>
          </div>
        </div>
      </div>
      
      {/* Thumbnail navigation - responsive grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-4 mx-auto">
        {videos.map((video, index) => (
          <button 
            key={index}
            onClick={() => setCurrentVideo(index)} 
            className={`bg-[#1A1D29] rounded-lg overflow-hidden border shadow-md transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#4BF29C] ${
              currentVideo === index ? 'border-[#4BF29C]' : 'border-[#2A2E3A] hover:border-[#4BF29C]'
            }`}
          >
            <div className="flex items-center p-2 sm:block sm:p-0">
              <div 
                className="aspect-video w-24 sm:w-full bg-cover bg-center opacity-80 rounded-md sm:rounded-none" 
                style={{
                  backgroundImage: `url('${video.thumbnail || "https://i.vimeocdn.com/video/1526060493-9e7f5e2c6730f6301c5d89aa1ec7a70e53e30a4c2dad6dc04af67c9bada42a63-d_640"}')`
                }}
              >
                <div className="w-full h-full flex items-center justify-center">
                  <div className="bg-[#4BF29C]/50 p-1 sm:p-2 rounded-full">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 sm:w-6 sm:h-6 text-white">
                      <path fillRule="evenodd" d="M4.5 5.653c0-1.426 1.529-2.33 2.779-1.643l11.54 6.348c1.295.712 1.295 2.573 0 3.285L7.28 19.991c-1.25.687-2.779-.217-2.779-1.643V5.653z" clipRule="evenodd" />
                    </svg>
                  </div>
                </div>
              </div>
              <div className="flex-1 p-2 sm:p-3">
                <h4 className="text-[#4BF29C] font-medium text-xs sm:text-sm truncate">{video.title}</h4>
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}