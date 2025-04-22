// lib/server-only/posthog-server.ts
'use server'

import posthog from 'posthog-js'
import { encryptEmail } from '../email-encryption'

const INTERNAL_EMAILS = ['@reeply.ai', '@reeply.net']
// const INTERNAL_EMAILS = ['@gmail.com']

export async function isInternalUser(email: string) {
  return INTERNAL_EMAILS.some((domain) =>
    email.toLowerCase().includes(domain)
  )
}

interface TrackServerEventArgs {
  event: string
  user: { email: string; id: string }
  properties?: Record<string, any>
}

export async function trackServerEvent({
  event,
  user,
  properties = {}
}: TrackServerEventArgs): Promise<void> {
  if (await isInternalUser(user.email)) return

  const encryptedEmail = await encryptEmail(user.email)
  
  posthog.capture(event, {
    distinct_id: user.id,
    email: encryptedEmail,
    ...properties
  })
}