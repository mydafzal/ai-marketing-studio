'use client'

import * as React from 'react'
import Textarea from 'react-textarea-autosize'
import { UserContent, TextPart, ImagePart } from 'ai'
import { useActions, useUIState, getMutableAIState } from 'ai/rsc'
import chatToCampaignMapping from '@/lib/api/fasty-bot/helpers/campaign-id-list'
import { UserMessage } from './stocks/message'
import { type AI } from '@/lib/chat/actions'
import { Button } from '@/components/ui/button'
import { IconArrowElbow, IconPlus, IconSpinner } from '@/components/ui/icons'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger
} from '@/components/ui/tooltip'
import { Toaster, toast } from 'sonner'
import { useEnterSubmit } from '@/lib/hooks/use-enter-submit'
import { nanoid } from 'nanoid'
import { useParams } from 'next/navigation'

export function PromptForm({
  input,
  setInput
}: {
  input: string
  setInput: (value: string) => void
}) {
  const { id } = useParams()
  const { formRef, onKeyDown } = useEnterSubmit()
  const inputRef = React.useRef<HTMLTextAreaElement>(null)
  const { submitUserMessage } = useActions()
  const [_, setMessages] = useUIState<typeof AI>()

  const fileInputRef = React.useRef<HTMLInputElement>(null)
  const [selectedFiles, setSelectedFiles] = React.useState<FileList | null>(
    null
  )
  const [uploading, setUploading] = React.useState(false)
  const [urls, setUrls] = React.useState<string[]>([])
  const handleFileChange = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const files = event.target.files
    if (!files || files.length === 0) return

    setUploading(true)

    const formData = new FormData()
    const campaignId = chatToCampaignMapping[id as string]

    formData.append('id', (campaignId || id) as string)
    Array.from(files).forEach(file => {
      formData.append('files', file)
    })

    toast.info('Uploading your images, please wait...')
    try {
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      })
      
      const data = await response.json()
      if (response.ok) {
        toast.success('Images uploaded successfully!')
        setUrls(data.urls)
        const textPrompt = ''
        const messageContent: UserContent = [
          {
            type: 'text',
            text: textPrompt
          },
          ...data.urls.map((url: string) => ({
            type: 'image',
            image: url,
            mimeType: 'image/png'
          }))
        ]
        setMessages(currentMessages => [
          ...currentMessages,
          {
            id: nanoid(),
            display: (
              <UserMessage userContent={messageContent}>
                {textPrompt}
              </UserMessage>
            )
          }
        ])
        const responseMessage = await submitUserMessage(
          textPrompt,
          messageContent
        )
        setMessages(currentMessages => [...currentMessages, responseMessage]);
      } else {
        toast.error('Failed to upload the image. Please try again.')
      }
    } catch (error) {
      toast.error('Failed to upload the image. Please try again.')
    }

    setUploading(false)
  }
  const handleButtonClick = () => {
    fileInputRef.current?.click()
  }
  React.useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus()
    }
  }, [])

  return (
    <form
      ref={formRef}
      onSubmit={async (e: any) => {
        e.preventDefault()

        // Blur focus on mobile
        if (window.innerWidth < 600) {
          e.target['message']?.blur()
        }

        const value = input.trim()
        setInput('')
        if (!value) return

        // Optimistically add user message UI
        setMessages(currentMessages => [
          ...currentMessages,
          {
            id: nanoid(),
            display: <UserMessage>{value}</UserMessage>
          }
        ])

        // Submit and get response message
        const responseMessage = await submitUserMessage(value)
        setMessages(currentMessages => [...currentMessages, responseMessage])
      }}
    >
      <div className="relative flex max-h-60 w-full grow flex-col overflow-hidden bg-background px-8 sm:rounded-md sm:border sm:px-12">
        <input
          ref={fileInputRef}
          style={{ display: 'none' }}
          type="file"
          multiple
          accept="image/*"
          onChange={handleFileChange}
        />
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="outline"
              size="icon"
              className="absolute left-0 top-[14px] size-8 rounded-full bg-background p-0 sm:left-4"
              onClick={handleButtonClick}
              disabled={uploading}
            >
              {uploading ? <IconSpinner /> : <IconPlus />}
              <span className="sr-only">Upload Images</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent>You can upload up to 10 images</TooltipContent>
        </Tooltip>
        <Textarea
          ref={inputRef}
          tabIndex={0}
          onKeyDown={onKeyDown}
          placeholder="Send a message."
          className="min-h-[60px] w-full resize-none bg-transparent px-4 py-[1.3rem] focus-within:outline-none sm:text-sm"
          autoFocus
          spellCheck={false}
          autoComplete="off"
          autoCorrect="off"
          name="message"
          rows={1}
          value={input}
          onChange={e => setInput(e.target.value)}
        />
        <div className="absolute right-0 top-[13px] sm:right-4">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button type="submit" size="icon" disabled={input === ''}>
                <IconArrowElbow />
                <span className="sr-only">Send message</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent>Send message</TooltipContent>
          </Tooltip>
        </div>
      </div>
    </form>
  )
}
