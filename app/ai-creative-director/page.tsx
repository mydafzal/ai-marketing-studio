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

// Import our custom loading screen components
import WebsiteAnalysisLoader from "@/components/website-analysis-loader";
import AdCreativeLoader from "@/components/ad-creative-loader";

export default function AiCreativeDirectorPage() {
  const [url, setUrl] = useState("");
  const [campaignGoals, setCampaignGoals] = useState<{
    leads: boolean;
    emails: boolean;
    sales: boolean;
    brand: boolean;
    recruiting: boolean;
  }>({
    leads: true,
    emails: false,
    sales: false,
    brand: false,
    recruiting: false,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isGeneratingImages, setIsGeneratingImages] = useState(false);
  const [websiteData, setWebsiteData] = useState<{
    colors: string[];
    fonts: string[];
    contentSample: string;
    contentSummary: string;
    images: string[];
  } | null>(null);
  
  const [generatedImages, setGeneratedImages] = useState<{
    awareness: { square: string; vertical: string };
    consideration: { square: string; vertical: string };
    conversion: { square: string; vertical: string };
  } | null>(null);
  
  const [error, setError] = useState<string | null>(null);
  const [imageLoadErrors, setImageLoadErrors] = useState<Record<string, boolean>>({});
  const [selectedReferenceImages, setSelectedReferenceImages] = useState<string[]>([]);
  const [useReferenceImages, setUseReferenceImages] = useState<boolean>(true);
  
  // Preview modal state
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [previewImageFormat, setPreviewImageFormat] = useState<"square" | "vertical" | null>(null);
  const [previewStage, setPreviewStage] = useState<"awareness" | "consideration" | "conversion" | null>(null);
  
  // Campaign selection state
  const [selectedCampaigns, setSelectedCampaigns] = useState<{
    campaign1: boolean;
    campaign2: boolean;
    campaign3: boolean;
  }>({
    campaign1: false,
    campaign2: false,
    campaign3: false
  });
  
  const [showSubscribeScreen, setShowSubscribeScreen] = useState<boolean>(false);

  // Function to handle website scraping
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
      setGeneratedImages(null);
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
      
      await new Promise(resolve => setTimeout(resolve, 6000));
      
      setError(null);
      setWebsiteData(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  // Function to handle image errors
  const handleImageError = (imageUrl: string) => {
    setImageLoadErrors(prev => ({
      ...prev,
      [imageUrl]: true
    }));
  };
  
  // Function to toggle reference images
  const toggleReferenceImage = (imageUrl: string) => {
    setSelectedReferenceImages(prev => {
      if (prev.includes(imageUrl)) {
        return prev.filter(url => url !== imageUrl);
      } else {
        if (prev.length >= 4) {
          return [...prev.slice(1), imageUrl];
        }
        return [...prev, imageUrl];
      }
    });
  };

  // Helper function to convert image to base64
  const convertImageUrlToBase64 = async (imageUrl: string): Promise<string | null> => {
    try {
      const response = await fetch(imageUrl);
      if (!response.ok) {
        throw new Error(`Failed to fetch image: ${response.statusText}`);
      }
      
      const blob = await response.blob();
      
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

  // Function to generate creatives
  const handleGenerateCreatives = async () => {
    if (!websiteData) {
      setError("Please analyze a website first");
      return;
    }

    try {
      setIsGeneratingImages(true);
      setError(null);
      
      // Reference images setup
      let referenceImagesBase64: string[] = [];
      
      // Only process reference images if the user has selected to use them
      if (useReferenceImages && selectedReferenceImages.length > 0) {
        // Convert selected reference images to base64
        const promises = selectedReferenceImages.map(img => convertImageUrlToBase64(img));
        const results = await Promise.all(promises);
        referenceImagesBase64 = results.filter(r => r !== null) as string[];
      }
      
      // Extract key info from website data
      const { colors, fonts, contentSummary } = websiteData;
      
      // Build base prompt from website analysis
      const basePrompt = `
Create an ad creative for a marketing campaign based on this website analysis:
${contentSummary ? contentSummary.substring(0, 500) : "No content summary available"}

Brand Colors: ${colors ? colors.join(", ") : "No brand colors available"}
Brand Fonts: ${fonts ? fonts.slice(0, 3).join(", ") : "No brand fonts available"}

The ad should be clean, professional and match the brand identity.
      `.trim();
      
      // Generate images for all three campaign types
      const generateImagesForStage = async (stageName: string, prompt: string, aspectRatio: AspectRatio) => {
        try {
          // Generate the image with the correct function signature
          const result = await generateImages(
            `${prompt} Create a ${aspectRatio === "1:1" ? "square format (1:1)" : "vertical format (9:16)"} ad for ${stageName} campaign.`,
            aspectRatio
          );
          
          // Return the first image URL from the results if successful
          if (result.success && result.images && result.images.length > 0) {
            return result.images[0];
          } else {
            console.error(`Error generating images: ${result.error}`);
            return "";
          }
        } catch (error) {
          console.error(`Error generating images for ${stageName}:`, error);
          return "";
        }
      };
      
      // For demonstration, we'll generate real images
      // If the API calls fail, the try/catch will ensure we don't crash
      try {
        // Generate images for all three campaign types (square and vertical for each)
        const campaign1SquareResult = await generateImagesForStage(
          "Campaign 1", 
          basePrompt + " Focus on brand awareness and introduction.",
          "1:1"
        );
        
        const campaign1VerticalResult = await generateImagesForStage(
          "Campaign 1", 
          basePrompt + " Focus on brand awareness and introduction.",
          "9:16"
        );
        
        const campaign2SquareResult = await generateImagesForStage(
          "Campaign 2", 
          basePrompt + " Focus on product/service consideration and benefits.",
          "1:1"
        );
        
        const campaign2VerticalResult = await generateImagesForStage(
          "Campaign 2", 
          basePrompt + " Focus on product/service consideration and benefits.",
          "9:16"
        );
        
        const campaign3SquareResult = await generateImagesForStage(
          "Campaign 3", 
          basePrompt + " Focus on conversion with strong call-to-action.",
          "1:1"
        );
        
        const campaign3VerticalResult = await generateImagesForStage(
          "Campaign 3", 
          basePrompt + " Focus on conversion with strong call-to-action.",
          "9:16"
        );
        
        // Set the generated images
        setGeneratedImages({
          awareness: { 
            square: campaign1SquareResult || 'https://placehold.co/600x600/333/white?text=Campaign+1+Square', 
            vertical: campaign1VerticalResult || 'https://placehold.co/600x1067/333/white?text=Campaign+1+Vertical' 
          },
          consideration: { 
            square: campaign2SquareResult || 'https://placehold.co/600x600/333/white?text=Campaign+2+Square', 
            vertical: campaign2VerticalResult || 'https://placehold.co/600x1067/333/white?text=Campaign+2+Vertical' 
          },
          conversion: { 
            square: campaign3SquareResult || 'https://placehold.co/600x600/333/white?text=Campaign+3+Square', 
            vertical: campaign3VerticalResult || 'https://placehold.co/600x1067/333/white?text=Campaign+3+Vertical' 
          }
        });
      } catch (err) {
        console.error("Failed to generate one or more creatives:", err);
        // Fallback to placeholder images if generation fails
        setGeneratedImages({
          awareness: { 
            square: 'https://placehold.co/600x600/333/white?text=Campaign+1+Square', 
            vertical: 'https://placehold.co/600x1067/333/white?text=Campaign+1+Vertical' 
          },
          consideration: { 
            square: 'https://placehold.co/600x600/333/white?text=Campaign+2+Square', 
            vertical: 'https://placehold.co/600x1067/333/white?text=Campaign+2+Vertical' 
          },
          conversion: { 
            square: 'https://placehold.co/600x600/333/white?text=Campaign+3+Square', 
            vertical: 'https://placehold.co/600x1067/333/white?text=Campaign+3+Vertical' 
          }
        });
      }
      
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to generate creatives");
    } finally {
      setIsGeneratingImages(false);
    }
  };

  // Filter valid website images
  const validWebsiteImages = websiteData?.images.filter(img => !imageLoadErrors[img]) || [];

  // Function to close preview modal
  const closePreview = () => {
    setPreviewImage(null);
    setPreviewImageFormat(null);
    setPreviewStage(null);
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
                download={`campaign${previewStage === "awareness" ? "1" : previewStage === "consideration" ? "2" : "3"}-${previewImageFormat}-ad.png`}
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
            <div className="absolute top-2 left-2 flex gap-2">
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                previewImageFormat === "square" 
                  ? "bg-primary-green/80 text-black" 
                  : "bg-blue-500/80 text-white"
              }`}>
                {previewImageFormat === "square" ? "1:1 Square" : "9:16 Vertical"}
              </span>
              
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                previewStage === "awareness" 
                  ? "bg-primary-green/80 text-black"
                  : previewStage === "consideration"
                  ? "bg-blue-500/80 text-white"
                  : "bg-amber-500/80 text-black"
              }`}>
                {previewStage === "awareness" 
                  ? "Campaign 1" 
                  : previewStage === "consideration" 
                  ? "Campaign 2" 
                  : "Campaign 3"}
              </span>
            </div>
          </div>
        </div>
      )}

      <h1 className="text-3xl font-bold mb-8 text-center">AI Creative Director</h1>

      {/* Show loading screens */}
      {isLoading && !websiteData && !generatedImages && (
        <div className="max-w-5xl mx-auto bg-dark-bg border border-border-dark rounded-lg shadow-xl p-6">
          <WebsiteAnalysisLoader />
        </div>
      )}

      {/* Show initial URL input form */}
      {!websiteData && !generatedImages && !isLoading && (
        <div className="text-center">
          <h2 className="text-xl font-medium mb-4">Enter your website URL to generate ad creatives</h2>
          
          <form onSubmit={handleScrapeWebsite} className="max-w-md mx-auto">
            <Input 
              placeholder="https://yourwebsite.com" 
              className="mb-4"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
            />
            
            <Button type="submit" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Analyzing...
                </>
              ) : (
                "Analyze Website"
              )}
            </Button>
          </form>
        </div>
      )}
      
      {/* Show Website Analysis Results */}
      {websiteData && !generatedImages && !isLoading && (
        <div className="max-w-5xl mx-auto bg-dark-bg border border-border-dark rounded-lg shadow-xl p-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4 space-y-3 md:space-y-0">
            <div>
              <h2 className="text-2xl font-bold">Website Analysis</h2>
              <div className="text-xs text-gray-500 mt-1">
                Analysis for {url}
              </div>
            </div>
            <Button
              onClick={() => {
                setWebsiteData(null);
                setUrl("");
                setSelectedReferenceImages([]);
              }}
              variant="outline"
              className="border-gray-700 hover:bg-gray-800"
            >
              Start Over
            </Button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {/* Marketing Insight Report */}
            <div className="md:col-span-2 bg-gray-800/50 rounded-lg p-5 border border-gray-700">
              <h3 className="text-lg font-semibold mb-3 text-primary-green flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2">
                  <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                  <line x1="3" y1="9" x2="21" y2="9"></line>
                  <line x1="9" y1="21" x2="9" y2="9"></line>
                </svg>
                Marketing Insight Report
              </h3>
              
              <div className="prose prose-sm prose-invert max-w-none overflow-auto max-h-[500px] pr-2">
                {websiteData.contentSummary ? (
                  <div dangerouslySetInnerHTML={{ __html: websiteData.contentSummary.replace(/\n/g, '<br />') }} />
                ) : (
                  <div className="text-amber-400 flex items-center">
                    <AlertCircle className="w-4 h-4 mr-2" />
                    <span>No content analysis available</span>
                  </div>
                )}
              </div>
            </div>
            
            {/* Brand Colors and Reference Images */}
            <div className="md:col-span-1 space-y-5">
              {/* Brand Colors */}
              <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
                <h3 className="text-sm font-semibold mb-3 text-primary-green flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2">
                    <circle cx="12" cy="12" r="10"></circle>
                    <circle cx="12" cy="12" r="6"></circle>
                    <circle cx="12" cy="12" r="2"></circle>
                  </svg>
                  Brand Colors
                </h3>
                
                <div className="flex flex-wrap gap-2">
                  {websiteData.colors && websiteData.colors.length > 0 ? (
                    websiteData.colors.map((color, index) => (
                      <div key={index} className="flex flex-col items-center">
                        <div 
                          className="w-8 h-8 rounded-md border border-gray-600"
                          style={{ backgroundColor: color }}
                        ></div>
                        <span className="text-xs mt-1">{color}</span>
                      </div>
                    ))
                  ) : (
                    <div className="text-amber-400 text-xs flex items-center">
                      <AlertCircle className="w-3 h-3 mr-1" />
                      <span>No brand colors detected</span>
                    </div>
                  )}
                </div>
              </div>
              
              {/* Brand Fonts */}
              <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
                <h3 className="text-sm font-semibold mb-3 text-primary-green flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2">
                    <polyline points="4 7 4 4 20 4 20 7"></polyline>
                    <line x1="9" y1="20" x2="15" y2="20"></line>
                    <line x1="12" y1="4" x2="12" y2="20"></line>
                  </svg>
                  Brand Typography
                </h3>
                
                <div className="space-y-1">
                  {websiteData.fonts && websiteData.fonts.length > 0 ? (
                    websiteData.fonts.slice(0, 3).map((font, index) => (
                      <div key={index} className="text-sm">
                        {font}
                      </div>
                    ))
                  ) : (
                    <div className="text-amber-400 text-xs flex items-center">
                      <AlertCircle className="w-3 h-3 mr-1" />
                      <span>No fonts detected</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
          
          {/* Reference Images Section */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-3 flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2 text-blue-400">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                <circle cx="8.5" cy="8.5" r="1.5"></circle>
                <polyline points="21 15 16 10 5 21"></polyline>
              </svg>
              Reference Images
              <span className="text-xs font-normal ml-2 text-gray-400">(Select up to 4 images to use as reference)</span>
            </h3>
            
            {websiteData.images && websiteData.images.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                {websiteData.images.map((img, idx) => !imageLoadErrors[img] && (
                  <div 
                    key={idx}
                    className={`relative aspect-square rounded-lg overflow-hidden border-2 cursor-pointer transition-all ${
                      selectedReferenceImages.includes(img) ? 'border-primary-green scale-95 ring-1 ring-primary-green' : 'border-transparent hover:border-gray-500'
                    }`}
                    onClick={() => toggleReferenceImage(img)}
                  >
                    <img 
                      src={img} 
                      alt={`Website image ${idx + 1}`} 
                      className="w-full h-full object-cover"
                      onError={() => handleImageError(img)}
                    />
                    {selectedReferenceImages.includes(img) && (
                      <div className="absolute top-2 right-2 bg-primary-green rounded-full p-1">
                        <Check className="h-4 w-4 text-black" />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700 text-amber-400 flex items-center">
                <AlertCircle className="w-5 h-5 mr-2" />
                <span>No reference images were found on the website</span>
              </div>
            )}
          </div>
          
          {/* Generate Creatives Button */}
          <div className="flex justify-center mt-8">
            <Button
              onClick={handleGenerateCreatives}
              disabled={isGeneratingImages}
              className="bg-primary-green hover:bg-primary-green/90 text-black font-semibold px-10 py-6 text-lg shadow-lg shadow-primary-green/30"
            >
              {isGeneratingImages ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Generating Creatives...
                </>
              ) : (
                <>
                  <ImageIcon className="mr-2 h-5 w-5" />
                  Generate Ad Creatives
                </>
              )}
            </Button>
          </div>
        </div>
      )}

      {/* Show campaign options after generation */}
      {generatedImages && (
        <div className="space-y-8">
          {/* Show subscription screen after selecting campaigns */}
          {showSubscribeScreen && (
            <div className="border border-primary-green/40 rounded-xl p-8 relative overflow-hidden">
              {/* Gradient background */}
              <div className="absolute inset-0 bg-gradient-to-br from-primary-green/20 via-blue-600/20 to-purple-800/30 z-0"></div>
              {/* Glow effects */}
              <div className="absolute -top-20 -left-20 w-64 h-64 bg-primary-green/10 rounded-full blur-3xl"></div>
              <div className="absolute -bottom-20 -right-20 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl"></div>
              
              <div className="relative z-10">
                <div className="flex flex-col items-center text-center mb-8">
                  {/* Status badge */}
                  <div className="mb-3 bg-primary-green/20 border border-primary-green/30 rounded-full px-4 py-1 flex items-center gap-2">
                    <div className="bg-primary-green rounded-full p-1">
                      <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-black">
                        <path d="M20 6 9 17l-5-5"></path>
                      </svg>
                    </div>
                    <span className="text-sm font-medium text-primary-green">AI Campaign Creation Complete!</span>
                  </div>
                
                  {/* Main heading with highlight */}
                  <h2 className="font-bold text-2xl md:text-3xl mb-2 bg-clip-text text-transparent bg-gradient-to-r from-primary-green to-blue-400">
                    {selectedCampaigns.campaign1 && selectedCampaigns.campaign2 && selectedCampaigns.campaign3 
                      ? "3 Ready-to-Launch Meta Ad Campaigns"
                      : selectedCampaigns.campaign1 && selectedCampaigns.campaign2 
                      ? "2 Ready-to-Launch Meta Ad Campaigns"
                      : selectedCampaigns.campaign1 && selectedCampaigns.campaign3
                      ? "2 Ready-to-Launch Meta Ad Campaigns"
                      : selectedCampaigns.campaign2 && selectedCampaigns.campaign3
                      ? "2 Ready-to-Launch Meta Ad Campaigns"
                      : "1 Ready-to-Launch Meta Ad Campaign"}
                  </h2>
                  
                  {/* One-click callout */}
                  <div className="flex items-center gap-2 mb-3">
                    <div className="h-6 w-6 bg-primary-green rounded-full flex items-center justify-center text-black font-bold text-sm">1</div>
                    <span className="text-lg font-medium text-white">Click Launch to Start Running Your Ads</span>
                  </div>
                  
                  <p className="text-base text-gray-300 max-w-2xl mb-6">
                    Your website has been analyzed and our AI has created <span className="text-primary-green font-medium">complete campaigns</span> with all required settings:
                  </p>
                
                  {/* Campaign settings section */}
                  <div className="w-full max-w-4xl mx-auto">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                      <div className="bg-blue-500/20 border border-blue-500/30 rounded-md p-3">
                        <div className="text-blue-300 font-medium flex items-center justify-center text-sm mb-1">
                          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1.5">
                            <path d="M12 20h9"></path>
                            <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path>
                          </svg>
                          AI-Written Ad Copy
                        </div>
                        <div className="text-xs text-blue-200/70 text-center">✓ Headlines & Descriptions</div>
                      </div>
                      
                      <div className="bg-amber-500/20 border border-amber-500/30 rounded-md p-3">
                        <div className="text-amber-300 font-medium flex items-center justify-center text-sm mb-1">
                          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1.5">
                            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                            <circle cx="9" cy="7" r="4"></circle>
                            <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                            <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                          </svg>
                          Detailed Targeting
                        </div>
                        <div className="text-xs text-amber-200/70 text-center">✓ Interests & Demographics</div>
                      </div>
                      
                      <div className="bg-green-500/20 border border-green-500/30 rounded-md p-3">
                        <div className="text-green-300 font-medium flex items-center justify-center text-sm mb-1">
                          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1.5">
                            <circle cx="12" cy="12" r="10"></circle>
                            <path d="M16 8h-6a2 2 0 1 0 0 4h4a2 2 0 1 1 0 4H8"></path>
                            <path d="M12 18V6"></path>
                          </svg>
                          Budget Optimization
                        </div>
                        <div className="text-xs text-green-200/70 text-center">✓ Maximum ROI Settings</div>
                      </div>
                      
                      <div className="bg-purple-500/20 border border-purple-500/30 rounded-md p-3">
                        <div className="text-purple-300 font-medium flex items-center justify-center text-sm mb-1">
                          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1.5">
                            <rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect>
                            <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path>
                          </svg>
                          Placement Settings
                        </div>
                        <div className="text-xs text-purple-200/70 text-center">✓ Optimized for All Devices</div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Meta Ads Logo and Campaign Status */}
                  <div className="flex items-center gap-3 mb-5 bg-white/5 rounded-lg px-4 py-2 border border-white/10">
                    <img src="/Reeplylogoicon.png" alt="Reeply Logo" className="h-6 w-6" />
                    <div className="h-2 w-2 bg-primary-green rounded-full animate-pulse"></div>
                    <span className="text-white/90 font-medium">All Meta Campaign Settings Ready</span>
                  </div>
                  
                  {/* CTA button */}
                  <Button
                    className="bg-primary-green hover:bg-primary-green/90 text-black font-semibold px-10 py-6 text-lg shadow-lg shadow-primary-green/30 transition-all hover:scale-105"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2">
                      <path d="M5 12h14"></path>
                      <path d="m12 5 7 7-7 7"></path>
                    </svg>
                    Unlock & Launch Campaigns
                  </Button>
                  
                  <p className="text-xs text-gray-400 mt-3">
                    Subscribe to unlock all campaign settings and launch immediately
                  </p>
                  
                  {/* Back to selection link */}
                  <p className="mt-5">
                    <button 
                      onClick={() => setShowSubscribeScreen(false)}
                      className="text-sm text-blue-400 hover:text-blue-300 flex items-center gap-1"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="m15 18-6-6 6-6"></path>
                      </svg>
                      Back to campaign selection
                    </button>
                  </p>
                </div>
              </div>
            </div>
          )}
          
          <div className="bg-dark-bg border border-border-dark p-6 rounded-lg">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4 space-y-3 md:space-y-0">
              <div>
                <h2 className="text-2xl font-bold">AI-Generated Ad Campaigns</h2>
                <div className="text-xs text-gray-500 mt-1">
                  Optimized for {url}
                </div>
              </div>
              <Button
                onClick={() => {
                  setGeneratedImages(null);
                  setWebsiteData(null);
                  setUrl("");
                  setSelectedReferenceImages([]);
                }}
                variant="outline"
                className="border-gray-700 hover:bg-gray-800"
              >
                Start Over
              </Button>
            </div>
            
            {!showSubscribeScreen && (
              <div className="mb-6 bg-gradient-to-r from-primary-green/10 to-blue-500/10 rounded-lg p-4 border border-primary-green/20">
                <div className="flex items-center gap-3 mb-1">
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary-green">
                    <path d="M20 6 9 17l-5-5"></path>
                  </svg>
                  <h3 className="text-lg font-semibold text-primary-green">3 Meta Ad Campaigns Ready</h3>
                </div>
                <p className="text-sm text-gray-300 ml-7">Select one or more campaigns below to launch</p>
              </div>
            )}
            
            {/* Campaign selection section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
              {/* Campaign 1 */}
              <div className={`bg-gray-800/30 rounded-xl border ${selectedCampaigns.campaign1 ? 'border-primary-green' : 'border-gray-700'} p-4 transition-all ${selectedCampaigns.campaign1 ? 'ring-1 ring-primary-green' : ''}`}>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center">
                    <div className="w-7 h-7 bg-primary-green rounded-full text-black font-bold flex items-center justify-center mr-2.5">1</div>
                    <h3 className="text-lg font-bold">Campaign 1</h3>
                  </div>
                  
                  <div 
                    className={`w-6 h-6 rounded border ${selectedCampaigns.campaign1 ? 'bg-primary-green border-primary-green' : 'border-gray-400'} flex items-center justify-center cursor-pointer`}
                    onClick={() => setSelectedCampaigns(prev => ({...prev, campaign1: !prev.campaign1}))}
                  >
                    {selectedCampaigns.campaign1 && (
                      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-black">
                        <path d="M20 6 9 17l-5-5"></path>
                      </svg>
                    )}
                  </div>
                </div>
                
                {/* Campaign 1 content with real images */}
                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div 
                    className="aspect-square bg-gray-700 rounded-lg overflow-hidden cursor-pointer hover:opacity-90 transition-opacity"
                    onClick={() => {
                      if (generatedImages?.awareness?.square) {
                        setPreviewImage(generatedImages.awareness.square);
                        setPreviewImageFormat("square");
                        setPreviewStage("awareness");
                      }
                    }}
                  >
                    {generatedImages?.awareness?.square && (
                      <img 
                        src={generatedImages.awareness.square} 
                        alt="Campaign 1 square ad" 
                        className="w-full h-full object-cover"
                      />
                    )}
                  </div>
                  <div 
                    className="aspect-[9/16] bg-gray-700 rounded-lg overflow-hidden cursor-pointer hover:opacity-90 transition-opacity"
                    onClick={() => {
                      if (generatedImages?.awareness?.vertical) {
                        setPreviewImage(generatedImages.awareness.vertical);
                        setPreviewImageFormat("vertical");
                        setPreviewStage("awareness");
                      }
                    }}
                  >
                    {generatedImages?.awareness?.vertical && (
                      <img 
                        src={generatedImages.awareness.vertical} 
                        alt="Campaign 1 vertical ad" 
                        className="w-full h-full object-cover"
                      />
                    )}
                  </div>
                </div>
                
                {/* Campaign Settings */}
                <div className="mt-3 border-t border-gray-700 pt-3">
                  <h4 className="text-sm font-semibold mb-2 flex items-center">
                    <span className="w-3 h-3 bg-primary-green/80 rounded-full mr-1.5"></span>
                    AI-Generated Campaign Settings
                  </h4>
                  
                  <div className="grid grid-cols-2 gap-2 text-[10px]">
                    <div className="flex flex-col">
                      <span className="text-blue-300 font-medium">Ad Copy</span>
                      <span className="text-gray-400">✓ AI Generated</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-amber-300 font-medium">Targeting</span>
                      <span className="text-gray-400">✓ AI Generated</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-green-300 font-medium">Budget</span>
                      <span className="text-gray-400">✓ Freely Choosable</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-purple-300 font-medium">Placement</span>
                      <span className="text-gray-400">✓ AI Generated</span>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Campaign 2 */}
              <div className={`bg-gray-800/30 rounded-xl border ${selectedCampaigns.campaign2 ? 'border-blue-500' : 'border-gray-700'} p-4 transition-all ${selectedCampaigns.campaign2 ? 'ring-1 ring-blue-500' : ''}`}>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center">
                    <div className="w-7 h-7 bg-blue-500 rounded-full text-white font-bold flex items-center justify-center mr-2.5">2</div>
                    <h3 className="text-lg font-bold">Campaign 2</h3>
                  </div>
                  
                  <div 
                    className={`w-6 h-6 rounded border ${selectedCampaigns.campaign2 ? 'bg-blue-500 border-blue-500' : 'border-gray-400'} flex items-center justify-center cursor-pointer`}
                    onClick={() => setSelectedCampaigns(prev => ({...prev, campaign2: !prev.campaign2}))}
                  >
                    {selectedCampaigns.campaign2 && (
                      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white">
                        <path d="M20 6 9 17l-5-5"></path>
                      </svg>
                    )}
                  </div>
                </div>
                
                {/* Campaign 2 content with real images */}
                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div 
                    className="aspect-square bg-gray-700 rounded-lg overflow-hidden cursor-pointer hover:opacity-90 transition-opacity"
                    onClick={() => {
                      if (generatedImages?.consideration?.square) {
                        setPreviewImage(generatedImages.consideration.square);
                        setPreviewImageFormat("square");
                        setPreviewStage("consideration");
                      }
                    }}
                  >
                    {generatedImages?.consideration?.square && (
                      <img 
                        src={generatedImages.consideration.square} 
                        alt="Campaign 2 square ad" 
                        className="w-full h-full object-cover"
                      />
                    )}
                  </div>
                  <div 
                    className="aspect-[9/16] bg-gray-700 rounded-lg overflow-hidden cursor-pointer hover:opacity-90 transition-opacity"
                    onClick={() => {
                      if (generatedImages?.consideration?.vertical) {
                        setPreviewImage(generatedImages.consideration.vertical);
                        setPreviewImageFormat("vertical");
                        setPreviewStage("consideration");
                      }
                    }}
                  >
                    {generatedImages?.consideration?.vertical && (
                      <img 
                        src={generatedImages.consideration.vertical} 
                        alt="Campaign 2 vertical ad" 
                        className="w-full h-full object-cover"
                      />
                    )}
                  </div>
                </div>
                
                {/* Campaign Settings */}
                <div className="mt-3 border-t border-gray-700 pt-3">
                  <h4 className="text-sm font-semibold mb-2 flex items-center">
                    <span className="w-3 h-3 bg-blue-500/80 rounded-full mr-1.5"></span>
                    AI-Generated Campaign Settings
                  </h4>
                  
                  <div className="grid grid-cols-2 gap-2 text-[10px]">
                    <div className="flex flex-col">
                      <span className="text-blue-300 font-medium">Ad Copy</span>
                      <span className="text-gray-400">✓ AI Generated</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-amber-300 font-medium">Targeting</span>
                      <span className="text-gray-400">✓ AI Generated</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-green-300 font-medium">Budget</span>
                      <span className="text-gray-400">✓ Freely Choosable</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-purple-300 font-medium">Placement</span>
                      <span className="text-gray-400">✓ AI Generated</span>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Campaign 3 */}
              <div className={`bg-gray-800/30 rounded-xl border ${selectedCampaigns.campaign3 ? 'border-amber-500' : 'border-gray-700'} p-4 transition-all ${selectedCampaigns.campaign3 ? 'ring-1 ring-amber-500' : ''}`}>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center">
                    <div className="w-7 h-7 bg-amber-500 rounded-full text-black font-bold flex items-center justify-center mr-2.5">3</div>
                    <h3 className="text-lg font-bold">Campaign 3</h3>
                  </div>
                  
                  <div 
                    className={`w-6 h-6 rounded border ${selectedCampaigns.campaign3 ? 'bg-amber-500 border-amber-500' : 'border-gray-400'} flex items-center justify-center cursor-pointer`}
                    onClick={() => setSelectedCampaigns(prev => ({...prev, campaign3: !prev.campaign3}))}
                  >
                    {selectedCampaigns.campaign3 && (
                      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-black">
                        <path d="M20 6 9 17l-5-5"></path>
                      </svg>
                    )}
                  </div>
                </div>
                
                {/* Campaign 3 content with real images */}
                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div 
                    className="aspect-square bg-gray-700 rounded-lg overflow-hidden cursor-pointer hover:opacity-90 transition-opacity"
                    onClick={() => {
                      if (generatedImages?.conversion?.square) {
                        setPreviewImage(generatedImages.conversion.square);
                        setPreviewImageFormat("square");
                        setPreviewStage("conversion");
                      }
                    }}
                  >
                    {generatedImages?.conversion?.square && (
                      <img 
                        src={generatedImages.conversion.square} 
                        alt="Campaign 3 square ad" 
                        className="w-full h-full object-cover"
                      />
                    )}
                  </div>
                  <div 
                    className="aspect-[9/16] bg-gray-700 rounded-lg overflow-hidden cursor-pointer hover:opacity-90 transition-opacity"
                    onClick={() => {
                      if (generatedImages?.conversion?.vertical) {
                        setPreviewImage(generatedImages.conversion.vertical);
                        setPreviewImageFormat("vertical");
                        setPreviewStage("conversion");
                      }
                    }}
                  >
                    {generatedImages?.conversion?.vertical && (
                      <img 
                        src={generatedImages.conversion.vertical} 
                        alt="Campaign 3 vertical ad" 
                        className="w-full h-full object-cover"
                      />
                    )}
                  </div>
                </div>
                
                {/* Campaign Settings */}
                <div className="mt-3 border-t border-gray-700 pt-3">
                  <h4 className="text-sm font-semibold mb-2 flex items-center">
                    <span className="w-3 h-3 bg-amber-500/80 rounded-full mr-1.5"></span>
                    AI-Generated Campaign Settings
                  </h4>
                  
                  <div className="grid grid-cols-2 gap-2 text-[10px]">
                    <div className="flex flex-col">
                      <span className="text-blue-300 font-medium">Ad Copy</span>
                      <span className="text-gray-400">✓ AI Generated</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-amber-300 font-medium">Targeting</span>
                      <span className="text-gray-400">✓ AI Generated</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-green-300 font-medium">Budget</span>
                      <span className="text-gray-400">✓ Freely Choosable</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-purple-300 font-medium">Placement</span>
                      <span className="text-gray-400">✓ AI Generated</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Launch button */}
            {!showSubscribeScreen && (
              <div className="col-span-1 lg:col-span-3 flex flex-col items-center mt-2 mb-6">
                <Button
                  onClick={() => {
                    // Only show subscribe screen if at least one campaign is selected
                    if (selectedCampaigns.campaign1 || selectedCampaigns.campaign2 || selectedCampaigns.campaign3) {
                      setShowSubscribeScreen(true);
                    }
                  }}
                  disabled={!selectedCampaigns.campaign1 && !selectedCampaigns.campaign2 && !selectedCampaigns.campaign3}
                  className="bg-primary-green hover:bg-primary-green/90 text-black font-semibold px-10 py-6 text-lg shadow-lg shadow-primary-green/30 disabled:bg-gray-600 disabled:text-gray-300 disabled:cursor-not-allowed"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2">
                    <path d="M5 12h14"></path>
                    <path d="m12 5 7 7-7 7"></path>
                  </svg>
                  Launch Selected Campaigns
                </Button>
                {!selectedCampaigns.campaign1 && !selectedCampaigns.campaign2 && !selectedCampaigns.campaign3 && (
                  <p className="text-sm text-gray-400 mt-2">Select at least one campaign to continue</p>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}