"use client";

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ImageIcon, Copy, Check } from 'lucide-react';
import { GeneratedImages, GeneratedAdContent } from '../types';
import { useState } from 'react';

interface ImageGenerationGridProps {
  isGeneratingMultipleImages: boolean;
  generatedImages: GeneratedImages;
  generatedAdContent: GeneratedAdContent;
  isGeneratingAdContent: boolean;
  onImageClick: (image: string, format: string) => void;
}

export default function ImageGenerationGrid({
  isGeneratingMultipleImages,
  generatedImages,
  generatedAdContent,
  isGeneratingAdContent,
  onImageClick
}: ImageGenerationGridProps) {
  const [copiedItems, setCopiedItems] = useState<{[key: string]: boolean}>({});

  const imageTypes = [
    { key: 'social', title: 'Campaign 1', description: 'Social media focused campaign' },
    { key: 'product', title: 'Campaign 2', description: 'Product showcase campaign' },
    { key: 'branding', title: 'Campaign 3', description: 'Brand awareness campaign' }
  ];

  const copyToClipboard = async (text: string, itemKey: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedItems(prev => ({ ...prev, [itemKey]: true }));
      setTimeout(() => {
        setCopiedItems(prev => ({ ...prev, [itemKey]: false }));
      }, 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  return (
    <div className="animate-fadeIn">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {imageTypes.map(({ key, title, description }) => (
          <Card key={key} className="bg-[#1A1D29] border-gray-700 overflow-hidden">
            <CardContent className="p-0">
              <div className="aspect-square bg-gray-800 relative">
                {isGeneratingMultipleImages ? (
                  <div className="w-full h-full flex items-center justify-center animate-pulse bg-gradient-to-br from-gray-800 via-gray-700 to-gray-800">
                    <ImageIcon className="w-10 h-10 text-gray-600 animate-pulse" />
                  </div>
                ) : (
                  generatedImages[key as keyof GeneratedImages].some(img => img.includes(`${key}-1:1`)) && (
                    <div 
                      className="w-full h-full cursor-pointer group"
                      onClick={() => {
                        const image = generatedImages[key as keyof GeneratedImages].find(img => img.includes(`${key}-1:1`));
                        if (image) {
                          onImageClick(image.split('#')[0], "square");
                        }
                      }}
                    >
                      <img 
                        src={generatedImages[key as keyof GeneratedImages].find(img => img.includes(`${key}-1:1`))?.split('#')[0]} 
                        alt={`Generated ${key} image`}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <Button variant="outline" className="bg-white/20 backdrop-blur-sm text-white border-white/30">
                          View Larger
                        </Button>
                      </div>
                    </div>
                  )
                )}
              </div>
              <div className="p-4">
                <h3 className="font-medium text-white mb-1">{title}</h3>
                <p className="text-xs text-gray-400 mb-3">{description}</p>
                
                {isGeneratingMultipleImages ? (
                  <div className="space-y-3 border-t border-gray-600 pt-3">
                    <div className="animate-pulse">
                      <div className="h-4 bg-gray-700 rounded mb-2"></div>
                      <div className="h-3 bg-gray-700 rounded w-3/4 mb-3"></div>
                      <div className="h-4 bg-gray-700 rounded mb-2"></div>
                      <div className="h-3 bg-gray-700 rounded w-5/6"></div>
                    </div>
                  </div>
                ) : (
                  generatedAdContent[key as keyof GeneratedAdContent] && (
                    <div className="space-y-3 border-t border-gray-600 pt-3">
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className="text-xs font-medium text-gray-300">Headline</label>
                          <button
                            onClick={() => copyToClipboard(generatedAdContent[key as keyof GeneratedAdContent]!.headline, `${key}-headline`)}
                            className="text-gray-400 hover:text-white transition-colors"
                          >
                            {copiedItems[`${key}-headline`] ? (
                              <Check className="w-3 h-3" />
                            ) : (
                              <Copy className="w-3 h-3" />
                            )}
                          </button>
                        </div>
                        <p className="text-sm text-white bg-gray-800 rounded p-2 font-medium">
                          {generatedAdContent[key as keyof GeneratedAdContent]!.headline}
                        </p>
                      </div>
                      
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className="text-xs font-medium text-gray-300">Ad Text</label>
                          <button
                            onClick={() => copyToClipboard(generatedAdContent[key as keyof GeneratedAdContent]!.text, `${key}-text`)}
                            className="text-gray-400 hover:text-white transition-colors"
                          >
                            {copiedItems[`${key}-text`] ? (
                              <Check className="w-3 h-3" />
                            ) : (
                              <Copy className="w-3 h-3" />
                            )}
                          </button>
                        </div>
                        <p className="text-sm text-white bg-gray-800 rounded p-2">
                          {generatedAdContent[key as keyof GeneratedAdContent]!.text}
                        </p>
                      </div>
                    </div>
                  )
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
} 