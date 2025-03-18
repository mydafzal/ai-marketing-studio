'use client'

import React, { useEffect } from 'react'
import { showInSidebar } from '@/lib/sidebar-content-manager'

interface SidebarContentWrapperProps {
  content: React.ReactNode
  title: string
  onMount: boolean
}

export function SidebarContentWrapper({ content, title, onMount }: SidebarContentWrapperProps) {
  useEffect(() => {
    if (onMount) {
      showInSidebar(content, title)
    }
  }, [content, title, onMount])

  return null
}