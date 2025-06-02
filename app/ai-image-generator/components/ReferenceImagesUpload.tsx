"use client";

import React from 'react';
import { Button } from '@/components/ui/button';
import { ImageIcon, X, Upload } from 'lucide-react';
import Image from 'next/image';

interface ReferenceImagesUploadProps {
  showUploadField: boolean;
  selectedReferenceImages: string[];
  setShowUploadField: (show: boolean) => void;
  setSelectedReferenceImages: React.Dispatch<React.SetStateAction<string[]>>;
  setReferenceImageUploadedFiles: React.Dispatch<React.SetStateAction<File[]>>;
  setError: (error: string | null) => void;
  onContinueWithoutImages: () => void;
  onUseSelectedImages: () => void;
}

export default function ReferenceImagesUpload({
  showUploadField,
  selectedReferenceImages,
  setShowUploadField,
  setSelectedReferenceImages,
  setReferenceImageUploadedFiles,
  setError,
  onContinueWithoutImages,
  onUseSelectedImages
}: ReferenceImagesUploadProps) {

  const handleFileUpload = async (files: File[]) => {
    try {
      setError(null);
      
      const validFiles = files.filter(file => {
        const isValidType = file.type.startsWith('image/');
        const isValidSize = file.size <= 10 * 1024 * 1024; // 10MB
        return isValidType && isValidSize;
      });

      if (validFiles.length === 0) {
        setError("Please select valid image files (max 10MB each).");
        return;
      }

      if (validFiles.length > 4) {
        setError("You can upload a maximum of 4 images.");
        return;
      }

      const imageUrls: string[] = [];
      
      for (const file of validFiles) {
        const url = URL.createObjectURL(file);
        imageUrls.push(url);
      }

      setSelectedReferenceImages(prev => [...prev, ...imageUrls].slice(0, 4));
      setReferenceImageUploadedFiles(prev => [...prev, ...validFiles].slice(0, 4));
      
    } catch (error) {
      console.error("Error processing files:", error);
      setError("There was an error processing your files. Please try again.");
    }
  };

  const handleUploadButtonClick = () => {
    const wasVisible = showUploadField;
    
    if (wasVisible) {
      setSelectedReferenceImages([]);
      setReferenceImageUploadedFiles([]);
      setError(null);
      setShowUploadField(false);
    } else {
      setShowUploadField(true);
      
      setTimeout(() => {
        try {
          const fileInput = document.getElementById('file-upload') as HTMLInputElement;
          if (fileInput) {
            console.log("Opening file dialog");
            fileInput.click();
          }
        } catch (error) {
          console.error("Error opening file dialog:", error);
        }
      }, 300);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    try {
      if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        const files = Array.from(e.dataTransfer.files).slice(0, 4);
        handleFileUpload(files);
      }
    } catch (error) {
      console.error("Error processing dragged files:", error);
      setError("There was an error processing your files. Please try again.");
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const files = Array.from(e.target.files).slice(0, 4);
      handleFileUpload(files);
    }
  };

  const removeImage = (idx: number) => {
    setSelectedReferenceImages(prev => prev.filter((_, i) => i !== idx));
    setReferenceImageUploadedFiles(prev => prev.filter((_, i) => i !== idx));
  };

  return (
    <div className="mt-6 mb-4 animate-fadeIn">
      <div className="bg-[#1A1D29] rounded-lg p-4 border border-gray-700 max-w-xl mx-auto">
        <div className="text-center mb-4">
          <h3 className="text-white font-medium mb-2">Reference Images (Optional)</h3>
          <p className="text-gray-400 text-sm mb-4">
            Upload up to 4 images to help guide the style and look of your generated images.
          </p>
          
          <div className="flex justify-center gap-3">
            <Button
              onClick={handleUploadButtonClick}
              className="bg-gray-700 text-white hover:bg-gray-600 py-1 h-8 text-xs flex items-center gap-2"
            >
              <Upload className="size-3.5" />
              {showUploadField ? 'Clear Images' : 'Upload Images'}
            </Button>
            
            <Button
              onClick={onContinueWithoutImages}
              className="bg-[#4BF29C] text-black hover:bg-[#3bd283] py-1 h-8 text-xs flex items-center gap-2"
            >
              <ImageIcon className="size-3" />
              Continue Without Images
            </Button>
          </div>
        </div>

        {showUploadField && (
          <div className="mt-4">
            <div
              className="border-2 border-dashed border-gray-600 rounded-lg p-6 text-center hover:border-gray-500 transition-colors cursor-pointer"
              onDrop={handleDrop}
              onDragOver={(e) => e.preventDefault()}
              onDragEnter={(e) => e.preventDefault()}
              onClick={() => document.getElementById('file-upload')?.click()}
            >
              <Upload className="mx-auto size-8 text-gray-400 mb-2" />
              <p className="text-gray-400 text-sm mb-1">
                Click to upload or drag and drop
              </p>
              <p className="text-gray-500 text-xs">
                PNG, JPG, JPEG up to 10MB each (max 4 images)
              </p>
            </div>
            
            <input
              id="file-upload"
              type="file"
              multiple
              accept="image/*"
              onChange={handleFileInputChange}
              className="hidden"
            />
            
            {selectedReferenceImages.length > 0 && (
              <div className="mt-4 grid grid-cols-2 gap-2">
                {selectedReferenceImages.map((image, idx) => (
                  <div key={idx} className="relative group">
                    <Image
                      src={image}
                      alt={`Reference ${idx + 1}`}
                      width={150}
                      height={150}
                      className="size-full object-cover rounded border border-gray-600"
                    />
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        removeImage(idx);
                      }}
                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="size-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
            
            {selectedReferenceImages.length > 0 && (
              <div className="mt-4 text-center">
                <p className="text-gray-400 text-xs mb-2">
                  {selectedReferenceImages.length} image{selectedReferenceImages.length !== 1 ? 's' : ''} selected
                </p>
                
                <Button
                  onClick={() => {
                    const fileInput = document.getElementById('file-upload') as HTMLInputElement;
                    if (fileInput) fileInput.click();
                  }}
                  className="bg-gray-700 text-white hover:bg-gray-600 py-1 h-8 text-xs mr-2 flex items-center gap-1"
                >
                  <Upload className="size-6" />
                  Add More
                </Button>
              </div>
            )}
            
            <div className="mt-3 flex justify-center">
              <Button
                onClick={onUseSelectedImages}
                className="bg-[#4BF29C] text-black hover:bg-[#3bd283] py-1 h-8 text-xs"
                disabled={selectedReferenceImages.length === 0}
              >
                {selectedReferenceImages.length > 0 ? 'Use Selected Images' : 'Select Images to Continue'}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 