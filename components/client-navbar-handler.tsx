'use client'

import React, { useState, useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { getFacebookBusinessAccounts, getFacebookAdAccounts } from '@/app/facebook-actions'
import { isFeatureToggleEnabled } from '@/lib/helpers/feature-toggle/feature-toggle-manager'
import NavbarDropdowns from './navbar-dropdowns'

type ClientNavbarHandlerProps = {
  userDetails: any
  updateFbBusinessAcc: (email: string, accountId: string) => Promise<any>
  updateFbAccountId: (email: string, fbAccountId: string) => Promise<any>
  updateFbPageId: (email: string, pageId: string) => Promise<any>
}

// List of paths where the navbar should NOT be shown
const NON_CHAT_PATHS = [
  '/ai-content',
  '/content-folder',
  '/admin',
  '/subscription',
  '/create-campaign'
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
    
    // Check if we're on homepage with new dashboard (legacy mode disabled)
    const isHomepageWithNewDashboard = pathname === '/' && !isFeatureToggleEnabled('legacyChatMode')
    
    // Update shouldRender state based on the current path and dashboard mode
    setShouldRender(!isNonChatScreen && !isHomepageWithNewDashboard)
    
    // Also set up a navigation event listener to hide/show the navbar
    // when navigating between pages without a full page reload
    const handleRouteChange = () => {
      const currentPath = window.location.pathname
      const isNonChatPage = NON_CHAT_PATHS.some(path => currentPath.includes(path))
      const isHomepageNewDashboard = currentPath === '/' && !isFeatureToggleEnabled('legacyChatMode')
      setShouldRender(!isNonChatPage && !isHomepageNewDashboard)
    }
    
    // Listen for route changes
    window.addEventListener('popstate', handleRouteChange)
    
    // Clean up the event listener
    return () => {
      window.removeEventListener('popstate', handleRouteChange)
    }
  }, [pathname]) // Re-run when pathname changes
  
  // Only render on chat screens and legacy homepage
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