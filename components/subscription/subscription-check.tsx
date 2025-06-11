'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useUsageStore } from '@/app/store/useUsageStore'
import { checkSubscriptionAccess } from '@/app/actions'

interface SubscriptionCheckProps {
  userEmail?: string | null
}

export default function SubscriptionCheck({ userEmail }: SubscriptionCheckProps) {
  const router = useRouter()
  const { setIsSubscribed } = useUsageStore()
  const [isChecking, setIsChecking] = useState(true)
  
  useEffect(() => {
    const checkAccess = async () => {
      setIsChecking(true)
      
      try {
        // Check subscription status using server action
        const { hasAccess } = await checkSubscriptionAccess()
        
        // Update the usage store with subscription status
        setIsSubscribed(hasAccess)
        
        // If no access, redirect to subscription page
        if (!hasAccess) {
          router.push('/subscription')
        }
      } catch (error) {
        console.error('Error checking subscription access:', error)
        // On error, redirect to subscription page to be safe
        router.push('/subscription')
      } finally {
        setIsChecking(false)
      }
    }
    
    checkAccess()
  }, [router, setIsSubscribed])
  
  // This component doesn't render anything
  return null
}