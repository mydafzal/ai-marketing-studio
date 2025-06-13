'use client'

import { clearChats, getChats } from '@/app/actions'
import { ClearHistory } from '@/components/clear-history'
import { SidebarItems } from '@/components/sidebar-items'
import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'

interface SidebarListProps {
  userId?: string
  children?: React.ReactNode
}

export function SidebarList({ userId }: SidebarListProps) {
  const [chats, setChats] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const pathname = usePathname()

  const fetchChats = async () => {
    if (!userId) return
    try {
      const fetchedChats = await getChats(userId)
      setChats(fetchedChats || [])
    } catch (error) {
      console.error('Failed to fetch chats:', error)
    } finally {
      setIsLoading(false)
    }
  }

  // Fetch chats when component mounts, userId changes, or pathname changes
  useEffect(() => {
    fetchChats()
    
    // Set up polling to refresh chat data periodically
    const intervalId = setInterval(fetchChats, 3000)
    return () => clearInterval(intervalId)
  }, [userId, pathname])

  const handleClearChats = async () => {
    try {
      setIsLoading(true)
      await clearChats()
      // Force a complete reload to ensure everything is refreshed
      window.location.href = '/'
    } catch (error) {
      console.error('Failed to clear chats:', error)
      setIsLoading(false)
    }
  }

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <div className="flex-1 overflow-auto px-2 pt-2">
        {isLoading ? (
          <div className="p-8 text-center mt-4">
            <p className="text-sm text-text-light-gray">Loading chats...</p>
          </div>
        ) : chats?.length ? (
          <div className="space-y-1">
            <SidebarItems chats={chats} />
          </div>
        ) : (
          <div className="p-8 text-center mt-4">
            <p className="text-sm text-text-light-gray">No chat history</p>
          </div>
        )}
      </div>
      <div className="flex items-center justify-end p-4 border-t border-border-dark mt-2">
        <ClearHistory 
          clearChats={handleClearChats} 
          isEnabled={chats?.length > 0 && !isLoading} 
        />
      </div>
    </div>
  )
}