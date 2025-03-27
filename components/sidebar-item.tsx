'use client'

import * as React from 'react'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

import { motion } from 'framer-motion'

import { buttonVariants } from '@/components/ui/button'
import { IconMessage, IconUsers } from '@/components/ui/icons'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger
} from '@/components/ui/tooltip'
import { useLocalStorage } from '@/lib/hooks/use-local-storage'
import { type Chat } from '@/lib/types'
import { cn } from '@/lib/utils'

interface SidebarItemProps {
  index: number
  chat: Chat
  children: React.ReactNode
}

interface MyCustomEvent extends Event {
  detail: {
    campaignId: string,
    campaignName: string
  }
}

export function SidebarItem({ index, chat, children }: SidebarItemProps) {
  const pathname = usePathname()

  const isActive = pathname === chat.path
  const [newChatId, setNewChatId] = useLocalStorage('newChatId', null)
  const shouldAnimate = index === 0 && isActive && newChatId
  const [optimisticTitle, setOptimisticTitle] = React.useState<string | null>(null)

  React.useEffect(() => {
    const eventListener = async function(e: Event) {
      const { campaignId, campaignName } = ((e as MyCustomEvent).detail ?? {}) as { campaignId: string, campaignName: string }

      if (chat.fbCampaignId === campaignId) {
        setOptimisticTitle(campaignName)
      }
    }
    window.addEventListener('update-chat-title', eventListener)

    return () => {
      window.removeEventListener('update-chat-title', eventListener)
    }
  }, [])

  if (!chat?.id) return null

  return (
    <motion.div
      className="relative h-10 my-1"
      variants={{
        initial: {
          height: 0,
          opacity: 0
        },
        animate: {
          height: 'auto',
          opacity: 1
        }
      }}
      initial={shouldAnimate ? 'initial' : undefined}
      animate={shouldAnimate ? 'animate' : undefined}
      transition={{
        duration: 0.25,
        ease: 'easeIn'
      }}
    >
      <div className="flex w-full relative group">
        <Link
          href={chat.path}
          className={cn(
            buttonVariants({ variant: 'ghost' }),
            'relative w-full pr-2 py-2.5 transition-all duration-200 hover:bg-[#212534] rounded-lg mx-1 h-auto',
            isActive && 'bg-[#1A1D29] border-l-2 border-l-[#4BF29C] font-semibold'
          )}
        >
          <div className="absolute left-2 top-1/2 -translate-y-1/2 flex size-6 items-center justify-center">
            {chat.sharePath ? (
              <Tooltip delayDuration={1000}>
                <TooltipTrigger
                  tabIndex={-1}
                  className="focus:bg-[#212534] focus:ring-1 focus:ring-[#2A2E3A]"
                >
                  <IconUsers className="text-[#8A8F99]" />
                </TooltipTrigger>
                <TooltipContent className="bg-[#1A1D29] border border-[#2A2E3A] text-white">This is a shared chat.</TooltipContent>
              </Tooltip>
            ) : (
              <IconMessage className="text-[#8A8F99]" />
            )}
          </div>
          <div
            className="relative flex-1 select-none overflow-hidden text-ellipsis break-all pl-8 pr-4"
            title={optimisticTitle ?? (chat.title || 'No Name')}
          >
            <span className="whitespace-nowrap text-sm">
              {shouldAnimate ? (
                chat.title.split('').map((character, index) => (
                  <motion.span
                    key={index}
                    variants={{
                      initial: {
                        opacity: 0,
                        x: -100
                      },
                      animate: {
                        opacity: 1,
                        x: 0
                      }
                    }}
                    initial={shouldAnimate ? 'initial' : undefined}
                    animate={shouldAnimate ? 'animate' : undefined}
                    transition={{
                      duration: 0.25,
                      ease: 'easeIn',
                      delay: index * 0.05,
                      staggerChildren: 0.05
                    }}
                    onAnimationComplete={() => {
                      if (index === chat.title.length - 1) {
                        setNewChatId(null)
                      }
                    }}
                  >
                    {character}
                  </motion.span>
                ))
              ) : (
                <span>{optimisticTitle ?? (chat.title || 'No Name')}</span>
              )}
            </span>
          </div>
        </Link>
        <div className="absolute right-3 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          {children}
        </div>
      </div>
    </motion.div>
  )
}
