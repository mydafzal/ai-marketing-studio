"use client"

import React, { useEffect, useState } from "react"
import { getEmailAndBypassStatus } from "@/lib/auth/get-user-email"
import { getSubscriptionInfo } from "@/app/actions"
import { useRouter } from "next/navigation"
import { IconSpinner } from "@/components/ui/icons"
import { CreateCampaignForm } from "@/components/stocks/create-campaign-screen/components/CreateCampaignForm"

export default function CampaignCreatorPage() {
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

  if (isFetchingSub) {
    return (
      <div className="flex items-center justify-center h-screen w-full">
        <IconSpinner />
      </div>
    )
  }

  return (
    <div className="container mx-auto p-3 sm:p-6">
      <div className="flex flex-col space-y-4 sm:space-y-6">
        <div className="flex flex-col space-y-2 sm:space-y-3 mb-2">
          <div className="flex items-center justify-between">
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold bg-gradient-to-r from-primary-green to-blue-400 bg-clip-text text-transparent">Campaign Creator</h1>
          </div>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 sm:gap-3">
            <p className="text-xs sm:text-sm text-muted-foreground md:max-w-lg">
              Create professional Facebook and Instagram ad campaigns in minutes
            </p>
          </div>
        </div>

        <div className="w-full shadow-lg rounded-xl border border-border-dark/50 bg-card p-5 md:p-7 backdrop-blur-sm">
          <CreateCampaignForm />
        </div>
      </div>
    </div>
  )
}
