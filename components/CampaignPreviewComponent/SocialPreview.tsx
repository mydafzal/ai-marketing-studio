"use client";

import Image from 'next/image';
import { cn } from '@/lib/utils';
import { Instagram, Facebook } from 'lucide-react';

interface SocialPreviewProps {
  platform: 'instagram' | 'facebook';
  image: string;
  headline: string;
  text: string;
}

export function SocialPreview({ platform, image, headline, text }: SocialPreviewProps) {
  return (
    <div className={cn(
      "w-full rounded-lg overflow-hidden",
      "bg-white dark:bg-zinc-800",
      platform === 'instagram' ? "instagram-preview" : "facebook-preview"
    )}>
      <div className="p-3 flex items-center gap-2 border-b border-zinc-200 dark:border-zinc-700">
        {platform === 'instagram' ? (
          <Instagram className="size-5 text-pink-600" />
        ) : (
          <Facebook className="size-5 text-blue-600" />
        )}
        <span className="font-medium text-sm">
          {platform === 'instagram' ? 'Instagram' : 'Facebook'} Ad Preview
        </span>
      </div>
      
      <div className="relative aspect-square">
        {image ? (
          <Image
            src={image}
            alt="Ad preview"
            className="object-cover"
            fill
            sizes="(max-width: 768px) 100vw, 448px"
            priority
          />
        ) : (
          <div className="bg-zinc-300 dark:bg-zinc-700 w-full h-full" />
        )}
      </div>
      
      <div className="p-4">
        <h4 className="font-semibold mb-2">{headline || 'No Headline'}</h4>
        <p className="text-sm text-zinc-600 dark:text-zinc-300">{text || 'No ad text set yet.'}</p>
        
        <button className={cn(
          "w-full mt-4 py-2 rounded-lg text-center text-sm font-medium",
          platform === 'instagram' 
            ? "bg-gradient-to-r from-pink-500 to-purple-500 text-white"
            : "bg-blue-600 text-white"
        )}>
          Learn More
        </button>
      </div>
    </div>
  );
}
