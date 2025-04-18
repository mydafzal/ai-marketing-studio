'use client'

import posthog from 'posthog-js'
import { getConfig } from '@/utils/config'
export const initPostHog = async () => {
  const config = await getConfig();
  if (typeof window !== 'undefined' && !posthog.__loaded) {
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