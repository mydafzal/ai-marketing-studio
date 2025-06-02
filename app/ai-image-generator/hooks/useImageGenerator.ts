"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { generateImages } from '@/app/actions/generate-image';
import { AspectRatio } from '@/app/actions/generate-image';
import { CompanyInfo, GeneratedImages, GeneratedAdContent, ImageGeneratorState } from '../types';

export function useImageGenerator() {
  const router = useRouter();
  
  const [state, setState] = useState<ImageGeneratorState>({
    isLoading: true,
    isGeneratingImage: false,
    displayedText: "",
    fullMessage: "",
    companyInfo: {
      name: "",
      description: "",
      segment: "",
      brandColors: [],
      websiteImages: []
    },
    showTabs: false,
    showImageGenerationUI: false,
    generatedImages: {
      social: [],
      product: [],
      branding: []
    },
    generatedAdContent: {
      social: null,
      product: null,
      branding: null
    },
    selectedImage: null,
    selectedFormat: null,
    error: null,
    selectedReferenceImages: [],
    showReferenceImages: false,
    referenceImageUploadedFiles: [],
    isUploadingImage: false,
    showUploadField: false,
    isGeneratingMultipleImages: false,
    showAIGenerationMessage: false,
    completionMessage: "",
    isTypingCompletionMessage: false,
    displayedCompletionMessage: "",
    generationMessage: "",
    isTypingGenerationMessage: false,
    displayedGenerationMessage: "",
    isGeneratingAdContent: false
  });

  // Fetch welcome message from the API
  useEffect(() => {
    const fetchWelcomeMessage = async () => {
      try {
        const response = await fetch('/api/generate-welcome-message', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          }
        });
        
        if (!response.ok) {
          throw new Error('Failed to fetch welcome message');
        }
        
        const data = await response.json();
        setState(prev => ({
          ...prev,
          fullMessage: data.message,
          companyInfo: {
            name: data.companyInfo.name,
            description: data.companyInfo.description,
            segment: data.companyInfo.segment,
            brandColors: data.companyInfo.brandColors || [],
            websiteImages: data.companyInfo.websiteImages || []
          },
          isLoading: false
        }));
      } catch (error) {
        console.error('Error fetching welcome message:', error);
        setState(prev => ({
          ...prev,
          fullMessage: "Great — I now have a basic understanding of your product and target audience. Let me create some eye-catching images that will help promote your business!",
          isLoading: false
        }));
      }
    };
    
    fetchWelcomeMessage();
  }, []);

  // Type-writer effect for the AI message
  useEffect(() => {
    if (!state.isLoading && state.fullMessage) {
      let i = 0;
      const typingInterval = setInterval(() => {
        if (i < state.fullMessage.length) {
          setState(prev => ({
            ...prev,
            displayedText: state.fullMessage.substring(0, i + 1)
          }));
          i++;
        } else {
          clearInterval(typingInterval);
          setTimeout(() => {
            setState(prev => ({ ...prev, showTabs: true }));
          }, 500);
        }
      }, 20);

      return () => clearInterval(typingInterval);
    }
  }, [state.isLoading, state.fullMessage]);
  
  // Type-writer effect for the generation message
  useEffect(() => {
    if (state.isTypingGenerationMessage && state.generationMessage) {
      let i = 0;
      setState(prev => ({ ...prev, displayedGenerationMessage: "" }));
      
      const typingInterval = setInterval(() => {
        if (i < state.generationMessage.length) {
          setState(prev => ({
            ...prev,
            displayedGenerationMessage: state.generationMessage.substring(0, i + 1)
          }));
          i++;
        } else {
          clearInterval(typingInterval);
          setState(prev => ({ ...prev, isTypingGenerationMessage: false }));
        }
      }, 20);

      return () => clearInterval(typingInterval);
    }
  }, [state.isTypingGenerationMessage, state.generationMessage]);
  
  // Type-writer effect for the completion message
  useEffect(() => {
    if (state.isTypingCompletionMessage && state.completionMessage) {
      let i = 0;
      setState(prev => ({ ...prev, displayedCompletionMessage: "" }));
      
      const typingInterval = setInterval(() => {
        if (i < state.completionMessage.length) {
          setState(prev => ({
            ...prev,
            displayedCompletionMessage: state.completionMessage.substring(0, i + 1)
          }));
          i++;
        } else {
          clearInterval(typingInterval);
          setState(prev => ({ ...prev, isTypingCompletionMessage: false }));
        }
      }, 20);

      return () => clearInterval(typingInterval);
    }
  }, [state.isTypingCompletionMessage, state.completionMessage]);

  // Function to generate ad content for a specific campaign type
  const generateAdContent = async (campaignType: string) => {
    try {
      const response = await fetch('/api/generate-ad-content', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          companyInfo: state.companyInfo,
          campaignType
        })
      });

      const data = await response.json();
      
      if (data.success && data.adContent) {
        return data.adContent;
      }
      return null;
    } catch (error) {
      console.error(`Error generating ad content for ${campaignType}:`, error);
      return null;
    }
  };

  // Function to generate all ad content and return results
  const generateAllAdContent = async () => {
    try {
      const campaignTypes = ['social', 'product', 'branding'];
      const adContentPromises = campaignTypes.map(type => generateAdContent(type));
      const adContentResults = await Promise.all(adContentPromises);
      
      // Create the ad content object
      const generatedAdContent = {
        social: adContentResults[0],
        product: adContentResults[1],
        branding: adContentResults[2]
      };
      
      return generatedAdContent;
    } catch (error) {
      console.error('Error generating ad content:', error);
      return {
        social: null,
        product: null,
        branding: null
      };
    }
  };

  // Function to generate images
  const handleGenerateImage = async (format: string, aspectRatio: AspectRatio) => {
    setState(prev => ({ ...prev, isGeneratingImage: true, error: null }));
    
    const fallbackToStandardGeneration = async () => {
      console.log("Using standard image generation without references");
      
      try {
        const companyDesc = state.companyInfo.description || "professional business";
        const companyName = state.companyInfo.name || "the business";
        const industryType = state.companyInfo.segment || "business";
        
        const brandColors = state.companyInfo.brandColors.length > 0 
          ? `Use brand colors: ${state.companyInfo.brandColors.slice(0, 3).join(', ')}. ` 
          : '';
        
        let prompt = "";
        
        if (format === "social") {
          prompt = `Create a modern, professional ${aspectRatio} social media ad image for ${companyName}. ${companyDesc.substring(0, 100)}. ${brandColors}Style: clean, eye-catching, suitable for ${industryType} industry. Include empty space for text overlay.`;
        } else if (format === "product") {
          prompt = `Create a polished ${aspectRatio} product showcase image for ${companyName}. ${companyDesc.substring(0, 100)}. ${brandColors}Style: professional, highlighting quality and value. Suitable for ${industryType} industry advertising.`;
        } else if (format === "branding") {
          prompt = `Create a sophisticated ${aspectRatio} branding image for ${companyName}. ${companyDesc.substring(0, 100)}. ${brandColors}Style: corporate, trustworthy, reflecting the ${industryType} industry. Include empty space for logo placement.`;
        }
        
        console.log(`Generating ${format} image with standard generation`);
        console.log(`Using prompt: ${prompt}`);
        
        const result = await generateImages(prompt, aspectRatio);
        
        if (result.success && result.images && result.images.length > 0) {
          console.log(`Successfully generated ${result.images.length} image(s) in standard mode`);
          
          const taggedImages = result.images.map((img: string) => {
            return img + `#${format}-${aspectRatio}`;
          });
          
          return taggedImages;
        } else {
          throw new Error(result.error || "Failed to generate image");
        }
      } catch (fallbackError) {
        console.error("Error in fallback generation:", fallbackError);
        throw fallbackError;
      }
    };
    
    try {
      const companyDesc = state.companyInfo.description || "professional business";
      const companyName = state.companyInfo.name || "the business";
      const industryType = state.companyInfo.segment || "business";
      
      const brandColors = state.companyInfo.brandColors.length > 0 
        ? `Use brand colors: ${state.companyInfo.brandColors.slice(0, 3).join(', ')}. ` 
        : '';
      
      let prompt = "";
      
      if (format === "social") {
        prompt = `Create a modern, professional ${aspectRatio} social media ad image for ${companyName}. ${companyDesc.substring(0, 100)}. ${brandColors}Style: clean, eye-catching, suitable for ${industryType} industry. Include empty space for text overlay.`;
      } else if (format === "product") {
        prompt = `Create a polished ${aspectRatio} product showcase image for ${companyName}. ${companyDesc.substring(0, 100)}. ${brandColors}Style: professional, highlighting quality and value. Suitable for ${industryType} industry advertising.`;
      } else if (format === "branding") {
        prompt = `Create a sophisticated ${aspectRatio} branding image for ${companyName}. ${companyDesc.substring(0, 100)}. ${brandColors}Style: corporate, trustworthy, reflecting the ${industryType} industry. Include empty space for logo placement.`;
      }
      
      console.log(`Generating ${format} image with aspect ratio ${aspectRatio}`);
      console.log(`Using prompt: ${prompt}`);
      console.log(`Reference images: ${state.selectedReferenceImages.length}`);
      
      const startTime = Date.now();
      
      if (state.selectedReferenceImages.length > 0) {
        try {
          console.log("Attempting generation with reference images");
          
          const result = await generateImages(
            prompt, 
            aspectRatio
          );
          
          if (result.success && result.images && result.images.length > 0) {
            console.log(`Successfully generated ${result.images.length} image(s) with references in ${((Date.now() - startTime) / 1000).toFixed(1)}s`);
            
            const taggedImages = result.images.map((img: string) => {
              return img + `#${format}-${aspectRatio}`;
            });
            
            return taggedImages;
          } else {
            console.log("Reference generation failed, falling back to standard generation");
            return await fallbackToStandardGeneration();
          }
        } catch (referenceError) {
          console.error("Error with reference images, falling back:", referenceError);
          return await fallbackToStandardGeneration();
        }
      } else {
        return await fallbackToStandardGeneration();
      }
      
    } catch (error) {
      console.error("Error generating image:", error);
      throw error;
    } finally {
      setState(prev => ({ ...prev, isGeneratingImage: false }));
    }
  };

  // Function to generate multiple 1:1 images automatically
  const generateMultipleImages = async () => {
    setState(prev => ({
      ...prev,
      isGeneratingMultipleImages: true,
      showAIGenerationMessage: true,
      error: null
    }));
    
    const genMessage = `I'm creating 3 stunning campaign options for you! Each includes a custom image and tailored ad copy. This will take 1-2 minutes. I'm using all your brand information and ${state.selectedReferenceImages.length > 0 ? 'reference images' : 'style preferences'} to make these perfect for your needs.`;
    setState(prev => ({
      ...prev,
      generationMessage: genMessage,
      isTypingGenerationMessage: true
    }));
    
    try {
      // Clear previous results
      setState(prev => ({
        ...prev,
        generatedImages: {
          social: [],
          product: [],
          branding: []
        },
        generatedAdContent: {
          social: null,
          product: null,
          branding: null
        }
      }));
      
      const imageTypes = ["social", "product", "branding"];
      const aspectRatio: AspectRatio = "1:1";
      
      // Generate both images and ad content in parallel
      const [imageResults, adContentResults] = await Promise.all([
        Promise.all(imageTypes.map(type => handleGenerateImage(type, aspectRatio))),
        generateAllAdContent()
      ]);
      
      // Update state with both images and ad content at the same time
      setState(prev => ({
        ...prev,
        generatedImages: {
          social: imageResults[0] || [],
          product: imageResults[1] || [],
          branding: imageResults[2] || []
        },
        generatedAdContent: adContentResults
      }));
      
      console.log("Successfully generated all images and ad content");
      
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setState(prev => ({
        ...prev,
        completionMessage: "Your campaign options are ready! Each includes a custom image with headline and ad text. Feel free to download any images or copy the ad content you like.",
        isTypingCompletionMessage: true
      }));
    } catch (error) {
      console.error("Error generating multiple images:", error);
      setState(prev => ({ ...prev, error: "There was an error generating your campaigns. Please try again." }));
    } finally {
      setState(prev => ({ ...prev, isGeneratingMultipleImages: false }));
    }
  };
  
  const closePreview = () => {
    setState(prev => ({ ...prev, selectedImage: null, selectedFormat: null }));
  };

  const setSelectedImage = (image: string) => {
    setState(prev => ({ ...prev, selectedImage: image }));
  };

  const setSelectedFormat = (format: string) => {
    setState(prev => ({ ...prev, selectedFormat: format }));
  };

  const setShowUploadField = (show: boolean) => {
    setState(prev => ({ ...prev, showUploadField: show }));
  };

  const setSelectedReferenceImages = (images: string[]) => {
    setState(prev => ({ ...prev, selectedReferenceImages: images }));
  };

  const setReferenceImageUploadedFiles = (files: File[]) => {
    setState(prev => ({ ...prev, referenceImageUploadedFiles: files }));
  };

  const setError = (error: string | null) => {
    setState(prev => ({ ...prev, error }));
  };

  const setShowImageGenerationUI = (show: boolean) => {
    setState(prev => ({ ...prev, showImageGenerationUI: show }));
  };

  return {
    ...state,
    handleGenerateImage,
    generateMultipleImages,
    closePreview,
    setSelectedImage,
    setSelectedFormat,
    setShowUploadField,
    setSelectedReferenceImages,
    setReferenceImageUploadedFiles,
    setError,
    setShowImageGenerationUI
  };
} 