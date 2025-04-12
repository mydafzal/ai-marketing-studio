'use client'

import posthog from 'posthog-js'

export const initPostHog = () => {
  if (typeof window !== 'undefined' && !posthog.__loaded) {
    posthog.init(process.env.NEXT_PUBLIC_POSTHOG_API_KEY || '', {
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