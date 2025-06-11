"use client"

import React, {useEffect, useState} from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"

// Actions
import { improvePrompt } from "@/app/actions/generate-prompt"

// Existing tab components
import AiVideoTab from "@/components/ai-video-tab"
import AiImageTab from "@/components/ai-image-tab"

// NEW import for your inpainting component
import ImageImpaint from "@/components/image-inpaint"
import {useRouter} from "next/navigation";
import {getSubscriptionInfo} from "@/app/actions";
import {IconSpinner} from "@/components/ui/icons";
import {HomePageInfoCard} from "@/components/account-not-connected-screen";
import {getEmailAndBypassStatus} from "@/lib/auth/get-user-email";

// Default platform for content optimization (not visible to users)
// Keeping this since it's used in the enhancedImprovePrompt function

export default function AiContentPage() {
  // Track the current platform for prompt optimization
  const [platform, setPlatform] = useState("instagram")
  const [activeTab, setActiveTab] = useState("video")


  const [subStatus, setSubStatus] = useState<string | undefined>(undefined)
  const [subbedPackage, setSubbedPackage] = useState<string | undefined>(
      undefined
  )
  const [isFetchingSub, setIsFetchingSub] = useState(true)

  const router = useRouter()

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


  // Enhanced prompt improver that passes platform context
  const enhancedImprovePrompt = async (promptText: string): Promise<string> => {
    let contentType = "image"
    if (activeTab === "video") {
      contentType = "video"
    } else if (activeTab === "inpaint") {
      contentType = "image" // Using "image" content type for inpainting as well
    }
    return improvePrompt(promptText, platform, contentType)
  }

  if (isFetchingSub) {
    return (
        <div className="flex items-center justify-center h-screen w-full">
          <IconSpinner />
        </div>
    )
  }

  // Check if user has an active subscription (including bypass list users)
  if (subStatus !== 'active' && subStatus !== 'trialing') {
    router.push('/subscription')
    return (
      <div className="flex items-center justify-center h-screen w-full">
        <p>Redirecting to subscription page...</p>
      </div>
    )
  }
  
  return (
    <div className="container mx-auto p-3 sm:p-6 ai-content-page">
      <div className="flex flex-col space-y-4 sm:space-y-6">
        <div className="flex flex-col space-y-2 sm:space-y-3">
          <div className="flex items-center justify-between">
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold">Social Media Content Studio</h1>
          </div>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 sm:gap-3">
            <p className="text-xs sm:text-sm text-muted-foreground md:max-w-lg">
              Create professional AI-generated content optimized for social media engagement and conversions
            </p>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3 overflow-x-auto">
            <TabsTrigger value="video" className="text-xs sm:text-sm">
              <span className="hidden sm:inline">AI Video Creation</span>
              <span className="inline sm:hidden">Video</span>
            </TabsTrigger>
            <TabsTrigger value="image" className="text-xs sm:text-sm">
              <span className="hidden sm:inline">AI Creatives Director</span>
              <span className="inline sm:hidden">Images</span>
            </TabsTrigger>
            <TabsTrigger value="inpaint" className="text-xs sm:text-sm">
              <span className="hidden sm:inline">Image Inpainting</span>
              <span className="inline sm:hidden">Inpainting</span>
            </TabsTrigger>
          </TabsList>

          {/* VIDEO TAB */}
          <TabsContent value="video">
            <AiVideoTab improvePrompt={enhancedImprovePrompt} />
          </TabsContent>

          {/* IMAGE TAB */}
          <TabsContent value="image">
            <AiImageTab improvePrompt={enhancedImprovePrompt} />
          </TabsContent>

          {/* INPAINTING TAB */}
          <TabsContent value="inpaint">
            <ImageImpaint improvePrompt={enhancedImprovePrompt} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}