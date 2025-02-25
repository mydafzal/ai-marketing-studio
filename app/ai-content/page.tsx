"use client"

import React, { useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { InfoIcon, SparklesIcon } from "lucide-react"
import { improvePrompt } from "@/app/actions/generate-prompt"

// Import your separated tabs
import AiVideoTab from "@/components/ai-video-tab"
import AiImageTab from "@/components/ai-image-tab"

// Platform options for social media content
const PLATFORMS = [
  { value: "instagram", label: "Instagram" },
  { value: "tiktok", label: "TikTok" },
  { value: "youtube", label: "YouTube Shorts" },
  { value: "facebook", label: "Facebook" },
  { value: "linkedin", label: "LinkedIn" }
]

export default function AiContentPage() {
  // Track the current platform for prompt optimization
  const [platform, setPlatform] = useState("instagram")
  const [activeTab, setActiveTab] = useState("video")

  // Enhanced prompt improver that passes platform context
  const enhancedImprovePrompt = async (promptText: string): Promise<string> => {
    const contentType = activeTab === "video" ? "video" : "image"
    return improvePrompt(promptText, platform, contentType)
  }
  
  return (
    <div className="container mx-auto p-6">
      <div className="flex flex-col space-y-6">
        <div className="flex flex-col space-y-3">
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold">Social Media Content Studio</h1>
          </div>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            <p className="text-muted-foreground md:max-w-lg">
              Create professional AI-generated content optimized for social media engagement and conversions
            </p>
            
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Optimize for:</span>
              <Select value={platform} onValueChange={setPlatform}>
                <SelectTrigger className="w-[160px]">
                  <SelectValue placeholder="Platform" />
                </SelectTrigger>
                <SelectContent>
                  {PLATFORMS.map(platform => (
                    <SelectItem key={platform.value} value={platform.value}>
                      {platform.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <InfoIcon className="h-4 w-4 text-muted-foreground cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent className="max-w-sm">
                    <p>Content will be optimized for this platform&apos;s audience, algorithm preferences, and engagement patterns.</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="video">AI Video Creation</TabsTrigger>
            <TabsTrigger value="image">AI Image Creatives</TabsTrigger>
          </TabsList>

          {/* VIDEO TAB */}
          <TabsContent value="video">
            <AiVideoTab 
              improvePrompt={enhancedImprovePrompt}
            />
          </TabsContent>

          {/* IMAGE TAB */}
          <TabsContent value="image">
            <AiImageTab 
              improvePrompt={enhancedImprovePrompt}
            />
          </TabsContent>
        </Tabs>

        <div className="rounded-lg border bg-card text-card-foreground p-5 mt-3 text-sm text-muted-foreground">
          <h3 className="font-medium text-foreground mb-2 flex items-center gap-1.5">
            <SparklesIcon className="h-4 w-4 text-blue-500" />
            About Content Optimization
          </h3>
          <p>
            Our AI content studio enhances your prompts for maximum engagement on {PLATFORMS.find(p => p.value === platform)?.label || platform}. 
            The system analyzes platform-specific trends, audience preferences, and content algorithms to help create material more likely to perform well. 
            For best results, start with a clear idea and let our AI enhance it with platform-specific details.
          </p>
        </div>
      </div>
    </div>
  )
}