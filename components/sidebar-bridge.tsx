'use client'

import { useEffect } from 'react'
import { useSidebarContent } from '@/components/contexts/sidebar-content-context'
import { onSidebarContentChange, hasMinimizedContent as checkMinimizedContent } from '@/lib/sidebar-content-manager'

export function SidebarBridge() {
  const { 
    setContent, 
    setIsOpen, 
    setTitle, 
    setIsMinimized,
    setHasMinimizedContent
  } = useSidebarContent()

  useEffect(() => {
    return onSidebarContentChange((content, open, title, isMinimized) => {
      setContent(content)
      setIsOpen(open)
      setTitle(title)
      setIsMinimized(isMinimized)
      setHasMinimizedContent(checkMinimizedContent())
    })
  }, [setContent, setIsOpen, setTitle, setIsMinimized, setHasMinimizedContent])

  return null
}