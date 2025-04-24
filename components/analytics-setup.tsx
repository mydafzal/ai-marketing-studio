'use client'
 
 import { useEffect } from 'react'
 import { default as posthog, initPostHog } from '@/lib/posthog'
 import CrispChat from './crisp-chat'
 import { encryptEmail, decryptEmail } from '@/lib/email-encryption'
 
 interface AnalyticsSetupProps {
   user: {
     email: string
     name?: string
   }
 }
 
 export default function AnalyticsSetup({ user }: AnalyticsSetupProps) {
   useEffect(() => {
     const setupAnalytics = async () => {
       const encryptedEmail = await encryptEmail(user.email)
       initPostHog(user.email)
       posthog.identify(encryptedEmail, {
         email: encryptedEmail,
         name: user.name,
       })
 
     }
 
     if (user?.email) {
       setupAnalytics()
     }
   }, [user])
 
   return <CrispChat user={user} />
 }