'use client'

import React, { useEffect, useState } from 'react'
import { useSidebarContent } from '@/components/contexts/sidebar-content-context'
import { X } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function DynamicSidebar() {
  const { content, isOpen, setIsOpen, title } = useSidebarContent()
  const [shouldRender, setShouldRender] = useState(false)
  const [animationClass, setAnimationClass] = useState('')

  useEffect(() => {
    if (isOpen) {
      setShouldRender(true)
      setTimeout(() => setAnimationClass('translate-x-0'), 10)
    } else {
      setAnimationClass('translate-x-full')
      const timer = setTimeout(() => setShouldRender(false), 300)
      return () => clearTimeout(timer)
    }
  }, [isOpen])

  if (!shouldRender) return null

  return (
    <div 
      className={`fixed top-0 right-0 z-50 h-full w-[350px] transform bg-white shadow-lg 
                 dark:bg-zinc-800 transition-transform duration-300 ease-in-out ${animationClass}`}
    >
      <div className="flex h-full flex-col">
        <div className="flex items-center justify-between border-b p-4 dark:border-zinc-700">
          <h2 className="text-lg font-semibold">{title}</h2>
          <Button variant="ghost" size="sm" onClick={() => setIsOpen(false)}>
            <X className="h-5 w-5" />
          </Button>
        </div>
        <div className="flex-1 overflow-y-auto p-4">{content}</div>
      </div>
    </div>
  )
}