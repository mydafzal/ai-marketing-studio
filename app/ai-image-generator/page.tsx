"use client";

import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import ImagePreviewModal from './components/ImagePreviewModal';
import AIMessage from './components/AIMessage';
import ReferenceImagesUpload from './components/ReferenceImagesUpload';
import ImageGenerationGrid from './components/ImageGenerationGrid';
import { useImageGenerator } from './hooks/useImageGenerator';

export default function AIImageGeneratorPage() {
  const {
    isLoading,
    displayedText,
    showTabs,
    showImageGenerationUI,
    selectedImage,
    selectedFormat,
    error,
    selectedReferenceImages,
    referenceImageUploadedFiles,
    showUploadField,
    isGeneratingMultipleImages,
    showAIGenerationMessage,
    displayedGenerationMessage,
    displayedCompletionMessage,
    generatedImages,
    generatedAdContent,
    isGeneratingAdContent,
    closePreview,
    setSelectedImage,
    setSelectedFormat,
    setShowUploadField,
    setSelectedReferenceImages,
    setReferenceImageUploadedFiles,
    setError,
    setShowImageGenerationUI,
    generateMultipleImages
  } = useImageGenerator();

  const handleContinueWithoutImages = () => {
    setSelectedReferenceImages([]);
    setReferenceImageUploadedFiles([]);
    setShowImageGenerationUI(true);
    generateMultipleImages();
  };

  const handleUseSelectedImages = () => {
    setShowImageGenerationUI(true);
    generateMultipleImages();
  };

  const handleImageClick = (image: string, format: string) => {
    setSelectedImage(image);
    setSelectedFormat(format);
  };

  return (
    <div className="container mx-auto max-w-6xl py-12 px-4">
      <ImagePreviewModal 
        selectedImage={selectedImage}
        selectedFormat={selectedFormat}
        onClose={closePreview}
      />

      <div className="max-w-5xl mx-auto">
        {!showImageGenerationUI && (
          <AIMessage 
            isLoading={isLoading}
            displayedText={displayedText}
          />
        )}

        {error && (
          <div className="bg-red-900/20 border border-red-900 rounded-lg p-3 mb-6 mx-auto max-w-xl">
            <p className="text-red-500 text-sm">{error}</p>
          </div>
        )}

        {showTabs && !showImageGenerationUI && (
          <ReferenceImagesUpload
            showUploadField={showUploadField}
            selectedReferenceImages={selectedReferenceImages}
            setShowUploadField={setShowUploadField}
            setSelectedReferenceImages={(value) => setSelectedReferenceImages(
              typeof value === 'function' ? value(selectedReferenceImages) : value
            )}
            setReferenceImageUploadedFiles={(value) => setReferenceImageUploadedFiles(
              typeof value === 'function' ? value(referenceImageUploadedFiles) : value
            )}
            setError={setError}
            onContinueWithoutImages={handleContinueWithoutImages}
            onUseSelectedImages={handleUseSelectedImages}
          />
        )}

        {showAIGenerationMessage && showImageGenerationUI && (
          <div className="mb-8 animate-fadeIn">
            <AIMessage 
              isLoading={false}
              displayedText=""
              isGeneratingMultipleImages={isGeneratingMultipleImages}
              displayedGenerationMessage={displayedGenerationMessage}
              displayedCompletionMessage={displayedCompletionMessage}
            />
          </div>
        )}

        {showImageGenerationUI && (
          <ImageGenerationGrid
            isGeneratingMultipleImages={isGeneratingMultipleImages}
            generatedImages={generatedImages}
            generatedAdContent={generatedAdContent}
            isGeneratingAdContent={isGeneratingAdContent}
            onImageClick={handleImageClick}
          />
        )}

        {showImageGenerationUI && (
          <div className="hidden">
            <Tabs defaultValue="social" className="w-full">
              <TabsList className="grid w-full grid-cols-3 mb-8">
                <TabsTrigger value="social">Social Media</TabsTrigger>
                <TabsTrigger value="product">Product Images</TabsTrigger>
                <TabsTrigger value="branding">Branding</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        )}
      </div>
    </div>
  );
}