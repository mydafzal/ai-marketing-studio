import { serverPosthog } from './server-posthog'
 import { encryptEmail } from './email-encryption'
 
 const INTERNAL_EMAILS = ['@reeply.ai', '@reeply.net']
 // const INTERNAL_EMAILS = ['@localhost']
 
 export function isInternalUser(user?: { email?: string; role?: string }) {
   if (!user?.email) return false
 
   const isInternalEmail = INTERNAL_EMAILS.some((domain) =>
     user.email?.toLowerCase().includes(domain)
   )
 
   return isInternalEmail
 }
 
 export async function trackEventServer({
   event,
   user,
   properties = {},
 }: {
   event: string
   user: { email: string; id: string }
   properties?: Record<string, any>
 }) {
 
   if (isInternalUser(user)) return
 
   try {
     const encryptedEmail = await encryptEmail(user.email)
     await serverPosthog.capture({
       distinctId: user.id,
       event,
       properties: {
         email: encryptedEmail,
         ...properties
       }
     })
 
   } catch (error) {
     console.error('[PostHog] Failed to capture server event:', error)
   }
 }