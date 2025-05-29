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
    segment: ""
  });
  const [showTabs, setShowTabs] = useState(false);
  const [generatedImages, setGeneratedImages] = useState<Record<string, string[]>>({
    social: [],
    product: [],
    branding: []
  });
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [selectedFormat, setSelectedFormat] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

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
          segment: data.companyInfo.segment
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

  // Function to generate images
  const handleGenerateImage = async (format: string, aspectRatio: AspectRatio) => {
    setIsGeneratingImage(true);
    setError(null);
    
    try {
      // Create a prompt based on company information
      const companyDesc = companyInfo.description || "professional business";
      const companyName = companyInfo.name || "the business";
      const industryType = companyInfo.segment || "business";
      
      // Format-specific prompts
      let prompt = "";
      
      if (format === "social") {
        prompt = `Create a modern, professional ${aspectRatio} social media ad image for ${companyName}. ${companyDesc.substring(0, 100)}. Style: clean, eye-catching, suitable for ${industryType} industry. Include empty space for text overlay.`;
      } else if (format === "product") {
        prompt = `Create a polished ${aspectRatio} product showcase image for ${companyName}. ${companyDesc.substring(0, 100)}. Style: professional, highlighting quality and value. Suitable for ${industryType} industry advertising.`;
      } else if (format === "branding") {
        prompt = `Create a sophisticated ${aspectRatio} branding image for ${companyName}. ${companyDesc.substring(0, 100)}. Style: corporate, trustworthy, reflecting the ${industryType} industry. Include empty space for logo placement.`;
      }
      
      // Generate the image
      const result = await generateImages(prompt, aspectRatio, 1);
      
      if (result.success && result.images && result.images.length > 0) {
        // Store the generated image
        setGeneratedImages(prev => ({
          ...prev,
          [format]: [...(prev[format] || []), ...result.images!]
        }));
      } else {
        setError(result.error || "Failed to generate image. Please try again.");
      }
    } catch (error) {
      console.error("Error generating image:", error);
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setIsGeneratingImage(false);
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

      <h1 className="text-3xl font-bold mb-8 text-center">AI Image Generator</h1>

      <div className="max-w-5xl mx-auto">
        {/* AI Message with Animated Color Blob */}
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

        {/* Error message */}
        {error && (
          <div className="bg-red-900/20 border border-red-900 rounded-lg p-3 mb-6 mx-auto max-w-xl">
            <p className="text-red-500 text-sm">{error}</p>
          </div>
        )}

        {/* Image Generation Options */}
        {showTabs && (
          <div className="animate-fadeIn">
            <Tabs defaultValue="social" className="w-full">
              <TabsList className="grid w-full grid-cols-3 mb-8">
                <TabsTrigger value="social">Social Media</TabsTrigger>
                <TabsTrigger value="product">Product Images</TabsTrigger>
                <TabsTrigger value="branding">Branding</TabsTrigger>
              </TabsList>
              
              <TabsContent value="social" className="mt-0">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Square format */}
                  <Card className="bg-[#1A1D29] border-gray-700 overflow-hidden">
                    <CardContent className="p-0">
                      {generatedImages.social.some(img => img.includes("square") || img.includes("1:1")) ? (
                        <div 
                          className="aspect-square bg-gray-800 relative cursor-pointer group"
                          onClick={() => {
                            const squareImage = generatedImages.social.find(img => img.includes("square") || img.includes("1:1"));
                            if (squareImage) {
                              setSelectedImage(squareImage);
                              setSelectedFormat("square");
                            }
                          }}
                        >
                          <img 
                            src={generatedImages.social.find(img => img.includes("square") || img.includes("1:1"))} 
                            alt="Generated square format image" 
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <Button variant="outline" className="bg-white/20 backdrop-blur-sm text-white border-white/30">
                              View Larger
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div className="aspect-square bg-gray-800 flex items-center justify-center">
                          <ImageIcon className="w-10 h-10 text-gray-600" />
                        </div>
                      )}
                      <div className="p-4">
                        <h3 className="font-medium text-white mb-1">Instagram Post</h3>
                        <p className="text-sm text-gray-400">1:1 square format</p>
                        <Button 
                          className="w-full mt-3 bg-[#4BF29C] text-black hover:bg-[#3bd283]"
                          onClick={() => handleGenerateImage("social", "1:1")}
                          disabled={isGeneratingImage}
                        >
                          {isGeneratingImage ? (
                            <>
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              Generating...
                            </>
                          ) : (
                            "Generate"
                          )}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                  
                  {/* Vertical format */}
                  <Card className="bg-[#1A1D29] border-gray-700 overflow-hidden">
                    <CardContent className="p-0">
                      {generatedImages.social.some(img => img.includes("vertical") || img.includes("9:16")) ? (
                        <div 
                          className="aspect-[9/16] bg-gray-800 relative cursor-pointer group"
                          onClick={() => {
                            const verticalImage = generatedImages.social.find(img => img.includes("vertical") || img.includes("9:16"));
                            if (verticalImage) {
                              setSelectedImage(verticalImage);
                              setSelectedFormat("vertical");
                            }
                          }}
                        >
                          <img 
                            src={generatedImages.social.find(img => img.includes("vertical") || img.includes("9:16"))} 
                            alt="Generated vertical format image" 
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <Button variant="outline" className="bg-white/20 backdrop-blur-sm text-white border-white/30">
                              View Larger
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div className="aspect-[9/16] bg-gray-800 flex items-center justify-center">
                          <ImageIcon className="w-10 h-10 text-gray-600" />
                        </div>
                      )}
                      <div className="p-4">
                        <h3 className="font-medium text-white mb-1">Story Format</h3>
                        <p className="text-sm text-gray-400">9:16 vertical format</p>
                        <Button 
                          className="w-full mt-3 bg-[#4BF29C] text-black hover:bg-[#3bd283]"
                          onClick={() => handleGenerateImage("social", "9:16")}
                          disabled={isGeneratingImage}
                        >
                          {isGeneratingImage ? (
                            <>
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              Generating...
                            </>
                          ) : (
                            "Generate"
                          )}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                  
                  {/* Wide format */}
                  <Card className="bg-[#1A1D29] border-gray-700 overflow-hidden">
                    <CardContent className="p-0">
                      {generatedImages.social.some(img => img.includes("wide") || img.includes("16:9")) ? (
                        <div 
                          className="aspect-[16/9] bg-gray-800 relative cursor-pointer group"
                          onClick={() => {
                            const wideImage = generatedImages.social.find(img => img.includes("wide") || img.includes("16:9"));
                            if (wideImage) {
                              setSelectedImage(wideImage);
                              setSelectedFormat("wide");
                            }
                          }}
                        >
                          <img 
                            src={generatedImages.social.find(img => img.includes("wide") || img.includes("16:9"))} 
                            alt="Generated wide format image" 
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <Button variant="outline" className="bg-white/20 backdrop-blur-sm text-white border-white/30">
                              View Larger
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div className="aspect-[16/9] bg-gray-800 flex items-center justify-center">
                          <ImageIcon className="w-10 h-10 text-gray-600" />
                        </div>
                      )}
                      <div className="p-4">
                        <h3 className="font-medium text-white mb-1">Wide Banner</h3>
                        <p className="text-sm text-gray-400">16:9 landscape format</p>
                        <Button 
                          className="w-full mt-3 bg-[#4BF29C] text-black hover:bg-[#3bd283]"
                          onClick={() => handleGenerateImage("social", "16:9")}
                          disabled={isGeneratingImage}
                        >
                          {isGeneratingImage ? (
                            <>
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              Generating...
                            </>
                          ) : (
                            "Generate"
                          )}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
              
              <TabsContent value="product">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Square product */}
                  <Card className="bg-[#1A1D29] border-gray-700 overflow-hidden">
                    <CardContent className="p-0">
                      {generatedImages.product.some(img => img.includes("square") || img.includes("1:1")) ? (
                        <div 
                          className="aspect-square bg-gray-800 relative cursor-pointer group"
                          onClick={() => {
                            const squareImage = generatedImages.product.find(img => img.includes("square") || img.includes("1:1"));
                            if (squareImage) {
                              setSelectedImage(squareImage);
                              setSelectedFormat("product-square");
                            }
                          }}
                        >
                          <img 
                            src={generatedImages.product.find(img => img.includes("square") || img.includes("1:1"))} 
                            alt="Generated square product image" 
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <Button variant="outline" className="bg-white/20 backdrop-blur-sm text-white border-white/30">
                              View Larger
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div className="aspect-square bg-gray-800 flex items-center justify-center">
                          <ImageIcon className="w-10 h-10 text-gray-600" />
                        </div>
                      )}
                      <div className="p-4">
                        <h3 className="font-medium text-white mb-1">Product Showcase</h3>
                        <p className="text-sm text-gray-400">1:1 square format</p>
                        <Button 
                          className="w-full mt-3 bg-[#4BF29C] text-black hover:bg-[#3bd283]"
                          onClick={() => handleGenerateImage("product", "1:1")}
                          disabled={isGeneratingImage}
                        >
                          {isGeneratingImage ? (
                            <>
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              Generating...
                            </>
                          ) : (
                            "Generate"
                          )}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                  
                  {/* Product vertical */}
                  <Card className="bg-[#1A1D29] border-gray-700 overflow-hidden">
                    <CardContent className="p-0">
                      {generatedImages.product.some(img => img.includes("vertical") || img.includes("9:16")) ? (
                        <div 
                          className="aspect-[9/16] bg-gray-800 relative cursor-pointer group"
                          onClick={() => {
                            const verticalImage = generatedImages.product.find(img => img.includes("vertical") || img.includes("9:16"));
                            if (verticalImage) {
                              setSelectedImage(verticalImage);
                              setSelectedFormat("product-vertical");
                            }
                          }}
                        >
                          <img 
                            src={generatedImages.product.find(img => img.includes("vertical") || img.includes("9:16"))} 
                            alt="Generated vertical product image" 
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <Button variant="outline" className="bg-white/20 backdrop-blur-sm text-white border-white/30">
                              View Larger
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div className="aspect-[9/16] bg-gray-800 flex items-center justify-center">
                          <ImageIcon className="w-10 h-10 text-gray-600" />
                        </div>
                      )}
                      <div className="p-4">
                        <h3 className="font-medium text-white mb-1">Mobile Product Ad</h3>
                        <p className="text-sm text-gray-400">9:16 vertical format</p>
                        <Button 
                          className="w-full mt-3 bg-[#4BF29C] text-black hover:bg-[#3bd283]"
                          onClick={() => handleGenerateImage("product", "9:16")}
                          disabled={isGeneratingImage}
                        >
                          {isGeneratingImage ? (
                            <>
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              Generating...
                            </>
                          ) : (
                            "Generate"
                          )}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                  
                  {/* Product wide */}
                  <Card className="bg-[#1A1D29] border-gray-700 overflow-hidden">
                    <CardContent className="p-0">
                      {generatedImages.product.some(img => img.includes("wide") || img.includes("16:9")) ? (
                        <div 
                          className="aspect-[16/9] bg-gray-800 relative cursor-pointer group"
                          onClick={() => {
                            const wideImage = generatedImages.product.find(img => img.includes("wide") || img.includes("16:9"));
                            if (wideImage) {
                              setSelectedImage(wideImage);
                              setSelectedFormat("product-wide");
                            }
                          }}
                        >
                          <img 
                            src={generatedImages.product.find(img => img.includes("wide") || img.includes("16:9"))} 
                            alt="Generated wide product image" 
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <Button variant="outline" className="bg-white/20 backdrop-blur-sm text-white border-white/30">
                              View Larger
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div className="aspect-[16/9] bg-gray-800 flex items-center justify-center">
                          <ImageIcon className="w-10 h-10 text-gray-600" />
                        </div>
                      )}
                      <div className="p-4">
                        <h3 className="font-medium text-white mb-1">Product Banner</h3>
                        <p className="text-sm text-gray-400">16:9 landscape format</p>
                        <Button 
                          className="w-full mt-3 bg-[#4BF29C] text-black hover:bg-[#3bd283]"
                          onClick={() => handleGenerateImage("product", "16:9")}
                          disabled={isGeneratingImage}
                        >
                          {isGeneratingImage ? (
                            <>
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              Generating...
                            </>
                          ) : (
                            "Generate"
                          )}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
              
              <TabsContent value="branding">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Branding square */}
                  <Card className="bg-[#1A1D29] border-gray-700 overflow-hidden">
                    <CardContent className="p-0">
                      {generatedImages.branding.some(img => img.includes("square") || img.includes("1:1")) ? (
                        <div 
                          className="aspect-square bg-gray-800 relative cursor-pointer group"
                          onClick={() => {
                            const squareImage = generatedImages.branding.find(img => img.includes("square") || img.includes("1:1"));
                            if (squareImage) {
                              setSelectedImage(squareImage);
                              setSelectedFormat("branding-square");
                            }
                          }}
                        >
                          <img 
                            src={generatedImages.branding.find(img => img.includes("square") || img.includes("1:1"))} 
                            alt="Generated square branding image" 
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <Button variant="outline" className="bg-white/20 backdrop-blur-sm text-white border-white/30">
                              View Larger
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div className="aspect-square bg-gray-800 flex items-center justify-center">
                          <ImageIcon className="w-10 h-10 text-gray-600" />
                        </div>
                      )}
                      <div className="p-4">
                        <h3 className="font-medium text-white mb-1">Logo Background</h3>
                        <p className="text-sm text-gray-400">1:1 square format</p>
                        <Button 
                          className="w-full mt-3 bg-[#4BF29C] text-black hover:bg-[#3bd283]"
                          onClick={() => handleGenerateImage("branding", "1:1")}
                          disabled={isGeneratingImage}
                        >
                          {isGeneratingImage ? (
                            <>
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              Generating...
                            </>
                          ) : (
                            "Generate"
                          )}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                  
                  {/* Branding vertical */}
                  <Card className="bg-[#1A1D29] border-gray-700 overflow-hidden">
                    <CardContent className="p-0">
                      {generatedImages.branding.some(img => img.includes("vertical") || img.includes("9:16")) ? (
                        <div 
                          className="aspect-[9/16] bg-gray-800 relative cursor-pointer group"
                          onClick={() => {
                            const verticalImage = generatedImages.branding.find(img => img.includes("vertical") || img.includes("9:16"));
                            if (verticalImage) {
                              setSelectedImage(verticalImage);
                              setSelectedFormat("branding-vertical");
                            }
                          }}
                        >
                          <img 
                            src={generatedImages.branding.find(img => img.includes("vertical") || img.includes("9:16"))} 
                            alt="Generated vertical branding image" 
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <Button variant="outline" className="bg-white/20 backdrop-blur-sm text-white border-white/30">
                              View Larger
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div className="aspect-[9/16] bg-gray-800 flex items-center justify-center">
                          <ImageIcon className="w-10 h-10 text-gray-600" />
                        </div>
                      )}
                      <div className="p-4">
                        <h3 className="font-medium text-white mb-1">Mobile Brand Visual</h3>
                        <p className="text-sm text-gray-400">9:16 vertical format</p>
                        <Button 
                          className="w-full mt-3 bg-[#4BF29C] text-black hover:bg-[#3bd283]"
                          onClick={() => handleGenerateImage("branding", "9:16")}
                          disabled={isGeneratingImage}
                        >
                          {isGeneratingImage ? (
                            <>
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              Generating...
                            </>
                          ) : (
                            "Generate"
                          )}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                  
                  {/* Branding wide */}
                  <Card className="bg-[#1A1D29] border-gray-700 overflow-hidden">
                    <CardContent className="p-0">
                      {generatedImages.branding.some(img => img.includes("wide") || img.includes("16:9")) ? (
                        <div 
                          className="aspect-[16/9] bg-gray-800 relative cursor-pointer group"
                          onClick={() => {
                            const wideImage = generatedImages.branding.find(img => img.includes("wide") || img.includes("16:9"));
                            if (wideImage) {
                              setSelectedImage(wideImage);
                              setSelectedFormat("branding-wide");
                            }
                          }}
                        >
                          <img 
                            src={generatedImages.branding.find(img => img.includes("wide") || img.includes("16:9"))} 
                            alt="Generated wide branding image" 
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <Button variant="outline" className="bg-white/20 backdrop-blur-sm text-white border-white/30">
                              View Larger
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div className="aspect-[16/9] bg-gray-800 flex items-center justify-center">
                          <ImageIcon className="w-10 h-10 text-gray-600" />
                        </div>
                      )}
                      <div className="p-4">
                        <h3 className="font-medium text-white mb-1">Website Header</h3>
                        <p className="text-sm text-gray-400">16:9 landscape format</p>
                        <Button 
                          className="w-full mt-3 bg-[#4BF29C] text-black hover:bg-[#3bd283]"
                          onClick={() => handleGenerateImage("branding", "16:9")}
                          disabled={isGeneratingImage}
                        >
                          {isGeneratingImage ? (
                            <>
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              Generating...
                            </>
                          ) : (
                            "Generate"
                          )}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
            </Tabs>
            
            {/* Continue button to facebook connect */}
            <div className="flex justify-center mt-8">
              <Button 
                className="bg-[#4BF29C] text-black hover:bg-[#3bd283] px-8 py-6 text-lg"
                onClick={() => router.push('/facebook-connect')}
              >
                <ExternalLink className="w-5 h-5 mr-2" />
                Continue to Facebook Connect
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}