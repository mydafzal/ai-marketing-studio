"use client"

import React, { useEffect, useState, useCallback } from "react"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Check, Image, Palette, Paintbrush, PenTool, Layout, Layers, Type, Lightbulb, 
         Send, Camera, Upload, RefreshCw, Save, Wand2, Download, AlertCircle, CheckCircle2, ZoomIn } from "lucide-react"
import NextImage from "next/image"

// Actions
import { improvePrompt } from "@/app/actions/generate-prompt"
import { generateImages } from "@/app/actions/generate-image"
import type { AspectRatio } from "@/app/actions/generate-image"

import { useRouter } from "next/navigation"
import { getSubscriptionInfo } from "@/app/actions"
import { IconSpinner } from "@/components/ui/icons"
import { getEmailAndBypassStatus } from "@/lib/auth/get-user-email"
import { useUsageStore } from "@/app/store/useUsageStore" 
import { useTheme } from "next-themes"

// Color palettes
const COLOR_PALETTES = {
  "Modern Minimalist": {
    name: "Modern Minimalist",
    colors: ["#FFFFFF", "#F5F5F5", "#EBEBEB", "#333333", "#000000"],
    description: "clean monochrome with high contrast",
  },
  "Earth Tones": {
    name: "Earth Tones",
    colors: ["#D6CCA9", "#E8D5B7", "#C39E77", "#8A6642", "#584235"],
    description: "warm earth tones with organic feel",
  },
  "Luxury Gold": {
    name: "Luxury Gold",
    colors: ["#000000", "#1A1A1A", "#D4AF37", "#CFB53B", "#FFFFFF"],
    description: "elegant gold and black with touches of white",
  },
  "Ocean Fresh": {
    name: "Ocean Fresh",
    colors: ["#E0F7FA", "#80DEEA", "#26C6DA", "#00ACC1", "#006064"],
    description: "fresh aqua tones with deep blue accents",
  },
  "Vibrant Pop": {
    name: "Vibrant Pop",
    colors: ["#FF3D63", "#FF9946", "#FFDE53", "#36DFD3", "#3B49DF"],
    description: "bold vibrant colors with high energy",
  },
  "Soft Pastels": {
    name: "Soft Pastels",
    colors: ["#F0E6F6", "#E6F0F6", "#F0F6E6", "#F6E6F0", "#F6F0E6"],
    description: "soft pastel shades with gentle harmony",
  }
}

// Image types
const IMAGE_TYPES = [
  { id: "lifestyle_ad", name: "Lifestyle Ad", description: "Showing products in everyday use" },
  { id: "product_spotlight", name: "Product Spotlight", description: "Close-up focused on product details" },
  { id: "banner_ad", name: "Banner Ad", description: "For Banners and ads with mainly text on it" },
  { id: "social_media_post", name: "Social Media Post", description: "Optimized for social feeds" },
  { id: "promotional_offer", name: "Promotional Offer", description: "Highlight deals and special offers" }
]

// Brand segments
const BRAND_SEGMENTS = [
  { id: "tech", name: "Technology", styleTag: "sleek, futuristic, innovative", lighting: "cool blue ambient lighting" },
  { id: "beauty", name: "Beauty", styleTag: "clean, radiant, elegant", lighting: "soft diffused natural lighting" },
  { id: "fashion", name: "Fashion", styleTag: "editorial, stylish, trendy", lighting: "dramatic studio lighting with highlights" },
  { id: "food", name: "Food & Beverage", styleTag: "appetizing, warm, inviting", lighting: "warm key light with soft fill" },
  { id: "fitness", name: "Fitness", styleTag: "dynamic, energetic, vibrant", lighting: "bright high-contrast sports lighting" },
  { id: "home", name: "Home & Decor", styleTag: "cozy, aesthetic, harmonious", lighting: "warm natural daylight with soft shadows" }
]

