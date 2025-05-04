"use client"

import React, { useEffect, useState, useCallback, useRef } from "react"
import Draggable from "react-draggable"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Check, Image, Palette, Paintbrush, PenTool, Layout, Layers, Type, Lightbulb, 
         Send, Camera, Upload, RefreshCw, Save, Wand2, Download, AlertCircle, CheckCircle2, ZoomIn,
         File, FilePlus, ImagePlus, Trash2, X, Repeat, FileImage, ArrowRight, Sparkles } from "lucide-react"
import NextImage from "next/image"
import { HexColorPicker } from "react-colorful"

// Actions
import { improvePrompt } from "@/app/actions/generate-prompt"
import { generateImages, generateImageVariants, generateImageVariation } from "@/app/actions/generate-image"
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
  },
  "Corporate Blue": {
    name: "Corporate Blue",
    colors: ["#0A2463", "#3E92CC", "#FFFAFF", "#D8315B", "#1E1B18"],
    description: "professional blue-based corporate palette",
  },
  "Green Nature": {
    name: "Green Nature",
    colors: ["#2D6A4F", "#52B788", "#B7E4C7", "#D8F3DC", "#95D5B2"],
    description: "refreshing natural greens for eco themes",
  },
  "Sunset Gradient": {
    name: "Sunset Gradient",
    colors: ["#FF7B00", "#FF8800", "#FF9500", "#FFA200", "#FFAA00"],
    description: "warm orange tones reminiscent of sunset",
  },
  "Berry Tones": {
    name: "Berry Tones",
    colors: ["#6B0F1A", "#B91372", "#F7A1C4", "#F7E3AF", "#8A1C7C"],
    description: "rich berry colors with complementary accents",
  },
  "Vintage": {
    name: "Vintage",
    colors: ["#7B8CDE", "#C2CAE8", "#F7E3AF", "#EF8354", "#BE6E46"],
    description: "muted vintage palette with nostalgic feel",
  },
  "Tech Dark": {
    name: "Tech Dark",
    colors: ["#121212", "#1F1F1F", "#2C2C2C", "#00B4D8", "#90E0EF"],
    description: "dark theme with vibrant blue accents",
  }
}

// Standard image types
const IMAGE_TYPES = [
  { id: "lifestyle_ad", name: "Lifestyle Ad", description: "Showing products in everyday use" },
  { id: "product_spotlight", name: "Product Spotlight", description: "Close-up focused on product details" },
  { id: "banner_ad", name: "Banner Ad", description: "Wide format for website headers and ads" },
  { id: "social_media_post", name: "Social Media Post", description: "Optimized for social feeds" },
  { id: "promotional_offer", name: "Promotional Offer", description: "Highlight deals and special offers" }
]

// Enhanced social media content types
const ENHANCED_IMAGE_TYPES = [
  { id: "comparison_post", name: "🔁 Comparison Post", description: "Us vs. Them, Before vs. After, Old Way vs. New Way" },
  { id: "before_after", name: "✅ Before/After Post", description: "Show transformation and results" },
  { id: "myth_vs_fact", name: "🧠 Myths vs. Facts", description: "Debunk misconceptions with facts" },
  { id: "testimonial", name: "💬 Customer Testimonial", description: "Social proof with quote and results" },
  { id: "mini_tutorial", name: "💡 Tips & Mini-Tutorials", description: "Quick tips that provide immediate value" },
  { id: "stats_insights", name: "📊 Stats & Insights", description: "Data-driven points with visualization" },
  { id: "behind_scenes", name: "🔥 Behind the Scenes", description: "Show authenticity and process" },
  { id: "pain_point", name: "🎯 Pain Point Posts", description: "Focus on customer problems you solve" },
  { id: "feature_spotlight", name: "🛠️ Feature Spotlight", description: "Highlight key features and benefits" }
]

// Reference-based image types
const REFERENCE_IMAGE_TYPES = [
  { id: "product_scene", name: "Product in Scene", description: "Place products from reference images into a new scene" },
  { id: "creative_variation", name: "Creative Variations", description: "Generate fresh variations based on your references" },
  { id: "lifestyle_usage", name: "Product at Use", description: "Show products being used in lifestyle scenes" },
  { id: "styled_collection", name: "Styled Collection", description: "Arrange multiple products in a styled layout" },
  { id: "color_theme_change", name: "Color Theme Change", description: "Apply your brand colors to reference images" }
]

// Brand segments
const BRAND_SEGMENTS = [
  { id: "tech", name: "Technology", styleTag: "sleek, futuristic, innovative", lighting: "cool blue ambient lighting" },
  { id: "beauty", name: "Beauty", styleTag: "clean, radiant, elegant", lighting: "soft diffused natural lighting" },
  { id: "fashion", name: "Fashion", styleTag: "editorial, stylish, trendy", lighting: "dramatic studio lighting with highlights" },
  { id: "food", name: "Food & Beverage", styleTag: "appetizing, warm, inviting", lighting: "warm key light with soft fill" },
  { id: "fitness", name: "Fitness", styleTag: "dynamic, energetic, vibrant", lighting: "bright high-contrast sports lighting" },
  { id: "home", name: "Home & Decor", styleTag: "cozy, aesthetic, harmonious", lighting: "warm natural daylight with soft shadows" },
  
  // Additional industry segments
  { id: "healthcare", name: "Healthcare", styleTag: "clean, trustworthy, compassionate", lighting: "bright, sterile lighting with soft edges" },
  { id: "finance", name: "Finance & Banking", styleTag: "professional, secure, trustworthy", lighting: "neutral corporate lighting with subtle highlights" },
  { id: "education", name: "Education", styleTag: "bright, engaging, inspiring", lighting: "warm classroom lighting with natural accents" },
  { id: "travel", name: "Travel & Tourism", styleTag: "adventurous, scenic, aspirational", lighting: "golden hour outdoor lighting" },
  { id: "automotive", name: "Automotive", styleTag: "sleek, powerful, premium", lighting: "dramatic showroom lighting with strong highlights" },
  { id: "real_estate", name: "Real Estate", styleTag: "spacious, welcoming, aspirational", lighting: "bright natural lighting with soft shadows" },
  { id: "ecommerce", name: "E-commerce", styleTag: "clean, product-focused, engaging", lighting: "studio product lighting with white background" },
  { id: "b2b", name: "B2B Services", styleTag: "professional, solution-oriented, trustworthy", lighting: "clean office lighting with blue tones" },
  { id: "entertainment", name: "Entertainment", styleTag: "vibrant, exciting, immersive", lighting: "theatrical lighting with dramatic colors" },
  { id: "nonprofit", name: "Nonprofit", styleTag: "authentic, compassionate, impactful", lighting: "natural documentary-style lighting" },
  { id: "sustainability", name: "Sustainability", styleTag: "natural, organic, eco-friendly", lighting: "soft natural daylight with green tones" },
  { id: "luxury", name: "Luxury", styleTag: "elegant, exclusive, sophisticated", lighting: "dramatic low-key lighting with gold accents" }
]

// Font styles
const FONT_STYLES = [
  { id: "modern_sans", name: "Modern Sans-Serif", description: "Clean, minimal sans-serif typography" },
  { id: "elegant_serif", name: "Elegant Serif", description: "Sophisticated serif with fine details" },
  { id: "bold_display", name: "Bold Display", description: "Strong impact headline fonts" },
  { id: "creative_script", name: "Creative Script", description: "Flowing handwritten style" },
  { id: "minimal_mono", name: "Minimal Monospace", description: "Clean technical feel with equal spacing" }
]

// Image formats limited to portrait formats
const IMAGE_FORMATS = [
  { id: "9:16", name: "Portrait 9:16", description: "Vertical format for Stories and TikTok" },
  { id: "3:4", name: "Portrait 3:4", description: "Standard portrait aspect ratio" }
]

