"use client"

import React, { useEffect, useState, useCallback, useRef } from "react"
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

// Image formats limited to portrait formats
const IMAGE_FORMATS = [
  { id: "9:16", name: "Portrait 9:16", description: "Vertical format for Stories and TikTok" },
  { id: "3:4", name: "Portrait 3:4", description: "Standard portrait aspect ratio" }
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

  // Mode state - Standard or Enhanced
  const [imageTypeMode, setImageTypeMode] = useState<'standard' | 'enhanced'>('standard')

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
    
    return (
      <div className="flex flex-col items-center space-y-2 relative">
        {/* Color swatch */}
        <div 
          className="w-10 h-10 rounded-md cursor-pointer border border-gray-300 shadow-sm hover:ring-2 hover:ring-blue-300 transition-all"
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
          className="w-full text-xs p-1 text-center border rounded"
          maxLength={7}
        />
        
        {/* Full-screen overlay when picker is shown */}
        {showPicker && (
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center"
            onClick={handleCloseClick}
          >
            <div 
              className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-4 max-w-md w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium">Select a color</h3>
                <button
                  type="button" 
                  className="text-gray-400 hover:text-gray-500"
                  onClick={() => setShowPicker(false)}
                >
                  <X size={20} />
                </button>
              </div>
              
              <div className="flex flex-col items-center space-y-4">
                {/* Color picker */}
                <HexColorPicker 
                  color={currentColor} 
                  onChange={handleColorChangeLocal} 
                  style={{ width: '100%', height: '200px' }}
                />
                
                {/* Preview and hex code display */}
                <div className="flex items-center w-full mt-4">
                  <div 
                    className="w-12 h-12 rounded-md border shadow-inner mr-3"
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
                    className="flex-1 border rounded-md px-3 py-2 text-center uppercase font-mono"
                  />
                </div>
                
                {/* Action buttons */}
                <div className="flex justify-end w-full space-x-2 mt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowPicker(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="button"
                    onClick={applyColorChange}
                  >
                    Apply
                  </Button>
                </div>
              </div>
            </div>
          </div>
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

  // Download image
  async function handleDownload(imageUrl: string, index: number) {
    try {
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
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4">
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
                    );
                  })}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  };

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

        {/* Toggle between text-based and reference image-based generation */}
        <div className="w-full">
          <Tabs defaultValue="text-based" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger 
                value="text-based" 
                onClick={() => setUseReferenceImages(false)}
                className="text-sm sm:text-base py-3"
              >
                <Wand2 className="h-4 w-4 mr-2" />
                Text-Based Generation
              </TabsTrigger>
              <TabsTrigger 
                value="reference-based" 
                onClick={() => setUseReferenceImages(true)}
                className="text-sm sm:text-base py-3"
              >
                <ImagePlus className="h-4 w-4 mr-2" />
                Reference Image Generation
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="text-based">
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
                      {/* Toggle between standard and enhanced image types */}
                      <div className="space-y-1">
                        <label className="text-sm font-medium">Content Type</label>
                        <div className="grid grid-cols-2 gap-2">
                          <Button
                            variant={imageTypeMode === 'standard' ? 'default' : 'outline'}
                            className={`py-2 ${imageTypeMode === 'standard' ? 'bg-primary' : ''}`}
                            onClick={() => setImageTypeMode('standard')}
                          >
                            <Image className="h-4 w-4 mr-2" />
                            Standard Ads
                          </Button>
                          <Button
                            variant={imageTypeMode === 'enhanced' ? 'default' : 'outline'}
                            className={`py-2 ${imageTypeMode === 'enhanced' ? 'bg-primary' : ''}`}
                            onClick={() => setImageTypeMode('enhanced')}
                          >
                            <Sparkles className="h-4 w-4 mr-2" />
                            Enhanced Social Posts
                          </Button>
                        </div>
                      </div>
                    
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Image Type</label>
                        {imageTypeMode === 'standard' ? (
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
                        ) : (
                          <Select value={selectedEnhancedImageType} onValueChange={setSelectedEnhancedImageType}>
                            <SelectTrigger>
                              <SelectValue placeholder="Select enhanced content type" />
                            </SelectTrigger>
                            <SelectContent>
                              {ENHANCED_IMAGE_TYPES.map((type) => (
                                <SelectItem key={type.id} value={type.id}>
                                  <div className="flex flex-col">
                                    <span>{type.name}</span>
                                    <span className="text-xs text-muted-foreground">{type.description}</span>
                                  </div>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        )}
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
                      <CardDescription>Define your brand&apos;s visual identity</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-5">
                      <Tabs 
                        defaultValue={useCustomPalette ? "custom" : "preset"} 
                        className="w-full"
                        onValueChange={(value) => {
                          setUseCustomPalette(value === "custom");
                          console.log("Tab changed, useCustomPalette set to:", value === "custom");
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
                            setSelectedEnhancedImageType(ENHANCED_IMAGE_TYPES[0].id);
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
            </TabsContent>
            
            <TabsContent value="reference-based">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Left Column - Reference Image Controls */}
                <div className="lg:col-span-5 space-y-6">
                  {/* Reference image uploader */}
                  <ReferenceImageUploader />
                  
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
                      <CardDescription>Define your brand&apos;s visual identity</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-5">
                      <Tabs 
                        defaultValue={useCustomPalette ? "custom" : "preset"} 
                        className="w-full"
                        onValueChange={(value) => {
                          setUseCustomPalette(value === "custom");
                          console.log("Tab changed, useCustomPalette set to:", value === "custom");
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
                    </CardContent>
                  </Card>
                </div>
                
                {/* Right Column - Image Generator */}
                <div className="lg:col-span-7 space-y-6">
                  {/* Image Generator */}
                  <CustomImageGenerator />
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  )
}