// Font styles
const FONT_STYLES = [
  { id: "modern_sans", name: "Modern Sans-Serif", description: "Clean, minimal sans-serif typography" },
  { id: "elegant_serif", name: "Elegant Serif", description: "Sophisticated serif with fine details" },
  { id: "bold_display", name: "Bold Display", description: "Strong impact headline fonts" },
  { id: "creative_script", name: "Creative Script", description: "Flowing handwritten style" },
  { id: "minimal_mono", name: "Minimal Monospace", description: "Clean technical feel with equal spacing" }
]

// Camera angles
const CAMERA_ANGLES = [
  { id: "eye_level", name: "Eye Level", description: "Direct and natural perspective" },
  { id: "low_angle", name: "Low Angle", description: "Looking up at subject (powerful)" },
  { id: "high_angle", name: "High Angle", description: "Looking down at subject" },
  { id: "bird_eye", name: "Bird's Eye", description: "Directly from above" },
  { id: "dutch_angle", name: "Dutch Angle", description: "Tilted frame for dynamic feel" }
]

// Image formats limited to portrait formats
const IMAGE_FORMATS = [
  { id: "9:16", name: "Portrait 9:16", description: "Vertical format for Stories and TikTok" },
  { id: "3:4", name: "Portrait 3:4", description: "Standard portrait aspect ratio" }
]

// Composition styles 
const COMPOSITION_STYLES = [
  { id: "rule_thirds", name: "Rule of Thirds", description: "Subject at intersection points" },
  { id: "centered", name: "Centered", description: "Subject in the middle with symmetry" },
  { id: "diagonal", name: "Diagonal Flow", description: "Elements arranged in diagonal" },
  { id: "frame_within", name: "Frame within Frame", description: "Subject framed by elements" },
  { id: "negative_space", name: "Negative Space", description: "Minimal with breathing room" }
]

