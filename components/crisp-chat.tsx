'use client'

import { getConfig } from '@/utils/config'
import { useEffect } from 'react'

declare global {
  interface Window {
    $crisp: any[]
    CRISP_WEBSITE_ID: string
    CRISP_RUNTIME_CONFIG: any
    crispLoaded?: boolean
  }
}

interface CrispChatProps {
  user: {
    email: string
    name?: string
  }
}

// Function to open Crisp chat programmatically
export const openCrispChat = () => {
  if (typeof window === 'undefined') return

  if (window.$crisp) {
    // Standard method
    window.$crisp.push(['do', 'chat:open'])
    return true
  } else {
    // If Crisp is not loaded yet, try to load it
    if (!window.crispLoaded) {
      window.$crisp = []
      const script = document.createElement('script')
      script.src = 'https://client.crisp.chat/l.js'
      script.async = true
      script.onload = () => {
        window.crispLoaded = true
        setTimeout(() => {
          if (window.$crisp) window.$crisp.push(['do', 'chat:open'])
        }, 1000)
      }
      document.head.appendChild(script)
    }
    
    // Try to click the widget directly as a last resort
    setTimeout(() => {
      const crispButton = document.querySelector('.crisp-client .cc-1rzs .cc-9qit')
      if (crispButton && crispButton instanceof HTMLElement) crispButton.click()
    }, 1500)
    
    return false
  }
}

export default function CrispChat({ user }: CrispChatProps) {
  useEffect(() => {
    const setup = async () => {
      if (typeof window !== 'undefined') {
        // Clear any previous instance
        if (window.$crisp) window.$crisp = []
        else window.$crisp = []
        
        // Set global availability flag
        window.crispLoaded = false
        
        try {
          // Get the Crisp website ID from config
          const config = await getConfig()
          window.CRISP_WEBSITE_ID = config.crispWebsiteId
          
          // Create and load the Crisp script
          const script = document.createElement('script')
          script.src = 'https://client.crisp.chat/l.js'
          script.async = true
          document.head.appendChild(script)

          // Wait for Crisp to load
          script.onload = () => {
            window.crispLoaded = true
            
            // Set user information
            if (user?.email) {
              window.$crisp.push(['set', 'user:email', [user.email]])
              if (user.name) {
                window.$crisp.push(['set', 'user:nickname', [user.name]])
              }
            }
            
            // Add CSS to completely hide the Crisp chat widget on mobile devices
            // We'll use our custom button in the nav bar instead
            const style = document.createElement('style')
            style.textContent = `
              @media (max-width: 768px) {
                /* Hide the chat button */
                .crisp-client .cc-kegp,
                /* Hide the chat bubble when expanded */
                .crisp-client .cc-cbgc,
                /* Hide any popups or notifications */
                .crisp-client .cc-1ldk,
                /* Hide any other Crisp elements that might appear at the bottom */
                .crisp-client .cc-tlyw {
                  display: none !important;
                  opacity: 0 !important;
                  visibility: hidden !important;
                  pointer-events: none !important;
                  z-index: -999 !important;
                }
              }
            `
            document.head.appendChild(style)
            
            // Make Crisp more accessible to our custom button
            window.$crisp.push(['on', 'session:loaded', () => {
              console.log('Crisp session loaded and ready')
            }])
          }
        } catch (error) {
          console.error('Error setting up Crisp chat:', error)
        }
      }
    }
    
    // Set up a global event listener to handle chat opening from anywhere
    const handleCrispOpenEvent = () => {
      if (window.$crisp) {
        console.log('Handling global openCrispChat event')
        window.$crisp.push(['do', 'chat:open'])
      }
    }
    
    if (typeof window !== 'undefined') {
      window.addEventListener('openCrispChat', handleCrispOpenEvent)
    }
    
    setup()
    
    // Cleanup function
    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('openCrispChat', handleCrispOpenEvent)
      }
    }
  }, [user])

  return null
}