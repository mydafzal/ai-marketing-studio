'use client'

import * as React from 'react'
import { Button } from '@/components/ui/button'
import { HelpCircle, History } from 'lucide-react'
import { usePathname, useRouter } from 'next/navigation'
import { useT } from '@/lib/i18n/context'

export function ChatHistoryHeader() {
  const router = useRouter()
  const pathname = usePathname()
  const t = useT()
  
  const handleSupportClick = () => {
    // Extract the chat ID from the current path if we're in a chat
    const chatIdMatch = pathname.match(/\/chat\/([^\/]+)/)
    const chatId = chatIdMatch ? chatIdMatch[1] : null
    
    if (chatId) {
      // If we're in a chat, post the message to the current chat
      const messageEvent = new CustomEvent('send-support-message', {
        detail: { message: 'I need support' }
      })
      window.dispatchEvent(messageEvent)
    } else {
      // If we're not in a chat, navigate to a new chat and let the message be sent there
      router.push('/')
      // Use setTimeout to ensure navigation completes before sending the message
      setTimeout(() => {
        const messageEvent = new CustomEvent('send-support-message', {
          detail: { message: 'I need support' }
        })
        window.dispatchEvent(messageEvent)
      }, 500)
    }
  }

  return (
    <div className="flex items-center justify-between px-6 py-4 border-b border-[#2A2E3A]">
      <div className="flex items-center gap-2">
        <History className="size-5 text-[#8A8F99]" />
        <h2 className="text-base font-semibold text-white">
          {t('sidebar.chatHistory')}
        </h2>
      </div>
      {/* Support button removed - now using Crisp chat in the navbar */}
    </div>
  )
}