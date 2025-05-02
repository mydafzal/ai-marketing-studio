"use client"

import React, {useEffect, useState} from "react"
import { improvePrompt } from "@/app/actions/generate-prompt"
import AiImageTab from "@/components/ai-image-tab"
import {useRouter} from "next/navigation"
import {getSubscriptionInfo} from "@/app/actions"
import {IconSpinner} from "@/components/ui/icons"
import {getEmailAndBypassStatus} from "@/lib/auth/get-user-email"
import { Sparkles } from "lucide-react"

export default function AiCreativeDirectorPage() {
  // Track the current platform for prompt optimization
  const [platform, setPlatform] = useState("instagram")
  const [subStatus, setSubStatus] = useState<string | undefined>(undefined)
  const [subbedPackage, setSubbedPackage] = useState<string | undefined>(undefined)
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
    return improvePrompt(promptText, platform, "image")
  }

  if (isFetchingSub) {
    return (
      <div className="flex items-center justify-center h-screen w-full bg-deep-black">
        <div className="flex flex-col items-center justify-center">
          <IconSpinner className="size-10 text-primary-green animate-pulse-green" />
          <p className="mt-4 text-text-white text-sm">Loading your creative workspace...</p>
        </div>
      </div>
    )
  }

  // Allow all users to access the AI Creatives with usage limits for free plan users
  // The usage limits are enforced in the respective components

  return (
    <div className="bg-deep-black min-h-screen">
      <div className="container mx-auto p-4 sm:p-6 lg:p-8">
        {/* Header with improved styling */}
        <div className="mb-8">
          <div className="flex flex-col space-y-2 sm:space-y-3">
            <div className="flex items-center mb-2">
              <Sparkles className="text-primary-green mr-3 size-6" />
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold bg-gradient-to-r from-primary-green to-blue-400 bg-clip-text text-transparent">
                AI Creative Director
              </h1>
            </div>
            <div className="flex flex-col md:flex-row justify-between gap-3">
              <p className="text-sm sm:text-base text-text-light-gray md:max-w-xl leading-relaxed">
                Create professional AI-generated images optimized for marketing campaigns and social media
              </p>
            </div>
          </div>
        </div>

        {/* Dashboard-style content wrapper */}
        <div className="bg-container-bg border border-border-dark rounded-xl shadow-xl overflow-hidden">
          {/* Simple header bar */}
          <div className="border-b border-border-dark p-4 lg:p-6">
            <div className="flex items-center">
              <div className="flex flex-col">
                <span className="text-text-white font-medium">Image Creation</span>
                <span className="text-xs text-text-light-gray">Professional marketing visuals</span>
              </div>
            </div>
          </div>

          <div className="w-full p-4 lg:p-6">
            <AiImageTab improvePrompt={enhancedImprovePrompt} />
          </div>
        </div>
      </div>
    </div>
  )
}