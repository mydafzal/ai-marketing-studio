'use client'

import { useEffect } from 'react'
import { useSidebarContent } from '@/components/contexts/sidebar-content-context'
import { onSidebarContentChange } from '@/lib/sidebar-content-manager'

export function SidebarBridge() {
  const { setContent, setIsOpen, setTitle } = useSidebarContent()

  useEffect(() => {
    return onSidebarContentChange((content, open, title) => {
      setContent(content)
      setIsOpen(open)
      setTitle(title)
    })
  }, [setContent, setIsOpen, setTitle])

  return null
}