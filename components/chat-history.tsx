'use client'

import * as React from 'react'
import { useState } from 'react'
import { cn } from '@/lib/utils'
import { SidebarList } from '@/components/sidebar-list'
import { buttonVariants } from '@/components/ui/button'
import { IconPlus } from '@/components/ui/icons'
import { MessageSquarePlus, History } from 'lucide-react'
import { CampaignChoiceModal } from '@/components/campaign-choice-modal'

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
          <div className="size-2 rounded-full bg-zinc-200 dark:bg-zinc-700/50" />
          <div className="w-full h-12 rounded-lg bg-zinc-100 dark:bg-zinc-800/50" />
        </div>
      ))}
    </div>
  )
}

function ChatHistoryContent({ userId }: { userId?: string }) {
  const [showModal, setShowModal] = useState(false);

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-2 px-6 py-4 border-b border-zinc-200 dark:border-zinc-800">
        <History className="size-5 text-zinc-500 dark:text-zinc-400" />
        <h2 className="text-base font-semibold text-zinc-800 dark:text-zinc-200">
          Chat History
        </h2>
      </div>
      <div className="p-3">
        <button
          onClick={() => setShowModal(true)}
          className={cn(
            buttonVariants({ variant: 'outline' }),
            'w-full h-11 gap-2 justify-center',
            'bg-white hover:bg-zinc-100',
            'dark:bg-zinc-800 dark:hover:bg-zinc-700',
            'border-zinc-200 hover:border-zinc-300',
            'dark:border-zinc-700 dark:hover:border-zinc-600',
            'text-zinc-800 dark:text-zinc-200 font-medium',
            'transition-colors duration-200'
          )}
        >
          <MessageSquarePlus className="size-4" />
          New Chat
        </button>
      </div>
      <React.Suspense fallback={<ChatHistorySkeleton />}>
        {/* @ts-ignore */}
        <SidebarList userId={userId} />
      </React.Suspense>

      <CampaignChoiceModal 
        isOpen={showModal}
        onClose={() => setShowModal(false)}
      />
    </div>
  )
}

export function ChatHistory({ userId }: ChatHistoryProps) {
  return (
    <div className={cn(
      "flex flex-col h-full",
      "bg-white border-r border-zinc-200",
      "dark:bg-zinc-900 dark:border-zinc-800"
    )}>
      <ChatHistoryContent userId={userId} />
    </div>
  )
}