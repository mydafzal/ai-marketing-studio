import { Separator } from '@/components/ui/separator'
import { UIState } from '@/lib/chat/AIManager'
import { Session } from '@/lib/types'
import Link from 'next/link'
import { AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Card, CardContent } from '@/components/ui/card'

export interface ChatList {
  messages: UIState
  session?: Session
  isShared: boolean
}

export function LoginPrompt() {
  return (
    <Card className="bg-zinc-900/50 border-zinc-800 mb-6">
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className="shrink-0 p-2 bg-amber-500/10 rounded-lg">
            <AlertCircle className="size-5 text-amber-500" />
          </div>
          <div className="space-y-1">
            <p className="text-zinc-300 text-sm leading-relaxed">
              Please{' '}
              <Link 
                href="/login" 
                className="text-blue-400 hover:text-blue-300 hover:underline transition-colors"
              >
                log in
              </Link>
              {' '}or{' '}
              <Link 
                href="/signup"
                className="text-blue-400 hover:text-blue-300 hover:underline transition-colors"
              >
                sign up
              </Link>
              {' '}to save and revisit your chat history!
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export function ChatList({ messages, session, isShared }: ChatList) {
  if (!messages.length) {
    return null
  }

  return (
    <div className="relative mx-auto max-w-3xl px-4">
      {!isShared && !session && <LoginPrompt />}

      <div className="space-y-6">
        {messages.map((message, index) => (
          <div key={message.id} className="relative">
            {message.display}
            {index < messages.length - 1 && (
              <Separator 
                className={cn(
                  "my-6",
                  "bg-zinc-800/50" // Darker, more subtle separator
                )} 
              />
            )}
          </div>
        ))}
      </div>
    </div>
  )
}