// Loading screen component 
const LoadingScreen = ({ isDarkMode }: { isDarkMode: boolean }) => {
  return (
    <div className={`flex flex-col items-center justify-center size-full min-h-[250px] sm:min-h-[300px] ${
      isDarkMode ? 'bg-gray-800/50' : 'bg-gray-100/50'
    } rounded-lg border ${
      isDarkMode ? 'border-gray-700' : 'border-gray-300'
    }`}>
      <Wand2 className={`size-8 sm:size-10 mb-3 sm:mb-4 ${isDarkMode ? 'text-primary-green' : 'text-blue-500'}`} />
      
      <div className={`text-sm sm:text-lg font-medium mb-2 px-3 sm:px-4 text-center ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}>
        Creating your professional ad creative...
      </div>
      
      <div className="relative w-28 sm:w-48 h-1.5 sm:h-2 bg-gray-300 rounded-full overflow-hidden">
        <div className={`absolute top-0 left-0 h-full ${
          isDarkMode ? 'bg-primary-green' : 'bg-blue-500'
        } animate-loading-bar`}></div>
      </div>
      
      <div className={`mt-3 sm:mt-6 text-xs sm:text-sm px-3 sm:px-4 text-center ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
        <p>This may take a few moments...</p>
        <p className="mt-0.5 sm:mt-1">Please don&apos;t refresh the page.</p>
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
  const [selectedEnhancedImageType, setSelectedEnhancedImageType] = useState(ENHANCED_IMAGE_TYPES[0].id)
  const [selectedReferenceImageType, setSelectedReferenceImageType] = useState(REFERENCE_IMAGE_TYPES[0].id)
  const [selectedImageFormat, setSelectedImageFormat] = useState(IMAGE_FORMATS[0].id)
  const [selectedBrandSegment, setSelectedBrandSegment] = useState(BRAND_SEGMENTS[0].id)
  const [selectedFontStyle, setSelectedFontStyle] = useState(FONT_STYLES[0].id)
  
  // Text input states
  const [subject, setSubject] = useState("")
  const [brandName, setBrandName] = useState("")
  const [headline, setHeadline] = useState("")
  
  // Custom palette states with better default colors
  const [customColorPalette, setCustomColorPalette] = useState<string[]>([
    "#3B82F6", // Blue
    "#22C55E", // Green
    "#F59E0B", // Amber
    "#EC4899", // Pink
    "#6366F1"  // Indigo
  ])
  const [useCustomPalette, setUseCustomPalette] = useState(false)
  
  // Image generation states
  const [isGeneratingImages, setIsGeneratingImages] = useState(false)
  const [generatedImages, setGeneratedImages] = useState<string[]>([])
  const [selectedImages, setSelectedImages] = useState<number[]>([])
  const [numGeneratedImages, setNumGeneratedImages] = useState<number>(4)
  const [toastMessage, setToastMessage] = useState<{title: string, description: string, type: 'success' | 'error'} | null>(null)
  const [showUpgradeModal, setShowUpgradeModal] = useState(false)

  // Reference image upload states
  const [useReferenceImages, setUseReferenceImages] = useState(false)
  const [referenceImages, setReferenceImages] = useState<string[]>([])
  const [isUploading, setIsUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  // Logo upload states
  const [logoUrl, setLogoUrl] = useState<string>("")
  const [overlayPosition, setOverlayPosition] = useState("bottom-right")
  const [logoSize, setLogoSize] = useState(20) // As percentage of image width
  const [isCustomPosition, setIsCustomPosition] = useState(false)
  const logoInputRef = useRef<HTMLInputElement>(null)
  const [combinedPreviews, setCombinedPreviews] = useState<string[]>([])
  const [activeTab, setActiveTab] = useState<"original" | "withLogo">("original")
  const [isProcessing, setIsProcessing] = useState(false)
  const previewRefs = useRef<(HTMLDivElement | null)[]>([])
  
  // Logo drag and drop states - simplified for react-draggable
  const [isDraggingLogo, setIsDraggingLogo] = useState(false)
  const [draggedImageIndex, setDraggedImageIndex] = useState<number | null>(null)
  const [logoPositions, setLogoPositions] = useState<{ [key: number]: { x: number, y: number } }>({})
  const [isDragUpdatePending, setIsDragUpdatePending] = useState(false)
  
  // Mode state - Standard or Enhanced
  const [imageTypeMode, setImageTypeMode] = useState<'standard' | 'enhanced'>('standard')
  
  // Multi-step wizard states
  const [currentStep, setCurrentStep] = useState(1)
  const totalSteps = useReferenceImages ? 5 : 5 // Increased number of steps for both paths
  
  // Function to go to next step
  const goToNextStep = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1)
      // Scroll to top when moving to next step
      window.scrollTo(0, 0)
    }
  }
  
  // Function to go to previous step
  const goToPreviousStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
      // Scroll to top when moving to previous step
      window.scrollTo(0, 0)
    }
  }
  
  // Function to jump to a specific step
  const goToStep = (step: number) => {
    if (step >= 1 && step <= totalSteps) {
      setCurrentStep(step)
      // Scroll to top when changing steps
      window.scrollTo(0, 0)
    }
  }
  
  // Reset to step 1 when switching between text-based and reference-based modes
  useEffect(() => {
    setCurrentStep(1)
  }, [useReferenceImages])

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
  }, [router])

  // Create enhanced prompt based on user selections (for text-based generation)
  const generateEnhancedPrompt = (userPrompt: string): string => {
    try {
      // Get image type based on selected mode (standard or enhanced)
      let imageType = ""
      let imageTypeDescription = ""
      
      if (imageTypeMode === 'standard') {
        imageType = IMAGE_TYPES.find(t => t.id === selectedImageType)?.name || "lifestyle ad"
        imageTypeDescription = IMAGE_TYPES.find(t => t.id === selectedImageType)?.description || ""
      } else {
        imageType = ENHANCED_IMAGE_TYPES.find(t => t.id === selectedEnhancedImageType)?.name || "comparison post"
        imageTypeDescription = ENHANCED_IMAGE_TYPES.find(t => t.id === selectedEnhancedImageType)?.description || ""
      }
      
      const imageFormat = IMAGE_FORMATS.find(f => f.id === selectedImageFormat)?.name || "Portrait 9:16"
      const brandSegment = BRAND_SEGMENTS.find(s => s.id === selectedBrandSegment) || BRAND_SEGMENTS[0]
      const fontStyle = FONT_STYLES.find(f => f.id === selectedFontStyle)?.name || "modern sans-serif"
      
      // Get color palette
      let paletteDescription = "modern and clean"
      let colorSpecification = ""
      
      if (useCustomPalette) {
        paletteDescription = "custom brand colors"
        colorSpecification = `(${customColorPalette.join(", ")})`
      } else {
        paletteDescription = COLOR_PALETTES[selectedPalette as keyof typeof COLOR_PALETTES]?.description || "modern and clean"
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
      
      // Enhanced social media content prompts
      const enhancedContentPrompts = {
        "comparison_post": `Create a compelling side-by-side comparison showing "${brandName || "Brand Name"}" vs competitors or the before/after transformation. Clearly illustrate the advantages of "${brandName || "Brand Name"}" with a split-screen layout.`,
        "before_after": `Design a dramatic before/after transformation showing results achieved with "${brandName || "Brand Name"}". Show the contrast between the starting point and impressive end result to trigger emotional response.`,
        "myth_vs_fact": `Create an educational graphic that debunks a common myth about ${userPrompt || "industry misconceptions"} with facts from "${brandName || "Brand Name"}". Use a clear visual distinction between myth and fact sections.`,
        "testimonial": `Design a customer testimonial featuring a compelling quote about "${brandName || "Brand Name"}" with professional typography, customer photo representation, and results-focused visual elements.`,
        "mini_tutorial": `Create a step-by-step mini-tutorial about ${userPrompt || "using the product"} with "${brandName || "Brand Name"}". Use numbered steps, icons, and clear instructional elements that provide immediate value.`,
        "stats_insights": `Design a data-driven graphic featuring key statistics about ${userPrompt || "industry insights"} related to "${brandName || "Brand Name"}". Use charts or visual representations of the numbers for impact.`,
        "behind_scenes": `Create an authentic behind-the-scenes image showing the creation/development process of "${brandName || "Brand Name"}", with candid, documentary-style photography that builds authenticity.`,
        "pain_point": `Design a graphic that addresses the pain point of ${userPrompt || "customer challenges"} and shows how "${brandName || "Brand Name"}" solves it. Use emotional imagery that resonates with frustrated customers.`,
        "feature_spotlight": `Create a focused feature highlight for "${brandName || "Brand Name"}" showing ${userPrompt || "key feature"} in action. Use callouts, arrows, or highlights to draw attention to the specific functionality.`
      };
      
      // Get the appropriate campaign example or use a standard one if not found
      let campaignExample = "modern professional marketing";
      if (imageTypeMode === 'standard' && exemplaryCampaigns[selectedImageType as keyof typeof exemplaryCampaigns]?.[selectedBrandSegment as keyof (typeof exemplaryCampaigns)[keyof typeof exemplaryCampaigns]]) {
        campaignExample = exemplaryCampaigns[selectedImageType as keyof typeof exemplaryCampaigns][selectedBrandSegment as keyof (typeof exemplaryCampaigns)[keyof typeof exemplaryCampaigns]];
      }
      
      // Base prompt structure
      let enhancedPrompt = `Create a ${imageFormat} `;
      
      // Add appropriate content based on image type mode
      if (imageTypeMode === 'enhanced') {
        // For enhanced social media content types
        const contentType = selectedEnhancedImageType;
        enhancedPrompt += enhancedContentPrompts[contentType as keyof typeof enhancedContentPrompts] || `${imageType} (${imageTypeDescription})`;
      } else {
        // For standard image types
        enhancedPrompt += `${imageType} inspired by the style of ${campaignExample}, but using "${brandName || "Brand Name"}" as the company and "${headline || "Product Headline"}" as the main message.`;
      }
      
      // Common design elements for all types
      enhancedPrompt += ` The image should:
      - Use a ${paletteDescription} ${colorSpecification} color scheme
      - Feature professional typography in ${fontStyle} style
      - Appeal to ${brandSegment.name} industry audiences
      - Have ${brandSegment.lighting}
      - Include appropriate negative space for text elements
      - Look like a premium professionally designed ad
      - Position text elements tastefully with good hierarchy
      - DO NOT include any logos or brand symbols in the image
      
      Campaign purpose: ${userPrompt || "Showcase products and build brand awareness"}
      
      IMPORTANT: Never include any logos, watermarks, or brand symbols in the image. The brand name should only appear as text, not as a logo.
      
      Ensure the final result feels like a polished, premium advertisement that would be created by a professional designer for a major brand campaign.`;
      
      return enhancedPrompt;
    } catch (error) {
      console.error("Error generating enhanced prompt:", error);
      return userPrompt; // Fallback to original user prompt if enhancement fails
    }
  };

  // Create prompt for reference image-based generation
  const generateReferenceImagePrompt = (): string => {
    try {
      const imageType = REFERENCE_IMAGE_TYPES.find(t => t.id === selectedReferenceImageType)?.name || "Product in Scene";
      const imageTypeDesc = REFERENCE_IMAGE_TYPES.find(t => t.id === selectedReferenceImageType)?.description || "";
      const imageFormat = IMAGE_FORMATS.find(f => f.id === selectedImageFormat)?.name || "Portrait 9:16";
      const brandSegment = BRAND_SEGMENTS.find(s => s.id === selectedBrandSegment) || BRAND_SEGMENTS[0];
      
      // Get color palette
      let paletteDescription = "modern and clean";
      let colorSpecification = "";
      
      if (useCustomPalette) {
        paletteDescription = "custom brand colors";
        colorSpecification = `(${customColorPalette.join(", ")})`;
      } else {
        paletteDescription = COLOR_PALETTES[selectedPalette as keyof typeof COLOR_PALETTES]?.description || "modern and clean";
      }
      
      // Reference-based prompts for different image types
      const referencePrompts = {
        "product_scene": `Create a professional ${imageFormat} advertisement showing the product(s) from my reference images placed in a new appealing ${brandSegment.name} scene. Use "${brandName || "Brand Name"}" as the company and "${headline || "Product Headline"}" as the main message. Maintain the key product details but enhance the composition and setting.`,
        
        "creative_variation": `Create a creative variation of my reference images in ${imageFormat} format. Keep the core product/subject recognizable but enhance with a fresh, professional advertising style suitable for ${brandSegment.name} brands. Include "${brandName || "Brand Name"}" and "${headline || "Product Headline"}" with professional typography.`,
        
        "lifestyle_usage": `Transform my reference product images into a lifestyle ${imageFormat} advertisement showing the product(s) being used in a real-world scenario. Show people naturally interacting with or benefiting from the product in a way that appeals to ${brandSegment.name} audiences. Include "${brandName || "Brand Name"}" and "${headline || "Product Headline"}".`,
        
        "styled_collection": `Arrange the products from my reference images into a professionally styled ${imageFormat} collection/layout suitable for a ${brandSegment.name} brand advertisement. Create a cohesive, aesthetically pleasing composition that highlights the products together. Include "${brandName || "Brand Name"}" and "${headline || "Product Headline"}".`,
        
        "color_theme_change": `Apply the ${paletteDescription} ${colorSpecification} to my reference images, transforming them into a cohesive ${imageFormat} advertisement for "${brandName || "Brand Name"}". Maintain the core product/subject but enhance with the new color palette and add "${headline || "Product Headline"}" with professional typography.`
      };
      // Base prompt from the selected reference image type
      let prompt = referencePrompts[selectedReferenceImageType as keyof typeof referencePrompts] || `Create a professional ${imageFormat} advertisement based on my reference images for "${brandName || "Brand Name"}" with the headline "${headline || "Product Headline"}".`;
      
      // Add common styling elements
      prompt += `
      The final image should:
      - Use a ${paletteDescription} ${colorSpecification} color scheme
      - Feature professional typography
      - Appeal to ${brandSegment.name} industry audiences
      - Have ${brandSegment.styleTag} styling
      - Include appropriate negative space for text elements
      - Look like a premium professionally designed ad
      - DO NOT include any logos or brand symbols in the image
      
      Campaign purpose: ${subject || "Showcase products and build brand awareness"}
      
      IMPORTANT: Never include any logos, watermarks, or brand symbols in the image. The brand name should only appear as text, not as a logo.
      
      Ensure the final result feels like a polished, premium advertisement that would be created by a professional designer for a major brand campaign.`;
      
      return prompt;
    } catch (error) {
      console.error("Error generating reference image prompt:", error);
      return `Create a professional advertisement based on my reference images for "${brandName || "Brand Name"}" with the headline "${headline || "Product Headline"}".`;
    }
  };

  // Handle color change in custom palette
  const handleColorChange = (index: number, color: string) => {
    const newPalette = [...customColorPalette];
    newPalette[index] = color;
    setCustomColorPalette(newPalette);
    // Force custom palette mode when user edits colors
    setUseCustomPalette(true);
  };
  
  // Color picker component with react-colorful
  const ColorPickerItem = ({ color, index }: { color: string, index: number }) => {
    // Open color picker in a modal dialog approach
    const [showPicker, setShowPicker] = useState(false);
    const [currentColor, setCurrentColor] = useState(color);
    // Track if we're on a mobile device
    const [isMobile, setIsMobile] = useState(false);

    // Check device on mount and window resize
    useEffect(() => {
      const checkIfMobile = () => {
        setIsMobile(window.innerWidth < 768);
      };
      
      // Initial check
      checkIfMobile();
      
      // Add event listener for window resize
      window.addEventListener('resize', checkIfMobile);
      
      // Cleanup
      return () => {
        window.removeEventListener('resize', checkIfMobile);
      };
    }, []);
    
    // Close picker when clicking the overlay
    const handleCloseClick = useCallback((e: React.MouseEvent) => {
      // Only close if clicking the overlay, not the picker itself
      if (e.target === e.currentTarget) {
        setShowPicker(false);
      }
    }, []);
    
    // Handle color change without immediately updating global state
    const handleColorChangeLocal = useCallback((newColor: string) => {
      setCurrentColor(newColor);
    }, []);
    
    // Apply changes when picker is closed
    const applyColorChange = useCallback(() => {
      handleColorChange(index, currentColor);
      setShowPicker(false);
    }, [index, currentColor]);
    
    // Handle key events for closing
    useEffect(() => {
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          setShowPicker(false);
        } else if (e.key === 'Enter') {
          applyColorChange();
        }
      };
      
      if (showPicker) {
        document.addEventListener('keydown', handleKeyDown);
      }
      
      return () => {
        document.removeEventListener('keydown', handleKeyDown);
      };
    }, [showPicker, applyColorChange]);
    
    // Reset local color when picker is opened
    useEffect(() => {
      setCurrentColor(color);
    }, [color, showPicker]);
    
    // Prevent body scrolling when picker is open
    useEffect(() => {
      if (showPicker) {
        // Add overflow-hidden to body to prevent scrolling
        document.body.style.overflow = 'hidden';
        
        // For iOS Safari to prevent background scrolling
        if (isMobile) {
          document.body.style.position = 'fixed';
          document.body.style.width = '100%';
          document.body.style.top = `-${window.scrollY}px`;
        }
      } else {
        // Restore scrolling when picker is closed
        document.body.style.overflow = '';
        
        // For iOS Safari to restore scroll position
        if (isMobile) {
          const scrollY = document.body.style.top;
          document.body.style.position = '';
          document.body.style.width = '';
          document.body.style.top = '';
          window.scrollTo(0, parseInt(scrollY || '0') * -1);
        }
      }
      
      return () => {
        // Cleanup: ensure scrolling is restored if component unmounts
        document.body.style.overflow = '';
        if (isMobile) {
          const scrollY = document.body.style.top;
          document.body.style.position = '';
          document.body.style.width = '';
          document.body.style.top = '';
          window.scrollTo(0, parseInt(scrollY || '0') * -1);
        }
      };
    }, [showPicker, isMobile]);
    
    // Mobile-specific color picker
    const MobileColorPicker = () => {
      // Reference for touch handling
      const touchSurfaceRef = useRef<HTMLDivElement>(null);
      const [showPresetColors, setShowPresetColors] = useState(false);
      
      // Common color presets for quick selection
      const colorPresets = [
        "#FF0000", // Red
        "#FF9500", // Orange
        "#FFCC00", // Yellow
        "#4CD964", // Green
        "#5AC8FA", // Light Blue
        "#007AFF", // Blue
        "#5856D6", // Purple
        "#FF2D55", // Pink
        "#8E8E93", // Gray
        "#000000", // Black
        "#FFFFFF", // White
      ];
      
      // Touch event handling for smoother color picker drag
      // IMPORTANT: For mobile devices only - don't interfere with mouse events
      useEffect(() => {
        const touchSurface = touchSurfaceRef.current;
        if (!touchSurface) return;
        
        // Only intercept touch events, not mouse events
        const preventDefaultOnTouch = (e: TouchEvent) => {
          // Only prevent default on the color picker elements
          if (
            e.target instanceof Element && 
            (e.target.closest('.react-colorful__saturation') || 
             e.target.closest('.react-colorful__hue'))
          ) {
            e.preventDefault();
          }
        };
        
        // Add passive: false to ensure preventDefault works, but only for touch events
        touchSurface.addEventListener('touchmove', preventDefaultOnTouch, { passive: false });
        
        return () => {
          touchSurface.removeEventListener('touchmove', preventDefaultOnTouch);
        };
      }, []);
      
      return (
        <div className="fixed inset-0 bg-black bg-opacity-80 z-[100] flex flex-col">
          {/* Header with close button */}
          <div className="bg-white dark:bg-gray-800 px-4 py-3 flex justify-between items-center border-b">
            <h3 className="text-base font-medium">Choose Color</h3>
            <div className="flex items-center gap-2">
              <button
                type="button"
                className="p-2 rounded-full text-gray-500 flex items-center justify-center"
                onClick={() => setShowPresetColors(!showPresetColors)}
                aria-label="Toggle presets"
              >
                <Palette size={20} />
              </button>
              <button
                type="button"
                className="p-2 rounded-full text-gray-500 flex items-center justify-center"
                onClick={() => setShowPicker(false)}
                aria-label="Close"
              >
                <X size={20} />
              </button>
            </div>
          </div>
          
          {/* Color picker body */}
          <div ref={touchSurfaceRef} className="flex-1 bg-white dark:bg-gray-800 overflow-y-auto flex flex-col">
            {/* Preview */}
            <div className="p-4 pb-2">
              <div 
                className="w-full h-28 rounded-lg mb-4 shadow-inner"
                style={{ backgroundColor: currentColor }}
              />
            </div>
            
            {/* Quick color presets */}
            {showPresetColors && (
              <div className="px-4 pb-4">
                <div className="grid grid-cols-6 gap-2">
                  {colorPresets.map((presetColor, i) => (
                    <button
                      key={i}
                      type="button"
                      className={`w-full aspect-square rounded-md border-2 ${currentColor === presetColor ? 'border-blue-500' : 'border-gray-200'}`}
                      style={{ backgroundColor: presetColor }}
                      onClick={() => setCurrentColor(presetColor)}
                      aria-label={`Select ${presetColor} color`}
                    />
                  ))}
                </div>
              </div>
            )}
            
            {/* Hex color picker with enhanced touch handling */}
            <div className="touch-color-picker-container px-4 pb-0">
              <HexColorPicker 
                color={currentColor} 
                onChange={handleColorChangeLocal} 
                style={{ 
                  width: '100%',
                  height: '220px', // Even taller for better mobile touch
                  maxWidth: '100%'
                }}
              />
              <style jsx global>{`
                /* Enhanced handling for mobile color picker */
                .touch-color-picker-container .react-colorful {
                  -webkit-tap-highlight-color: transparent;
                  user-select: none;
                }
                
                /* Make sliders and thumb bigger for touch */
                .touch-color-picker-container .react-colorful__saturation {
                  border-radius: 8px 8px 0 0;
                  border-bottom: 12px solid transparent;
                }
                
                .touch-color-picker-container .react-colorful__hue {
                  height: 30px;
                  border-radius: 0 0 8px 8px;
                  margin-top: 2px;
                }
                
                .touch-color-picker-container .react-colorful__saturation-pointer,
                .touch-color-picker-container .react-colorful__hue-pointer {
                  width: 28px;
                  height: 28px;
                  border-width: 3px;
                  transform: translate(-50%, -50%);
                  box-shadow: 0 2px 4px rgba(0,0,0,0.2);
                  cursor: pointer; /* Ensure cursor indicates interactivity */
                }
                
                /* Delay transition to make it feel more responsive */
                .touch-color-picker-container .react-colorful__interactive {
                  transition: transform 0.05s;
                  cursor: pointer; /* Ensure cursor indicates interactivity */
                }
                
                /* Input and saturation area improvements */
                input[type="text"] {
                  font-size: 16px; /* Prevent iOS zoom on focus */
                }
                
                /* Mobile-specific touch handling */
                @media (pointer: coarse) {
                  .touch-color-picker-container .react-colorful__interactive {
                    touch-action: none;
                  }
                  
                  .touch-color-picker-container .react-colorful__saturation,
                  .touch-color-picker-container .react-colorful__hue {
                    touch-action: none;
                  }
                }
              `}</style>
            </div>
            
            {/* Color code fields */}
            <div className="flex-grow flex flex-col justify-end">
              {/* Hex input field */}
              <div className="p-4 pt-6 flex items-center">
                <div className="text-sm font-medium mr-3">Hex:</div>
                <input
                  type="text"
                  value={currentColor}
                  onChange={(e) => {
                    const value = e.target.value;
                    if (/^#?[0-9A-Fa-f]{0,6}$/.test(value)) {
                      setCurrentColor(value.startsWith('#') ? value : `#${value}`);
                    }
                  }}
                  className="flex-1 border rounded-md px-3 py-3 text-center uppercase font-mono text-base"
                  maxLength={7}
                />
              </div>
            </div>
          </div>
          
          {/* Action buttons */}
          <div className="p-4 bg-white dark:bg-gray-800 border-t safe-bottom">
            <div className="grid grid-cols-2 gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowPicker(false)}
                className="h-14 text-base font-medium"
              >
                Cancel
              </Button>
              <Button
                type="button"
                onClick={applyColorChange}
                className="h-14 text-base font-medium"
              >
                Apply Color
              </Button>
            </div>
          </div>
        </div>
      );
    };
    
    // Desktop color picker
    const DesktopColorPicker = () => (
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 z-50 flex flex-col items-center justify-start pt-16 sm:pt-32 overflow-y-auto overflow-x-hidden"
        onClick={handleCloseClick}
      >
        <div 
          className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-[min(100vw-32px,_424px)] mx-auto overflow-hidden"
          style={{ 
            maxHeight: '80vh'
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="p-3 sm:p-4">
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-sm sm:text-base font-medium">Select a color</h3>
              <button
                type="button" 
                className="text-gray-400 hover:text-gray-500 p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
                onClick={() => setShowPicker(false)}
              >
                <X size={16} />
              </button>
            </div>
            
            <div className="flex flex-col items-center space-y-3">
              {/* Color picker */}
              <div className="w-full overflow-hidden" style={{ maxWidth: '100%' }}>
                <HexColorPicker 
                  color={currentColor} 
                  onChange={handleColorChangeLocal} 
                  style={{ 
                    width: '100%', 
                    height: '120px',
                    maxWidth: '100%'
                  }}
                />
              </div>
              
              {/* Preview and hex code display */}
              <div className="flex items-center w-full mt-3">
                <div 
                  className="w-8 h-8 rounded-md border shadow-inner mr-2 flex-shrink-0"
                  style={{ backgroundColor: currentColor }}
                />
                <input
                  type="text"
                  value={currentColor}
                  onChange={(e) => {
                    const value = e.target.value;
                    if (/^#?[0-9A-Fa-f]{0,6}$/.test(value)) {
                      setCurrentColor(value.startsWith('#') ? value : `#${value}`);
                    }
                  }}
                  className="flex-1 border rounded-md px-1.5 py-1 text-center uppercase font-mono text-xs"
                  maxLength={7}
                />
              </div>
              
              {/* Action buttons */}
              <div className="flex justify-end w-full gap-2 mt-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowPicker(false)}
                  className="h-8 text-xs px-2"
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  onClick={applyColorChange}
                  className="h-8 text-xs px-2"
                >
                  Apply
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
    
    return (
      <div className="flex flex-col items-center space-y-1 sm:space-y-2 relative">
        {/* Color swatch */}
        <div 
          className="w-6 h-6 xs:w-7 xs:h-7 sm:w-10 sm:h-10 rounded-md cursor-pointer border border-gray-300 shadow-sm hover:ring-2 hover:ring-blue-300 transition-all"
          style={{ backgroundColor: color }}
          onClick={() => setShowPicker(true)}
        />
        
        {/* Hex input field */}
        <input
          type="text"
          value={color}
          onChange={(e) => {
            const newValue = e.target.value;
            // Only update if it's a valid hex code or empty
            if (/^#[0-9A-Fa-f]{0,6}$/.test(newValue) || /^[0-9A-Fa-f]{0,6}$/.test(newValue)) {
              handleColorChange(index, newValue);
            }
          }}
          onBlur={(e) => {
            // Add # prefix if missing on blur
            if (/^[0-9A-Fa-f]{3,6}$/.test(e.target.value)) {
              handleColorChange(index, `#${e.target.value}`);
            }
            // Ensure 6 digits
            else if (/^#[0-9A-Fa-f]{3}$/.test(e.target.value)) {
              // Convert 3-digit hex to 6-digit
              const digits = e.target.value.substring(1).split('');
              handleColorChange(index, `#${digits[0]}${digits[0]}${digits[1]}${digits[1]}${digits[2]}${digits[2]}`);
            }
          }}
          className="w-full text-[10px] xs:text-xs sm:text-xs p-1 text-center border rounded"
          maxLength={7}
        />
        
        {/* Color picker modal - conditionally render based on device */}
        {showPicker && (
          isMobile ? <MobileColorPicker /> : <DesktopColorPicker />
        )}
      </div>
    );
  };

  // Show toast notification
  const showToast = useCallback((title: string, description: string, type: 'success' | 'error') => {
    setToastMessage({ title, description, type });
    setTimeout(() => setToastMessage(null), 3000);
  }, []);

  // Toggle selection for a given image index
  function toggleImageSelected(index: number) {
    setSelectedImages((prev) =>
      prev.includes(index) ? prev.filter((i) => i !== index) : [...prev, index]
    );
  }

  // Reference image handling
  const handleReferenceImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;
    
    // Limit to max 4 reference images
    if (referenceImages.length + files.length > 4) {
      showToast(
        "Too many images", 
        "You can upload a maximum of 4 reference images", 
        "error"
      );
      return;
    }
    
    setIsUploading(true);
    
    // Process each file
    Array.from(files).forEach(file => {
      if (!file.type.startsWith('image/')) {
        showToast("Invalid file", "Please upload only image files", "error");
        return;
      }
      
      const reader = new FileReader();
      reader.onload = (e) => {
        if (e.target?.result) {
          setReferenceImages(prev => [...prev, e.target!.result as string]);
        }
      };
      reader.readAsDataURL(file);
    });
    
    setIsUploading(false);
    
    // Reset the file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Remove a reference image
  const removeReferenceImage = (index: number) => {
    setReferenceImages(prev => prev.filter((_, i) => i !== index));
  };

  // Clear all reference images
  const clearReferenceImages = () => {
    setReferenceImages([]);
  };

  // Generate images with our enhanced prompt (for text-based generation)
  const handleGenerateImages = async () => {
    if (useReferenceImages) {
      // Call reference image generation function
      await handleGenerateWithReferenceImages();
      return;
    }
    
    if (!subject.trim() && !brandName && !headline) {
      showToast("Missing information", "Please provide a campaign goal, brand name, or headline", "error");
      return;
    }
    
    // Check if image limit reached
    if (isImageLimitReached) {
      setShowUpgradeModal(true);
      return;
    }
    
    // Diagnostic logging for color palette
    console.log("Generation settings:", {
      useCustomPalette,
      selectedPalette,
      customColors: customColorPalette,
      usedPalette: useCustomPalette ? "Custom" : selectedPalette
    });
    
    setIsGeneratingImages(true);
    
    try {
      // Generate the enhanced prompt from all our form fields
      const enhancedPrompt = generateEnhancedPrompt(subject);
      
      // Log the prompt to verify color settings are included
      console.log("Generated prompt:", enhancedPrompt);
      
      // Further improve the prompt using the server-side improvePrompt
      const finalPrompt = await improvePrompt(enhancedPrompt, "instagram", "image");
      
      // Get the aspect ratio from the selected format
      const aspectRatio = selectedImageFormat as AspectRatio;
      
      // Generate the images
      const result = await generateImages(finalPrompt, aspectRatio, numGeneratedImages);
      
      if (result.success && result.images) {
        const validUrls = result.images.filter((url: unknown) => typeof url === "string") as string[];
        setGeneratedImages(validUrls);
        
        // Increment usage counter
        await incrementImageCount();
        
        showToast(
          "Images generated", 
          `Created ${validUrls.length} image${validUrls.length !== 1 ? 's' : ''} successfully`, 
          "success"
        );
      } else {
        throw new Error(result.error || "Failed to generate images.");
      }
    } catch (err) {
      console.error("Error generating images:", err);
      
      // Check if error is due to free plan limit
      const errorMessage = err instanceof Error ? err.message : String(err);
      if (errorMessage.includes("Free plan image generation limit reached")) {
        // Show the upgrade modal if limit is reached
        setShowUpgradeModal(true);
      } else {
        // Show regular error for other types of errors
        showToast(
          "Generation failed", 
          "Unable to create images. Please try again with a different prompt.", 
          "error"
        );
      }
    } finally {
      setIsGeneratingImages(false);
    }
  };

  // Generate images using reference images
  const handleGenerateWithReferenceImages = async () => {
    if (referenceImages.length === 0) {
      showToast("No reference images", "Please upload at least one reference image", "error");
      return;
    }
    
    // Check if image limit reached
    if (isImageLimitReached) {
      setShowUpgradeModal(true);
      return;
    }
    
    // Diagnostic logging for color palette
    console.log("Reference image generation settings:", {
      useCustomPalette,
      selectedPalette,
      customColors: customColorPalette,
      usedPalette: useCustomPalette ? "Custom" : selectedPalette
    });
    
    setIsGeneratingImages(true);
    
    try {
      // Generate prompt specifically for reference images
      const refPrompt = generateReferenceImagePrompt();
      
      // Log the prompt to verify color settings are included
      console.log("Generated reference image prompt:", refPrompt);
      
      // Get the aspect ratio from the selected format
      const aspectRatio = selectedImageFormat as AspectRatio;
      
      // Use the appropriate API based on number of reference images
      let result;
      if (referenceImages.length === 1) {
        // For single reference image
        result = await generateImageVariation(
          referenceImages[0],
          aspectRatio,
          numGeneratedImages,
          refPrompt
        );
      } else {
        // For multiple reference images
        result = await generateImageVariants(
          refPrompt,
          referenceImages,
          aspectRatio,
          numGeneratedImages
        );
      }
      
      if (result.success && result.images) {
        const validUrls = result.images.filter((url: unknown) => typeof url === "string") as string[];
        setGeneratedImages(validUrls);
        
        // Increment usage counter
        await incrementImageCount();
        
        showToast(
          "Images generated", 
          `Created ${validUrls.length} image${validUrls.length !== 1 ? 's' : ''} successfully using your reference images`, 
          "success"
        );
      } else {
        throw new Error(result.error || "Failed to generate images with reference images.");
      }
    } catch (err) {
      console.error("Error generating images with references:", err);
      
      // Check if error is due to free plan limit
      const errorMessage = err instanceof Error ? err.message : String(err);
      if (errorMessage.includes("Free plan image generation limit reached")) {
        // Show the upgrade modal if limit is reached
        setShowUpgradeModal(true);
      } else {
        // Show regular error for other types of errors
        showToast(
          "Reference image generation failed", 
          "Unable to create images. Please try with different reference images or check image format.", 
          "error"
        );
      }
    } finally {
      setIsGeneratingImages(false);
    }
  };

  // Logo upload handling
  function handleLogoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0]
      
      // Validate file size (5MB max)
      if (file.size > 5 * 1024 * 1024) {
        showToast("File too large", "Logo file must be smaller than 5MB.", "error")
        return
      }
      
      const reader = new FileReader()
      reader.onload = () => {
        if (reader.result) {
          setLogoUrl(reader.result as string)
          showToast(
            "Logo uploaded", 
            "Your logo has been added and can be positioned on images.", 
            "success"
          )
        }
      }
      reader.readAsDataURL(file)
    }
  }

  // Handle logo button click
  function handleLogoButtonClick() {
    if (logoInputRef.current) {
      logoInputRef.current.click()
    }
  }

  // Handle logo position change
  const handlePositionChange = (newPosition: string) => {
    // Prevent preview updates during position changes
    setIsDragUpdatePending(true)
    
    // Update the position setting
    setOverlayPosition(newPosition)
    setIsCustomPosition(newPosition === "custom")
    
    // Reset saved positions when switching to a preset position
    if (newPosition !== "custom") {
      setLogoPositions({})
    }
    
    // Switch to withLogo tab when custom position is selected
    if (newPosition === "custom" && activeTab !== "withLogo") {
      setActiveTab("withLogo")
    }
    
    // Allow preview to update after a short delay
    setTimeout(() => {
      setIsDragUpdatePending(false)
    }, 100)
  }
  
  // We're using react-draggable now, so we don't need these handlers

  // Clear logo
  function handleClearLogo() {
    setLogoUrl("")
    if (logoInputRef.current) {
      logoInputRef.current.value = ""
    }
    showToast("Logo removed", "Your logo has been cleared.", "success")
  }

  // Combine image with logo for download
  const combineImages = async (backgroundUrl: string, overlayUrl: string, position: string, imageIndex = 0) => {
    return new Promise<string>((resolve, reject) => {
      const canvas = document.createElement("canvas")
      const ctx = canvas.getContext("2d")
      if (!ctx) {
        return reject(new Error("Could not get canvas context"))
      }

      const background = new window.Image()
      const overlay = new window.Image()

      background.crossOrigin = "anonymous"
      overlay.crossOrigin = "anonymous"

      background.onload = () => {
        canvas.width = background.width
        canvas.height = background.height
        ctx.drawImage(background, 0, 0)

        overlay.onload = () => {
          // Calculate logo size based on percentage setting
          const maxWidth = Math.floor(canvas.width * (logoSize / 100))
          
          // Calculate aspect-correct height
          const aspectRatio = overlay.width / overlay.height
          const scaledWidth = Math.min(maxWidth, overlay.width)
          const scaledHeight = scaledWidth / aspectRatio
          
          let x = 0
          let y = 0
          const padding = Math.floor(canvas.width * 0.03) // 3% padding

          if (position === "custom" && isCustomPosition) {
            // Use the specific position for this image index
            const customPos = logoPositions[imageIndex]
            if (customPos) {
              // Get reference to preview container to calculate percentage position
              const previewElement = previewRefs.current[imageIndex]
              if (previewElement) {
                // Get container dimensions
                const containerWidth = previewElement.offsetWidth
                const containerHeight = previewElement.offsetHeight
                
                // Calculate position as a percentage of container dimensions
                const relativeX = customPos.x / containerWidth
                const relativeY = customPos.y / containerHeight
                
                // Apply percentage to actual canvas dimensions
                // No need to subtract half width since we're storing top-left coordinates
                x = (canvas.width * relativeX)
                y = (canvas.height * relativeY)
                
                // Ensure the logo stays within the image boundaries
                x = Math.max(padding, Math.min(canvas.width - scaledWidth - padding, x))
                y = Math.max(padding, Math.min(canvas.height - scaledHeight - padding, y))
              }
            } else {
              // Default to center if no custom position set
              x = (canvas.width - scaledWidth) / 2
              y = (canvas.height - scaledHeight) / 2
            }
          } else {
            // Decide Y position for preset positions
            if (position.includes("bottom")) {
              y = canvas.height - scaledHeight - padding
            } else if (position.includes("middle") || position === "center") {
              y = (canvas.height - scaledHeight) / 2
            } else if (position.includes("top")) {
              y = padding
            }

            // Decide X position for preset positions
            if (position.includes("right")) {
              x = canvas.width - scaledWidth - padding
            } else if (position.includes("center")) {
              x = (canvas.width - scaledWidth) / 2
            } else if (position.includes("left")) {
              x = padding
            }
          }

          ctx.drawImage(overlay, x, y, scaledWidth, scaledHeight)
          const finalUrl = canvas.toDataURL("image/png")
          resolve(finalUrl)
        }
        overlay.onerror = (err) => reject(err)
        overlay.src = overlayUrl
      }

      background.onerror = (err) => reject(err)
      background.src = backgroundUrl
    })
  }
  
  // Initialize previewRefs when images change
  useEffect(() => {
    // Reset refs array when number of images changes
    previewRefs.current = Array(generatedImages.length).fill(null)
  }, [generatedImages.length])
  
  // LogoDragIndicator component with react-draggable library
  const LogoDragIndicator = ({ imageIndex }: { imageIndex: number }) => {
    if (!isCustomPosition || !logoUrl) return null
    
    // Get the reference to this specific image container
    const previewRef = previewRefs.current[imageIndex]
    if (!previewRef) return null
    
    // Get container dimensions for calculations
    const containerWidth = previewRef.offsetWidth
    const containerHeight = previewRef.offsetHeight
    
    // Calculate logo size in pixels
    const exactLogoWidth = Math.floor(containerWidth * (logoSize / 100))
    
    // Get saved position for this image, or default to center
    const savedPosition = logoPositions[imageIndex]
    
    // Default position at center of container
    const defaultPosition = {
      x: containerWidth / 2 - exactLogoWidth / 2,
      y: containerHeight / 2 - exactLogoWidth / 2
    }
    
    // Use saved position if available, otherwise use default
    const position = savedPosition || defaultPosition
    
    // Handle the end of dragging - save the position
    const handleDragStop = (e: any, data: any) => {
      // Save the absolute position in the container
      setLogoPositions(prev => ({
        ...prev,
        [imageIndex]: { x: data.x, y: data.y }
      }))
      
      // Update preview images with new position
      setTimeout(() => setIsDragUpdatePending(false), 100)
    }
    
    // Handle the start of dragging
    const handleDragStart = () => {
      // Prevent rerendering of previews during drag
      setIsDragUpdatePending(true)
      setIsDraggingLogo(true)
      setDraggedImageIndex(imageIndex)
    }
    
    // Calculate bounds to keep logo inside container
    const bounds = {
      left: 0,
      top: 0,
      right: containerWidth - exactLogoWidth,
      bottom: containerHeight - exactLogoWidth
    }
    
    // Use the position directly since we're now storing top-left coordinates
    const dragPosition = {
      x: position.x,
      y: position.y
    }
    
    return (
      <>
        {/* If we're dragging, show an overlay with the original image */}
        {isDraggingLogo && draggedImageIndex === imageIndex && (
          <div className="absolute inset-0 z-10 pointer-events-none">
            <div 
              className="absolute inset-0"
              style={{ 
                backgroundColor: isDarkMode ? 'rgba(17, 24, 39, 0.85)' : 'rgba(243, 244, 246, 0.85)',
                backgroundImage: `url(${generatedImages[imageIndex]})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                filter: 'blur(1px) brightness(0.7)'
              }}
            />
            <div className="absolute top-2 left-0 right-0 text-center">
              <div className={`inline-block text-sm font-medium py-1 px-3 rounded-md ${
                isDarkMode ? 'bg-gray-800 text-gray-200' : 'bg-white text-gray-700'
              }`}>
                Drag to position logo
              </div>
            </div>
          </div>
        )}
        
        {/* Draggable logo component */}
        <Draggable
          bounds={bounds}
          position={dragPosition}
          onStart={handleDragStart}
          onStop={handleDragStop}
          onDrag={() => {
            // Keep the dragging state active
            setIsDraggingLogo(true)
          }}
        >
          <div
            className="absolute cursor-grab active:cursor-grabbing z-20"
            style={{ 
              width: `${exactLogoWidth}px`,
              height: `${exactLogoWidth}px`,
              opacity: isDraggingLogo && draggedImageIndex !== imageIndex ? 0.3 : 1,
              transition: 'opacity 0.2s ease'
            }}
          >
            <NextImage
              src={logoUrl}
              alt="Draggable logo"
              width={exactLogoWidth}
              height={exactLogoWidth}
              className="w-full h-auto object-contain pointer-events-none"
              draggable={false}
              style={{
                filter: `drop-shadow(0 0 3px ${isDarkMode ? 'rgba(255, 255, 255, 0.3)' : 'rgba(0, 0, 0, 0.3)'})`
              }}
            />
            
            {/* Show hint on the first image when no positions are saved */}
            {(imageIndex === 0 && !Object.keys(logoPositions).length) && (
              <div className={`absolute -top-8 left-1/2 transform -translate-x-1/2 whitespace-nowrap text-xs font-medium px-2 py-1 rounded-md ${
                isDarkMode ? 'bg-blue-600 text-white' : 'bg-blue-100 text-blue-800'
              }`}>
                Drag me to position
              </div>
            )}
          </div>
        </Draggable>
      </>
    )
  }
  
  // We don't need event listeners with react-draggable
  
  // Generate logo previews when logo or settings change
  useEffect(() => {
    // Skip preview updates if we're in the middle of dragging
    if (isDragUpdatePending) return
    
    // Prevent unnecessary preview generation
    const generatePreviews = async () => {
      if (!logoUrl || generatedImages.length === 0) {
        setCombinedPreviews([])
        return
      }
      
      try {
        // Show loading state during generation
        setIsProcessing(true)
        
        const newPreviews: string[] = []
        for (let i = 0; i < generatedImages.length; i++) {
          const combined = await combineImages(generatedImages[i], logoUrl, overlayPosition, i)
          newPreviews.push(combined)
        }
        
        setCombinedPreviews(newPreviews)
        
        // Automatically switch to the "withLogo" tab when logo is added
        if (activeTab === "original" && newPreviews.length > 0) {
          setActiveTab("withLogo")
        }
      } catch (err) {
        console.error("Error generating logo previews:", err)
        showToast("Preview error", "Failed to generate logo previews. Please try again.", "error")
      } finally {
        setIsProcessing(false)
      }
    }

    const debounceTimeout = setTimeout(() => {
      generatePreviews()
    }, 200) // Add small debounce for better performance
    
    return () => {
      clearTimeout(debounceTimeout)
    }
  }, [
    generatedImages, 
    logoUrl, 
    overlayPosition, 
    logoSize,
    activeTab,
    isDragUpdatePending,
    showToast
  ])

  // Download image
  async function handleDownload(imageUrl: string, index: number) {
    try {
      if (logoUrl) {
        // If a logo exists, combine logo with image before download
        const finalUrl = await combineImages(imageUrl, logoUrl, overlayPosition);
        const response = await fetch(finalUrl);
        if (!response.ok) throw new Error("Failed to fetch combined image for download");
        
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `${brandName || "brand"}-ad-${index + 1}-with-logo.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
        
        showToast("Download complete", "Image with logo saved successfully to your device.", "success");
      } else {
        // No logo, download original image
        const response = await fetch(imageUrl);
        if (!response.ok) throw new Error("Failed to fetch image for download");

        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `${brandName || "brand"}-ad-${index + 1}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);

        showToast("Download complete", "Image saved successfully to your device.", "success");
      }
    } catch (error) {
      console.error("Error downloading image:", error);
      showToast("Download failed", "Unable to download the image. Please try again.", "error");
    }
  }

  // Loading state
  if (isFetchingSub) {
    return (
      <div className="flex items-center justify-center h-screen w-full">
        <IconSpinner />
      </div>
    );
  }

  // Reference Image Upload Component
  const ReferenceImageUploader = () => {
    return (
      <div className="w-full">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ImagePlus className="h-5 w-5 text-primary" />
              Reference Images
            </CardTitle>
            <CardDescription>
              Upload up to 4 reference images to generate variations or enhance with your brand style
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <Button 
                onClick={() => fileInputRef.current?.click()}
                variant="outline"
                className="flex items-center gap-2"
                disabled={referenceImages.length >= 4}
              >
                <Upload className="h-4 w-4" />
                Upload Images
              </Button>
              
              {referenceImages.length > 0 && (
                <Button 
                  onClick={clearReferenceImages}
                  variant="ghost"
                  className="text-red-500 hover:text-red-700 hover:bg-red-50"
                >
                  <Trash2 className="h-4 w-4 mr-1" />
                  Clear All
                </Button>
              )}
              
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleReferenceImageUpload}
                accept="image/*"
                multiple
                className="hidden"
              />
            </div>
            
            {/* Selected reference images */}
            {referenceImages.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 mt-3 sm:mt-4">
                {referenceImages.map((image, index) => (
                  <div 
                    key={index} 
                    className="relative aspect-square border rounded-md overflow-hidden group"
                  >
                    <NextImage
                      src={image}
                      alt={`Reference image ${index + 1}`}
                      fill
                      className="object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => removeReferenceImage(index)}
                      className="absolute top-1 right-1 bg-white rounded-full p-1 shadow-md opacity-70 hover:opacity-100 transition-opacity"
                    >
                      <X className="h-4 w-4 text-red-500" />
                    </button>
                  </div>
                ))}
                
                {/* Placeholder slots for remaining image uploads */}
                {Array.from({ length: Math.min(4 - referenceImages.length, 4) }).map((_, index) => (
                  <div
                    key={`placeholder-${index}`}
                    className="border border-dashed rounded-md aspect-square flex items-center justify-center bg-gray-50 dark:bg-gray-800 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <div className="flex flex-col items-center text-gray-400">
                      <FilePlus className="h-6 w-6 mb-1" />
                      <span className="text-xs">Add Image</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
            
            {referenceImages.length === 0 && (
              <div 
                className="border-2 border-dashed rounded-lg p-8 mt-2 flex flex-col items-center justify-center cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                onClick={() => fileInputRef.current?.click()}
              >
                <FileImage className="h-12 w-12 text-gray-400 mb-3" />
                <p className="text-sm text-center text-gray-500 dark:text-gray-400">
                  Drag & drop or click to upload reference images
                </p>
                <p className="text-xs text-center text-gray-400 mt-1">
                  Upload product photos, inspiration, or existing ads (max 4)
                </p>
              </div>
            )}
            
            <div className="pt-4">
              <div className="space-y-3">
                <label className="text-sm font-medium">Reference Image Type</label>
                <Select value={selectedReferenceImageType} onValueChange={setSelectedReferenceImageType}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select reference image type" />
                  </SelectTrigger>
                  <SelectContent>
                    {REFERENCE_IMAGE_TYPES.map((type) => (
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
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

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
              Create professional ads for your campaign using the settings you&apos;ve defined
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="pt-2">
              <Button 
                onClick={handleGenerateImages}
                disabled={isGeneratingImages}
                className="w-full h-10 sm:h-12 text-sm sm:text-base flex items-center justify-center gap-1 sm:gap-2 px-2 sm:px-4"
              >
                {isGeneratingImages ? (
                  <>
                    <IconSpinner className="h-4 w-4 sm:h-5 sm:w-5 animate-spin flex-shrink-0" />
                    <span className="truncate">Generating professional images...</span>
                  </>
                ) : (
                  <>
                    <Wand2 className="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0" />
                    <span className="truncate">Generate Professional Ad Creatives</span>
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

                {/* Logo Uploader UI */}
                <div className="p-3 border rounded-md mb-4">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                    <div>
                      <h4 className="text-sm font-medium mb-1">Add Your Logo</h4>
                      <p className="text-xs text-gray-500">Upload your logo to place on generated images</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button 
                        onClick={handleLogoButtonClick}
                        variant="outline"
                        size="sm"
                        className="flex items-center gap-1"
                      >
                        <Upload className="h-3 w-3" />
                        {logoUrl ? "Change Logo" : "Upload Logo"}
                      </Button>
                      {logoUrl && (
                        <Button 
                          onClick={handleClearLogo}
                          variant="ghost" 
                          size="sm"
                          className="text-red-500 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      )}
                      <input
                        type="file"
                        ref={logoInputRef}
                        onChange={handleLogoUpload}
                        accept="image/*"
                        className="hidden"
                      />
                    </div>
                  </div>
                  
                  {logoUrl && (
                    <div className="mt-3 flex flex-col sm:flex-row gap-3 sm:items-end">
                      <div className="w-16 h-16 border rounded-md overflow-hidden relative">
                        <NextImage
                          src={logoUrl}
                          alt="Your logo"
                          fill
                          className="object-contain"
                        />
                      </div>
                      <div className="space-y-2 flex-1">
                        <div>
                          <label className="text-xs mb-1 block">Position</label>
                          <Select defaultValue={overlayPosition} onValueChange={handlePositionChange}>
                            <SelectTrigger className="h-8 text-xs">
                              <SelectValue placeholder="Choose position" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="top-left">Top Left</SelectItem>
                              <SelectItem value="top-right">Top Right</SelectItem>
                              <SelectItem value="bottom-left">Bottom Left</SelectItem>
                              <SelectItem value="bottom-right">Bottom Right</SelectItem>
                              <SelectItem value="center">Center</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <label className="text-xs mb-1 block">Size (%)</label>
                          <div className="flex items-center gap-2">
                            <input
                              type="range"
                              min="5"
                              max="50"
                              value={logoSize}
                              onChange={(e) => setLogoSize(parseInt(e.target.value))}
                              className="flex-1"
                            />
                            <span className="text-xs w-8 text-right">{logoSize}%</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Image View Tabs */}
                {logoUrl && combinedPreviews.length > 0 && (
                  <div className="mb-4 flex border-b">
                    <button
                      type="button"
                      onClick={() => setActiveTab("original")}
                      className={`py-2 px-4 text-sm font-medium border-b-2 ${
                        activeTab === "original" 
                          ? isDarkMode
                            ? 'border-primary-green text-primary-green'
                            : 'border-blue-600 text-blue-600'
                          : isDarkMode
                            ? 'border-transparent text-gray-400 hover:text-gray-300'
                            : 'border-transparent text-gray-500 hover:text-gray-700'
                      }`}
                    >
                      Original
                    </button>
                    
                    <button
                      type="button"
                      onClick={() => setActiveTab("withLogo")}
                      className={`py-2 px-4 text-sm font-medium border-b-2 ${
                        activeTab === "withLogo" 
                          ? isDarkMode
                            ? 'border-primary-green text-primary-green'
                            : 'border-blue-600 text-blue-600'
                          : isDarkMode
                            ? 'border-transparent text-gray-400 hover:text-gray-300'
                            : 'border-transparent text-gray-500 hover:text-gray-700'
                      }`}
                    >
                      With Logo
                    </button>
                  </div>
                )}

                {/* Loading indicator during preview generation */}
                {isProcessing && (
                  <div className="flex justify-center items-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-green"></div>
                    <span className="ml-2 text-sm text-gray-600 dark:text-gray-400">Generating logo previews...</span>
                  </div>
                )}

                {/* Display the appropriate images based on the active tab */}
                {!isProcessing && (
                  <div className={`grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4`}>
                    {activeTab === "original" && 
                      generatedImages.map((imgUrl, index) => {
                        const isSelected = selectedImages.includes(index);
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
                                className="absolute bottom-1.5 sm:bottom-2 right-1.5 sm:right-2 py-0.5 sm:py-1 px-2 sm:px-3 text-xs sm:text-sm font-medium bg-white text-gray-700 rounded-md shadow hover:bg-gray-50 flex items-center z-30 pointer-events-auto"
                              >
                                <Download className="mr-0.5 sm:mr-1 size-3 sm:size-4 flex-shrink-0" />
                                <span>Download</span>
                              </button>
                            </div>
                            
                            {isSelected && (
                              <div className="absolute top-2 left-2 bg-blue-600 text-white rounded-full p-1">
                                <CheckCircle2 className="size-4" />
                              </div>
                            )}
                          </div>
                        );
                      })
                    }
                    
                    {/* With Logo View */}
                    {activeTab === "withLogo" && logoUrl && combinedPreviews.length > 0 && 
                      combinedPreviews.map((previewUrl, index) => {
                        const isSelected = selectedImages.includes(index);
                        return (
                          <div
                            key={index}
                            ref={el => { previewRefs.current[index] = el; }}
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
                              src={previewUrl}
                              alt={`Generated ad with logo ${index+1}`}
                              fill
                              sizes="(max-width: 768px) 100vw, 448px"
                              className="object-cover"
                            />
                            
                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100">
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDownload(generatedImages[index], index);
                                }}
                                className="absolute bottom-1.5 sm:bottom-2 right-1.5 sm:right-2 py-0.5 sm:py-1 px-2 sm:px-3 text-xs sm:text-sm font-medium bg-white text-gray-700 rounded-md shadow hover:bg-gray-50 flex items-center z-30 pointer-events-auto"
                              >
                                <Download className="mr-0.5 sm:mr-1 size-3 sm:size-4 flex-shrink-0" />
                                <span>Download</span>
                              </button>
                            </div>
                            
                            {isSelected && (
                              <div className="absolute top-2 left-2 bg-blue-600 text-white rounded-full p-1">
                                <CheckCircle2 className="size-4" />
                              </div>
                            )}
                          </div>
                        );
                      })
                    }
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  };

  // Progress indicator for multi-step process
  const StepIndicator = () => {
    const steps = useReferenceImages 
      ? [
          { number: 1, label: "Choose Type" },
          { number: 2, label: "Upload References" },
          { number: 3, label: "Campaign Info" },
          { number: 4, label: "Brand Style" },
          { number: 5, label: "Generate Images" }
        ]
      : [
          { number: 1, label: "Choose Type" },
          { number: 2, label: "Content Type" },
          { number: 3, label: "Campaign Info" },
          { number: 4, label: "Brand Style" },
          { number: 5, label: "Generate Images" }
        ];
    
    return (
      <div className="w-full mb-6">
        <div className="hidden sm:flex w-full justify-between relative">
          {/* Progress bar */}
          <div className="absolute top-1/2 w-full h-0.5 bg-gray-200 dark:bg-gray-700 -translate-y-1/2 z-0"></div>
          
          {/* Steps */}
          {steps.map((step, i) => (
            <div 
              key={i} 
              className={`z-10 flex flex-col items-center relative ${
                currentStep >= step.number ? 'cursor-pointer' : 'cursor-not-allowed'
              }`}
              onClick={() => currentStep >= step.number && goToStep(step.number)}
            >
              <div className={`
                w-8 h-8 rounded-full flex items-center justify-center
                ${currentStep > step.number ? 'bg-green-500 text-white' : ''}
                ${currentStep === step.number ? 'bg-blue-500 text-white' : ''}
                ${currentStep < step.number ? 'bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400' : ''}
                transition-colors duration-200
              `}>
                {currentStep > step.number ? <Check className="h-4 w-4" /> : step.number}
              </div>
              <span className={`
                text-xs mt-1 text-center max-w-[80px] truncate
                ${currentStep >= step.number ? 'text-gray-700 dark:text-gray-300' : 'text-gray-400 dark:text-gray-500'}
              `}>
                {step.label}
              </span>
            </div>
          ))}
        </div>
        
        {/* Mobile step indicator */}
        <div className="sm:hidden flex items-center justify-between px-2">
          <span className="text-sm font-medium">
            Step {currentStep} of {totalSteps}
          </span>
          <div className="flex-1 mx-4">
            <div className="w-full bg-gray-200 dark:bg-gray-700 h-1.5 rounded-full overflow-hidden">
              <div 
                className="bg-blue-500 h-full rounded-full"
                style={{ width: `${(currentStep / totalSteps) * 100}%` }}
              ></div>
            </div>
          </div>
          <span className="text-xs text-gray-500">
            {steps.find(s => s.number === currentStep)?.label}
          </span>
        </div>
      </div>
    );
  };
  
  // Step navigation buttons
  const StepNavigation = () => (
    <div className="flex justify-between mt-8 pt-4 border-t">
      <Button
        type="button"
        variant="outline"
        onClick={goToPreviousStep}
        disabled={currentStep === 1}
        className="px-4 py-2"
      >
        Previous
      </Button>
      
      {currentStep < totalSteps ? (
        <Button
          type="button"
          onClick={goToNextStep}
          className="px-6 py-2"
        >
          Continue
        </Button>
      ) : (
        <Button
          type="button"
          onClick={handleGenerateImages}
          disabled={isGeneratingImages}
          className="px-6 py-2"
        >
          {isGeneratingImages ? 'Generating...' : 'Generate Images'}
        </Button>
      )}
    </div>
  );

  // Step 1: Choose input type (Text-based or Reference-based)
  const Step1InputTypeSelection = () => (
    <Card className="w-full max-w-3xl mx-auto">
      <CardHeader>
        <CardTitle className="text-center">Choose Your Input Type</CardTitle>
        <CardDescription className="text-center">
          Select how you want to generate your marketing images
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Text-based option */}
          <div
            className={`p-4 border rounded-lg cursor-pointer transition-all ${
              !useReferenceImages ? 'ring-2 ring-blue-500 dark:ring-blue-400' : 'hover:bg-gray-50 dark:hover:bg-gray-800'
            }`}
            onClick={() => setUseReferenceImages(false)}
          >
            <div className="flex flex-col items-center text-center space-y-3">
              <div className="w-16 h-16 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                <Wand2 className="h-8 w-8 text-blue-500 dark:text-blue-400" />
              </div>
              <h3 className="font-medium text-lg">Text-Based</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Describe your vision and let AI generate images based on your text prompt
              </p>
            </div>
          </div>
          
          {/* Reference-based option */}
          <div
            className={`p-4 border rounded-lg cursor-pointer transition-all ${
              useReferenceImages ? 'ring-2 ring-blue-500 dark:ring-blue-400' : 'hover:bg-gray-50 dark:hover:bg-gray-800'
            }`}
            onClick={() => setUseReferenceImages(true)}
          >
            <div className="flex flex-col items-center text-center space-y-3">
              <div className="w-16 h-16 rounded-full bg-purple-100 dark:bg-purple-900 flex items-center justify-center">
                <ImagePlus className="h-8 w-8 text-purple-500 dark:text-purple-400" />
              </div>
              <h3 className="font-medium text-lg">Reference Image</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Upload your own images as reference and transform them into professional ads
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
  
  // Step 2 for Reference-based: Upload reference images
  const Step2ReferenceImages = () => (
    <Card className="w-full max-w-3xl mx-auto">
      <CardHeader>
        <CardTitle className="text-center">Upload Reference Images</CardTitle>
        <CardDescription className="text-center">
          Upload up to 4 images that will be used as a reference for your generated marketing materials
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <ReferenceImageUploader />
        
        <div className="space-y-4 pt-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Reference Image Type</label>
            <Select value={selectedReferenceImageType} onValueChange={setSelectedReferenceImageType}>
              <SelectTrigger>
                <SelectValue placeholder="Select reference image type" />
              </SelectTrigger>
              <SelectContent className="max-h-[300px]">
                {REFERENCE_IMAGE_TYPES.map((type) => (
                  <SelectItem key={type.id} value={type.id}>
                    <div className="flex flex-col py-1">
                      <span>{type.name}</span>
                      <span className="text-xs text-muted-foreground">{type.description}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardContent>
    </Card>
  );
  
  // Step 2 for Text-based: Content Type selection
  const Step2TextContentType = () => (
    <Card className="w-full max-w-3xl mx-auto">
      <CardHeader>
        <CardTitle className="text-center">Select Content Type</CardTitle>
        <CardDescription className="text-center">
          Choose what type of marketing content you want to create
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Content type selection */}
        <div className="space-y-4">
          <h3 className="text-base font-medium">Primary Content Type</h3>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div 
              className={`p-4 border rounded-lg cursor-pointer transition-all flex flex-col items-center text-center space-y-3 ${
                imageTypeMode === 'standard' ? 'ring-2 ring-blue-500 dark:ring-blue-400' : 'hover:bg-gray-50 dark:hover:bg-gray-800'
              }`}
              onClick={() => setImageTypeMode('standard')}
            >
              <div className="w-16 h-16 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                <Image className="h-8 w-8 text-blue-500 dark:text-blue-400" />
              </div>
              <h3 className="font-medium">Standard Ads</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Traditional marketing ads optimized for different platforms and audience segments
              </p>
            </div>
            
            <div 
              className={`p-4 border rounded-lg cursor-pointer transition-all flex flex-col items-center text-center space-y-3 ${
                imageTypeMode === 'enhanced' ? 'ring-2 ring-blue-500 dark:ring-blue-400' : 'hover:bg-gray-50 dark:hover:bg-gray-800'
              }`}
              onClick={() => setImageTypeMode('enhanced')}
            >
              <div className="w-16 h-16 rounded-full bg-purple-100 dark:bg-purple-900 flex items-center justify-center">
                <Sparkles className="h-8 w-8 text-purple-500 dark:text-purple-400" />
              </div>
              <h3 className="font-medium">Enhanced Social Content</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Content specifically designed for social media engagement and performance
              </p>
            </div>
          </div>
        </div>
        
        {/* Image type selection */}
        <div className="space-y-4 pt-6">
          <h3 className="text-base font-medium">Specific Image Type</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
            Select the specific format that best fits your marketing needs:
          </p>
          
          {imageTypeMode === 'standard' ? (
            <div className="grid grid-cols-1 gap-3">
              {IMAGE_TYPES.map((type) => (
                <div 
                  key={type.id}
                  className={`p-3 border rounded-lg cursor-pointer transition-all ${
                    selectedImageType === type.id ? 'ring-2 ring-blue-500 border-transparent' : 'hover:bg-gray-50 dark:hover:bg-gray-800'
                  }`}
                  onClick={() => setSelectedImageType(type.id)}
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <h4 className="font-medium">{type.name}</h4>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{type.description}</p>
                    </div>
                    {selectedImageType === type.id && <Check className="h-5 w-5 text-blue-500" />}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3">
              {ENHANCED_IMAGE_TYPES.map((type) => (
                <div 
                  key={type.id}
                  className={`p-3 border rounded-lg cursor-pointer transition-all ${
                    selectedEnhancedImageType === type.id ? 'ring-2 ring-blue-500 border-transparent' : 'hover:bg-gray-50 dark:hover:bg-gray-800'
                  }`}
                  onClick={() => setSelectedEnhancedImageType(type.id)}
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <h4 className="font-medium">{type.name}</h4>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{type.description}</p>
                    </div>
                    {selectedEnhancedImageType === type.id && <Check className="h-5 w-5 text-blue-500" />}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        
        {/* Image format selection */}
        <div className="space-y-4 pt-6">
          <h3 className="text-base font-medium">Image Format</h3>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {IMAGE_FORMATS.map((format) => (
              <div 
                key={format.id}
                className={`p-3 border rounded-lg cursor-pointer transition-all ${
                  selectedImageFormat === format.id ? 'ring-2 ring-blue-500 border-transparent' : 'hover:bg-gray-50 dark:hover:bg-gray-800'
                }`}
                onClick={() => setSelectedImageFormat(format.id)}
              >
                <div className="flex justify-between items-center">
                  <div>
                    <h4 className="font-medium">{format.name}</h4>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{format.description}</p>
                  </div>
                  {selectedImageFormat === format.id && <Check className="h-5 w-5 text-blue-500" />}
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
  
  // Step 3 for Text-based: Campaign Information
  const Step3CampaignInfo = () => {
    // Create refs for direct DOM access instead of using controlled components
    const brandNameRef = useRef<HTMLInputElement>(null);
    const headlineRef = useRef<HTMLInputElement>(null);
    const subjectRef = useRef<HTMLTextAreaElement>(null);
    
    // State for filtering segments
    const [segmentFilter, setSegmentFilter] = useState("");
    // Filtered segments based on search
    const filteredSegments = React.useMemo(() => {
      if (!segmentFilter.trim()) return BRAND_SEGMENTS;
      
      const lowerCaseFilter = segmentFilter.toLowerCase();
      return BRAND_SEGMENTS.filter(segment => 
        segment.name.toLowerCase().includes(lowerCaseFilter) ||
        segment.styleTag.toLowerCase().includes(lowerCaseFilter)
      );
    }, [segmentFilter]);
    
    // Set initial values on mount
    useEffect(() => {
      if (brandNameRef.current) brandNameRef.current.value = brandName;
      if (headlineRef.current) headlineRef.current.value = headline;
      if (subjectRef.current) subjectRef.current.value = subject;
    }, []);
    
    // Save form data on blur events and before navigating away
    const saveFormData = useCallback(() => {
      if (brandNameRef.current) setBrandName(brandNameRef.current.value);
      if (headlineRef.current) setHeadline(headlineRef.current.value);
      if (subjectRef.current) setSubject(subjectRef.current.value);
    }, []);
    
    // Save data when navigating away
    useEffect(() => {
      return () => {
        saveFormData();
      };
    }, [saveFormData]);
    
    return (
      <Card className="w-full max-w-3xl mx-auto">
        <CardHeader>
          <CardTitle className="text-center">Campaign Information</CardTitle>
          <CardDescription className="text-center">
            Tell us about your brand and marketing goals
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">Brand Segment</label>
              <div className="text-xs text-gray-500">{BRAND_SEGMENTS.length} industries available</div>
            </div>
            
            {/* Search filter for segments */}
            <div className="relative">
              <input
                type="text"
                placeholder="Search industry segments..."
                value={segmentFilter}
                onChange={(e) => setSegmentFilter(e.target.value)}
                className="w-full h-10 pl-9 pr-4 rounded-md border border-input bg-background text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              />
              <div className="absolute left-2.5 top-2.5 text-gray-400">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="11" cy="11" r="8"></circle>
                  <path d="m21 21-4.3-4.3"></path>
                </svg>
              </div>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[400px] overflow-y-auto pr-1">
              {filteredSegments.map((segment) => (
                <div 
                  key={segment.id}
                  className={`p-3 border rounded-lg cursor-pointer transition-all ${
                    selectedBrandSegment === segment.id ? 'ring-2 ring-blue-500 border-transparent' : 'hover:bg-gray-50 dark:hover:bg-gray-800'
                  }`}
                  onClick={() => setSelectedBrandSegment(segment.id)}
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <h4 className="font-medium">{segment.name}</h4>
                      <p className="text-xs text-gray-500 mt-1">{segment.styleTag}</p>
                    </div>
                    {selectedBrandSegment === segment.id && <Check className="h-5 w-5 text-blue-500" />}
                  </div>
                </div>
              ))}
              
              {filteredSegments.length === 0 && (
                <div className="col-span-1 sm:col-span-2 p-4 border border-dashed rounded-lg bg-gray-50 dark:bg-gray-800/50 text-center">
                  <p className="text-sm text-gray-500">No matching industry segments found. Try a different search term.</p>
                </div>
              )}
            </div>
          </div>
          
          <div className="space-y-4 pt-4">
            <div className="space-y-3">
              <label htmlFor="brandName" className="text-sm font-medium">Brand Name</label>
              <div className="w-full">
                <input
                  ref={brandNameRef}
                  id="brandName"
                  type="text"
                  placeholder="Your brand name"
                  defaultValue={brandName}
                  onBlur={saveFormData}
                  autoComplete="off"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                />
              </div>
              <p className="text-xs text-gray-500">This will appear in your generated images</p>
            </div>
            
            <div className="space-y-3">
              <label htmlFor="headlineText" className="text-sm font-medium">Headline Text</label>
              <div className="w-full">
                <input
                  ref={headlineRef}
                  id="headlineText"
                  type="text"
                  placeholder="Main headline for the creative"
                  defaultValue={headline}
                  onBlur={saveFormData}
                  autoComplete="off"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                />
              </div>
              <p className="text-xs text-gray-500">The primary message you want to communicate</p>
            </div>
          </div>

          <div className="space-y-3 pt-4">
            <label htmlFor="campaignGoal" className="text-sm font-medium">Campaign Goal</label>
            <div className="w-full">
              <textarea
                ref={subjectRef}
                id="campaignGoal"
                placeholder="Briefly describe what you want to achieve with this campaign..."
                defaultValue={subject}
                onBlur={saveFormData}
                rows={5}
                className="flex min-h-[120px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              />
            </div>
            <p className="text-xs text-gray-500">Describe your objectives, target audience, and any specific messaging requirements</p>
          </div>
        </CardContent>
      </Card>
    );
  };
  
  // Step 4 for both paths: Brand Style
  const Step4BrandStyle = () => (
    <Card className="w-full max-w-3xl mx-auto">
      <CardHeader>
        <CardTitle className="text-center">Brand Style</CardTitle>
        <CardDescription className="text-center">
          Define your brand&apos;s visual identity
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Color palette section */}
        <div className="space-y-4">
          <h3 className="text-base font-medium flex items-center gap-2">
            <Palette className="h-4 w-4" />
            Color Palette
          </h3>
          
          <Tabs 
            defaultValue={useCustomPalette ? "custom" : "preset"} 
            className="w-full"
            onValueChange={(value) => {
              setUseCustomPalette(value === "custom");
            }}
          >
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="preset">
                Preset Palettes
              </TabsTrigger>
              <TabsTrigger value="custom">
                Custom Palette
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="preset" className="space-y-4 pt-4">
              <div className="grid grid-cols-2 gap-3">
                {Object.entries(COLOR_PALETTES).map(([key, palette]) => (
                  <div 
                    key={key}
                    className={`p-2 border rounded-lg cursor-pointer transition-all ${
                      selectedPalette === key && !useCustomPalette ? 'ring-2 ring-primary' : 'hover:bg-accent'
                    }`}
                    onClick={() => {
                      setSelectedPalette(key);
                      setUseCustomPalette(false);
                    }}
                  >
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium">{palette.name}</span>
                      {selectedPalette === key && !useCustomPalette && <Check className="h-4 w-4 text-primary" />}
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
                <div className="flex justify-between items-center">
                  <label className="text-sm font-medium">Custom Brand Colors</label>
                  <span className={`text-xs px-2 py-1 rounded-full ${useCustomPalette ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-700'}`}>
                    {useCustomPalette ? 'Active' : 'Inactive'}
                  </span>
                </div>
                <div className="grid grid-cols-5 gap-3">
                  {customColorPalette.map((color, index) => (
                    <ColorPickerItem key={index} color={color} index={index} />
                  ))}
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
        
        {/* Font style selection - only for text-based */}
        {!useReferenceImages && (
          <div className="pt-6 space-y-4">
            <h3 className="text-base font-medium flex items-center gap-2">
              <Type className="h-4 w-4" />
              Typography
            </h3>
            
            <div className="grid grid-cols-1 gap-3">
              {FONT_STYLES.map((font) => (
                <div 
                  key={font.id}
                  className={`p-3 border rounded-lg cursor-pointer transition-all ${
                    selectedFontStyle === font.id ? 'ring-2 ring-blue-500 border-transparent' : 'hover:bg-gray-50 dark:hover:bg-gray-800'
                  }`}
                  onClick={() => setSelectedFontStyle(font.id)}
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <h4 className="font-medium">{font.name}</h4>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{font.description}</p>
                    </div>
                    {selectedFontStyle === font.id && <Check className="h-5 w-5 text-blue-500" />}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
  
  // Step 3 for Reference-based: Campaign Information
  const Step3ReferenceSettings = () => (
    <Card className="w-full max-w-3xl mx-auto">
      <CardHeader>
        <CardTitle className="text-center">Style & Settings</CardTitle>
        <CardDescription className="text-center">
          Define your brand identity and campaign elements
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 gap-6">
          {/* Basic settings */}
          <div className="space-y-4">
            <h3 className="text-base font-medium">Campaign Information</h3>
            
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

            <div className="space-y-2">
              <label className="text-sm font-medium">Campaign Goal</label>
              <Textarea
                placeholder="Briefly describe what you want to achieve with this campaign..."
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="min-h-[80px]"
              />
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
                      <div className="flex flex-col py-1">
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
          </div>
          
          {/* Color palette section */}
          <div className="space-y-4 pt-2">
            <h3 className="text-base font-medium flex items-center gap-2">
              <Palette className="h-4 w-4" />
              Color Palette
            </h3>
            
            <Tabs 
              defaultValue={useCustomPalette ? "custom" : "preset"} 
              className="w-full"
              onValueChange={(value) => {
                setUseCustomPalette(value === "custom");
              }}
            >
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="preset">
                  Preset Palettes
                </TabsTrigger>
                <TabsTrigger value="custom">
                  Custom Palette
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="preset" className="space-y-4 pt-4">
                <div className="grid grid-cols-2 gap-3">
                  {Object.entries(COLOR_PALETTES).map(([key, palette]) => (
                    <div 
                      key={key}
                      className={`p-2 border rounded-lg cursor-pointer transition-all ${
                        selectedPalette === key && !useCustomPalette ? 'ring-2 ring-primary' : 'hover:bg-accent'
                      }`}
                      onClick={() => {
                        setSelectedPalette(key);
                        setUseCustomPalette(false);
                      }}
                    >
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-medium">{palette.name}</span>
                        {selectedPalette === key && !useCustomPalette && <Check className="h-4 w-4 text-primary" />}
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
                  <div className="flex justify-between items-center">
                    <label className="text-sm font-medium">Custom Brand Colors</label>
                    <span className={`text-xs px-2 py-1 rounded-full ${useCustomPalette ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-700'}`}>
                      {useCustomPalette ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  <div className="grid grid-cols-5 gap-3">
                    {customColorPalette.map((color, index) => (
                      <ColorPickerItem key={index} color={color} index={index} />
                    ))}
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </CardContent>
    </Card>
  );
  
  // Step 3 for Text-based / Step 4 for Reference-based: Generate Images
  const Step3GenerateImages = () => (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="text-center">Generate Your Images</CardTitle>
        <CardDescription className="text-center">
          Review your settings and generate professional marketing images
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Settings summary */}
        <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4 border">
          <h3 className="text-sm font-medium mb-3">Settings Summary</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-500 dark:text-gray-400">Input Type:</span>
                <span className="font-medium">{useReferenceImages ? 'Reference Image' : 'Text-Based'}</span>
              </div>
              
              {!useReferenceImages && (
                <div className="flex justify-between">
                  <span className="text-gray-500 dark:text-gray-400">Content Type:</span>
                  <span className="font-medium">{imageTypeMode === 'standard' ? 'Standard Ad' : 'Enhanced Social'}</span>
                </div>
              )}
              
              {useReferenceImages && (
                <div className="flex justify-between">
                  <span className="text-gray-500 dark:text-gray-400">Reference Type:</span>
                  <span className="font-medium">
                    {REFERENCE_IMAGE_TYPES.find(t => t.id === selectedReferenceImageType)?.name || "-"}
                  </span>
                </div>
              )}
              
              <div className="flex justify-between">
                <span className="text-gray-500 dark:text-gray-400">Image Format:</span>
                <span className="font-medium">
                  {IMAGE_FORMATS.find(f => f.id === selectedImageFormat)?.name || "-"}
                </span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-gray-500 dark:text-gray-400">Brand Segment:</span>
                <span className="font-medium">
                  {BRAND_SEGMENTS.find(s => s.id === selectedBrandSegment)?.name || "-"}
                </span>
              </div>
              
              {!useReferenceImages && (
                <div className="flex justify-between">
                  <span className="text-gray-500 dark:text-gray-400">Font Style:</span>
                  <span className="font-medium">
                    {FONT_STYLES.find(f => f.id === selectedFontStyle)?.name || "-"}
                  </span>
                </div>
              )}
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-500 dark:text-gray-400">Brand Name:</span>
                <span className="font-medium truncate max-w-[180px]">{brandName || "-"}</span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-gray-500 dark:text-gray-400">Headline:</span>
                <span className="font-medium truncate max-w-[180px]">{headline || "-"}</span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-gray-500 dark:text-gray-400">Color Palette:</span>
                <span className="font-medium">
                  {useCustomPalette ? 'Custom Colors' : COLOR_PALETTES[selectedPalette as keyof typeof COLOR_PALETTES]?.name || "-"}
                </span>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-gray-500 dark:text-gray-400">Colors:</span>
                <div className="flex space-x-1">
                  {(useCustomPalette ? customColorPalette : COLOR_PALETTES[selectedPalette as keyof typeof COLOR_PALETTES]?.colors || []).map((color, i) => (
                    <div 
                      key={i}
                      className="h-4 w-4 rounded-full border border-gray-300" 
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
          
          <div className="mt-3 pt-3 border-t">
            <div className="flex justify-between">
              <span className="text-gray-500 dark:text-gray-400 text-sm">Campaign Goal:</span>
            </div>
            <p className="text-sm mt-1">{subject || "No campaign goal specified"}</p>
          </div>
        </div>
        
        {/* Generation controls */}
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4 items-center">
            <label className="text-sm font-medium w-full sm:w-auto">Number of Images:</label>
            <div className="flex items-center space-x-1 flex-1 w-full">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-8 w-8 p-0"
                onClick={() => setNumGeneratedImages(Math.max(1, numGeneratedImages - 1))}
                disabled={numGeneratedImages <= 1}
              >
                -
              </Button>
              <div className="w-20 text-center">
                <Input
                  type="number"
                  min={1}
                  max={8}
                  value={numGeneratedImages}
                  onChange={(e) => setNumGeneratedImages(Math.min(8, Math.max(1, parseInt(e.target.value) || 1)))}
                  className="text-center h-8"
                />
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-8 w-8 p-0"
                onClick={() => setNumGeneratedImages(Math.min(8, numGeneratedImages + 1))}
                disabled={numGeneratedImages >= 8}
              >
                +
              </Button>
              <span className="text-sm text-gray-500 dark:text-gray-400 ml-2">
                (Max 8)
              </span>
            </div>
          </div>
        </div>
        
        {/* Generate button */}
        <div className="pt-4">
          <Button 
            onClick={handleGenerateImages}
            disabled={isGeneratingImages || (!useReferenceImages && !subject.trim() && !brandName && !headline) || (useReferenceImages && referenceImages.length === 0)}
            className="w-full h-12 text-sm font-medium flex items-center justify-center gap-2"
          >
            {isGeneratingImages ? (
              <>
                <IconSpinner className="h-5 w-5 animate-spin flex-shrink-0" />
                <span className="truncate">Generating professional images...</span>
              </>
            ) : (
              <>
                <Wand2 className="h-5 w-5 flex-shrink-0" />
                <span className="truncate">Generate Professional Ad Creatives</span>
              </>
            )}
          </Button>
          
          {useReferenceImages && referenceImages.length === 0 && (
            <p className="text-red-500 text-sm mt-2 text-center">
              Please upload at least one reference image
            </p>
          )}
          
          {!useReferenceImages && !subject.trim() && !brandName && !headline && (
            <p className="text-red-500 text-sm mt-2 text-center">
              Please provide a campaign goal, brand name, or headline
            </p>
          )}
        </div>
        
        {/* Generated images display */}
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

            {/* Logo Uploader UI */}
            <div className="p-3 border rounded-md mb-4">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                <div>
                  <h4 className="text-sm font-medium mb-1">Add Your Logo</h4>
                  <p className="text-xs text-gray-500">Upload your logo to place on generated images</p>
                </div>
                <div className="flex items-center gap-2">
                  <Button 
                    onClick={handleLogoButtonClick}
                    variant="outline"
                    size="sm"
                    className="flex items-center gap-1"
                  >
                    <Upload className="h-3 w-3" />
                    {logoUrl ? "Change Logo" : "Upload Logo"}
                  </Button>
                  {logoUrl && (
                    <Button 
                      onClick={handleClearLogo}
                      variant="ghost" 
                      size="sm"
                      className="text-red-500 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  )}
                  <input
                    type="file"
                    ref={logoInputRef}
                    onChange={handleLogoUpload}
                    accept="image/*"
                    className="hidden"
                  />
                </div>
              </div>
              
              {logoUrl && (
                <div className="mt-3 flex flex-col sm:flex-row gap-3 sm:items-end">
                  <div className="w-16 h-16 border rounded-md overflow-hidden relative">
                    <NextImage
                      src={logoUrl}
                      alt="Your logo"
                      fill
                      className="object-contain"
                    />
                  </div>
                  <div className="space-y-2 flex-1">
                    <div>
                      <label className="text-xs mb-1 block">Position</label>
                      <Select defaultValue={overlayPosition} onValueChange={handlePositionChange}>
                        <SelectTrigger className="h-8 text-xs">
                          <SelectValue placeholder="Choose position" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="top-left">Top Left</SelectItem>
                          <SelectItem value="top-right">Top Right</SelectItem>
                          <SelectItem value="bottom-left">Bottom Left</SelectItem>
                          <SelectItem value="bottom-right">Bottom Right</SelectItem>
                          <SelectItem value="center">Center</SelectItem>
                          <SelectItem value="custom">Custom (Drag & Drop)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <label className="text-xs mb-1 block">Size (%)</label>
                      <div className="flex items-center gap-2">
                        <input
                          type="range"
                          min="5"
                          max="50"
                          value={logoSize}
                          onChange={(e) => setLogoSize(parseInt(e.target.value))}
                          className="flex-1"
                        />
                        <span className="text-xs w-8 text-right">{logoSize}%</span>
                      </div>
                    </div>
                  </div>
                  
                  {isCustomPosition && (
                    <div className={`mt-2 p-2 rounded ${
                      isDarkMode ? 'bg-blue-900/30 border border-blue-800 text-blue-200' : 'bg-blue-50 border border-blue-100 text-blue-700'
                    }`}>
                      <p className="text-xs flex items-center">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="size-3 mr-1 flex-shrink-0">
                          <circle cx="12" cy="12" r="10"></circle>
                          <line x1="12" y1="16" x2="12" y2="12"></line>
                          <line x1="12" y1="8" x2="12.01" y2="8"></line>
                        </svg>
                        Click and drag to position your logo on each image
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Loading indicator during preview generation */}
            {isProcessing && (
              <div className="flex justify-center items-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-green"></div>
                <span className="ml-2 text-sm text-gray-600 dark:text-gray-400">Generating logo previews...</span>
              </div>
            )}

            {/* Image View Tabs */}
            {logoUrl && combinedPreviews.length > 0 && (
              <div className="mb-4 flex border-b">
                <button
                  type="button"
                  onClick={() => setActiveTab("original")}
                  className={`py-2 px-4 text-sm font-medium border-b-2 ${
                    activeTab === "original" 
                      ? isDarkMode
                        ? 'border-primary-green text-primary-green'
                        : 'border-blue-600 text-blue-600'
                      : isDarkMode
                        ? 'border-transparent text-gray-400 hover:text-gray-300'
                        : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Original
                </button>
                
                <button
                  type="button"
                  onClick={() => setActiveTab("withLogo")}
                  className={`py-2 px-4 text-sm font-medium border-b-2 ${
                    activeTab === "withLogo" 
                      ? isDarkMode
                        ? 'border-primary-green text-primary-green'
                        : 'border-blue-600 text-blue-600'
                      : isDarkMode
                        ? 'border-transparent text-gray-400 hover:text-gray-300'
                        : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  With Logo
                </button>
              </div>
            )}
            
            {/* Display the appropriate images based on the active tab */}
            {!isProcessing && (
              <div className={`grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4`}>
                {activeTab === "original" && generatedImages.map((imgUrl, index) => {
                const isSelected = selectedImages.includes(index);
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
                        className="absolute bottom-1.5 sm:bottom-2 right-1.5 sm:right-2 py-0.5 sm:py-1 px-2 sm:px-3 text-xs sm:text-sm font-medium bg-white text-gray-700 rounded-md shadow hover:bg-gray-50 flex items-center z-30 pointer-events-auto"
                      >
                        <Download className="mr-0.5 sm:mr-1 size-3 sm:size-4 flex-shrink-0" />
                        <span>Download</span>
                      </button>
                    </div>
                    
                    {isSelected && (
                      <div className="absolute top-2 left-2 bg-blue-600 text-white rounded-full p-1">
                        <CheckCircle2 className="size-4" />
                      </div>
                    )}
                  </div>
                );
              })}
                
                {/* With Logo View */}
                {activeTab === "withLogo" && logoUrl && combinedPreviews.length > 0 && 
                  combinedPreviews.map((previewUrl, index) => {
                    const isSelected = selectedImages.includes(index);
                    return (
                      <div
                        key={index}
                        ref={el => { previewRefs.current[index] = el; }}
                        className={`relative rounded-md overflow-hidden group cursor-pointer ${
                          selectedImageFormat === "9:16" ? "aspect-[9/16]" : "aspect-[3/4]"
                        } ${
                          isSelected 
                            ? "ring-2 ring-blue-500 ring-offset-2" 
                            : isDarkMode ? "border-gray-700 border" : "border-gray-300 border"
                        }`}
                        onClick={() => toggleImageSelected(index)}
                        style={{ touchAction: isCustomPosition ? 'none' : 'auto' }}
                      >
                        {/* Always show the preview image */}
                        <NextImage
                          src={previewUrl}
                          alt={`Generated ad with logo ${index+1}`}
                          fill
                          sizes="(max-width: 768px) 100vw, 448px"
                          className="object-cover"
                        />
                        
                        {/* Use the LogoDragIndicator component for dragging */}
                        <LogoDragIndicator imageIndex={index} />
                        
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDownload(generatedImages[index], index);
                            }}
                            className="absolute bottom-1.5 sm:bottom-2 right-1.5 sm:right-2 py-0.5 sm:py-1 px-2 sm:px-3 text-xs sm:text-sm font-medium bg-white text-gray-700 rounded-md shadow hover:bg-gray-50 flex items-center z-30 pointer-events-auto"
                          >
                            <Download className="mr-0.5 sm:mr-1 size-3 sm:size-4 flex-shrink-0" />
                            <span>Download</span>
                          </button>
                        </div>
                        
                        {isSelected && (
                          <div className="absolute top-2 left-2 bg-blue-600 text-white rounded-full p-1">
                            <CheckCircle2 className="size-4" />
                          </div>
                        )}
                      </div>
                    );
                  })
                }
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
  
  // Main render function for the entire page
  return (
    <div className="container mx-auto px-2 sm:px-4 md:px-6 py-3 sm:py-6 ai-content-page max-w-full">
      {/* Toast notification */}
      {toastMessage && (
        <div className={`fixed top-4 right-4 z-50 p-3 sm:p-4 rounded-md shadow-md transition-all max-w-[calc(100%-32px)] sm:max-w-md ${
          toastMessage.type === 'success' 
            ? isDarkMode ? 'bg-primary-green/20 border border-primary-green/60' : 'bg-green-100 border border-green-300' 
            : isDarkMode ? 'bg-coral/20 border border-coral/60' : 'bg-red-100 border border-red-300'
        }`}>
          <div className="flex items-start gap-2">
            <div className={`flex-shrink-0 ${toastMessage.type === 'success' 
              ? isDarkMode ? 'text-primary-green' : 'text-green-600' 
              : isDarkMode ? 'text-coral' : 'text-red-600'}`}>
              {toastMessage.type === 'success' ? <CheckCircle2 className="size-5" /> : <AlertCircle className="size-5" />}
            </div>
            <div className="flex-1 min-w-0">
              <h3 className={`font-medium text-sm truncate ${toastMessage.type === 'success' 
                ? isDarkMode ? 'text-primary-green' : 'text-green-800' 
                : isDarkMode ? 'text-coral' : 'text-red-800'}`}>
                {toastMessage.title}
              </h3>
              <p className={`text-sm break-words ${toastMessage.type === 'success' 
                ? isDarkMode ? 'text-text-white' : 'text-green-700' 
                : isDarkMode ? 'text-text-white' : 'text-red-700'}`}>
                {toastMessage.description}
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-col space-y-4 sm:space-y-6">
        <div className="flex flex-col space-y-1 sm:space-y-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h1 className="text-lg sm:text-2xl md:text-3xl font-bold flex items-center gap-1 sm:gap-2">
              <PenTool className="h-5 w-5 sm:h-7 sm:w-7 md:h-8 md:w-8 text-primary flex-shrink-0" />
              <span>AI Creative Director</span>
            </h1>
          </div>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-1 sm:gap-2">
            <p className="text-xs sm:text-sm text-muted-foreground md:max-w-lg">
              Create professional AI-generated images with structured prompts optimized for marketing
            </p>
          </div>
        </div>

        {/* Multi-step process */}
        <StepIndicator />
        
        {/* Step 1: Select input type */}
        {currentStep === 1 && <Step1InputTypeSelection />}
        
        {/* Text-based flow */}
        {!useReferenceImages && (
          <>
            {/* Step 2: Content Type */}
            {currentStep === 2 && <Step2TextContentType />}
            
            {/* Step 3: Campaign Info */}
            {currentStep === 3 && <Step3CampaignInfo />}
            
            {/* Step 4: Brand Style */}
            {currentStep === 4 && <Step4BrandStyle />}
            
            {/* Step 5: Generate Images */}
            {currentStep === 5 && <Step3GenerateImages />}
          </>
        )}
        
        {/* Reference-based flow */}
        {useReferenceImages && (
          <>
            {/* Step 2: Upload Reference Images */}
            {currentStep === 2 && <Step2ReferenceImages />}
            
            {/* Step 3: Campaign Info */}
            {currentStep === 3 && <Step3CampaignInfo />}
            
            {/* Step 4: Brand Style */}
            {currentStep === 4 && <Step4BrandStyle />}
            
            {/* Step 5: Generate Images */}
            {currentStep === 5 && <Step3GenerateImages />}
          </>
        )}
        
        {/* Navigation buttons */}
        <StepNavigation />
      </div>
    </div>
  )
}