'use client'

import * as React from 'react'

import Textarea from 'react-textarea-autosize'
import { UserContent, ImagePart } from 'ai'
import { useActions, useUIState } from 'ai/rsc'
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
import { toast } from 'sonner'
import { useEnterSubmit } from '@/lib/hooks/use-enter-submit'
import { nanoid } from 'nanoid'
import { useParams } from 'next/navigation'
import { useAIState } from 'ai/rsc'
import { Message } from '@/lib/types'
import { getMimeType } from '@/lib/utils'
import { updateChatFbCampaignId, updateChatTitle } from '@/app/actions'

export interface PromtFormProps {
  createNewCampaign: (name: string) => Promise<string | false>,
}

export function PromptForm({
  createNewCampaign
}: PromtFormProps) {
  const { id } = useParams()
  const { formRef, onKeyDown } = useEnterSubmit()
  const inputRef = React.useRef<HTMLTextAreaElement>(null)
  const { submitUserMessage } = useActions()
  const [messages, setMessages] = useUIState<typeof AI>()
  const [aiState, setAIState] = useAIState()
  const [isDisabled, setIsDisabled] = React.useState(true)

  const fileInputRef = React.useRef<HTMLInputElement>(null)

  const [uploading, setUploading] = React.useState(false)

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

    const imageMes = aiState.messages.filter(
      (msg: Message) =>
        Array.isArray(msg.content) &&
        msg.content.some(item => item.type === 'image')
    )
    type ImagePartNew = Partial<ImagePart> & {
      uploaded_date?: number
    }
    let imageIdx = -1
    const images: ImagePartNew[] = []
    imageMes.map((msg: Message) => {
      if (Array.isArray(msg.content))
        msg.content.map(item => {
          if (item.type === 'image') {
            images.push(item)
            imageIdx++
          }
        })
    })
    toast.info('Uploading your images, please wait...')
    try {
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      })

      const data = await response.json()
      if (!response.ok) {
        toast.error('Failed to upload the image. Please try again.')
        return
      }
      toast.success('Images uploaded successfully!')
      const campaignName = "My campaign"
      let newCampaignId
      if (!aiState.messages.length) {
        newCampaignId = await createNewCampaign(campaignName)
      }

      const textPrompt = `I upload images with these urls: ${JSON.stringify(data.urls)}, at this time: ${new Date().getTime()}`
      const uploadedTime = new Date().getTime()
      console.log('uploaded image urls', data.urls, uploadedTime)
      const imgMessages = data.urls.map((url: string) => {
        imageIdx++
        let objUrl = {
          type: 'image',
          image: url,
          uploaded_date: uploadedTime,
          idx: imageIdx,
          mimeType: getMimeType(url)
        }
        return objUrl
      })
      const messageContent: UserContent = [
        {
          type: 'text',
          text: textPrompt
        },
        ...imgMessages
      ]
      const responseMessage = await submitUserMessage(
        textPrompt,
        messageContent
      )

      if (newCampaignId) {
        await updateChatFbCampaignId(aiState.chatId, newCampaignId)
      }

      setMessages(currentMessages => [
        ...currentMessages,
        {
          id: nanoid(),
          display: (
            <UserMessage userContent={messageContent}>
              {textPrompt}
            </UserMessage>
          )
        },
        responseMessage,
      ])
      if (newCampaignId) {
        await updateChatTitle(aiState.chatId, campaignName)
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

        const value = inputRef.current?.value.trim()
        if (inputRef.current) {
          inputRef.current.value = ''
          setIsDisabled(true)
        }
        if (!value) return
        const campaignName = "My campaign"
        let newCampaignId
        if (!aiState.messages.length) {
          newCampaignId = await createNewCampaign(campaignName)
        }

        
        if (newCampaignId) {
          await updateChatFbCampaignId(aiState.chatId, newCampaignId)
        }

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
        if (newCampaignId) {
          await updateChatTitle(aiState.chatId, campaignName)
        }        
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
          onChange={e => {
            setIsDisabled(!e.target.value)
          }}
        />
        <div className="absolute right-0 top-[13px] sm:right-4">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button type="submit" size="icon" disabled={isDisabled}>
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
