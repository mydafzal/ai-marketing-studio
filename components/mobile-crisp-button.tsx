'use client'

import React, { useState, useEffect } from 'react'
import { Button } from './ui/button'
import { MessageCircle } from 'lucide-react'
import { Tooltip, TooltipContent, TooltipTrigger } from './ui/tooltip'

export function MobileCrispButton() {
  const [isCrispLoaded, setIsCrispLoaded] = useState(false)

  // Check if Crisp is loaded
  useEffect(() => {
    const checkCrispLoaded = () => {
      if (typeof window !== 'undefined' && window.$crisp) {
        setIsCrispLoaded(true)
        return true
      }
      return false
    }

    // Check immediately
    if (checkCrispLoaded()) return

    // Set up an interval to keep checking until Crisp is loaded
    const intervalId = setInterval(() => {
      if (checkCrispLoaded()) {
        clearInterval(intervalId)
      }
    }, 1000)

    return () => clearInterval(intervalId)
  }, [])

  const handleOpenChat = () => {
    console.log('Opening Crisp chat')
    
    // Method 1: Try using window.$crisp directly
    if (typeof window !== 'undefined' && window.$crisp) {
      console.log('Using $crisp.push method')
      window.$crisp.push(['do', 'chat:open'])
      // Also trigger a window event that will make any iframes or hidden elements appear
      const event = new Event('openCrispChat')
      window.dispatchEvent(event)
    } 
    // Method 2: If Crisp object is available but in a different format
    else if (typeof window !== 'undefined' && window.CRISP_WEBSITE_ID) {
      console.log('Using direct Crisp API method')
      // Try direct DOM manipulation as a fallback
      const crispButton = document.querySelector('.crisp-client .cc-1rzs .cc-9qit')
      if (crispButton && crispButton instanceof HTMLElement) {
        crispButton.click()
      }
    }
    // Method 3: Try to force load Crisp if not loaded
    else if (typeof window !== 'undefined') {
      console.log('Attempting to load Crisp')
      // Force create Crisp script if it doesn't exist
      window.$crisp = [];
      window.CRISP_WEBSITE_ID = window.CRISP_WEBSITE_ID || "not-set"; // Will be replaced with correct ID
      const script = document.createElement('script');
      script.src = 'https://client.crisp.chat/l.js';
      script.async = true;
      document.head.appendChild(script);
      
      // Try to open after a short delay
      setTimeout(() => {
        if (window.$crisp) {
          window.$crisp.push(['do', 'chat:open'])
        }
      }, 1000);
    }
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button 
          onClick={handleOpenChat}
          variant="ghost" 
          size="icon"
          className="md:hidden flex items-center justify-center text-primary-green hover:text-primary-green/80 hover:bg-[#212534] mr-2"
        >
          <MessageCircle className="h-5 w-5" />
        </Button>
      </TooltipTrigger>
      <TooltipContent className="bg-container-bg border border-border-dark text-text-white">
        Support Chat
      </TooltipContent>
    </Tooltip>
  )
}