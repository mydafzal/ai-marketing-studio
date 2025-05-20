"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, AlertCircle, ArrowRight, ExternalLink, ImageIcon, Check } from "lucide-react";
import { AspectRatio } from "@/app/actions/generate-image";
import { generateImages, generateImageVariation } from "@/app/actions/generate-image";
import Image from "next/image";
import dynamic from "next/dynamic";

export default function AiCreativeDirectorPage() {
  const [url, setUrl] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isGeneratingImages, setIsGeneratingImages] = useState(false);
  const [websiteData, setWebsiteData] = useState<{
    colors: string[];
    fonts: string[];
    contentSample: string;
    contentSummary: string;
    images: string[];
  } | null>(null);
  const [generatedImages, setGeneratedImages] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [imageLoadErrors, setImageLoadErrors] = useState<Record<string, boolean>>({});
  const [selectedReferenceImages, setSelectedReferenceImages] = useState<string[]>([]);
  const [useReferenceImages, setUseReferenceImages] = useState<boolean>(true);
  
  // New state for large image preview modal
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [previewImageFormat, setPreviewImageFormat] = useState<"square" | "vertical" | null>(null);

  const handleScrapeWebsite = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!url) {
      setError("Please enter a website URL");
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      setWebsiteData(null);
      setGeneratedImages([]);
      setImageLoadErrors({});
      setSelectedReferenceImages([]);
      
      const response = await fetch("/api/website-scrape", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ url }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to analyze website");
      }

      setWebsiteData(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  const handleImageError = (imageUrl: string) => {
    setImageLoadErrors(prev => ({
      ...prev,
      [imageUrl]: true
    }));
  };
  
  const toggleReferenceImage = (imageUrl: string) => {
    setSelectedReferenceImages(prev => {
      if (prev.includes(imageUrl)) {
        return prev.filter(url => url !== imageUrl);
      } else {
        // Limit to 4 reference images (OpenAI API limit)
        if (prev.length >= 4) {
          return [...prev.slice(1), imageUrl]; // Remove oldest, add new one
        }
        return [...prev, imageUrl];
      }
    });
  };

  // Helper function to convert an image URL to a base64 data URL
  const convertImageUrlToBase64 = async (imageUrl: string): Promise<string | null> => {
    try {
      const response = await fetch(imageUrl);
      if (!response.ok) {
        throw new Error(`Failed to fetch image: ${response.statusText}`);
      }
      
      const blob = await response.blob();
      
      // Create a FileReader to convert the blob to a base64 data URL
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
    } catch (error) {
      console.error(`Error converting image to base64: ${error}`);
      return null;
    }
  };

  const handleGenerateCreatives = async () => {
    if (!websiteData) {
      setError("Please analyze a website first");
      return;
    }

    try {
      setIsGeneratingImages(true);
      setError(null);

      // Create the base prompt for both formats
      const basePrompt = `
You are a world-class creative director tasked with designing a high-converting visual ad for this brand.

**Brand Colors**: ${websiteData.colors.slice(0, 5).join(', ')}  
**Font Style**: ${websiteData.fonts.slice(0, 3).join(', ') || "clean, modern fonts"}  
**Visual Identity**: Derive your design inspiration from the brand's look and feel.

**Product/Service Summary**:  
"${websiteData.contentSample.substring(0, 300)}..."

Your task is to design a visually compelling advertisement image that:
- Instantly captures attention within 2 seconds
- Clearly communicates the brand's core value proposition
- Reflects the visual style and emotion of the website
- Uses harmonious colors and typography consistent with the brand
- Includes a bold, scroll-stopping headline
- Includes a persuasive call-to-action (CTA) that drives clicks or signups

Additional guidance:
- Think like a conversion-optimized designer, not a generic graphic artist
- Your image should work for paid advertising (e.g. Facebook, Instagram, Google Display)
- Prioritize clarity, contrast, emotional resonance, and simplicity
- Use strong composition and negative space to guide the eye
`;
      
      // Initialize result variable to fix the "result is not defined" error
      let result: { success: boolean; images?: string[]; error?: string } = {
        success: false,
        images: []
      };

      // Reference images handling check
      if (useReferenceImages && selectedReferenceImages.length > 0) {
        // First convert the URL references to base64 data URLs
        setError("Converting reference images... please wait");
        
        const base64Images: string[] = [];
        
        // Process each image URL to convert it to a base64 data URL
        for (const imageUrl of selectedReferenceImages) {
          const base64Image = await convertImageUrlToBase64(imageUrl);
          if (base64Image) {
            base64Images.push(base64Image);
          }
        }
        
        if (base64Images.length === 0) {
          throw new Error("Failed to convert any reference images. Please try selecting different images.");
        }
        
        setError("Generating square format images (1:1)...");
        
        // Create prompt for square format
        const squarePrompt = `${basePrompt}\nOutput: a realistic, high-resolution square (1:1) ad image perfect for Instagram posts.`;
        
        // Generate square format images (1:1)
        const squareResult = await generateImageVariation(
          base64Images,
          "1:1" as AspectRatio,
          3,
          squarePrompt
        );
        
        setError("Generating reel format images (9:16)...");
        
        // Create prompt for reel format
        const reelPrompt = `${basePrompt}\nOutput: a realistic, high-resolution vertical (9:16) ad image perfect for Instagram/Facebook reels and stories.`;
        
        // Generate reel format images (9:16)
        const reelResult = await generateImageVariation(
          base64Images,
          "9:16" as AspectRatio,
          3,
          reelPrompt
        );
        
        // Combine the results
        const combinedImages = [];
        
        if (squareResult.success && squareResult.images) {
          combinedImages.push(...squareResult.images);
        }
        
        if (reelResult.success && reelResult.images) {
          combinedImages.push(...reelResult.images);
        }
        
        if (combinedImages.length === 0) {
          throw new Error("Failed to generate images. Please try again or use different reference images.");
        }
        
        // Use the combined result
        result = {
          success: true,
          images: combinedImages
        };
        
      } else {
        // For text-only mode (no reference images)
        
        // Add reference to website images in the prompt if we aren't using them directly
        let additionalInfo = "";
        if (validWebsiteImages.length > 0 && !useReferenceImages) {
          additionalInfo = `\nThe website contains images that showcase: ${
            validWebsiteImages.length === 1 
            ? "a specific visual element that should inspire your design" 
            : "specific visual elements that should inspire your design"
          }.`;
        }
        
        setError("Generating square format images (1:1)...");
        
        // Create prompt for square format
        const squarePrompt = `${basePrompt}${additionalInfo}\nOutput: a realistic, high-resolution square (1:1) ad image perfect for Instagram posts.`;
        
        // Generate square format images (1:1)
        const squareResult = await generateImages(squarePrompt, "1:1" as AspectRatio, 3);
        
        setError("Generating reel format images (9:16)...");
        
        // Create prompt for reel format
        const reelPrompt = `${basePrompt}${additionalInfo}\nOutput: a realistic, high-resolution vertical (9:16) ad image perfect for Instagram/Facebook reels and stories.`;
        
        // Generate reel format images (9:16)
        const reelResult = await generateImages(reelPrompt, "9:16" as AspectRatio, 3);
        
        // Combine the results
        const combinedImages = [];
        
        if (squareResult.success && squareResult.images) {
          combinedImages.push(...squareResult.images);
        }
        
        if (reelResult.success && reelResult.images) {
          combinedImages.push(...reelResult.images);
        }
        
        if (combinedImages.length === 0) {
          throw new Error("Failed to generate images. Please try again with a different prompt.");
        }
        
        // Use the combined result
        result = {
          success: true,
          images: combinedImages
        };
      }
      
      if (result.success && result.images) {
        setGeneratedImages(result.images);
      } else {
        throw new Error(result.error || "Failed to generate images");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to generate creatives");
    } finally {
      setIsGeneratingImages(false);
    }
  };

  // Filter out images that failed to load
  const validWebsiteImages = websiteData?.images.filter(img => !imageLoadErrors[img]) || [];

  // Function to close the preview modal
  const closePreview = () => {
    setPreviewImage(null);
    setPreviewImageFormat(null);
  };

  return (
    <div className="container mx-auto max-w-6xl py-12 px-4">
      {/* Image Preview Modal */}
      {previewImage && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 sm:p-8" onClick={closePreview}>
          <div 
            className={`relative max-w-7xl max-h-full ${
              previewImageFormat === "square" ? "aspect-square" : "aspect-[9/16]"
            } ${previewImageFormat === "vertical" ? "sm:max-w-md md:max-w-lg" : ""}`}
            onClick={(e) => e.stopPropagation()}
          >
            <img 
              src={previewImage} 
              alt="Ad creative preview" 
              className="w-full h-full object-contain rounded-lg" 
            />
            <div className="absolute top-2 right-2 flex gap-2">
              <a
                href={previewImage}
                download={`ad-creative-${previewImageFormat}.png`}
                className="bg-white text-gray-800 rounded-md py-2 px-4 font-medium shadow hover:bg-gray-50"
                target="_blank"
                rel="noopener noreferrer"
              >
                Download
              </a>
              <button
                onClick={closePreview}
                className="bg-white text-gray-800 rounded-md py-2 px-4 font-medium shadow hover:bg-gray-50"
              >
                Close
              </button>
            </div>
            <div className="absolute top-2 left-2">
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                previewImageFormat === "square" 
                  ? "bg-primary-green/80 text-black" 
                  : "bg-blue-500/80 text-white"
              }`}>
                {previewImageFormat === "square" ? "1:1 Square" : "9:16 Vertical"}
              </span>
            </div>
          </div>
        </div>
      )}

      <h1 className="text-3xl font-bold mb-4 text-center">AI Creative Director</h1>
      <p className="text-lg text-gray-500 mb-8 text-center">
        Enter your website URL and get instant ad creatives tailored to your brand
      </p>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left column - always visible, contains the form */}
        <div className="space-y-6">
          <Card className="bg-dark-bg border-border-dark shadow-lg">
            <CardHeader>
              <CardTitle className="text-xl">Generate AI Advertising Creatives</CardTitle>
              <CardDescription>
                Our AI will analyze your website and create custom advertising assets
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleScrapeWebsite} className="space-y-4">
                <div>
                  <label htmlFor="website-url" className="block text-sm font-medium mb-1">
                    Website URL
                  </label>
                  <Input 
                    id="website-url" 
                    placeholder="https://yourwebsite.com" 
                    className="w-full"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                  />
                  <p className="mt-2 text-xs text-gray-500">
                    Enter your full website URL including https://
                  </p>
                  {error && (
                    <p className="mt-2 text-xs text-red-500">{error}</p>
                  )}
                </div>

                <Button 
                  type="submit" 
                  className="w-full bg-primary-green hover:bg-primary-green/90 text-black"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Analyzing...
                    </>
                  ) : "Analyze Website"}
                </Button>
              </form>
            </CardContent>
            {websiteData && (
              <CardFooter className="flex flex-col items-stretch">
                <Button 
                  onClick={handleGenerateCreatives} 
                  disabled={isGeneratingImages || (useReferenceImages && selectedReferenceImages.length === 0)}
                  className="w-full mt-2 bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center"
                >
                  {isGeneratingImages ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      {error || "Generating Creatives..."}
                    </>
                  ) : (
                    <>
                      {useReferenceImages && selectedReferenceImages.length === 0 ? (
                        <>Select reference images to continue</>
                      ) : useReferenceImages ? (
                        <>Generate 3 Square + 3 Reel Creatives</>
                      ) : (
                        <>Generate 3 Square + 3 Reel Creatives</>
                      )}
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </>
                  )}
                </Button>
              </CardFooter>
            )}
          </Card>

          {/* Reference images section */}
          {websiteData && validWebsiteImages.length > 0 && generatedImages.length === 0 && (
            <Card className="bg-dark-bg border-border-dark shadow-lg overflow-hidden">
              <CardHeader className="pb-2">
                <div className="flex justify-between items-center">
                  <CardTitle className="text-lg">Reference Images</CardTitle>
                  <div className="flex items-center">
                    <label className="flex items-center space-x-1 text-sm cursor-pointer mr-2">
                      <input 
                        type="checkbox"
                        checked={useReferenceImages}
                        onChange={() => setUseReferenceImages(!useReferenceImages)}
                        className="rounded text-primary-green focus:ring-primary-green"
                      />
                      <span>Use as references</span>
                    </label>
                    {selectedReferenceImages.length > 0 && (
                      <span className="text-xs bg-primary-green/20 text-primary-green px-2 py-0.5 rounded-full">
                        {selectedReferenceImages.length}/4 selected
                      </span>
                    )}
                  </div>
                </div>
                {useReferenceImages && (
                  <CardDescription>
                    Click on images to select up to 4 reference images for ad generation
                  </CardDescription>
                )}
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {validWebsiteImages.map((imageUrl, index) => {
                    const isSelected = selectedReferenceImages.includes(imageUrl);
                    return (
                      <div 
                        key={index} 
                        className={`relative aspect-square group rounded-md overflow-hidden border cursor-pointer ${
                          isSelected 
                            ? "border-primary-green ring-2 ring-primary-green" 
                            : "border-border-dark hover:border-primary-green/50"
                        }`}
                        onClick={() => useReferenceImages && toggleReferenceImage(imageUrl)}
                      >
                        {/* Use a regular img tag with role="img" for accessibility */}
                        <div className="relative w-full h-full">
                          <img 
                            src={imageUrl}
                            alt={`Website image ${index + 1}`}
                            className="absolute inset-0 w-full h-full object-cover"
                            onError={() => handleImageError(imageUrl)}
                          />
                        </div>
                        
                        {/* Selection indicator */}
                        {isSelected && (
                          <div className="absolute top-2 right-2 bg-primary-green text-black rounded-full p-1">
                            <Check className="h-3 w-3" />
                          </div>
                        )}
                        
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/50 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100">
                          <a
                            href={imageUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1.5 bg-white text-gray-800 rounded-full"
                            onClick={(e) => {
                              e.stopPropagation(); // Prevent selection toggle when clicking view button
                            }}
                          >
                            <ExternalLink className="h-4 w-4" />
                          </a>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right column - either website analysis or generated creatives */}
        <div>
          {generatedImages.length > 0 ? (
            <div className="space-y-6">
              <h2 className="text-xl font-bold mb-4">Generated Ad Creatives</h2>
              <div className="mb-6">
                <h3 className="text-lg font-semibold mb-3">Square Format (1:1) - For Instagram Posts</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {generatedImages.slice(0, 3).map((image, index) => (
                    <div 
                      key={index} 
                      className="relative aspect-square border border-border-dark rounded-lg overflow-hidden group cursor-pointer"
                      onClick={() => {
                        setPreviewImage(image);
                        setPreviewImageFormat("square");
                      }}
                    >
                      <div className="w-full h-full">
                        <img
                          src={image}
                          alt={`Square ad creative ${index + 1}`}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setPreviewImage(image);
                              setPreviewImageFormat("square");
                            }}
                            className="py-2 px-4 bg-white text-gray-800 rounded-md font-medium shadow hover:bg-gray-50"
                          >
                            View
                          </button>
                          <a 
                            href={image}
                            download={`square-ad-${index + 1}.png`}
                            className="py-2 px-4 bg-white text-gray-800 rounded-md font-medium shadow hover:bg-gray-50"
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                          >
                            Download
                          </a>
                        </div>
                      </div>
                      <div className="absolute top-2 right-2 bg-primary-green/80 text-black text-xs px-2 py-1 rounded-full">
                        1:1
                      </div>
                      <div className="absolute bottom-2 left-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
                        Square {index + 1}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              
              <div>
                <h3 className="text-lg font-semibold mb-3">Vertical Format (9:16) - For Reels & Stories</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {generatedImages.slice(3, 6).map((image, index) => (
                    <div 
                      key={index} 
                      className="relative aspect-[9/16] border border-border-dark rounded-lg overflow-hidden group cursor-pointer"
                      onClick={() => {
                        setPreviewImage(image);
                        setPreviewImageFormat("vertical");
                      }}
                    >
                      <div className="w-full h-full">
                        <img
                          src={image}
                          alt={`Vertical ad creative ${index + 1}`}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setPreviewImage(image);
                              setPreviewImageFormat("vertical");
                            }}
                            className="py-2 px-4 bg-white text-gray-800 rounded-md font-medium shadow hover:bg-gray-50"
                          >
                            View
                          </button>
                          <a 
                            href={image}
                            download={`reel-ad-${index + 1}.png`}
                            className="py-2 px-4 bg-white text-gray-800 rounded-md font-medium shadow hover:bg-gray-50"
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                          >
                            Download
                          </a>
                        </div>
                      </div>
                      <div className="absolute top-2 right-2 bg-blue-500/80 text-white text-xs px-2 py-1 rounded-full">
                        9:16
                      </div>
                      <div className="absolute bottom-2 left-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
                        Reel {index + 1}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : websiteData ? (
            <Card className="bg-dark-bg border-border-dark shadow-lg overflow-hidden h-full">
              <CardHeader className="border-b border-gray-800">
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle className="text-xl flex items-center gap-2">
                      <div className="w-1 h-6 bg-primary-green rounded mr-2"></div>
                      Brand Analysis Report
                    </CardTitle>
                    <CardDescription className="mt-1">
                      Details extracted from <a href={url} target="_blank" rel="noopener noreferrer" className="font-medium text-primary-green hover:underline flex items-center">
                        {url} <ExternalLink className="h-3 w-3" />
                      </a>
                    </CardDescription>
                  </div>
                  <div className="bg-primary-green/20 text-primary-green text-xs px-3 py-1 rounded-full font-medium">
                    AI-Powered Analysis
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-5 pt-6">
                <div>
                  <h3 className="text-md font-semibold mb-3 flex items-center">
                    <div className="w-4 h-4 bg-primary-green/60 rounded-full mr-2"></div>
                    Brand Color Palette
                  </h3>
                  <div className="grid grid-cols-5 sm:grid-cols-8 gap-3">
                    {websiteData.colors.slice(0, 8).map((color, index) => (
                      <div key={index} className="flex flex-col items-center group">
                        <div 
                          className="w-12 h-12 rounded-md border border-border-dark shadow-sm group-hover:scale-110 transition-transform" 
                          style={{ backgroundColor: color }}
                        ></div>
                        <span className="text-xs mt-1 opacity-70 group-hover:opacity-100">{color}</span>
                      </div>
                    ))}
                    {websiteData.colors.length > 8 && (
                      <div className="flex flex-col items-center justify-center">
                        <Badge className="bg-gray-700 text-white">+{websiteData.colors.length - 8} more</Badge>
                      </div>
                    )}
                  </div>
                </div>

                <Separator className="bg-gray-700" />

                <div>
                  <h3 className="text-md font-semibold mb-3 flex items-center">
                    <div className="w-4 h-4 bg-blue-500/60 rounded-full mr-2"></div>
                    Typography
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {websiteData.fonts.length > 0 ? (
                      websiteData.fonts.map((font, index) => (
                        <Badge key={index} className="bg-blue-500/20 text-blue-300 border border-blue-500/40 py-1.5 px-3">
                          {font}
                        </Badge>
                      ))
                    ) : (
                      <p className="text-sm text-gray-400 italic">No font information detected</p>
                    )}
                  </div>
                </div>

                <Separator className="bg-gray-700" />

                <div className="col-span-2">
                  <h3 className="text-md font-semibold mb-3 flex items-center">
                    <div className="w-4 h-4 bg-amber-500/60 rounded-full mr-2"></div>
                    Website Analysis Report
                  </h3>
                  <div className="bg-gray-800/50 p-5 rounded-md max-h-80 overflow-y-auto border border-gray-700 shadow-inner">
                    <div className="text-sm text-gray-200 leading-relaxed prose prose-sm prose-invert max-w-none prose-headings:text-primary-green prose-headings:mb-2 prose-headings:mt-4 prose-p:mb-2 prose-li:mb-1">
                      {websiteData.contentSummary ? (
                        <div dangerouslySetInnerHTML={{ 
                          __html: websiteData.contentSummary
                            .replace(/\n\n/g, '<br/><br/>')
                            .replace(/\n/g, '<br/>')
                            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                            .replace(/\*(.*?)\*/g, '<em>$1</em>')
                            // Handle headings with emojis
                            .replace(/#{3}\s+(🏢|👥|✨|💼|🗣️|📣|📈|📊)?\s*(.*?)(?=<br\/>|$)/g, 
                              '<h3 class="text-primary-green font-semibold text-base flex items-center gap-2 border-b border-primary-green/30 pb-1 mt-4 mb-2">$1 $2</h3>')
                            .replace(/#{2}\s+(🏢|👥|✨|💼|🗣️|📣|📈|📊)?\s*(.*?)(?=<br\/>|$)/g, 
                              '<h2 class="text-primary-green font-bold text-lg flex items-center gap-2 border-b border-primary-green/30 pb-2 mt-5 mb-3">$1 $2</h2>')
                            // Handle bullet points
                            .replace(/- (.*?)(?=<br\/>|$)/g, 
                              '<li class="flex items-start mb-2"><span class="text-primary-green mr-2 font-bold">•</span><span>$1</span></li>')
                            // Wrap lists in proper ul tags
                            .replace(/(<li.*?<\/li>)(<br\/>)*(<li.*?<\/li>)(<br\/>)*(<li.*?<\/li>)/g, '<ul class="mt-1 mb-3 pl-2">$1$3$5</ul>')
                            .replace(/(<li.*?<\/li>)(<br\/>)*(<li.*?<\/li>)/g, '<ul class="mt-1 mb-3 pl-2">$1$3</ul>')
                            .replace(/(<li.*?<\/li>)/g, '<ul class="mt-1 mb-3 pl-2">$1</ul>')
                        }} />
                      ) : (
                        <p className="italic text-gray-400">Analyzing website content...</p>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
              <div className="px-6 py-4 bg-primary-green/10 border-t border-primary-green/30 mt-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-primary-green flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2">
                      <circle cx="12" cy="12" r="10" />
                      <path d="m15 9-6 6" />
                      <path d="m9 9 6 6" />
                    </svg>
                    <span className="font-semibold">Analysis complete</span>
                  </p>
                  <button 
                    onClick={handleGenerateCreatives}
                    disabled={isGeneratingImages || (useReferenceImages && selectedReferenceImages.length === 0)}
                    className="bg-primary-green hover:bg-primary-green/90 text-black text-sm px-4 py-1 rounded-md font-medium flex items-center"
                  >
                    Generate Ad Creatives
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="ml-2">
                      <path d="M5 12h14" />
                      <path d="m12 5 7 7-7 7" />
                    </svg>
                  </button>
                </div>
              </div>
            </Card>
          ) : (
            <div className="h-full flex items-center justify-center">
              <div className="text-center p-8 border border-dashed border-gray-600 rounded-lg w-full">
                <div className="mx-auto bg-gray-800 rounded-full p-4 w-16 h-16 flex items-center justify-center mb-4">
                  <svg 
                    xmlns="http://www.w3.org/2000/svg" 
                    width="24" 
                    height="24" 
                    viewBox="0 0 24 24" 
                    fill="none" 
                    stroke="currentColor" 
                    strokeWidth="2" 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    className="text-primary-green"
                  >
                    <rect width="18" height="10" x="3" y="4" rx="2" />
                    <circle cx="12" cy="14" r="6" />
                    <path d="M8 14h8" />
                    <path d="M12 10v8" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold mb-2">AI Creative Director</h3>
                <p className="text-gray-400 mb-4">
                  Enter your website URL to extract brand elements and generate professional ad creatives.
                </p>
                <div className="flex flex-col gap-2 text-left max-w-md mx-auto bg-gray-800 p-4 rounded-lg">
                  <div className="flex items-center">
                    <div className="bg-gray-700 rounded-full p-1 mr-2">
                      <span className="w-5 h-5 flex items-center justify-center text-xs font-bold text-white">1</span>
                    </div>
                    <span className="text-sm">Enter your website URL</span>
                  </div>
                  <div className="flex items-center">
                    <div className="bg-gray-700 rounded-full p-1 mr-2">
                      <span className="w-5 h-5 flex items-center justify-center text-xs font-bold text-white">2</span>
                    </div>
                    <span className="text-sm">Analyze website colors, fonts, and content</span>
                  </div>
                  <div className="flex items-center">
                    <div className="bg-gray-700 rounded-full p-1 mr-2">
                      <span className="w-5 h-5 flex items-center justify-center text-xs font-bold text-white">3</span>
                    </div>
                    <span className="text-sm">Generate custom advertisement creatives</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="mt-16">
        <h2 className="text-xl font-semibold mb-4">How It Works</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="p-4 border border-border-dark rounded-lg bg-dark-bg">
            <div className="font-bold mb-2">1. Enter Your Website</div>
            <p className="text-sm text-gray-400">
              Simply provide your website URL so our AI can analyze your brand&apos;s visual identity and messaging
            </p>
          </div>
          <div className="p-4 border border-border-dark rounded-lg bg-dark-bg">
            <div className="font-bold mb-2">2. AI Analysis</div>
            <p className="text-sm text-gray-400">
              Our AI extracts your brand&apos;s color palette, typography, images, and key content to understand your identity
            </p>
          </div>
          <div className="p-4 border border-border-dark rounded-lg bg-dark-bg">
            <div className="font-bold mb-2">3. Select Reference Images</div>
            <p className="text-sm text-gray-400">
              Choose website images to use as visual references or let our AI generate creatives based on text description
            </p>
          </div>
          <div className="p-4 border border-border-dark rounded-lg bg-dark-bg">
            <div className="font-bold mb-2">4. Get Creative Assets</div>
            <p className="text-sm text-gray-400">
              Receive professionally designed advertising creatives that are perfectly aligned with your brand
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}