'use client'

import React, { useState, useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { getFacebookBusinessAccounts, getFacebookAdAccounts } from '@/app/facebook-actions'
import NavbarDropdowns from './navbar-dropdowns'

type ClientNavbarHandlerProps = {
  userDetails: any
  updateFbBusinessAcc: (email: string, accountId: string) => Promise<any>
  updateFbAccountId: (email: string, fbAccountId: string) => Promise<any>
  updateFbPageId: (email: string, pageId: string) => Promise<any>
}

// List of paths where the navbar should NOT be shown
const NON_CHAT_PATHS = [
  '/ai-campaign-analysis',
  '/ai-content',
  '/content-folder',
  '/admin',
  '/subscription'
]

export default function ClientNavbarHandler({
  userDetails,
  updateFbBusinessAcc,
  updateFbAccountId,
  updateFbPageId
}: ClientNavbarHandlerProps) {
  const [shouldRender, setShouldRender] = useState(false)
  
  // Get the current pathname using Next.js router
  const pathname = usePathname()
  
  useEffect(() => {
    // Check if we're on a non-chat screen
    const isNonChatScreen = NON_CHAT_PATHS.some(path => pathname?.includes(path))
    
    // Update shouldRender state based on the current path
    setShouldRender(!isNonChatScreen)
    
    // Also set up a navigation event listener to hide/show the navbar
    // when navigating between pages without a full page reload
    const handleRouteChange = () => {
      const currentPath = window.location.pathname
      const isNonChatPage = NON_CHAT_PATHS.some(path => currentPath.includes(path))
      setShouldRender(!isNonChatPage)
    }
    
    // Listen for route changes
    window.addEventListener('popstate', handleRouteChange)
    
    // Clean up the event listener
    return () => {
      window.removeEventListener('popstate', handleRouteChange)
    }
  }, [pathname]) // Re-run when pathname changes
  
  // Only render on chat screens
  if (!shouldRender) {
    return null
  }
  
  return (
    <div className="w-full">
      <NavbarDropdowns
        userDetails={userDetails}
        getFacebookBusinessAccounts={getFacebookBusinessAccounts}
        getFacebookAdAccounts={getFacebookAdAccounts}
        updateFbBusinessAcc={updateFbBusinessAcc}
        updateFbAccountId={updateFbAccountId}
        updateFbPageId={updateFbPageId}
      />
    </div>
  )
}