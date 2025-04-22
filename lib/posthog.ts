'use client'

import posthog from 'posthog-js'
import { getConfig } from '@/utils/config'
import { isInternalUser } from '@/lib/server-only/posthog-server'

export const initPostHog = async (email: string) => {
  
  const config = await getConfig();
  if (typeof window !== 'undefined' && !posthog.__loaded) {
    if (await isInternalUser(email)) return
    posthog.init(config.posthogApiKey, {
      api_host: 'https://eu.i.posthog.com',
      capture_pageview: true,
      autocapture: true,
      session_recording: {
        maskAllInputs: false
      }
    })
  }
}

export default posthog