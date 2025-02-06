'use client'

import { IconUser } from '@/components/ui/icons'
import { UserContent, TextPart, ImagePart } from 'ai'
import Image from 'next/image'
import { cn } from '@/lib/utils'
import { spinner } from './spinner'
import { CodeBlock } from '../ui/codeblock'
import { MemoizedReactMarkdown } from '../markdown'
import remarkGfm from 'remark-gfm'
import remarkMath from 'remark-math'
import { StreamableValue, useStreamableValue } from 'ai/rsc'
import { useStreamableText } from '@/lib/hooks/use-streamable-text'
import { VideoPlayer } from './video-player'
import { Brain } from 'lucide-react'
import React from "react";
import { format } from 'date-fns'

function humanizeTimestamp(timestamp: string|undefined): string
{
  if(timestamp === undefined)
    {
      return '';
    }

  return format(new Date(timestamp), 'PPpp');
}


export function UserMessage({
                                userContent,
                                children,
                                timestamp
                            }: {
    userContent?: UserContent,
    children: React.ReactNode,
    timestamp?: string
}) {


  return (
    <div className="group relative flex items-start space-x-3 py-4 transition-colors">
      <div className="flex size-8 shrink-0 select-none items-center justify-center rounded-full bg-blue-500/10 border border-blue-500/20 shadow-sm dark:bg-blue-500/10 dark:border-blue-500/20">
        <IconUser className="size-5 text-blue-600 dark:text-blue-500" />
      </div>

      {Array.isArray(userContent) ? (
        <div className="flex flex-wrap flex-1">
          {userContent
            .filter(message => message.type === 'image')
            .map((message, idx) => (
              <div key={idx} className="p-2 w-1/2">
                <Image
                  src={(message as ImagePart).image as string}
                  alt=""
                  className="rounded-lg border border-zinc-200 shadow-sm dark:border-zinc-800"
                  style={{ width: '500px', height: 'auto' }}
                  width={300}
                  height={160}
                  sizes="(max-width: 500px) 100vw, 33vw"
                />
              </div>
            ))
          }
          {userContent
            .filter(message => (message.type === 'text' && message.text.includes('I upload video with these data:')))
            .map((message, idx) => {
              let video_data;
              try {
                video_data = JSON.parse(`{${(message as TextPart).text?.split('{')[1]?.split('}')[0]}}`);
              } catch (e) {
                console.log('error', e)
              }
              return (
                <div key={idx} className="p-4 w-1/2">
                  <div className="rounded-lg border border-zinc-200 overflow-hidden shadow-sm dark:border-zinc-800">
                    <VideoPlayer src={video_data?.video} />
                  </div>
                </div>
              )
            })
          }
        </div>
      ) : (
        <div className="flex-1 space-y-2 overflow-hidden">
          <div className="inline-block rounded-2xl rounded-tl-sm bg-blue-500/10 px-4 py-3 text-zinc-900 shadow-sm dark:bg-blue-500/10 dark:text-zinc-200">
            {children}
          </div>
          <div className='"text-xs text-zinc-500 dark:text-zinc-400 mt-1'>
            {humanizeTimestamp(timestamp)}
          </div>
        </div>
      )}
    </div>
  )
}

export function BotMessage({
  content,
  className
}: {
  content: string | StreamableValue<string>
  className?: string
}) {
  const text = useStreamableText(content)

  return (
    <div className={cn('group relative flex items-start space-x-3 py-4 transition-colors', className)}>
      <div className="flex size-8 shrink-0 select-none items-center justify-center rounded-full bg-green-500/10 border border-green-500/20 shadow-sm dark:bg-green-500/10 dark:border-green-500/20">
        <Brain className="size-5 text-green-600 dark:text-green-500" />
      </div>
      <div className="flex-1 space-y-2 overflow-hidden">
        <div className="inline-block rounded-2xl rounded-tl-sm bg-zinc-100 px-4 py-3 shadow-sm dark:bg-zinc-800/80">
          <MemoizedReactMarkdown
            className="prose break-words prose-zinc dark:prose-invert prose-p:leading-relaxed prose-pre:p-0 max-w-none"
            remarkPlugins={[remarkGfm, remarkMath]}
            components={{
              p({ children }) {
                return <p className="mb-2 last:mb-0 text-zinc-900 dark:text-zinc-200">{children}</p>
              },
              code({ node, inline, className, children, ...props }) {
                if (children.length) {
                  if (children[0] == '▍') {
                    return (
                      <span className="mt-1 animate-pulse cursor-default">▍</span>
                    )
                  }
                  children[0] = (children[0] as string).replace('`▍`', '▍')
                }

                const match = /language-(\w+)/.exec(className || '')

                if (inline) {
                  return (
                    <code className={cn('rounded-md bg-zinc-200 px-1.5 py-0.5 text-sm font-medium text-zinc-900 dark:bg-zinc-700/50 dark:text-zinc-200', className)} {...props}>
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
            {text}
          </MemoizedReactMarkdown>
        </div>
      </div>
    </div>
  )
}

export function BotCard({
  children,
  showAvatar = true
}: {
  children: React.ReactNode
  showAvatar?: boolean
}) {
  return (
    <div className="group relative flex items-start space-x-3 py-4 transition-colors">
      <div
        className={cn(
          'flex size-8 shrink-0 select-none items-center justify-center rounded-full bg-green-500/10 border border-green-500/20 shadow-sm dark:bg-green-500/10 dark:border-green-500/20',
          !showAvatar && 'invisible'
        )}
      >
        <Brain className="size-5 text-green-600 dark:text-green-500" />
      </div>
      <div className="flex-1 overflow-hidden rounded-2xl rounded-tl-sm bg-zinc-100 px-4 py-3 shadow-sm dark:bg-zinc-800/80">
        {children}
      </div>
    </div>
  )
}

export function SystemMessage({ children }: { children: React.ReactNode }) {
  return (
    <div className="mt-2 flex items-center justify-center gap-2">
      <div className="max-w-[600px] flex-initial rounded-xl bg-zinc-100 p-3 text-sm text-zinc-600 dark:bg-zinc-800/50 dark:text-zinc-400">
        {children}
      </div>
    </div>
  )
}

export function SystemErrorMessage({ children }: { children: React.ReactNode }) {
  return (
    <div className="mt-2 flex items-center justify-center gap-2">
      <div className="max-w-[600px] flex-initial rounded-xl bg-red-50 p-3 text-sm text-red-600 border border-red-200 dark:bg-red-500/10 dark:text-red-400 dark:border-red-500/20">
        {children}
      </div>
    </div>
  )
}

export function SpinnerMessage() {
  return (
    <div className="group relative flex items-start space-x-3 py-4">
      <div className="flex size-8 shrink-0 select-none items-center justify-center rounded-full bg-green-500/10 border border-green-500/20 shadow-sm dark:bg-green-500/10 dark:border-green-500/20">
        <Brain className="size-5 text-green-600 dark:text-green-500" />
      </div>
      <div className="flex h-8 flex-1 flex-row items-center overflow-hidden px-2">
        {spinner}
      </div>
    </div>
  )
}