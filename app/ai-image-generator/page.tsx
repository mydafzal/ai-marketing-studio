"use client";

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, ImageIcon, Download, ExternalLink } from 'lucide-react';
import { generateImages } from '@/app/actions/generate-image';
import { AspectRatio } from '@/app/actions/generate-image';
import Image from 'next/image';
import { useRouter } from 'next/navigation';

export default function AIImageGeneratorPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [displayedText, setDisplayedText] = useState("");
  const [fullMessage, setFullMessage] = useState("");
  const [companyInfo, setCompanyInfo] = useState({
    name: "",
    description: "",
    segment: "",
    brandColors: [],
    websiteImages: []
  });
  
  // Add animation styles to the global scope
  useEffect(() => {
    // Add the fadeIn animation if it doesn't exist
    if (!document.getElementById('fadeInAnimation')) {
      const style = document.createElement('style');
      style.id = 'fadeInAnimation';
      style.innerHTML = `
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out forwards;
        }
      `;
      document.head.appendChild(style);
    }
    
    return () => {
      // Clean up on component unmount
      const styleElement = document.getElementById('fadeInAnimation');
      if (styleElement) {
        styleElement.remove();
      }
    };
  }, []);
  const [showTabs, setShowTabs] = useState(false);
  const [showImageGenerationUI, setShowImageGenerationUI] = useState(false);
  const [generatedImages, setGeneratedImages] = useState<Record<string, string[]>>({
    social: [],
    product: [],
    branding: []
  });
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [selectedFormat, setSelectedFormat] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedReferenceImages, setSelectedReferenceImages] = useState<string[]>([]);
  const [showReferenceImages, setShowReferenceImages] = useState(false);
  const [referenceImageUploadedFiles, setReferenceImageUploadedFiles] = useState<File[]>([]);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [showUploadField, setShowUploadField] = useState(false);
  const [isGeneratingMultipleImages, setIsGeneratingMultipleImages] = useState(false);
  const [showAIGenerationMessage, setShowAIGenerationMessage] = useState(false);
  const [completionMessage, setCompletionMessage] = useState("");
  const [isTypingCompletionMessage, setIsTypingCompletionMessage] = useState(false);
  const [displayedCompletionMessage, setDisplayedCompletionMessage] = useState("");
  const [generationMessage, setGenerationMessage] = useState("");
  const [isTypingGenerationMessage, setIsTypingGenerationMessage] = useState(false);
  const [displayedGenerationMessage, setDisplayedGenerationMessage] = useState("");

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
        setFullMessage(data.message);
        setCompanyInfo({
          name: data.companyInfo.name,
          description: data.companyInfo.description,
          segment: data.companyInfo.segment,
          brandColors: data.companyInfo.brandColors || [],
          websiteImages: data.companyInfo.websiteImages || []
        });
        setIsLoading(false);
      } catch (error) {
        console.error('Error fetching welcome message:', error);
        setFullMessage("Great — I now have a basic understanding of your product and target audience. Let me create some eye-catching images that will help promote your business!");
        setIsLoading(false);
      }
    };
    
    fetchWelcomeMessage();
  }, []);

  // Type-writer effect for the AI message
  useEffect(() => {
    if (!isLoading && fullMessage) {
      let i = 0;
      const typingInterval = setInterval(() => {
        if (i < fullMessage.length) {
          setDisplayedText(fullMessage.substring(0, i + 1));
          i++;
        } else {
          clearInterval(typingInterval);
          // Show tabs after message is fully typed
          setTimeout(() => {
            setShowTabs(true);
          }, 500);
        }
      }, 20);

      return () => clearInterval(typingInterval);
    }
  }, [isLoading, fullMessage]);
  
  // Type-writer effect for the generation message
  useEffect(() => {
    if (isTypingGenerationMessage && generationMessage) {
      let i = 0;
      setDisplayedGenerationMessage(""); // Reset displayed text
      
      const typingInterval = setInterval(() => {
        if (i < generationMessage.length) {
          setDisplayedGenerationMessage(generationMessage.substring(0, i + 1));
          i++;
        } else {
          clearInterval(typingInterval);
          setIsTypingGenerationMessage(false);
        }
      }, 20);

      return () => clearInterval(typingInterval);
    }
  }, [isTypingGenerationMessage, generationMessage]);
  
  // Type-writer effect for the completion message
  useEffect(() => {
    if (isTypingCompletionMessage && completionMessage) {
      let i = 0;
      setDisplayedCompletionMessage(""); // Reset displayed text
      
      const typingInterval = setInterval(() => {
        if (i < completionMessage.length) {
          setDisplayedCompletionMessage(completionMessage.substring(0, i + 1));
          i++;
        } else {
          clearInterval(typingInterval);
          setIsTypingCompletionMessage(false);
        }
      }, 20);

      return () => clearInterval(typingInterval);
    }
  }, [isTypingCompletionMessage, completionMessage]);

  // Function to generate images
  const handleGenerateImage = async (format: string, aspectRatio: AspectRatio) => {
    setIsGeneratingImage(true);
    setError(null);
    
    // Function for standard generation without references - MOVED OUTSIDE AND DEFINED AS ARROW FUNCTION
    const fallbackToStandardGeneration = async () => {
      console.log("Using standard image generation without references");
      
      try {
        // Create reference to the prompt from outer scope
        const companyDesc = companyInfo.description || "professional business";
        const companyName = companyInfo.name || "the business";
        const industryType = companyInfo.segment || "business";
        
        // Extract brand colors and create a color directive for the prompt
        const brandColors = companyInfo.brandColors.length > 0 
          ? `Use brand colors: ${companyInfo.brandColors.slice(0, 3).join(', ')}. ` 
          : '';
        
        // Format-specific prompts with enhanced brand context
        let prompt = "";
        
        if (format === "social") {
          prompt = `Create a modern, professional ${aspectRatio} social media ad image for ${companyName}. ${companyDesc.substring(0, 100)}. ${brandColors}Style: clean, eye-catching, suitable for ${industryType} industry. Include empty space for text overlay.`;
        } else if (format === "product") {
          prompt = `Create a polished ${aspectRatio} product showcase image for ${companyName}. ${companyDesc.substring(0, 100)}. ${brandColors}Style: professional, highlighting quality and value. Suitable for ${industryType} industry advertising.`;
        } else if (format === "branding") {
          prompt = `Create a sophisticated ${aspectRatio} branding image for ${companyName}. ${companyDesc.substring(0, 100)}. ${brandColors}Style: corporate, trustworthy, reflecting the ${industryType} industry. Include empty space for logo placement.`;
        }
        
        // Enhance the prompt with additional brand context if available
        let enhancedPrompt = prompt;
        
        // If we have brand colors but no reference images, emphasize the colors more
        if (companyInfo.brandColors.length > 0) {
          enhancedPrompt += ` Make sure to prominently feature the brand colors: ${companyInfo.brandColors.join(', ')}.`;
        }
        
        // Track generation start time for analytics
        const startTime = Date.now();
        
        const result = await generateImages(enhancedPrompt, aspectRatio, 1);
        
        if (result.success && result.images && result.images.length > 0) {
          console.log(`Successfully generated ${result.images.length} image(s) without reference in ${((Date.now() - startTime) / 1000).toFixed(1)}s`);
          
          // Store the generated image with format and aspectRatio info in the URL
          const taggedImages = result.images.map((img: string) => {
            return img + `#${format}-${aspectRatio}`;
          });
          
          // Store the generated image
          setGeneratedImages(prev => ({
            ...prev,
            [format]: [...(prev[format] || []), ...taggedImages]
          }));
          
          // Clear any temporary error message that might have been set
          setError(null);
        } else {
          setError(result.error || "Failed to generate image. Please try again.");
        }
      } catch (fallbackError) {
        console.error("Error in fallback generation:", fallbackError);
        setError("Failed to generate image. Please try again with different settings.");
      }
    };
    
    try {
      // Create a prompt based on company information
      const companyDesc = companyInfo.description || "professional business";
      const companyName = companyInfo.name || "the business";
      const industryType = companyInfo.segment || "business";
      
      // Extract brand colors and create a color directive for the prompt
      const brandColors = companyInfo.brandColors.length > 0 
        ? `Use brand colors: ${companyInfo.brandColors.slice(0, 3).join(', ')}. ` 
        : '';
      
      // Format-specific prompts with enhanced brand context
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
      console.log(`Reference images: ${selectedReferenceImages.length}`);
      
      // Track generation start time for analytics
      const startTime = Date.now();
      
      // APPROACH 1: Use reference images if available
      if (selectedReferenceImages.length > 0) {
        try {
          console.log("Using reference images for generation:", selectedReferenceImages.length);
          
          // Use image variation API with reference images
          const result = await fetch('/api/generate-image/variation', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              prompt,
              referenceImages: selectedReferenceImages,
              aspectRatio
            })
          });
          
          const data = await result.json();
          
          if (data.success && data.images && data.images.length > 0) {
            console.log(`Successfully generated ${data.images.length} image(s) with reference in ${((Date.now() - startTime) / 1000).toFixed(1)}s`);
            
            // Store the generated image with format and aspectRatio info in the URL for later filtering
            const taggedImages = data.images.map((img: string) => {
              // Add format and aspect ratio as URL parameters to help identify images later
              // This is a hack since we're using data URLs, but it works for our internal tracking
              return img + `#${format}-${aspectRatio}`;
            });
            
            // Store the generated image
            setGeneratedImages(prev => ({
              ...prev,
              [format]: [...(prev[format] || []), ...taggedImages]
            }));
          } else {
            console.error("API returned error:", data.error);
            throw new Error(data.error || "Failed to generate image with references");
          }
        } catch (error) {
          console.error("Error with reference image generation:", error);
          
          // Show a user-friendly error but still try the fallback
          setError("There was an issue using your reference images. Trying standard generation...");
          
          // Fall back to standard generation if reference-based fails
          await fallbackToStandardGeneration();
        }
      } 
      // APPROACH 2: Use standard generation with brand info from the profile
      else {
        await fallbackToStandardGeneration();
      }
      
    } catch (error) {
      console.error("Error generating image:", error);
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setIsGeneratingImage(false);
    }
  };

  // Function to generate multiple 1:1 images automatically
  const generateMultipleImages = async () => {
    setIsGeneratingMultipleImages(true);
    setShowAIGenerationMessage(true);
    setError(null);
    
    // Set generation message and start typing effect
    const genMessage = `I'm creating 3 stunning 1:1 square format images for you! Grab a quick coffee or stretch your legs - this will take 1-2 minutes. I'm using all the brand information and ${selectedReferenceImages.length > 0 ? 'reference images' : 'style preferences'} to make these perfect for your needs.`;
    setGenerationMessage(genMessage);
    setIsTypingGenerationMessage(true);
    
    try {
      // Clear any existing images
      setGeneratedImages({
        social: [],
        product: [],
        branding: []
      });
      
      // Generate 3 different 1:1 square images
      const imageTypes = ["social", "product", "branding"];
      const aspectRatio: AspectRatio = "1:1";
      
      // Generate the images in parallel
      const promises = imageTypes.map(type => handleGenerateImage(type, aspectRatio));
      
      // Wait for all image generations to complete
      await Promise.all(promises);
      
      console.log("Successfully generated all images");
      
      // Add a small delay before indicating completion
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Set completion message and start typing effect
      setCompletionMessage("Your images are ready! Feel free to download any you like or generate more variations.");
      setIsTypingCompletionMessage(true);
    } catch (error) {
      console.error("Error generating multiple images:", error);
      setError("There was an error generating your images. Please try again.");
    } finally {
      setIsGeneratingMultipleImages(false);
    }
  };
  
  // Function to close image preview
  const closePreview = () => {
    setSelectedImage(null);
    setSelectedFormat(null);
  };

  // Function to redirect to facebook connect after first image generation
  useEffect(() => {
    const imageCount = Object.values(generatedImages).flat().length;
    if (imageCount === 1) {
      // First image was just generated - set a timeout to redirect
      const timer = setTimeout(() => {
        router.push('/facebook-connect');
      }, 8000); // 8 seconds to view the image
      
      return () => clearTimeout(timer);
    }
  }, [generatedImages, router]);

  return (
    <div className="container mx-auto max-w-6xl py-12 px-4">
      {/* Image Preview Modal */}
      {selectedImage && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 sm:p-8" onClick={closePreview}>
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
                onClick={closePreview}
                className="bg-white text-gray-800 rounded-md py-2 px-4 font-medium shadow hover:bg-gray-50"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Page headline removed as requested */}

      <div className="max-w-5xl mx-auto">
        {/* AI Message with Animated Color Blob - Only show when not in image generation mode */}
        {!showImageGenerationUI && (
          <div className="flex justify-center mb-10">
            <div className="flex items-start max-w-xl w-full">
              <div className="mr-4 flex-shrink-0">
                {/* Enhanced Color Blob */}
                <div className="w-14 h-14 rounded-full flex items-center justify-center relative overflow-hidden shadow-[0_0_20px_rgba(75,242,156,0.7)]">
                  <div 
                    className="absolute inset-0 bg-gradient-to-br from-[#4BF29C] via-[#35d6ff] to-[#0a84ff]" 
                    style={{
                      animation: "pulse 2.5s cubic-bezier(0.4, 0, 0.6, 1) infinite, gradient 6s ease infinite",
                      backgroundSize: "300% 300%"
                    }}
                  ></div>
                  <div 
                    className="absolute inset-0" 
                    style={{
                      background: "radial-gradient(circle at 30% 30%, rgba(255,255,255,0.9), transparent 45%)",
                      animation: "rotate 10s linear infinite, shimmer 3s ease-in-out infinite"
                    }}
                  ></div>
                  <div 
                    className="absolute inset-0" 
                    style={{
                      background: "linear-gradient(45deg, transparent 40%, rgba(255,255,255,0.95) 48%, rgba(255,255,255,0.95) 52%, transparent 60%)",
                      backgroundSize: "400% 400%",
                      animation: "shimmer 2s ease-in-out infinite, rotate 8s linear infinite reverse"
                    }}
                  ></div>
                  <div 
                    className="absolute inset-0" 
                    style={{
                      background: "linear-gradient(-60deg, transparent 75%, rgba(255,255,255,0.8) 80%, rgba(255,255,255,0.9) 85%, transparent 90%)",
                      backgroundSize: "200% 200%",
                      animation: "shimmer 3.5s ease-in-out infinite 0.5s, rotate 12s linear infinite"
                    }}
                  ></div>
                  <div 
                    className="absolute inset-[2px] rounded-full"
                    style={{
                      background: "radial-gradient(circle at center, rgba(255,255,255,0.5) 0%, transparent 70%)",
                      animation: "pulse 2s ease-in-out infinite alternate"
                    }}
                  ></div>
                </div>
              </div>
              <div className="bg-[#1A1D29] rounded-lg p-5 shadow flex-grow">
                <div className="text-white text-base typing-container relative" 
                   style={{ 
                     whiteSpace: "pre-wrap", 
                     minHeight: "24px",
                     wordBreak: "keep-all",
                     overflowWrap: "break-word",
                     hyphens: "none",
                     lineHeight: "1.5"
                   }}>
                  {isLoading ? (
                    <div className="flex items-center">
                      <Loader2 className="w-4 h-4 mr-2 animate-spin text-[#4BF29C]" />
                      <span>Analyzing your business profile...</span>
                    </div>
                  ) : (
                    <span className="typing-text">
                      {displayedText.split(/(\s+)/).map((word, wordIndex) => (
                        <span 
                          key={wordIndex} 
                          className="word-span"
                          style={{
                            display: 'inline-block',
                            whiteSpace: 'pre-wrap'
                          }}
                        >
                          {word.split('').map((char, charIndex) => (
                            <span 
                              key={`${wordIndex}-${charIndex}`} 
                              style={{ 
                                display: 'inline'
                              }}
                            >{char}</span>
                          ))}
                        </span>
                      ))}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Error message */}
        {error && (
          <div className="bg-red-900/20 border border-red-900 rounded-lg p-3 mb-6 mx-auto max-w-xl">
            <p className="text-red-500 text-sm">{error}</p>
          </div>
        )}

        {/* Reference Images Section - Only show after message is typed */}
        {showTabs && !showImageGenerationUI && (
          <div className="mt-6 mb-4 animate-fadeIn">
            <div className="bg-[#1A1D29] rounded-lg p-4 border border-gray-700 max-w-xl mx-auto">
              <div className="flex flex-row gap-3 justify-center">
                <Button
                  onClick={() => {
                    const wasVisible = showUploadField;
                    
                    // If it was already visible (and we're toggling off)
                    if (wasVisible) {
                      // Clear any selected images
                      setSelectedReferenceImages([]);
                      setReferenceImageUploadedFiles([]);
                      // Clear any errors
                      setError(null);
                      // Hide the upload field
                      setShowUploadField(false);
                    } else {
                      // Show the upload field
                      setShowUploadField(true);
                      
                      // Use a longer timeout to ensure the field is fully rendered before opening the file dialog
                      // This improves browser compatibility
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
                  }}
                  className={`${showUploadField 
                    ? "bg-transparent border border-[#4BF29C] text-[#4BF29C] hover:bg-[#4BF29C]/10" 
                    : "bg-[#4BF29C] text-black hover:bg-[#3bd283]"} 
                    py-1.5 h-9 px-4`}
                >
                  <ImageIcon className="w-3.5 h-3.5 mr-2" />
                  {showUploadField ? 'Cancel Upload' : 'Upload Reference Images'}
                </Button>
                <Button
                  onClick={() => {
                    // Show the image generation UI without reference images
                    setSelectedReferenceImages([]);
                    setReferenceImageUploadedFiles([]);
                    setShowImageGenerationUI(true);
                    // Start generating images automatically
                    generateMultipleImages();
                  }}
                  className="bg-transparent border border-[#4BF29C] text-[#4BF29C] hover:bg-[#4BF29C]/10 py-1.5 h-9 px-4"
                >
                  Continue Without Images
                </Button>
              </div>
              
              {/* File upload field - only show when Upload button is clicked */}
              {showUploadField && (
                <div className="mt-4 animate-fadeIn">
                  <h3 className="text-sm font-medium text-white mb-2 flex items-center">
                    <ImageIcon className="w-3 h-3 mr-1.5 text-[#4BF29C]" />
                    Select 1-4 Reference Images
                  </h3>
                  
                  {/* File drop zone */}
                  <div 
                    className="border-2 border-dashed border-gray-600 rounded-lg p-4 text-center cursor-pointer hover:border-[#4BF29C] transition-colors"
                    onClick={() => document.getElementById('file-upload')?.click()}
                    onDragOver={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                    }}
                    onDrop={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      
                      try {
                        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                          const files = Array.from(e.dataTransfer.files).slice(0, 4);
                          setReferenceImageUploadedFiles(files);
                          
                          // Check if files are images
                          const validImageTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'];
                          const allFilesAreImages = files.every(file => validImageTypes.includes(file.type));
                          
                          if (!allFilesAreImages) {
                            setError("Please upload only image files (JPG, PNG, GIF, WebP, SVG).");
                            setReferenceImageUploadedFiles([]);
                            return;
                          }
                          
                          // Convert files to data URLs for preview
                          const promises = files.map(file => {
                            return new Promise<string>((resolve, reject) => {
                              const reader = new FileReader();
                              reader.onloadend = () => {
                                if (reader.result) {
                                  resolve(reader.result as string);
                                } else {
                                  reject(new Error("Failed to read file"));
                                }
                              };
                              reader.onerror = () => {
                                reject(new Error("Error reading file"));
                              };
                              reader.readAsDataURL(file);
                            });
                          });
                          
                          Promise.all(promises)
                            .then(urls => {
                              setSelectedReferenceImages(urls);
                              console.log("Images loaded via drag and drop:", urls.length);
                              // Clear any previous errors
                              setError(null);
                            })
                            .catch(error => {
                              console.error("Error loading dragged images:", error);
                              setError("There was an error loading your images. Please try again.");
                            });
                        }
                      } catch (error) {
                        console.error("Error processing dragged files:", error);
                        setError("There was an error processing your files. Please try again.");
                      }
                    }}
                  >
                    <input
                      id="file-upload"
                      type="file"
                      accept="image/*"
                      multiple
                      className="hidden"
                      onClick={(e) => {
                        // Reset the input value to ensure onChange fires even if the same file is selected
                        (e.target as HTMLInputElement).value = '';
                      }}
                      onChange={(e) => {
                        if (e.target.files && e.target.files.length > 0) {
                          try {
                            const files = Array.from(e.target.files).slice(0, 4);
                            
                            // Check if files are images
                            const validImageTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'];
                            const allFilesAreImages = files.every(file => validImageTypes.includes(file.type));
                            
                            if (!allFilesAreImages) {
                              setError("Please upload only image files (JPG, PNG, GIF, WebP, SVG).");
                              setReferenceImageUploadedFiles([]);
                              return;
                            }
                            
                            setReferenceImageUploadedFiles(files);
                            
                            // Convert files to data URLs for preview
                            const promises = files.map(file => {
                              return new Promise<string>((resolve, reject) => {
                                const reader = new FileReader();
                                reader.onloadend = () => {
                                  if (reader.result) {
                                    resolve(reader.result as string);
                                  } else {
                                    reject(new Error("Failed to read file"));
                                  }
                                };
                                reader.onerror = () => {
                                  reject(new Error("Error reading file"));
                                };
                                reader.readAsDataURL(file);
                              });
                            });
                            
                            Promise.all(promises)
                              .then(urls => {
                                setSelectedReferenceImages(urls);
                                console.log("Images loaded:", urls.length);
                                // Clear any previous errors
                                setError(null);
                              })
                              .catch(error => {
                                console.error("Error loading images:", error);
                                // Show an error message to the user
                                setError("There was an error loading your images. Please try again.");
                                // Clear uploaded files state to prevent further issues
                                setReferenceImageUploadedFiles([]);
                              });
                          } catch (error) {
                            console.error("Error processing files:", error);
                            setError("There was an error processing your files. Please try again.");
                          }
                        }
                      }}
                    />
                    
                    {selectedReferenceImages.length > 0 ? (
                      <div>
                        <div className="grid grid-cols-4 gap-2 mb-2">
                          {selectedReferenceImages.map((img, idx) => (
                            <div key={idx} className="relative aspect-square rounded-lg overflow-hidden border border-gray-600">
                              <img 
                                src={img} 
                                alt={`Uploaded reference image ${idx + 1}`} 
                                className="w-full h-full object-cover"
                              />
                              <button
                                className="absolute top-1 right-1 bg-black/70 text-white rounded-full p-0.5 hover:bg-black/90"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedReferenceImages(prev => prev.filter((_, i) => i !== idx));
                                  setReferenceImageUploadedFiles(prev => prev.filter((_, i) => i !== idx));
                                }}
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                  <line x1="18" y1="6" x2="6" y2="18"></line>
                                  <line x1="6" y1="6" x2="18" y2="18"></line>
                                </svg>
                              </button>
                            </div>
                          ))}
                        </div>
                        <p className="text-xs text-[#4BF29C]">
                          {selectedReferenceImages.length} {selectedReferenceImages.length === 1 ? 'image' : 'images'} selected (max 4)
                        </p>
                      </div>
                    ) : (
                      <div>
                        <ImageIcon className="w-6 h-6 text-gray-500 mx-auto mb-1" />
                        <p className="text-xs text-gray-300">Drag & drop images or click to browse</p>
                      </div>
                    )}
                  </div>
                  
                  {/* Action button */}
                  <div className="mt-3 flex justify-center">
                    <Button
                      onClick={() => {
                        // Show the image generation UI with selected reference images
                        setShowImageGenerationUI(true);
                        // Start generating images automatically
                        generateMultipleImages();
                      }}
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
        )}

        {/* AI Generation Message */}
        {showAIGenerationMessage && showImageGenerationUI && (
          <div className="mb-8 animate-fadeIn">
            <div className="flex justify-center">
              <div className="flex items-start max-w-3xl w-full">
                <div className="mr-4 flex-shrink-0">
                  {/* Color Blob */}
                  <div className="w-14 h-14 rounded-full flex items-center justify-center relative overflow-hidden shadow-[0_0_20px_rgba(75,242,156,0.7)]">
                    <div className="absolute inset-0 bg-gradient-to-br from-[#4BF29C] via-[#35d6ff] to-[#0a84ff]" 
                         style={{animation: "pulse 2.5s cubic-bezier(0.4, 0, 0.6, 1) infinite, gradient 6s ease infinite", backgroundSize: "300% 300%"}}></div>
                    <div className="absolute inset-0" 
                         style={{background: "radial-gradient(circle at 30% 30%, rgba(255,255,255,0.9), transparent 45%)", animation: "rotate 10s linear infinite, shimmer 3s ease-in-out infinite"}}></div>
                    <div className="absolute inset-0" 
                         style={{background: "linear-gradient(45deg, transparent 40%, rgba(255,255,255,0.95) 48%, rgba(255,255,255,0.95) 52%, transparent 60%)", backgroundSize: "400% 400%", animation: "shimmer 2s ease-in-out infinite, rotate 8s linear infinite reverse"}}></div>
                    <div className="absolute inset-0" 
                         style={{background: "linear-gradient(-60deg, transparent 75%, rgba(255,255,255,0.8) 80%, rgba(255,255,255,0.9) 85%, transparent 90%)", backgroundSize: "200% 200%", animation: "shimmer 3.5s ease-in-out infinite 0.5s, rotate 12s linear infinite"}}></div>
                    <div className="absolute inset-[2px] rounded-full"
                         style={{background: "radial-gradient(circle at center, rgba(255,255,255,0.5) 0%, transparent 70%)", animation: "pulse 2s ease-in-out infinite alternate"}}></div>
                  </div>
                </div>
                <div className="bg-[#1A1D29] rounded-lg p-5 shadow flex-grow">
                  <div className="text-white text-base typing-container relative" 
                       style={{ 
                         whiteSpace: "pre-wrap", 
                         minHeight: "24px",
                         wordBreak: "keep-all",
                         overflowWrap: "break-word",
                         hyphens: "none",
                         lineHeight: "1.5"
                       }}>
                    {isGeneratingMultipleImages ? (
                      <span className="typing-text">
                        {displayedGenerationMessage.split(/(\s+)/).map((word, wordIndex) => (
                          <span 
                            key={wordIndex} 
                            className="word-span"
                            style={{
                              display: 'inline-block',
                              whiteSpace: 'pre-wrap'
                            }}
                          >
                            {word.split('').map((char, charIndex) => (
                              <span 
                                key={`${wordIndex}-${charIndex}`} 
                                style={{ 
                                  display: 'inline'
                                }}
                              >{char}</span>
                            ))}
                          </span>
                        ))}
                      </span>
                    ) : (
                      <span className="typing-text">
                        {displayedCompletionMessage.split(/(\s+)/).map((word, wordIndex) => (
                          <span 
                            key={wordIndex} 
                            className="word-span"
                            style={{
                              display: 'inline-block',
                              whiteSpace: 'pre-wrap'
                            }}
                          >
                            {word.split('').map((char, charIndex) => (
                              <span 
                                key={`${wordIndex}-${charIndex}`} 
                                style={{ 
                                  display: 'inline'
                                }}
                              >{char}</span>
                            ))}
                          </span>
                        ))}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Image Generation Options */}
        {showImageGenerationUI && (
          <div className="animate-fadeIn">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              {/* Social Media Image Card */}
              <Card className="bg-[#1A1D29] border-gray-700 overflow-hidden">
                <CardContent className="p-0">
                  <div className="aspect-square bg-gray-800 relative">
                    {isGeneratingMultipleImages ? (
                      <div className="w-full h-full flex items-center justify-center animate-pulse bg-gradient-to-br from-gray-800 via-gray-700 to-gray-800">
                        <ImageIcon className="w-10 h-10 text-gray-600 animate-pulse" />
                      </div>
                    ) : (
                      generatedImages.social.some(img => img.includes("social-1:1")) && (
                        <div 
                          className="w-full h-full cursor-pointer group"
                          onClick={() => {
                            const image = generatedImages.social.find(img => img.includes("social-1:1"));
                            if (image) {
                              setSelectedImage(image.split('#')[0]);
                              setSelectedFormat("square");
                            }
                          }}
                        >
                          <img 
                            src={generatedImages.social.find(img => img.includes("social-1:1"))?.split('#')[0]} 
                            alt="Generated social media image"
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
                  <div className="p-3">
                    <h3 className="font-medium text-white">Social Feed Image</h3>
                    <p className="text-xs text-gray-400 mb-2">1:1 square format for social media</p>
                  </div>
                </CardContent>
              </Card>

              {/* Product Image Card */}
              <Card className="bg-[#1A1D29] border-gray-700 overflow-hidden">
                <CardContent className="p-0">
                  <div className="aspect-square bg-gray-800 relative">
                    {isGeneratingMultipleImages ? (
                      <div className="w-full h-full flex items-center justify-center animate-pulse bg-gradient-to-br from-gray-800 via-gray-700 to-gray-800">
                        <ImageIcon className="w-10 h-10 text-gray-600 animate-pulse" />
                      </div>
                    ) : (
                      generatedImages.product.some(img => img.includes("product-1:1")) && (
                        <div 
                          className="w-full h-full cursor-pointer group"
                          onClick={() => {
                            const image = generatedImages.product.find(img => img.includes("product-1:1"));
                            if (image) {
                              setSelectedImage(image.split('#')[0]);
                              setSelectedFormat("square");
                            }
                          }}
                        >
                          <img 
                            src={generatedImages.product.find(img => img.includes("product-1:1"))?.split('#')[0]} 
                            alt="Generated product image"
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
                  <div className="p-3">
                    <h3 className="font-medium text-white">Product Showcase</h3>
                    <p className="text-xs text-gray-400 mb-2">1:1 square format for products</p>
                  </div>
                </CardContent>
              </Card>

              {/* Branding Image Card */}
              <Card className="bg-[#1A1D29] border-gray-700 overflow-hidden">
                <CardContent className="p-0">
                  <div className="aspect-square bg-gray-800 relative">
                    {isGeneratingMultipleImages ? (
                      <div className="w-full h-full flex items-center justify-center animate-pulse bg-gradient-to-br from-gray-800 via-gray-700 to-gray-800">
                        <ImageIcon className="w-10 h-10 text-gray-600 animate-pulse" />
                      </div>
                    ) : (
                      generatedImages.branding.some(img => img.includes("branding-1:1")) && (
                        <div 
                          className="w-full h-full cursor-pointer group"
                          onClick={() => {
                            const image = generatedImages.branding.find(img => img.includes("branding-1:1"));
                            if (image) {
                              setSelectedImage(image.split('#')[0]);
                              setSelectedFormat("square");
                            }
                          }}
                        >
                          <img 
                            src={generatedImages.branding.find(img => img.includes("branding-1:1"))?.split('#')[0]} 
                            alt="Generated branding image"
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
                  <div className="p-3">
                    <h3 className="font-medium text-white">Brand Visual</h3>
                    <p className="text-xs text-gray-400 mb-2">1:1 square format for branding</p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Hidden tabs for backward compatibility - we'll only show the 1:1 images */}
            <div className="hidden">
              <Tabs defaultValue="social" className="w-full">
                <TabsList className="grid w-full grid-cols-3 mb-8">
                  <TabsTrigger value="social">Social Media</TabsTrigger>
                  <TabsTrigger value="product">Product Images</TabsTrigger>
                  <TabsTrigger value="branding">Branding</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}