'use client'

import { type Message } from 'ai'

import { Button } from '@/components/ui/button'
import { IconCheck, IconCopy } from '@/components/ui/icons'
import { useCopyToClipboard } from '@/lib/hooks/use-copy-to-clipboard'
import { cn } from '@/lib/utils'

interface ChatMessageActionsProps extends React.ComponentProps<'div'> {
  message: Message
}

export function ChatMessageActions({
  message,
  className,
  ...props
}: ChatMessageActionsProps) {
  const { isCopied, copyToClipboard } = useCopyToClipboard({ timeout: 2000 })
 
  const onCopy = () => {
    if (isCopied) return
    copyToClipboard(message.content)
  }

  return (
    <div
      className={cn(
        'flex items-center justify-end transition-opacity group-hover:opacity-100 md:absolute md:-right-10 md:top-0 md:opacity-0',
        className
      )}
      {...props}
    >
      <Button 
        variant="ghost" 
        size="icon" 
        onClick={onCopy}
        className="size-8 p-0 bg-[#1A1D29] border border-[#2A2E3A] text-[#8A8F99] hover:bg-[#212534] hover:text-white rounded-lg shadow-sm"
      >
        {isCopied ? <IconCheck className="size-4" /> : <IconCopy className="size-4" />}
        <span className="sr-only">Copy message</span>
      </Button>
    </div>
  )
}
