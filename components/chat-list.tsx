import { Separator } from '@/components/ui/separator'
import { UIState } from '@/lib/chat/AIManager'
import { Session } from '@/lib/types'
import Link from 'next/link'
import { AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Card, CardContent } from '@/components/ui/card'
import { useT } from '@/lib/i18n/context'

export interface ChatList {
  messages: UIState
  session?: Session
  isShared: boolean
}

export function LoginPrompt() {
  const t = useT()
  
  return (
    <Card className="bg-[#1A1D29] border-[#2A2E3A] mb-6 rounded-xl shadow-md">
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className="shrink-0 p-2 bg-[#4BF29C]/10 rounded-lg">
            <AlertCircle className="size-5 text-[#4BF29C]" />
          </div>
          <div className="space-y-1">
            <p className="text-[#ADB0B8] text-sm leading-relaxed">
              Please{' '}
              <Link 
                href="/login" 
                className="text-[#4BF29C] hover:text-[#5cffad] hover:underline transition-colors font-medium"
              >
                {t('chat.loginPrompt.logIn')}
              </Link>
              {' '}or{' '}
              <Link 
                href="/signup"
                className="text-[#4BF29C] hover:text-[#5cffad] hover:underline transition-colors font-medium"
              >
                {t('chat.loginPrompt.signUp')}
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
    <div className="w-full max-w-3xl px-4 pb-52 mx-auto">
      {!isShared && !session && <LoginPrompt />}
      <div className="space-y-0">
        {messages.map((message, index, allMessages) => (
          <div key={message.id} className="relative py-2">
            {message.display}
            {index < allMessages.length - 1 && (
              <Separator 
                className={cn(
                  "my-6",
                  "bg-[#2A2E3A]/30 h-px" // Subtle separator matching our design
                )} 
              />
            )}
          </div>
        ))}
      </div>
    </div>
  )
}