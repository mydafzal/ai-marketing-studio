'use client'

import React, { useEffect, useState } from 'react'
import { useSidebarContent } from '@/components/contexts/sidebar-content-context'
import { useActiveUI } from '@/components/stocks/active-ui-context'
import { X } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function DynamicSidebar() {
  const { content, isOpen, setIsOpen, title } = useSidebarContent()
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

  if (!shouldRender) return null

  const handleClose = () => {
    if (activeUI) {
      clearActiveUI()
    }
    setIsOpen(false)
  }

  return (
    <div 
      className={`fixed top-0 right-0 z-50 h-full w-[500px] transform bg-[#1A1D29] shadow-lg 
                 border-l border-[#2A2E3A] transition-transform duration-300 ease-in-out ${animationClass} pointer-events-none`}
    >
      <div className="flex h-full flex-col pointer-events-auto">
        <div className="flex items-center justify-between border-b border-[#2A2E3A] p-4">
          <h2 className="text-lg font-semibold text-white">{effectiveTitle}</h2>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={handleClose}
            className="text-[#ADB0B8] hover:text-white hover:bg-[#151925] transition-colors"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>
        <div className="flex-1 overflow-y-auto p-4 bg-[#0A0C14]">{effectiveContent}</div>
      </div>
    </div>
  )
}