// Loading screen component 
const LoadingScreen = ({ isDarkMode }: { isDarkMode: boolean }) => {
  return (
    <div className={`flex flex-col items-center justify-center size-full min-h-[300px] ${
      isDarkMode ? 'bg-gray-800/50' : 'bg-gray-100/50'
    } rounded-lg border ${
      isDarkMode ? 'border-gray-700' : 'border-gray-300'
    }`}>
      <Wand2 className={`size-10 mb-4 ${isDarkMode ? 'text-primary-green' : 'text-blue-500'}`} />
      
      <div className={`text-base sm:text-lg font-medium mb-2 px-4 text-center ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}>
        Creating your professional ad creative...
      </div>
      
      <div className="relative w-32 sm:w-48 h-2 bg-gray-300 rounded-full overflow-hidden">
        <div className={`absolute top-0 left-0 h-full ${
          isDarkMode ? 'bg-primary-green' : 'bg-blue-500'
        } animate-loading-bar`}></div>
      </div>
      
      <div className={`mt-4 sm:mt-6 text-xs sm:text-sm px-4 text-center ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
        <p>This may take a few moments...</p>
        <p className="mt-1">Please don&apos;t refresh the page.</p>
      </div>
    </div>
  );
}

export default function AiCreativeDirectorPage() {
  // Theme and router
  const { theme } = useTheme()
  const isDarkMode = theme === "dark"
  const router = useRouter()
  
  // Usage tracking
  const { 
    fetchUsageData, 
    incrementImageCount, 
    isImageLimitReached,
    imageCount
  } = useUsageStore()
  
  // Authentication states
  const [subStatus, setSubStatus] = useState<string | undefined>(undefined)
  const [subbedPackage, setSubbedPackage] = useState<string | undefined>(undefined)
  const [isFetchingSub, setIsFetchingSub] = useState(true)

  // Creative control states
  const [selectedPalette, setSelectedPalette] = useState("Modern Minimalist")
  const [selectedImageType, setSelectedImageType] = useState(IMAGE_TYPES[0].id)
  const [selectedImageFormat, setSelectedImageFormat] = useState(IMAGE_FORMATS[0].id) 
  const [selectedBrandSegment, setSelectedBrandSegment] = useState(BRAND_SEGMENTS[0].id)
  const [selectedFontStyle, setSelectedFontStyle] = useState(FONT_STYLES[0].id)
  const [selectedCameraAngle, setSelectedCameraAngle] = useState(CAMERA_ANGLES[0].id)
  const [selectedComposition, setSelectedComposition] = useState(COMPOSITION_STYLES[0].id)
  
  // Text input states
  const [subject, setSubject] = useState("")
  const [background, setBackground] = useState("")
  const [brandName, setBrandName] = useState("")
  const [headline, setHeadline] = useState("")
  
  // Custom states
  const [customColorPalette, setCustomColorPalette] = useState<string[]>(Array(5).fill("#FFFFFF"))
  const [useCustomPalette, setUseCustomPalette] = useState(false)
  const [customPaletteName, setCustomPaletteName] = useState("My Custom Palette")
  const [customPaletteDescription, setCustomPaletteDescription] = useState("custom colors selected by user")
  
  // Image generation states
  const [isGeneratingImages, setIsGeneratingImages] = useState(false)
  const [generatedImages, setGeneratedImages] = useState<string[]>([])
  const [selectedImages, setSelectedImages] = useState<number[]>([])
  const [numGeneratedImages, setNumGeneratedImages] = useState<number>(4)
  const [toastMessage, setToastMessage] = useState<{title: string, description: string, type: 'success' | 'error'} | null>(null)
  const [showUpgradeModal, setShowUpgradeModal] = useState(false)

  // Fetch usage data on component mount
  useEffect(() => {
    fetchUsageData()
  }, [fetchUsageData])

  // Authentication check
  useEffect(() => {
    const fetchSubscription = async () => {
      setIsFetchingSub(true)

      try {
        // First check if user is logged in by getting email
        const emailResult = await getEmailAndBypassStatus()
        
        // If email is empty or null, user is not authenticated
        if (!emailResult || !emailResult.email) {
          console.error('User not authenticated, redirecting to login')
          router.push('/login')
          return
        }
        
        const { isBypassed } = emailResult

        if (isBypassed) {
          setSubStatus('active') // Override with bypass
          setSubbedPackage('AI Marketer Suite')
        } else {
          const result = await getSubscriptionInfo()
          if (result && result.success) {
            setSubStatus(result.sub_status ?? '')
            setSubbedPackage(result.sub_offer ?? '')
          } else {
            setSubStatus('')
            setSubbedPackage('')
          }
        }
      } catch (error) {
        console.error('Error fetching subscription info or email:', error)
        setSubStatus('')
        setSubbedPackage('')
        // If there was an error getting user info, redirect to login
        router.push('/login')
        return
      }

      setIsFetchingSub(false)
    }

    fetchSubscription()
  }, [])

  // Create hidden enhanced prompt based on user selections
  const generateEnhancedPrompt = (userPrompt: string): string => {
    try {
      // Get details for selected options
      const imageType = IMAGE_TYPES.find(t => t.id === selectedImageType)?.name || "lifestyle ad"
      const imageFormat = IMAGE_FORMATS.find(f => f.id === selectedImageFormat)?.name || "Portrait 9:16"
      const brandSegment = BRAND_SEGMENTS.find(s => s.id === selectedBrandSegment) || BRAND_SEGMENTS[0]
      const fontStyle = FONT_STYLES.find(f => f.id === selectedFontStyle)?.name || "modern sans-serif"
      
      // Get color palette
      let paletteDescription = "modern and clean"
      if (useCustomPalette) {
        paletteDescription = "custom brand colors"
      } else {
        paletteDescription = COLOR_PALETTES[selectedPalette]?.description || "modern and clean"
      }
      
      // Define exemplary campaign styles based on image type and brand segment
      const exemplaryCampaigns = {
        "lifestyle_ad": {
          "tech": "Apple's clean, minimalist product ads",
          "beauty": "Glossier's authentic beauty campaigns",
          "fashion": "Gucci's bold editorial style",
          "food": "Whole Foods' fresh and vibrant imagery",
          "fitness": "Nike's motivational athletic campaigns",
          "home": "IKEA's warm and aspirational lifestyle scenes"
        },
        "product_spotlight": {
          "tech": "Samsung's detailed product showcase style",
          "beauty": "Fenty Beauty's close-up product features",
          "fashion": "Zara's clean product photography",
          "food": "Starbucks' appetizing product focus",
          "fitness": "Adidas' performance-focused product shots",
          "home": "West Elm's sophisticated product displays"
        },
        "banner_ad": {
          "tech": "Microsoft's clean, informative banners",
          "beauty": "Sephora's colorful promotional banners",
          "fashion": "H&M's seasonal collection banners",
          "food": "McDonald's vibrant promotional banners",
          "fitness": "Under Armour's high-energy promotional banners",
          "home": "Crate & Barrel's elegant seasonal banners"
        },
        "social_media_post": {
          "tech": "Google's friendly, colorful social posts",
          "beauty": "Kylie Cosmetics' glamorous social style",
          "fashion": "Uniqlo's bright, youthful social content",
          "food": "Chipotle's humorous, relatable social posts",
          "fitness": "Peloton's motivational community content",
          "home": "Pottery Barn's aspirational home scenes"
        },
        "promotional_offer": {
          "tech": "Amazon's clean deal promotions",
          "beauty": "Ulta's special offer announcements",
          "fashion": "ASOS's sale and discount imagery",
          "food": "DoorDash's special promotion cards",
          "fitness": "Planet Fitness's membership offer style",
          "home": "Wayfair's sale and clearance visuals"
        }
      };
      
      const campaignExample = exemplaryCampaigns[selectedImageType]?.[selectedBrandSegment] || "modern professional marketing";
      
      // Build an enhanced but hidden professional prompt
      const enhancedPrompt = `Create a ${imageFormat} ${imageType} inspired by the style of ${campaignExample}, but using "${brandName || "Brand Name"}" as the company and "${headline || "Product Headline"}" as the main message. The image should:
      - Use a ${paletteDescription} color scheme
      - Feature professional typography in ${fontStyle} style
      - Appeal to ${brandSegment.name} industry audiences
      - Have ${brandSegment.lighting}
      - Include appropriate negative space for text elements
      - Look like a premium professionally designed ad
      - Position text elements tastefully with good hierarchy
      - DO NOT include any logos or brand symbols in the image
      
      Campaign purpose: ${userPrompt || "Showcase products and build brand awareness"}
      
      IMPORTANT: Never include any logos, watermarks, or brand symbols in the image. The brand name should only appear as text, not as a logo.
      
      Ensure the final result feels like a polished, premium advertisement that would be created by a professional designer for a major brand campaign.`
      
      return enhancedPrompt
    } catch (error) {
      console.error("Error generating enhanced prompt:", error)
      return userPrompt // Fallback to original user prompt if enhancement fails
    }
  }

  // Handle color change in custom palette
  const handleColorChange = (index: number, color: string) => {
    const newPalette = [...customColorPalette]
    newPalette[index] = color
    setCustomColorPalette(newPalette)
  }

  // Show toast notification
  const showToast = useCallback((title: string, description: string, type: 'success' | 'error') => {
    setToastMessage({ title, description, type })
    setTimeout(() => setToastMessage(null), 3000)
  }, [])

  // Toggle selection for a given image index
  function toggleImageSelected(index: number) {
    setSelectedImages((prev) =>
      prev.includes(index) ? prev.filter((i) => i !== index) : [...prev, index]
    )
  }

  // Generate images with our enhanced prompt
  const handleGenerateImages = async () => {
    if (!subject.trim() && !brandName && !headline) {
      showToast("Missing information", "Please provide a campaign goal, brand name, or headline", "error")
      return
    }
    
    // Check if image limit reached
    if (isImageLimitReached) {
      setShowUpgradeModal(true)
      return
    }
    
    setIsGeneratingImages(true)
    
    try {
      // Generate the enhanced prompt from all our form fields
      const enhancedPrompt = generateEnhancedPrompt(subject)
      
      // Further improve the prompt using the server-side improvePrompt
      const finalPrompt = await improvePrompt(enhancedPrompt, "instagram", "image")
      
      // Get the aspect ratio from the selected format
      const aspectRatio = selectedImageFormat as AspectRatio
      
      // Generate the images
      const result = await generateImages(finalPrompt, aspectRatio, numGeneratedImages)
      
      if (result.success && result.images) {
        const validUrls = result.images.filter((url: unknown) => typeof url === "string") as string[]
        setGeneratedImages(validUrls)
        
        // Increment usage counter
        await incrementImageCount(validUrls.length)
        
        showToast(
          "Images generated", 
          `Created ${validUrls.length} image${validUrls.length !== 1 ? 's' : ''} successfully`, 
          "success"
        )
      } else {
        throw new Error(result.error || "Failed to generate images.")
      }
    } catch (err) {
      console.error("Error generating images:", err)
      
      // Check if error is due to free plan limit
      const errorMessage = err instanceof Error ? err.message : String(err);
      if (errorMessage.includes("Free plan image generation limit reached")) {
        // Show the upgrade modal if limit is reached
        setShowUpgradeModal(true)
      } else {
        // Show regular error for other types of errors
        showToast(
          "Generation failed", 
          "Unable to create images. Please try again with a different prompt.", 
          "error"
        )
      }
    } finally {
      setIsGeneratingImages(false)
    }
  }

  // Download image
  async function handleDownload(imageUrl: string, index: number) {
    try {
      const response = await fetch(imageUrl)
      if (!response.ok) throw new Error("Failed to fetch image for download")

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.href = url
      link.download = `${brandName || "brand"}-ad-${index + 1}.png`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)

      showToast("Download complete", "Image saved successfully to your device.", "success")
    } catch (error) {
      console.error("Error downloading image:", error)
      showToast("Download failed", "Unable to download the image. Please try again.", "error")
    }
  }

  // Loading state
  if (isFetchingSub) {
    return (
      <div className="flex items-center justify-center h-screen w-full">
        <IconSpinner />
      </div>
    )
  }

  // Custom Image Generator component that displays generated images
  const CustomImageGenerator = () => {
    return (
      <div className="w-full">
        {/* Image generator card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Wand2 className="h-5 w-5 text-primary" />
              AI Image Generator
            </CardTitle>
            <CardDescription>
              Create professional ads for your campaign using the settings you've defined
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="pt-2">
              <Button 
                onClick={handleGenerateImages}
                disabled={isGeneratingImages}
                className="w-full h-12 text-base flex items-center justify-center gap-2"
              >
                {isGeneratingImages ? (
                  <>
                    <IconSpinner className="h-5 w-5 animate-spin" />
                    Generating professional images...
                  </>
                ) : (
                  <>
                    <Wand2 className="h-5 w-5" />
                    Generate Professional Ad Creatives
                  </>
                )}
              </Button>
            </div>

            {isGeneratingImages && (
              <LoadingScreen isDarkMode={isDarkMode} />
            )}

            {!isGeneratingImages && generatedImages.length > 0 && (
              <div className="space-y-4 pt-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-lg font-medium">Your Generated Images</h3>
                  <div className="text-sm text-muted-foreground">
                    {generatedImages.length} image{generatedImages.length !== 1 ? 's' : ''} created
                  </div>
                </div>

                <div className={`grid grid-cols-2 gap-4`}>
                  {generatedImages.map((imgUrl, index) => {
                    const isSelected = selectedImages.includes(index)
                    return (
                      <div
                        key={index}
                        className={`relative rounded-md overflow-hidden group cursor-pointer ${
                          selectedImageFormat === "9:16" ? "aspect-[9/16]" : "aspect-[3/4]"
                        } ${
                          isSelected 
                            ? "ring-2 ring-blue-500 ring-offset-2" 
                            : isDarkMode ? "border-gray-700 border" : "border-gray-300 border"
                        }`}
                        onClick={() => toggleImageSelected(index)}
                      >
                        <NextImage
                          src={imgUrl}
                          alt={`Generated ad ${index+1}`}
                          fill
                          sizes="(max-width: 768px) 100vw, 448px"
                          className="object-cover"
                        />
                        
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDownload(imgUrl, index);
                            }}
                            className="absolute bottom-2 right-2 py-1 px-3 text-sm font-medium bg-white text-gray-700 rounded-md shadow hover:bg-gray-50 flex items-center z-30 pointer-events-auto"
                          >
                            <Download className="mr-1 size-4" />
                            Download
                          </button>
                        </div>
                        
                        {isSelected && (
                          <div className="absolute top-2 left-2 bg-blue-600 text-white rounded-full p-1">
                            <CheckCircle2 className="size-4" />
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-3 sm:p-6 ai-content-page">
      {/* Toast notification */}
      {toastMessage && (
        <div className={`fixed top-4 right-4 z-50 p-4 rounded-md shadow-md transition-all ${
          toastMessage.type === 'success' 
            ? isDarkMode ? 'bg-primary-green/20 border border-primary-green/60' : 'bg-green-100 border border-green-300' 
            : isDarkMode ? 'bg-coral/20 border border-coral/60' : 'bg-red-100 border border-red-300'
        }`}>
          <div className="flex items-start gap-2">
            <div className={toastMessage.type === 'success' 
              ? isDarkMode ? 'text-primary-green' : 'text-green-600' 
              : isDarkMode ? 'text-coral' : 'text-red-600'}>
              {toastMessage.type === 'success' ? <CheckCircle2 className="size-5" /> : <AlertCircle className="size-5" />}
            </div>
            <div>
              <h3 className={`font-medium text-sm ${toastMessage.type === 'success' 
                ? isDarkMode ? 'text-primary-green' : 'text-green-800' 
                : isDarkMode ? 'text-coral' : 'text-red-800'}`}>
                {toastMessage.title}
              </h3>
              <p className={`text-sm ${toastMessage.type === 'success' 
                ? isDarkMode ? 'text-text-white' : 'text-green-700' 
                : isDarkMode ? 'text-text-white' : 'text-red-700'}`}>
                {toastMessage.description}
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-col space-y-6">
        <div className="flex flex-col space-y-2">
          <div className="flex items-center justify-between">
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold flex items-center gap-2">
              <PenTool className="h-8 w-8 text-primary" />
              AI Creative Director
            </h1>
          </div>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
            <p className="text-xs sm:text-sm text-muted-foreground md:max-w-lg">
              Create professional AI-generated images with structured prompts optimized for marketing
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column - Simplified Creative Controls */}
          <div className="lg:col-span-5 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Layers className="h-5 w-5 text-primary" />
                  Campaign Settings
                </CardTitle>
                <CardDescription>Define the basic elements of your campaign</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Image Type</label>
                  <Select value={selectedImageType} onValueChange={setSelectedImageType}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select image type" />
                    </SelectTrigger>
                    <SelectContent>
                      {IMAGE_TYPES.map((type) => (
                        <SelectItem key={type.id} value={type.id}>
                          <div className="flex flex-col">
                            <span>{type.name}</span>
                            <span className="text-xs text-muted-foreground">{type.description}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium">Image Format</label>
                  <Select value={selectedImageFormat} onValueChange={setSelectedImageFormat}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select image format" />
                    </SelectTrigger>
                    <SelectContent>
                      {IMAGE_FORMATS.map((format) => (
                        <SelectItem key={format.id} value={format.id}>
                          <div className="flex flex-col">
                            <span>{format.name}</span>
                            <span className="text-xs text-muted-foreground">{format.description}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium">Brand Segment</label>
                  <Select value={selectedBrandSegment} onValueChange={setSelectedBrandSegment}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select brand segment" />
                    </SelectTrigger>
                    <SelectContent>
                      {BRAND_SEGMENTS.map((segment) => (
                        <SelectItem key={segment.id} value={segment.id}>
                          {segment.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">                
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Brand Name</label>
                    <Input 
                      placeholder="Your brand name"
                      value={brandName}
                      onChange={(e) => setBrandName(e.target.value)}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Headline Text</label>
                    <Input 
                      placeholder="Main headline for the creative"
                      value={headline}
                      onChange={(e) => setHeadline(e.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-2 pt-2">
                  <label className="text-sm font-medium">Campaign Goal</label>
                  <Textarea
                    placeholder="Briefly describe what you want to achieve with this campaign..."
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    className="min-h-[80px]"
                  />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Palette className="h-5 w-5 text-primary" />
                  Brand Style
                </CardTitle>
                <CardDescription>Define your brand's visual identity</CardDescription>
              </CardHeader>
              <CardContent className="space-y-5">
                <Tabs defaultValue="preset" className="w-full">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="preset" onClick={() => setUseCustomPalette(false)}>
                      Preset Palettes
                    </TabsTrigger>
                    <TabsTrigger value="custom" onClick={() => setUseCustomPalette(true)}>
                      Custom Palette
                    </TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="preset" className="space-y-4 pt-4">
                    <div className="grid grid-cols-2 gap-3">
                      {Object.entries(COLOR_PALETTES).map(([key, palette]) => (
                        <div 
                          key={key}
                          className={`p-2 border rounded-lg cursor-pointer transition-all ${
                            selectedPalette === key ? 'ring-2 ring-primary' : 'hover:bg-accent'
                          }`}
                          onClick={() => setSelectedPalette(key)}
                        >
                          <div className="flex justify-between items-center mb-2">
                            <span className="text-sm font-medium">{palette.name}</span>
                            {selectedPalette === key && <Check className="h-4 w-4 text-primary" />}
                          </div>
                          <div className="flex space-x-1">
                            {palette.colors.map((color, i) => (
                              <div 
                                key={i}
                                className="h-5 w-5 rounded-full" 
                                style={{ backgroundColor: color }}
                              />
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="custom" className="space-y-4 pt-4">
                    <div className="space-y-3">
                      <label className="text-sm font-medium">Custom Colors</label>
                      <div className="grid grid-cols-5 gap-2">
                        {customColorPalette.map((color, index) => (
                          <div key={index} className="flex flex-col items-center space-y-1">
                            <input
                              type="color"
                              value={color}
                              onChange={(e) => handleColorChange(index, e.target.value)}
                              className="w-8 h-8 rounded cursor-pointer"
                            />
                            <span className="text-xs">{color}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </TabsContent>
                </Tabs>
                
                <div className="pt-3 space-y-2">
                  <label className="text-sm font-medium">Font Style</label>
                  <Select value={selectedFontStyle} onValueChange={setSelectedFontStyle}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select font style" />
                    </SelectTrigger>
                    <SelectContent>
                      {FONT_STYLES.map((font) => (
                        <SelectItem key={font.id} value={font.id}>
                          <div className="flex flex-col">
                            <span>{font.name}</span>
                            <span className="text-xs text-muted-foreground">{font.description}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="pt-3">
                  <Button 
                    onClick={() => {
                      // Reset form
                      setSubject("");
                      setBrandName("");
                      setHeadline("");
                      setSelectedPalette("Modern Minimalist");
                      setSelectedImageType(IMAGE_TYPES[0].id);
                      setSelectedImageFormat(IMAGE_FORMATS[0].id);
                      setSelectedBrandSegment(BRAND_SEGMENTS[0].id);
                      setSelectedFontStyle(FONT_STYLES[0].id);
                    }}
                    variant="outline"
                    className="w-full"
                  >
                    Reset Settings
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
          
          {/* Right Column - Image Generator */}
          <div className="lg:col-span-7 space-y-6">
            {/* Customized Image Generation Component */}
            <CustomImageGenerator />
          </div>
        </div>
      </div>
    </div>
  )
}