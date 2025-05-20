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
  // Organized by funnel stage and format
  const [generatedImages, setGeneratedImages] = useState<{
    awareness: { square: string; vertical: string };
    consideration: { square: string; vertical: string };
    conversion: { square: string; vertical: string };
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [imageLoadErrors, setImageLoadErrors] = useState<Record<string, boolean>>({});
  const [selectedReferenceImages, setSelectedReferenceImages] = useState<string[]>([]);
  const [useReferenceImages, setUseReferenceImages] = useState<boolean>(true);
  
  // New state for large image preview modal
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [previewImageFormat, setPreviewImageFormat] = useState<"square" | "vertical" | null>(null);
  const [previewStage, setPreviewStage] = useState<"awareness" | "consideration" | "conversion" | null>(null);

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
      
      // First step: Show appropriate loading message
      setError("Analyzing website structure and content...");
      
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
      
      // Add a loading message during AI processing
      setError("Generating brand analysis report...");
      
      // Before displaying the results, add a deliberate delay to ensure
      // the AI has enough time to complete its analysis
      // This helps prevent seeing incomplete content
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Clear error message and set the data
      setError(null);
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

      // Create the base prompt that will be customized for each funnel stage
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

      // Add reference to website images in the prompt if we aren't using them directly
      let additionalInfo = "";
      if (validWebsiteImages.length > 0 && !useReferenceImages) {
        additionalInfo = `\nThe website contains images that showcase: ${
          validWebsiteImages.length === 1 
          ? "a specific visual element that should inspire your design" 
          : "specific visual elements that should inspire your design"
        }.`;
      }
      
      // Add campaign goals information to the prompt
      let campaignGoalInfo = "\nThe campaign goals are:";
      
      // Check each goal and add specific instructions
      if (campaignGoals.leads) {
        campaignGoalInfo += `\n- GENERATE LEADS: Focus on encouraging sign-ups, contact form submissions, or consultations. Design creatives that emphasize the value of taking immediate action and highlight lead magnets or offers.`;
      }
      
      if (campaignGoals.emails) {
        campaignGoalInfo += `\n- INCREASE EMAIL SUBSCRIBERS: Design creatives that promote newsletter benefits, exclusive content, or special offers available only to subscribers. Focus on making the email subscription process seem valuable and low-friction.`;
      }
      
      if (campaignGoals.sales) {
        campaignGoalInfo += `\n- DRIVE SALES: Create creatives that showcase products/services, emphasize unique selling propositions, and include strong purchase CTAs. Focus on benefits, social proof, and urgency to drive immediate purchase decisions.`;
      }
      
      if (campaignGoals.brand) {
        campaignGoalInfo += `\n- BUILD BRAND AWARENESS: Design creatives that communicate the brand's personality, values, and story. Focus on memorable visuals and messaging that will stick in the audience's mind, even if they don't take immediate action.`;
      }
      
      if (campaignGoals.recruiting) {
        campaignGoalInfo += `\n- RECRUITING: Create creatives focused on attracting potential job candidates. Highlight company culture, benefits, growth opportunities, and what makes the workplace unique. Use language that appeals to job seekers and emphasizes the value of joining the team.`;
      }
      
      // If no goals selected, default to leads
      if (!campaignGoals.leads && !campaignGoals.emails && !campaignGoals.sales && !campaignGoals.brand && !campaignGoals.recruiting) {
        campaignGoalInfo = `\nThe primary campaign goal is to GENERATE LEADS. Focus on encouraging sign-ups, contact form submissions, or consultations. Design creatives that emphasize the value of taking immediate action and highlight lead magnets or offers.`;
      }
      
      // Combine additional info
      additionalInfo = additionalInfo + campaignGoalInfo;
      
      // Process reference images if selected
      let base64Images: string[] = [];
      if (useReferenceImages && selectedReferenceImages.length > 0) {
        setError("Converting reference images... please wait");
        
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
      }

      // Funnel stage specific prompts
      const funnelStagePrompts = {
        awareness: {
          square: `${basePrompt}${additionalInfo}
**AWARENESS STAGE CREATIVE**
This ad is for the top of the funnel to build brand awareness:
- Focus on making a memorable first impression
- Highlight a broad problem or opportunity
- Introduce the brand without specifics of products/services 
- Use eye-catching visuals that convey the brand's personality
- Create emotional impact without expecting immediate conversion
- Aim for broad appeal within the target audience
- Keep text minimal and focus on bold visuals
- Leave the audience wanting to learn more

Output: a realistic, high-resolution square (1:1) ad image optimized for awareness stage marketing.`,

          vertical: `${basePrompt}${additionalInfo}
**AWARENESS STAGE CREATIVE**
This ad is for the top of the funnel to build brand awareness:
- Focus on making a memorable first impression
- Highlight a broad problem or opportunity
- Introduce the brand without specifics of products/services 
- Use eye-catching visuals that convey the brand's personality
- Create emotional impact without expecting immediate conversion
- Aim for broad appeal within the target audience
- Keep text minimal and focus on bold visuals
- Leave the audience wanting to learn more

Output: a realistic, high-resolution vertical (9:16) ad image optimized for awareness stage marketing on reels and stories.`
        },
        
        consideration: {
          square: `${basePrompt}${additionalInfo}
**CONSIDERATION STAGE CREATIVE**
This ad is for the middle of the funnel to build interest and consideration:
- Focus on specific problems and solutions
- Highlight key benefits and unique selling propositions
- Show how your product/service solves specific pain points
- Include more detailed information than awareness ads
- Use visuals that demonstrate the product/service in context
- Appeal to both emotional and rational decision-making
- Include clear benefits bulleted or numbered if appropriate
- Use a CTA that encourages learning more (like "Discover How" or "See Why")

Output: a realistic, high-resolution square (1:1) ad image optimized for consideration stage marketing.`,

          vertical: `${basePrompt}${additionalInfo}
**CONSIDERATION STAGE CREATIVE**
This ad is for the middle of the funnel to build interest and consideration:
- Focus on specific problems and solutions
- Highlight key benefits and unique selling propositions
- Show how your product/service solves specific pain points
- Include more detailed information than awareness ads
- Use visuals that demonstrate the product/service in context
- Appeal to both emotional and rational decision-making
- Include clear benefits bulleted or numbered if appropriate
- Use a CTA that encourages learning more (like "Discover How" or "See Why")

Output: a realistic, high-resolution vertical (9:16) ad image optimized for consideration stage marketing on reels and stories.`
        },
        
        conversion: {
          square: `${basePrompt}${additionalInfo}
**CONVERSION STAGE CREATIVE**
This ad is for the bottom of the funnel to drive conversions:
- Focus on creating urgency and prompting immediate action
- Include specific offers, promotions, or limited-time deals
- Highlight social proof, testimonials, or results
- Show the product/service with clear value proposition
- Address final objections or hesitations
- Use strong, action-oriented language
- Include a very direct CTA (like "Buy Now," "Sign Up Today," or "Claim Offer")
- Create a sense of FOMO (fear of missing out)

Output: a realistic, high-resolution square (1:1) ad image optimized for conversion stage marketing.`,

          vertical: `${basePrompt}${additionalInfo}
**CONVERSION STAGE CREATIVE**
This ad is for the bottom of the funnel to drive conversions:
- Focus on creating urgency and prompting immediate action
- Include specific offers, promotions, or limited-time deals
- Highlight social proof, testimonials, or results
- Show the product/service with clear value proposition
- Address final objections or hesitations
- Use strong, action-oriented language
- Include a very direct CTA (like "Buy Now," "Sign Up Today," or "Claim Offer")
- Create a sense of FOMO (fear of missing out)

Output: a realistic, high-resolution vertical (9:16) ad image optimized for conversion stage marketing on reels and stories.`
        }
      };

      // Object to store our results
      const funnelStageResults: {
        awareness: { square: string; vertical: string };
        consideration: { square: string; vertical: string };
        conversion: { square: string; vertical: string };
      } = {
        awareness: { square: '', vertical: '' },
        consideration: { square: '', vertical: '' },
        conversion: { square: '', vertical: '' }
      };

      // Generate images for each funnel stage and format
      for (const stage of ['awareness', 'consideration', 'conversion'] as const) {
        // Generate square format image
        setError(`Generating ${stage} stage square image (1:1)...`);
        let squareResult;
        
        if (useReferenceImages && base64Images.length > 0) {
          squareResult = await generateImageVariation(
            base64Images,
            "1:1" as AspectRatio,
            1,
            funnelStagePrompts[stage].square
          );
        } else {
          squareResult = await generateImages(
            funnelStagePrompts[stage].square, 
            "1:1" as AspectRatio, 
            1
          );
        }
        
        if (squareResult.success && squareResult.images && squareResult.images.length > 0) {
          funnelStageResults[stage].square = squareResult.images[0];
        } else {
          throw new Error(`Failed to generate ${stage} stage square image: ${squareResult.error || 'Unknown error'}`);
        }
        
        // Generate vertical format image
        setError(`Generating ${stage} stage vertical image (9:16)...`);
        let verticalResult;
        
        if (useReferenceImages && base64Images.length > 0) {
          verticalResult = await generateImageVariation(
            base64Images,
            "9:16" as AspectRatio,
            1,
            funnelStagePrompts[stage].vertical
          );
        } else {
          verticalResult = await generateImages(
            funnelStagePrompts[stage].vertical, 
            "9:16" as AspectRatio, 
            1
          );
        }
        
        if (verticalResult.success && verticalResult.images && verticalResult.images.length > 0) {
          funnelStageResults[stage].vertical = verticalResult.images[0];
        } else {
          throw new Error(`Failed to generate ${stage} stage vertical image: ${verticalResult.error || 'Unknown error'}`);
        }
      }
      
      // Update the state with all generated images
      setGeneratedImages(funnelStageResults);
      
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
                download={`${previewStage}-${previewImageFormat}-ad.png`}
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
                  ? "Awareness" 
                  : previewStage === "consideration" 
                  ? "Consideration" 
                  : "Conversion"}
              </span>
            </div>
          </div>
        </div>
      )}

      <h1 className="text-3xl font-bold mb-4 text-center">AI Creative Director</h1>
      <p className="text-lg text-gray-500 mb-8 text-center">
        Enter your website URL and get instant ad creatives tailored to your brand
      </p>

      {/* ===== STEP 1: Initial URL Input ===== */}
      {!websiteData && !generatedImages && (
        <div className="max-w-5xl mx-auto">
          {/* Get Started with Reeply AI Card */}
          <div className="relative overflow-hidden rounded-xl bg-dark-bg border border-border-dark shadow-xl">
            <div className="absolute top-0 left-0 w-full h-full bg-[url('/Reeplylogoicon.png')] bg-no-repeat bg-right-bottom opacity-5 bg-contain"></div>
            
            {/* Top content section */}
            <div className="px-8 pt-8 pb-4 relative z-10">
              <div className="inline-block bg-primary-green/20 text-primary-green text-xs px-3 py-1 rounded-full font-medium mb-4">
                AI Creative Director
              </div>
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-2">Get Started With Reeply AI</h2>
              <h3 className="text-xl md:text-2xl font-medium text-gray-300 mb-5">Start your first project</h3>
              <p className="text-gray-400 mb-6 leading-relaxed">
                Reeply AI analyzes your website to create a comprehensive marketing strategy and professional ad creatives. 
                Our advanced AI scrapes your brand&apos;s visual identity, messaging, and key selling points to deliver 
                customized marketing assets that perfectly match your brand and campaign goals.
              </p>
              <div className="flex flex-wrap gap-x-6 gap-y-3 mb-2">
                <div className="flex items-center text-gray-300">
                  <Check className="h-5 w-5 mr-2 text-primary-green" />
                  <span>Brand-matched designs</span>
                </div>
                <div className="flex items-center text-gray-300">
                  <Check className="h-5 w-5 mr-2 text-primary-green" />
                  <span>Multiple ad formats</span>
                </div>
                <div className="flex items-center text-gray-300">
                  <Check className="h-5 w-5 mr-2 text-primary-green" />
                  <span>Full funnel creatives</span>
                </div>
                <div className="flex items-center text-gray-300">
                  <Check className="h-5 w-5 mr-2 text-primary-green" />
                  <span>Campaign-specific targeting</span>
                </div>
              </div>
            </div>
            
            {/* Input form section */}
            <div className="px-8 pb-8 relative z-10">
              <div className="mt-6 p-6 bg-gray-800/50 rounded-xl border border-border-dark">
                <form onSubmit={handleScrapeWebsite} className="space-y-5">
                  <h4 className="text-lg font-semibold text-gray-200 mb-4">Enter your details to generate ad creatives</h4>
                  
                  {/* URL + Campaign Goal Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                    <div className="md:col-span-2">
                      <label htmlFor="website-url" className="block text-sm font-medium mb-2 text-gray-300">
                        Website URL
                      </label>
                      <Input 
                        id="website-url" 
                        placeholder="https://yourwebsite.com" 
                        className="w-full bg-dark-bg border-border-dark text-white placeholder:text-gray-500 focus-visible:ring-primary-green"
                        value={url}
                        onChange={(e) => setUrl(e.target.value)}
                      />
                      <p className="mt-2 text-xs text-gray-500">
                        Enter your full website URL including https://
                      </p>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium mb-3 text-gray-300">
                        Campaign Goals
                      </label>
                      
                      <div className="space-y-3">
                        <div className="flex items-center">
                          <input 
                            type="checkbox" 
                            id="goal-leads" 
                            checked={campaignGoals.leads}
                            onChange={() => setCampaignGoals(prev => ({...prev, leads: !prev.leads}))}
                            className="h-4 w-4 rounded border-gray-600 text-primary-green focus:ring-primary-green focus:ring-offset-0 bg-dark-bg"
                          />
                          <label htmlFor="goal-leads" className="ml-2 text-sm text-gray-300">Get more Leads</label>
                        </div>
                        
                        <div className="flex items-center">
                          <input 
                            type="checkbox" 
                            id="goal-emails" 
                            checked={campaignGoals.emails}
                            onChange={() => setCampaignGoals(prev => ({...prev, emails: !prev.emails}))}
                            className="h-4 w-4 rounded border-gray-600 text-primary-green focus:ring-primary-green focus:ring-offset-0 bg-dark-bg"
                          />
                          <label htmlFor="goal-emails" className="ml-2 text-sm text-gray-300">Increase Email subscribers</label>
                        </div>
                        
                        <div className="flex items-center">
                          <input 
                            type="checkbox" 
                            id="goal-sales" 
                            checked={campaignGoals.sales}
                            onChange={() => setCampaignGoals(prev => ({...prev, sales: !prev.sales}))}
                            className="h-4 w-4 rounded border-gray-600 text-primary-green focus:ring-primary-green focus:ring-offset-0 bg-dark-bg"
                          />
                          <label htmlFor="goal-sales" className="ml-2 text-sm text-gray-300">Make more Sales</label>
                        </div>
                        
                        <div className="flex items-center">
                          <input 
                            type="checkbox" 
                            id="goal-brand" 
                            checked={campaignGoals.brand}
                            onChange={() => setCampaignGoals(prev => ({...prev, brand: !prev.brand}))}
                            className="h-4 w-4 rounded border-gray-600 text-primary-green focus:ring-primary-green focus:ring-offset-0 bg-dark-bg"
                          />
                          <label htmlFor="goal-brand" className="ml-2 text-sm text-gray-300">Brand awareness</label>
                        </div>
                        
                        <div className="flex items-center">
                          <input 
                            type="checkbox" 
                            id="goal-recruiting" 
                            checked={campaignGoals.recruiting}
                            onChange={() => setCampaignGoals(prev => ({...prev, recruiting: !prev.recruiting}))}
                            className="h-4 w-4 rounded border-gray-600 text-primary-green focus:ring-primary-green focus:ring-offset-0 bg-dark-bg"
                          />
                          <label htmlFor="goal-recruiting" className="ml-2 text-sm text-gray-300">Recruiting</label>
                        </div>
                      </div>
                      
                      <p className="mt-3 text-xs text-gray-500">
                        Select one or more campaign objectives
                      </p>
                    </div>
                  </div>
                  
                  {error && (
                    <div className="bg-red-900/30 text-red-300 px-4 py-3 rounded-md text-sm border border-red-900 flex items-center">
                      <AlertCircle className="h-4 w-4 mr-2" />
                      {error}
                    </div>
                  )}

                  <Button 
                    type="submit" 
                    className="w-full h-12 bg-primary-green hover:bg-primary-green/90 text-black text-lg font-semibold mt-4"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                        Analyzing...
                      </>
                    ) : (
                      <>
                        Analyze Website
                        <ArrowRight className="ml-2 h-5 w-5" />
                      </>
                    )}
                  </Button>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ===== STEP 2: Website Analysis and Reference Image Selection ===== */}
      {websiteData && !generatedImages && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left column - Analysis report and brand assets */}
          <div className="lg:col-span-7 space-y-6">
            {/* Website analysis report */}
            <Card className="bg-dark-bg border-border-dark shadow-lg overflow-hidden">
              <CardHeader className="border-b border-gray-800">
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle className="text-xl flex items-center gap-2">
                      <div className="w-1 h-6 bg-primary-green rounded mr-2"></div>
                      Brand Analysis Report
                    </CardTitle>
                    <CardDescription className="mt-1">
                      Details extracted from <a href={url} target="_blank" rel="noopener noreferrer" className="font-medium text-primary-green hover:underline inline-flex items-center gap-1">
                        {url} <ExternalLink className="h-3 w-3" />
                      </a>
                    </CardDescription>
                  </div>
                  <div className="bg-primary-green/20 text-primary-green text-xs px-3 py-1 rounded-full font-medium">
                    AI-Powered Analysis
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="bg-gray-800/50 p-5 rounded-md max-h-[65vh] overflow-y-auto border border-gray-700 shadow-inner">
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
              </CardContent>
              <div className="px-6 py-4 bg-primary-green/10 border-t border-primary-green/30 mt-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-primary-green flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2">
                      <circle cx="12" cy="12" r="10" />
                      <path d="M12 16v.01" />
                      <path d="M12 8v4" />
                    </svg>
                    <span className="font-semibold">Analysis complete. Select reference images to proceed.</span>
                  </p>
                </div>
              </div>
            </Card>

            {/* Brand assets section */}
            <Card className="bg-dark-bg border-border-dark shadow-lg overflow-hidden">
              <CardContent className="space-y-6 pt-6 pb-6">
                <div>
                  <h3 className="text-md font-semibold mb-3 flex items-center">
                    <div className="w-4 h-4 bg-primary-green/60 rounded-full mr-2"></div>
                    Brand Colors
                  </h3>
                  <div className="grid grid-cols-4 gap-3">
                    {websiteData.colors.slice(0, 8).map((color, index) => (
                      <div key={index} className="flex flex-col items-center group">
                        <div 
                          className="w-12 h-12 rounded-md border border-border-dark shadow-sm group-hover:scale-110 transition-transform" 
                          style={{ backgroundColor: color }}
                        ></div>
                        <span className="text-xs mt-1 opacity-70 group-hover:opacity-100">{color}</span>
                      </div>
                    ))}
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
              </CardContent>
            </Card>
          </div>

          {/* Right column - Image selection */}
          <div className="lg:col-span-5">
            {/* Reference images section */}
            {validWebsiteImages.length > 0 && (
              <Card className="bg-dark-bg border-border-dark shadow-lg overflow-hidden h-full">
                <CardHeader className="pb-2 border-b border-gray-800">
                  <div className="flex justify-between items-center">
                    <CardTitle className="text-lg flex items-center">
                      <div className="w-1 h-6 bg-amber-500 rounded mr-2"></div>
                      Reference Images
                    </CardTitle>
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
                    <CardDescription className="mt-2">
                      Click on images to select up to 4 reference images for ad generation
                    </CardDescription>
                  )}
                </CardHeader>
                <CardContent className="pt-4 flex-grow">
                  <div className="grid grid-cols-2 gap-3">
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

                <CardFooter className="border-t border-gray-800 p-4">
                  <Button 
                    onClick={handleGenerateCreatives} 
                    disabled={isGeneratingImages || (useReferenceImages && selectedReferenceImages.length === 0)}
                    className="w-full h-12 bg-primary-green hover:bg-primary-green/90 text-black font-medium text-base flex items-center justify-center"
                  >
                    {isGeneratingImages ? (
                      <>
                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                        {error || "Generating Creatives..."}
                      </>
                    ) : (
                      <>
                        {useReferenceImages && selectedReferenceImages.length === 0 ? (
                          <>Select reference images to continue</>
                        ) : (
                          <>
                            Generate Ad Creatives
                            <ArrowRight className="ml-2 h-5 w-5" />
                          </>
                        )}
                      </>
                    )}
                  </Button>
                </CardFooter>
              </Card>
            )}
          </div>
        </div>
      )}

      {/* ===== STEP 3: Generated Creatives Display ===== */}
      {generatedImages && (
        <div className="space-y-8">
          <div className="bg-dark-bg border border-border-dark p-4 rounded-lg">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4 space-y-3 md:space-y-0">
              <div>
                <h2 className="text-2xl font-bold">Step 3: Your Custom Ad Creatives</h2>
                <div className="mt-2">
                  <div className="flex flex-wrap gap-2 mb-2">
                    {campaignGoals.leads && (
                      <div className="px-3 py-1 text-sm font-medium rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/40">
                        Lead Generation
                      </div>
                    )}
                    {campaignGoals.emails && (
                      <div className="px-3 py-1 text-sm font-medium rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/40">
                        Email Subscribers
                      </div>
                    )}
                    {campaignGoals.sales && (
                      <div className="px-3 py-1 text-sm font-medium rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40">
                        Sales
                      </div>
                    )}
                    {campaignGoals.brand && (
                      <div className="px-3 py-1 text-sm font-medium rounded-full bg-primary-green/20 text-primary-green border border-primary-green/40">
                        Brand Awareness
                      </div>
                    )}
                    {campaignGoals.recruiting && (
                      <div className="px-3 py-1 text-sm font-medium rounded-full bg-violet-500/20 text-violet-300 border border-violet-500/40">
                        Recruiting
                      </div>
                    )}
                  </div>
                  <div className="text-xs text-gray-500">
                    Optimized for {url}
                  </div>
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
            
            {/* Awareness Stage */}
            <div className="mb-8 pb-6 border-b border-gray-700">
              <div className="flex items-center mb-4">
                <div className="w-9 h-9 bg-primary-green rounded-full text-black font-bold flex items-center justify-center mr-3">1</div>
                <div>
                  <h3 className="text-xl font-bold mb-1">Awareness Stage</h3>
                  <p className="text-gray-400 text-sm">Top-of-funnel creatives to build brand awareness and attract new audiences</p>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Square Format */}
                <div>
                  <div className="mb-2 flex items-center">
                    <div className="w-4 h-4 bg-primary-green/80 rounded-full mr-1.5 flex items-center justify-center">
                      <span className="text-xs font-bold">A</span>
                    </div>
                    <span className="text-sm font-medium">Square Format (1:1)</span>
                  </div>
                  <div 
                    className="relative aspect-square border border-border-dark rounded-lg overflow-hidden group cursor-pointer shadow-lg"
                    onClick={() => {
                      setPreviewImage(generatedImages.awareness.square);
                      setPreviewImageFormat("square");
                      setPreviewStage("awareness");
                    }}
                  >
                    <div className="w-full h-full">
                      <img
                        src={generatedImages.awareness.square}
                        alt="Awareness stage square ad creative"
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100">
                      <div className="flex items-center gap-3">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setPreviewImage(generatedImages.awareness.square);
                            setPreviewImageFormat("square");
                            setPreviewStage("awareness");
                          }}
                          className="py-2 px-4 bg-white text-gray-800 rounded-md font-medium shadow hover:bg-gray-50"
                        >
                          View
                        </button>
                        <a 
                          href={generatedImages.awareness.square}
                          download="awareness-square-ad.png"
                          className="py-2 px-4 bg-white text-gray-800 rounded-md font-medium shadow hover:bg-gray-50"
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                        >
                          Download
                        </a>
                      </div>
                    </div>
                    <div className="absolute top-3 right-3 bg-primary-green/80 text-black text-xs px-2 py-1 rounded-full font-medium">
                      1:1
                    </div>
                    <div className="absolute bottom-3 left-3 bg-black/70 text-white text-xs px-2 py-1 rounded font-medium">
                      Awareness
                    </div>
                  </div>
                </div>
                
                {/* Vertical Format */}
                <div>
                  <div className="mb-2 flex items-center">
                    <div className="w-4 h-4 bg-blue-500/80 rounded-full mr-1.5 flex items-center justify-center">
                      <span className="text-xs font-bold text-white">B</span>
                    </div>
                    <span className="text-sm font-medium">Vertical Format (9:16)</span>
                  </div>
                  <div 
                    className="relative aspect-[9/16] border border-border-dark rounded-lg overflow-hidden group cursor-pointer shadow-lg"
                    onClick={() => {
                      setPreviewImage(generatedImages.awareness.vertical);
                      setPreviewImageFormat("vertical");
                      setPreviewStage("awareness");
                    }}
                  >
                    <div className="w-full h-full">
                      <img
                        src={generatedImages.awareness.vertical}
                        alt="Awareness stage vertical ad creative"
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100">
                      <div className="flex items-center gap-3">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setPreviewImage(generatedImages.awareness.vertical);
                            setPreviewImageFormat("vertical");
                            setPreviewStage("awareness");
                          }}
                          className="py-2 px-4 bg-white text-gray-800 rounded-md font-medium shadow hover:bg-gray-50"
                        >
                          View
                        </button>
                        <a 
                          href={generatedImages.awareness.vertical}
                          download="awareness-vertical-ad.png"
                          className="py-2 px-4 bg-white text-gray-800 rounded-md font-medium shadow hover:bg-gray-50"
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                        >
                          Download
                        </a>
                      </div>
                    </div>
                    <div className="absolute top-3 right-3 bg-blue-500/80 text-white text-xs px-2 py-1 rounded-full font-medium">
                      9:16
                    </div>
                    <div className="absolute bottom-3 left-3 bg-black/70 text-white text-xs px-2 py-1 rounded font-medium">
                      Awareness
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Consideration Stage */}
            <div className="mb-8 pb-6 border-b border-gray-700">
              <div className="flex items-center mb-4">
                <div className="w-9 h-9 bg-blue-500 rounded-full text-white font-bold flex items-center justify-center mr-3">2</div>
                <div>
                  <h3 className="text-xl font-bold mb-1">Consideration Stage</h3>
                  <p className="text-gray-400 text-sm">Mid-funnel creatives to highlight benefits and engage interested prospects</p>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Square Format */}
                <div>
                  <div className="mb-2 flex items-center">
                    <div className="w-4 h-4 bg-primary-green/80 rounded-full mr-1.5 flex items-center justify-center">
                      <span className="text-xs font-bold">A</span>
                    </div>
                    <span className="text-sm font-medium">Square Format (1:1)</span>
                  </div>
                  <div 
                    className="relative aspect-square border border-border-dark rounded-lg overflow-hidden group cursor-pointer shadow-lg"
                    onClick={() => {
                      setPreviewImage(generatedImages.consideration.square);
                      setPreviewImageFormat("square");
                      setPreviewStage("consideration");
                    }}
                  >
                    <div className="w-full h-full">
                      <img
                        src={generatedImages.consideration.square}
                        alt="Consideration stage square ad creative"
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100">
                      <div className="flex items-center gap-3">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setPreviewImage(generatedImages.consideration.square);
                            setPreviewImageFormat("square");
                            setPreviewStage("consideration");
                          }}
                          className="py-2 px-4 bg-white text-gray-800 rounded-md font-medium shadow hover:bg-gray-50"
                        >
                          View
                        </button>
                        <a 
                          href={generatedImages.consideration.square}
                          download="consideration-square-ad.png"
                          className="py-2 px-4 bg-white text-gray-800 rounded-md font-medium shadow hover:bg-gray-50"
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                        >
                          Download
                        </a>
                      </div>
                    </div>
                    <div className="absolute top-3 right-3 bg-primary-green/80 text-black text-xs px-2 py-1 rounded-full font-medium">
                      1:1
                    </div>
                    <div className="absolute bottom-3 left-3 bg-black/70 text-white text-xs px-2 py-1 rounded font-medium">
                      Consideration
                    </div>
                  </div>
                </div>
                
                {/* Vertical Format */}
                <div>
                  <div className="mb-2 flex items-center">
                    <div className="w-4 h-4 bg-blue-500/80 rounded-full mr-1.5 flex items-center justify-center">
                      <span className="text-xs font-bold text-white">B</span>
                    </div>
                    <span className="text-sm font-medium">Vertical Format (9:16)</span>
                  </div>
                  <div 
                    className="relative aspect-[9/16] border border-border-dark rounded-lg overflow-hidden group cursor-pointer shadow-lg"
                    onClick={() => {
                      setPreviewImage(generatedImages.consideration.vertical);
                      setPreviewImageFormat("vertical");
                      setPreviewStage("consideration");
                    }}
                  >
                    <div className="w-full h-full">
                      <img
                        src={generatedImages.consideration.vertical}
                        alt="Consideration stage vertical ad creative"
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100">
                      <div className="flex items-center gap-3">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setPreviewImage(generatedImages.consideration.vertical);
                            setPreviewImageFormat("vertical");
                            setPreviewStage("consideration");
                          }}
                          className="py-2 px-4 bg-white text-gray-800 rounded-md font-medium shadow hover:bg-gray-50"
                        >
                          View
                        </button>
                        <a 
                          href={generatedImages.consideration.vertical}
                          download="consideration-vertical-ad.png"
                          className="py-2 px-4 bg-white text-gray-800 rounded-md font-medium shadow hover:bg-gray-50"
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                        >
                          Download
                        </a>
                      </div>
                    </div>
                    <div className="absolute top-3 right-3 bg-blue-500/80 text-white text-xs px-2 py-1 rounded-full font-medium">
                      9:16
                    </div>
                    <div className="absolute bottom-3 left-3 bg-black/70 text-white text-xs px-2 py-1 rounded font-medium">
                      Consideration
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Conversion Stage */}
            <div className="mb-8">
              <div className="flex items-center mb-4">
                <div className="w-9 h-9 bg-amber-500 rounded-full text-black font-bold flex items-center justify-center mr-3">3</div>
                <div>
                  <h3 className="text-xl font-bold mb-1">Conversion Stage</h3>
                  <p className="text-gray-400 text-sm">Bottom-of-funnel creatives to drive immediate action and conversions</p>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Square Format */}
                <div>
                  <div className="mb-2 flex items-center">
                    <div className="w-4 h-4 bg-primary-green/80 rounded-full mr-1.5 flex items-center justify-center">
                      <span className="text-xs font-bold">A</span>
                    </div>
                    <span className="text-sm font-medium">Square Format (1:1)</span>
                  </div>
                  <div 
                    className="relative aspect-square border border-border-dark rounded-lg overflow-hidden group cursor-pointer shadow-lg"
                    onClick={() => {
                      setPreviewImage(generatedImages.conversion.square);
                      setPreviewImageFormat("square");
                      setPreviewStage("conversion");
                    }}
                  >
                    <div className="w-full h-full">
                      <img
                        src={generatedImages.conversion.square}
                        alt="Conversion stage square ad creative"
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100">
                      <div className="flex items-center gap-3">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setPreviewImage(generatedImages.conversion.square);
                            setPreviewImageFormat("square");
                            setPreviewStage("conversion");
                          }}
                          className="py-2 px-4 bg-white text-gray-800 rounded-md font-medium shadow hover:bg-gray-50"
                        >
                          View
                        </button>
                        <a 
                          href={generatedImages.conversion.square}
                          download="conversion-square-ad.png"
                          className="py-2 px-4 bg-white text-gray-800 rounded-md font-medium shadow hover:bg-gray-50"
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                        >
                          Download
                        </a>
                      </div>
                    </div>
                    <div className="absolute top-3 right-3 bg-primary-green/80 text-black text-xs px-2 py-1 rounded-full font-medium">
                      1:1
                    </div>
                    <div className="absolute bottom-3 left-3 bg-black/70 text-white text-xs px-2 py-1 rounded font-medium">
                      Conversion
                    </div>
                  </div>
                </div>
                
                {/* Vertical Format */}
                <div>
                  <div className="mb-2 flex items-center">
                    <div className="w-4 h-4 bg-blue-500/80 rounded-full mr-1.5 flex items-center justify-center">
                      <span className="text-xs font-bold text-white">B</span>
                    </div>
                    <span className="text-sm font-medium">Vertical Format (9:16)</span>
                  </div>
                  <div 
                    className="relative aspect-[9/16] border border-border-dark rounded-lg overflow-hidden group cursor-pointer shadow-lg"
                    onClick={() => {
                      setPreviewImage(generatedImages.conversion.vertical);
                      setPreviewImageFormat("vertical");
                      setPreviewStage("conversion");
                    }}
                  >
                    <div className="w-full h-full">
                      <img
                        src={generatedImages.conversion.vertical}
                        alt="Conversion stage vertical ad creative"
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100">
                      <div className="flex items-center gap-3">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setPreviewImage(generatedImages.conversion.vertical);
                            setPreviewImageFormat("vertical");
                            setPreviewStage("conversion");
                          }}
                          className="py-2 px-4 bg-white text-gray-800 rounded-md font-medium shadow hover:bg-gray-50"
                        >
                          View
                        </button>
                        <a 
                          href={generatedImages.conversion.vertical}
                          download="conversion-vertical-ad.png"
                          className="py-2 px-4 bg-white text-gray-800 rounded-md font-medium shadow hover:bg-gray-50"
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                        >
                          Download
                        </a>
                      </div>
                    </div>
                    <div className="absolute top-3 right-3 bg-blue-500/80 text-white text-xs px-2 py-1 rounded-full font-medium">
                      9:16
                    </div>
                    <div className="absolute bottom-3 left-3 bg-black/70 text-white text-xs px-2 py-1 rounded font-medium">
                      Conversion
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-8 pt-4 border-t border-gray-700 text-center">
              <p className="text-gray-400 mb-4">Need different creatives? You can start over or try with a different website.</p>
              <Button
                onClick={() => {
                  setGeneratedImages(null);
                  setWebsiteData(null);
                  setUrl("");
                  setSelectedReferenceImages([]);
                }}
                className="bg-primary-green hover:bg-primary-green/90 text-black"
              >
                Create New Creatives
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}