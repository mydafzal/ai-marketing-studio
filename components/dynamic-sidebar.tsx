'use client'

import React, { useEffect, useState } from 'react'
import { useSidebarContent } from '@/components/contexts/sidebar-content-context'
import { useActiveUI } from '@/components/stocks/active-ui-context'
import { X, Minimize2, Maximize2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { minimizeSidebar, restoreSidebar, hasMinimizedContent as checkMinimizedContent } from '@/lib/sidebar-content-manager'

export function DynamicSidebar() {
  const { 
    content, 
    isOpen, 
    setIsOpen, 
    title, 
    isMinimized, 
    setIsMinimized,
    hasMinimizedContent,
    setHasMinimizedContent
  } = useSidebarContent()
  const { activeUI, clearActiveUI } = useActiveUI()
  const [shouldRender, setShouldRender] = useState(false)
  const [animationClass, setAnimationClass] = useState('')

  // Only open the sidebar when isOpen is true, not based on activeUI presence
  // This prevents automatic opening when activeUI is set
  const effectiveIsOpen = isOpen
  const effectiveContent = activeUI?.component || content
  const effectiveTitle = activeUI?.title || title

  useEffect(() => {
    if (effectiveIsOpen) {
      setShouldRender(true)
      setTimeout(() => setAnimationClass('translate-x-0'), 10)
    } else {
      setAnimationClass('translate-x-full')
      const timer = setTimeout(() => setShouldRender(false), 300)
      return () => clearTimeout(timer)
    }
  }, [effectiveIsOpen])

  // Check if there's minimized content available
  useEffect(() => {
    setHasMinimizedContent(checkMinimizedContent())
  }, [isMinimized, setHasMinimizedContent])

  if (!shouldRender) return null

  const handleClose = () => {
    if (activeUI) {
      clearActiveUI()
    }
    setIsOpen(false)
  }

  const handleMinimize = () => {
    if (effectiveContent) {
      minimizeSidebar(effectiveContent, effectiveTitle)
      setIsMinimized(true)
      setIsOpen(false)
    }
  }

  return (
    <div 
      className={`fixed top-0 right-0 z-50 h-full w-full sm:w-[90%] md:w-[500px] max-w-full transform bg-[#1A1D29] shadow-lg 
                 border-l border-[#2A2E3A] transition-transform duration-300 ease-in-out ${animationClass} pointer-events-none`}
    >
      <div className="flex h-full flex-col pointer-events-auto">
        <div className="flex items-center justify-between border-b border-[#2A2E3A] p-4">
          <h2 className="text-lg font-semibold text-white truncate max-w-[200px] sm:max-w-full">{effectiveTitle}</h2>
          <div className="flex gap-2">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={handleMinimize}
              className="text-[#ADB0B8] hover:text-white hover:bg-[#151925] transition-colors p-2 sm:p-3"
              title="Minimize sidebar"
            >
              <Minimize2 className="h-5 w-5" />
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={handleClose}
              className="text-[#ADB0B8] hover:text-white hover:bg-[#151925] transition-colors p-2 sm:p-3"
              title="Close sidebar"
            >
              <X className="h-6 w-6" />
            </Button>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-4 bg-[#0A0C14]">{effectiveContent}</div>
      </div>
    </div>
  )
}

// Restore button component that appears in chat when there's minimized content
export function RestoreSidebarButton() {
  const { setIsOpen, hasMinimizedContent, setIsMinimized } = useSidebarContent()

  if (!hasMinimizedContent) return null

  const handleRestore = () => {
    restoreSidebar()
    setIsMinimized(false)
    setIsOpen(true)
  }

  return (
    <Button
      onClick={handleRestore}
      variant="outline"
      size="icon"
      className="fixed bottom-24 right-6 z-40 rounded-full bg-[#1A1D29] border-[#2A2E3A] hover:bg-[#212534] text-white shadow-lg transition-colors p-3 h-14 w-14 sm:h-12 sm:w-12 sm:p-2"
      title="Restore sidebar"
    >
      <Maximize2 className="h-7 w-7 sm:h-5 sm:w-5" />
    </Button>
  )
}