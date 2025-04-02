'use client'

import React, { createContext, useContext, useState, ReactNode } from 'react'

interface SidebarContentContextProps {
  content: ReactNode | null
  setContent: (content: ReactNode | null) => void
  isOpen: boolean
  setIsOpen: (isOpen: boolean) => void
  title: string
  setTitle: (title: string) => void
}

const SidebarContentContext = createContext<SidebarContentContextProps | undefined>(undefined)

export function useSidebarContent() {
  const context = useContext(SidebarContentContext)
  if (!context) {
    throw new Error('useSidebarContent must be used within a SidebarContentProvider')
  }
  return context
}

interface SidebarContentProviderProps {
  children: ReactNode
}

export function SidebarContentProvider({ children }: SidebarContentProviderProps) {
  const [content, setContent] = useState<ReactNode | null>(null)
  const [isOpen, setIsOpen] = useState(false)
  const [title, setTitle] = useState('Details')

  return (
    <SidebarContentContext.Provider value={{ 
      content, 
      setContent, 
      isOpen, 
      setIsOpen,
      title,
      setTitle
    }}>
      {children}
    </SidebarContentContext.Provider>
  )
}