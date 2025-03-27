'use client'

import { ReactNode } from 'react'

// This will be used to communicate with the client components
let listeners: ((content: ReactNode, open: boolean, title: string) => void)[] = []

export function showInSidebar(content: ReactNode, title: string = 'Details') {
  listeners.forEach(listener => listener(content, true, title))
}

export function hideSidebar() {
  listeners.forEach(listener => listener(null, false, ''))
}

export function onSidebarContentChange(callback: (content: ReactNode, open: boolean, title: string) => void) {
  listeners.push(callback)
  return () => {
    listeners = listeners.filter(l => l !== callback)
  }
}