'use client'

import posthog from 'posthog-js'
import { getConfig } from '@/utils/config'
import { auth } from '@/auth'
import { isInternalUser } from '@/lib/server-only/posthog-server'

export const initPostHog = async () => {
  const session = await auth()

  if (!session?.user?.email) {
      console.error('User not authenticated or email not available')
      return ''
  }
  
  const config = await getConfig();
  if (typeof window !== 'undefined' && !posthog.__loaded) {
    if (await isInternalUser(session.user.email)) return
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