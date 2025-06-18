import * as React from 'react'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import { SidebarList } from '@/components/sidebar-list'
import { buttonVariants } from '@/components/ui/button'
import { IconPlus } from '@/components/ui/icons'
import { MessageSquarePlus, History } from 'lucide-react'

// Import the client-side header component
import { ChatHistoryHeader } from '@/components/chat-history-header'

interface ChatHistoryProps {
  userId?: string
}

function ChatHistorySkeleton() {
  return (
    <div className="flex flex-col flex-1 px-4 space-y-3">
      {Array.from({ length: 10 }).map((_, i) => (
        <div
          key={i}
          className="flex items-center gap-3 animate-pulse"
        >
          <div className="size-2 rounded-full bg-[#2A2E3A]" />
          <div className="w-full h-12 rounded-lg bg-[#1A1D29]" />
        </div>
      ))}
    </div>
  )
}

function ChatHistoryContent({ userId }: { userId?: string }) {
  return (
    <div className="flex flex-col h-full">
      {/* Use the client component for the header */}
      <ChatHistoryHeader />
      
      <div className="p-3">
        <Link
          href="/"
          className={cn(
            buttonVariants({ variant: 'outline' }),
            'w-full h-12 gap-3 justify-center',
            'bg-[#4BF29C] hover:bg-[#5cffad]',
            'border-[#4BF29C] hover:border-[#5cffad]',
            'text-[#0A0C14] font-medium text-sm',
            'rounded-xl shadow-sm',
            'transition-all duration-200'
          )}
        >
          <MessageSquarePlus className="size-5" />
          New Chat
        </Link>
      </div>
      {/* Client component SidebarList doesn't need a Suspense boundary */}
      <SidebarList userId={userId} />
    </div>
  )
}

export function ChatHistory({ userId }: ChatHistoryProps) {
  return (
    <div className={cn(
      "flex flex-col h-full",
      "bg-[#0A0C14] border-r border-[#2A2E3A]"
    )}>
      <ChatHistoryContent userId={userId} />
    </div>
  )
}