"use client"

import React from 'react'
import { Dialog, DialogTrigger, ImageModalContent } from '@/components/ui/dialog'
import { ZoomIn } from 'lucide-react'

type ImagePreviewModalProps = {
  imageUrl: string
  thumbnailUrl?: string
  altText?: string
  children?: React.ReactNode
  className?: string
}

export default function ImagePreviewModal({
  imageUrl,
  thumbnailUrl,
  altText = "Image preview",
  children,
  className
}: ImagePreviewModalProps) {
  // Stop propagation to prevent parent click handlers from firing
  const handlePreviewClick = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <div 
          className={`group relative ${className}`} 
          onClick={handlePreviewClick}
        >
          {children || (
            <>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={thumbnailUrl || imageUrl}
                alt={altText}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 flex items-center justify-center bg-black/0 group-hover:bg-black/40 transition-all opacity-0 group-hover:opacity-100">
                <div className="bg-white/90 dark:bg-gray-800/90 p-2 rounded-full">
                  <ZoomIn className="h-5 w-5 text-gray-800 dark:text-white" />
                </div>
              </div>
            </>
          )}
        </div>
      </DialogTrigger>
      <ImageModalContent imageUrl={imageUrl} altText={altText} />
    </Dialog>
  )
}