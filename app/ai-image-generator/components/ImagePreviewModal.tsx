"use client";

import React from 'react';
import { Download } from 'lucide-react';

interface ImagePreviewModalProps {
  selectedImage: string | null;
  selectedFormat: string | null;
  onClose: () => void;
}

export default function ImagePreviewModal({ selectedImage, selectedFormat, onClose }: ImagePreviewModalProps) {
  if (!selectedImage) return null;

  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 sm:p-8" onClick={onClose}>
      <div 
        className="relative max-w-7xl max-h-full"
        onClick={(e) => e.stopPropagation()}
      >
        <img 
          src={selectedImage} 
          alt="Generated image preview" 
          className="w-full h-full object-contain rounded-lg max-h-[80vh]" 
        />
        <div className="absolute top-2 right-2 flex gap-2">
          <a
            href={selectedImage}
            download={`reeply-${selectedFormat}-image.png`}
            className="bg-white text-gray-800 rounded-md py-2 px-4 font-medium shadow hover:bg-gray-50 flex items-center"
            target="_blank"
            rel="noopener noreferrer"
          >
            <Download className="w-4 h-4 mr-1" />
            Download
          </a>
          <button
            onClick={onClose}
            className="bg-white text-gray-800 rounded-md py-2 px-4 font-medium shadow hover:bg-gray-50"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
} 