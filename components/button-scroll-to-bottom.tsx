'use client'

import * as React from 'react'

import { cn } from '@/lib/utils'
import { Button, type ButtonProps } from '@/components/ui/button'
import { IconArrowDown } from '@/components/ui/icons'

interface ButtonScrollToBottomProps extends ButtonProps {
  isAtBottom: boolean
  scrollToBottom: () => void
}

export function ButtonScrollToBottom({
  className,
  isAtBottom,
  scrollToBottom,
  ...props
}: ButtonScrollToBottomProps) {
  return (
    <Button
      variant="outline"
      size="icon"
      className={cn(
        'absolute right-4 top-1 z-10 bg-[#1A1D29] border-[#2A2E3A] hover:bg-[#212534] text-white transition-all duration-300 sm:right-8 md:top-2',
        isAtBottom ? 'opacity-0' : 'opacity-100',
        className
      )}
      onClick={() => scrollToBottom()}
      {...props}
    >
      <IconArrowDown />
      <span className="sr-only">Scroll to bottom</span>
    </Button>
  )
}
