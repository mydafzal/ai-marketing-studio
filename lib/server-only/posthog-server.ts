// lib/server-only/posthog-server.ts
'use server'

import { PostHog } from 'posthog-node'
import { encryptEmail } from '../email-encryption'
import { getConfig } from '@/utils/config'
import { isInternalUser } from '../posthog-utils'

let serverPosthog: PostHog | null = null

async function getServerPosthog(): Promise<PostHog> {
  if (serverPosthog) return serverPosthog

  const config = await getConfig()

  serverPosthog = new PostHog(config.posthogApiKey, {
    host: 'https://eu.i.posthog.com',
    flushAt: 1
  })

  return serverPosthog
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
  if (isInternalUser(user.email)) return

  const encryptedEmail = await encryptEmail(user.email)
  const posthog = await getServerPosthog()

  await posthog.capture({
    distinctId: user.id,
    event,
    properties: {
      email: encryptedEmail,
      ...properties
    }
  })
}