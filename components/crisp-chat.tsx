'use client'

import { getConfig } from '@/utils/config'
import { useEffect } from 'react'

declare global {
  interface Window {
    $crisp: any[]
    CRISP_WEBSITE_ID: string
  }
}

interface CrispChatProps {
  user: {
    email: string
    name?: string
  }
}

export default function CrispChat({ user }: CrispChatProps) {
  useEffect(() => {
    const setup = async () => {
      if (typeof window !== 'undefined') {
        window.$crisp = []
        const config = await getConfig();
        window.CRISP_WEBSITE_ID = config.crispWebsiteId;
        const script = document.createElement('script')
        script.src = 'https://client.crisp.chat/l.js'
        script.async = true
        document.head.appendChild(script)

        // Wait for Crisp to load
        script.onload = () => {
          if (user?.email) {
            window.$crisp.push(['set', 'user:email', [user.email]])
            if (user.name) {
              window.$crisp.push(['set', 'user:nickname', [user.name]])
            }
          }
          
          // Add CSS to hide Crisp on mobile devices
          const style = document.createElement('style')
          style.textContent = `
            @media (max-width: 768px) {
              .crisp-client {
                display: none !important;
              }
            }
          `
          document.head.appendChild(style)
        }
      }
    }
    setup();
  }, [user])

  return null
}