'use client'

import * as React from 'react'

import { useSidebar } from '@/lib/hooks/use-sidebar'
import { Button } from '@/components/ui/button'
import { IconSidebar } from '@/components/ui/icons'

export function SidebarToggle() {
  const { toggleSidebar, isSidebarOpen } = useSidebar()
  const [isNonSidebarPage, setIsNonSidebarPage] = React.useState(false)
  
  // Client-side check for non-sidebar pages
  React.useEffect(() => {
    const nonSidebarPaths = ['/ai-content', '/content-folder', '/admin', '/subscription']
    const currentPath = window.location.pathname
    const isNonSidebar = nonSidebarPaths.some(path => currentPath.includes(path))
    setIsNonSidebarPage(isNonSidebar)
    
    // Listen for route changes
    const handleRouteChange = () => {
      const path = window.location.pathname
      const isNonSidebar = nonSidebarPaths.some(p => path.includes(p))
      setIsNonSidebarPage(isNonSidebar)
    }
    
    window.addEventListener('popstate', handleRouteChange)
    return () => window.removeEventListener('popstate', handleRouteChange)
  }, [])
  
  // Don't render on non-sidebar pages
  if (isNonSidebarPage) return null

  return (
    <Button
      variant="ghost"
      className={`-ml-2 size-9 p-0 flex ${isSidebarOpen ? 'lg:flex' : 'inline-flex'}`}
      onClick={() => {
        toggleSidebar()
      }}
    >
      <IconSidebar className="size-6" />
      <span className="sr-only">Toggle Sidebar</span>
    </Button>
  )
}
