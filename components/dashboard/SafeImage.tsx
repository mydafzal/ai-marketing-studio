'use client'

import React, { useState } from 'react'
import Image from 'next/image'

interface SafeImageProps {
  src: string
  alt: string
  fill?: boolean
  width?: number
  height?: number
  style?: React.CSSProperties
  className?: string
  unoptimized?: boolean
}

/**
 * SafeImage component that handles fallback for broken images
 * Automatically falls back to a placeholder image if the provided src fails to load
 */
export default function SafeImage({
  src,
  alt,
  fill = false,
  width,
  height,
  style,
  className,
  unoptimized = false
}: SafeImageProps) {
  const [imgSrc, setImgSrc] = useState(src)
  const [hasError, setHasError] = useState(false)
  
  // Generate a placeholder URL with the alt text
  const placeholderSrc = `https://via.placeholder.com/400x250/0A0C14/FFFFFF?text=${encodeURIComponent(alt || 'No Image')}`
  
  const handleError = () => {
    if (!hasError) {
      setImgSrc(placeholderSrc)
      setHasError(true)
    }
  }
  
  // Props for the Image component
  const imageProps = {
    src: imgSrc,
    alt,
    onError: handleError,
    className,
    unoptimized
  }
  
  // Determine whether to use fill mode or explicit dimensions
  if (fill) {
    return <Image {...imageProps} fill style={{ objectFit: 'cover', ...style }} />
  }
  
  return (
    <Image 
      {...imageProps} 
      width={width || 400} 
      height={height || 250}
      style={style} 
    />
  )
}