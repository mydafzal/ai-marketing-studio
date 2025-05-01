'use client'

import React, { useState, useEffect, useRef } from 'react'
import { Button } from './ui/button'
import { MessageCircle, X } from 'lucide-react'
import { Tooltip, TooltipContent, TooltipTrigger } from './ui/tooltip'
import { getConfig } from '@/utils/config'

// Props to receive user information instead of using useSession
type CrispMobileLauncherProps = {
  userEmail?: string;
  userName?: string;
}

export function CrispMobileLauncher({ userEmail = '', userName = '' }: CrispMobileLauncherProps) {
  const [isChatOpen, setIsChatOpen] = useState(false)
  const [websiteId, setWebsiteId] = useState('')
  const [iframeLoaded, setIframeLoaded] = useState(false)
  const iframeRef = useRef<HTMLIFrameElement>(null)

  // Get the Crisp website ID from config
  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const config = await getConfig()
        setWebsiteId(config.crispWebsiteId)
      } catch (error) {
        console.error('Error fetching Crisp website ID:', error)
      }
    }
    
    fetchConfig()
  }, [])

  // Create and inject a direct link to the chat iframe
  const createChatIframe = () => {
    // Create a completely standalone iframe that's not part of the React component tree
    // This approach bypasses any potential z-index or CSS issues
    
    // First, remove any existing iframe with our ID
    const existingIframe = document.getElementById('standalone-crisp-iframe')
    if (existingIframe) {
      existingIframe.remove()
    }
    
    // Create the full-screen overlay container
    const overlay = document.createElement('div')
    overlay.id = 'crisp-mobile-overlay'
    overlay.style.position = 'fixed'
    overlay.style.top = '0'
    overlay.style.left = '0'
    overlay.style.width = '100%'
    overlay.style.height = '100%'
    overlay.style.backgroundColor = '#0A0C14'
    overlay.style.zIndex = '99999'
    overlay.style.display = 'flex'
    overlay.style.flexDirection = 'column'
    
    // Create the header
    const header = document.createElement('div')
    header.style.display = 'flex'
    header.style.justifyContent = 'space-between'
    header.style.alignItems = 'center'
    header.style.padding = '16px'
    header.style.borderBottom = '1px solid #2A2E3A'
    header.style.backgroundColor = '#1A1D29'
    
    // Title
    const title = document.createElement('h2')
    title.textContent = 'Support Chat'
    title.style.color = 'white'
    title.style.fontWeight = '600'
    title.style.margin = '0'
    title.style.fontSize = '16px'
    
    // Close button
    const closeBtn = document.createElement('button')
    closeBtn.innerHTML = 'Close <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>'
    closeBtn.style.backgroundColor = '#4BF29C'
    closeBtn.style.border = 'none'
    closeBtn.style.color = '#0A0C14'
    closeBtn.style.fontWeight = 'bold'
    closeBtn.style.cursor = 'pointer'
    closeBtn.style.padding = '8px 12px'
    closeBtn.style.borderRadius = '4px'
    closeBtn.style.display = 'flex'
    closeBtn.style.alignItems = 'center'
    closeBtn.style.gap = '8px'
    closeBtn.style.fontSize = '14px'
    closeBtn.style.justifyContent = 'center'
    
    const closeChat = function() {
      // Remove the overlay
      const overlay = document.getElementById('crisp-mobile-overlay')
      if (overlay) {
        overlay.remove()
      }
      
      // Remove the style that hides the regular Crisp widget
      const hideStyle = document.getElementById('hide-crisp-style')
      if (hideStyle) {
        hideStyle.remove()
      }
      
      // Allow scrolling again
      document.body.style.overflow = ''
      
      // Update React state
      setIsChatOpen(false)
    };
    
    closeBtn.onclick = closeChat
    
    // Also add a floating close button at the bottom right for easier access
    const floatingClose = document.createElement('button')
    floatingClose.textContent = 'Close chat'
    floatingClose.style.position = 'fixed'
    floatingClose.style.bottom = '20px'
    floatingClose.style.right = '20px'
    floatingClose.style.padding = '12px 16px'
    floatingClose.style.backgroundColor = '#4BF29C'
    floatingClose.style.color = '#0A0C14'
    floatingClose.style.fontWeight = 'bold'
    floatingClose.style.border = 'none'
    floatingClose.style.borderRadius = '40px'
    floatingClose.style.zIndex = '100000'
    floatingClose.style.boxShadow = '0 4px 8px rgba(0,0,0,0.2)'
    floatingClose.style.fontSize = '14px'
    floatingClose.style.cursor = 'pointer'
    floatingClose.onclick = closeChat
    
    // Add title and close button to header
    header.appendChild(title)
    header.appendChild(closeBtn)
    
    // Create the iframe container
    const iframeContainer = document.createElement('div')
    iframeContainer.style.flex = '1'
    iframeContainer.style.backgroundColor = 'white'
    
    // Build the iframe URL
    let iframeSrc = `https://go.crisp.chat/chat/embed/?website_id=${websiteId}`
    if (userEmail) {
      iframeSrc += `&user_email=${encodeURIComponent(userEmail)}`
    }
    if (userName) {
      iframeSrc += `&user_nickname=${encodeURIComponent(userName)}`
    }
    
    // Create the iframe
    const iframe = document.createElement('iframe')
    iframe.id = 'standalone-crisp-iframe'
    iframe.src = iframeSrc
    iframe.style.width = '100%'
    iframe.style.height = '100%'
    iframe.style.border = 'none'
    iframe.allow = 'microphone; camera'
    
    // Add loading spinner
    const spinner = document.createElement('div')
    spinner.id = 'crisp-loading-spinner'
    spinner.style.position = 'absolute'
    spinner.style.top = '0'
    spinner.style.left = '0'
    spinner.style.width = '100%'
    spinner.style.height = '100%'
    spinner.style.backgroundColor = 'white'
    spinner.style.display = 'flex'
    spinner.style.justifyContent = 'center'
    spinner.style.alignItems = 'center'
    spinner.style.zIndex = '2'
    
    const spinnerCircle = document.createElement('div')
    spinnerCircle.style.width = '32px'
    spinnerCircle.style.height = '32px'
    spinnerCircle.style.border = '4px solid transparent'
    spinnerCircle.style.borderTopColor = '#4BF29C'
    spinnerCircle.style.borderRadius = '50%'
    spinnerCircle.style.animation = 'spin 1s linear infinite'
    
    // Add keyframe animation
    const style = document.createElement('style')
    style.textContent = `
      @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
    `
    document.head.appendChild(style)
    
    spinner.appendChild(spinnerCircle)
    
    // Handle iframe load event to hide spinner
    iframe.onload = () => {
      const loadingSpinner = document.getElementById('crisp-loading-spinner')
      if (loadingSpinner) {
        loadingSpinner.style.display = 'none'
      }
    }
    
    // Assemble everything
    iframeContainer.appendChild(spinner)
    iframeContainer.appendChild(iframe)
    overlay.appendChild(header)
    overlay.appendChild(iframeContainer)
    overlay.appendChild(floatingClose) // Add the floating close button
    
    // Add to document
    document.body.appendChild(overlay)
    
    // Prevent scrolling of the main page
    document.body.style.overflow = 'hidden'
    
    // Also hide the regular Crisp chat
    const crispStyle = document.createElement('style')
    crispStyle.id = 'hide-crisp-style'
    crispStyle.textContent = `
      .crisp-client {
        display: none !important;
        z-index: -1 !important;
        pointer-events: none !important;
      }
    `
    document.head.appendChild(crispStyle)
  }

  // Handle opening the chat
  const handleOpenChat = () => {
    if (websiteId) {
      setIsChatOpen(true)
      // Create the standalone iframe
      createChatIframe()
    }
  }

  // Clean up on unmount
  useEffect(() => {
    return () => {
      // Remove any standalone elements
      document.getElementById('crisp-mobile-overlay')?.remove()
      document.getElementById('hide-crisp-style')?.remove()
      document.body.style.overflow = ''
    }
  }, [])

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