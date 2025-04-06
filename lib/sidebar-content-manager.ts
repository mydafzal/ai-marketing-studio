'use client'

import { ReactNode } from 'react'

// Store for minimized content that can be restored later
let minimizedContent: { content: ReactNode; title: string } | null = null

// This will be used to communicate with the client components
let listeners: ((content: ReactNode, open: boolean, title: string, isMinimized: boolean) => void)[] = []

export function showInSidebar(content: ReactNode, title: string = 'Details') {
  minimizedContent = null // Clear any minimized content when showing new content
  listeners.forEach(listener => listener(content, true, title, false))
}

export function hideSidebar() {
  minimizedContent = null // Clear minimized content when hiding
  listeners.forEach(listener => listener(null, false, '', false))
}

export function minimizeSidebar(content: ReactNode, title: string) {
  minimizedContent = { content, title }
  listeners.forEach(listener => listener(content, false, title, true))
}

export function restoreSidebar() {
  if (minimizedContent) {
    const { content, title } = minimizedContent
    listeners.forEach(listener => listener(content, true, title, false))
  }
}

export function hasMinimizedContent() {
  return minimizedContent !== null
}

export function onSidebarContentChange(callback: (content: ReactNode, open: boolean, title: string, isMinimized: boolean) => void) {
  listeners.push(callback)
  return () => {
    listeners = listeners.filter(l => l !== callback)
  }
}