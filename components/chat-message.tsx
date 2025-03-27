// Inspired by Chatbot-UI and modified to fit the needs of this project
// @see https://github.com/mckaywrigley/chatbot-ui/blob/main/components/Chat/ChatMessage.tsx

import { Message } from 'ai'
import remarkGfm from 'remark-gfm'
import remarkMath from 'remark-math'

import { cn } from '@/lib/utils'
import { CodeBlock } from '@/components/ui/codeblock'
import { MemoizedReactMarkdown } from '@/components/markdown'
import { IconOpenAI, IconUser } from '@/components/ui/icons'
import { ChatMessageActions } from '@/components/chat-message-actions'

export interface ChatMessageProps {
  message: Message
}

export function ChatMessage({ message, ...props }: ChatMessageProps) {
  return (
    <div
      className={cn('group relative mb-6 flex items-start')}
      {...props}
    >
      <div
        className={cn(
          'flex size-9 shrink-0 select-none items-center justify-center rounded-lg shadow-sm',
          message.role === 'user'
            ? 'bg-[#1A1D29] text-white border border-[#2A2E3A]'
            : 'bg-[#4BF29C] text-[#0A0C14]'
        )}
      >
        {message.role === 'user' ? <IconUser className="size-5" /> : <IconOpenAI className="size-5" />}
      </div>
          <div className={cn(
            "flex-1 px-1 ml-4 space-y-2 overflow-hidden",
            message.role === 'assistant' && "pr-2"
          )}>
              <MemoizedReactMarkdown
                  className="prose break-words dark:prose-invert prose-p:leading-relaxed prose-pre:p-0 prose-headings:text-white prose-a:text-[#4BF29C] prose-strong:text-white"
                  remarkPlugins={[remarkGfm, remarkMath]}
                  components={{
                    p({ children }) {
                      return <p className="mb-2 last:mb-0 text-[#ADB0B8]">{children}</p>
                    },
                    code({ node, inline, className, children, ...props }) {
                      if (children.length) {
                        if (children[0] == '▍') {
                          return (
                            <span className="mt-1 cursor-default animate-pulse">▍</span>
                          )
                        }
        
                        children[0] = (children[0] as string).replace('`▍`', '▍')
                      }
        
                      const match = /language-(\w+)/.exec(className || '')
        
                      if (inline) {
                        return (
                          <code className={className} {...props}>
                            {children}
                          </code>
                        )
                      }

                      return (
                        <CodeBlock
                          key={Math.random()}
                          language={(match && match[1]) || ''}
                          value={String(children).replace(/\n$/, '')}
                          {...props}
                        />
                      )
                    }
                  }}
                >
                  {message.content}
                </MemoizedReactMarkdown>
              {message.timestamp && (
                  <div className="flex items-center mt-3 gap-3">
                    <div className="h-px flex-grow bg-[#2A2E3A]/15"></div>
                    <p className="text-xs text-[#8A8F99] font-medium flex items-center px-2 py-1 rounded-full bg-[#151925]/60 border border-[#2A2E3A]/20">
                      <svg className="w-3 h-3 mr-1.5 text-[#4BF29C]/70" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M12 8V12L14 14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                        <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.5" />
                      </svg>
                      {new Date(message.timestamp).toLocaleString(undefined, {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                    <div className="h-px flex-grow bg-[#2A2E3A]/15"></div>
                  </div>
              )}
        <ChatMessageActions message={message} />
      </div>
    </div>
  )
}
