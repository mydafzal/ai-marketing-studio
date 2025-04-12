'use client'

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
    if (typeof window !== 'undefined') {
      window.$crisp = []
      window.CRISP_WEBSITE_ID = process.env.NEXT_PUBLIC_CRISP_WEBSITE_ID || ''      
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
      }
    }
  }, [user])

  return null
}