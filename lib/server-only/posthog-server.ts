// lib/server-only/posthog-server.ts
'use server'

import { PostHog } from 'posthog-node'
import { encryptEmail } from '../email-encryption'

const serverPosthog = new PostHog(process.env.NEXT_PUBLIC_POSTHOG_API_KEY || '', {
  host: 'https://eu.i.posthog.com',
  flushAt: 1
})

const INTERNAL_EMAILS = ['@reeply.ai', '@reeply.net']
// const INTERNAL_EMAILS = ['@gmail.com']

function isInternalUser(email: string) {
  return INTERNAL_EMAILS.some((domain) =>
    email.toLowerCase().includes(domain)
  )
}

export async function trackServerEvent({
  event,
  user,
  properties = {}
}: {
  event: string
  user: { email: string; id: string }
  properties?: Record<string, any>
}) {
  if (isInternalUser(user.email)) return

  const encryptedEmail = await encryptEmail(user.email)

  return serverPosthog.capture({
    distinctId: user.id,
    event,
    properties: {
      email: encryptedEmail,
      ...properties
    }
  })
}
