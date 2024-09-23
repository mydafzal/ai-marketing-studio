'use client'

import * as React from 'react'

import Textarea from 'react-textarea-autosize'
import { ImagePart, TextPart, UserContent } from 'ai'
import chatToCampaignMapping from '@/lib/api/fasty-bot/helpers/campaign-id-list'
import { Button } from '@/components/ui/button'
import { IconArrowElbow, IconPlus, IconSpinner } from '@/components/ui/icons'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger
} from '@/components/ui/tooltip'
import { toast } from 'sonner'
import { useEnterSubmit } from '@/lib/hooks/use-enter-submit'
import { useParams } from 'next/navigation'
import { useAIState } from 'ai/rsc'
import { Message } from '@/lib/types'
import { getMimeType } from '@/lib/utils'

export interface PromtFormProps {
  onSendMessage: (message: string, userContent?: Array<TextPart | ImagePart>) => Promise<void>
}
const MAX_SIZE = 4 * 1024 * 1024;

export function PromptForm({
  onSendMessage
}: PromtFormProps) {
  const { id } = useParams()
  const { formRef, onKeyDown } = useEnterSubmit()
  const inputRef = React.useRef<HTMLTextAreaElement>(null)
  const [aiState] = useAIState()
  const [isDisabled, setIsDisabled] = React.useState(true)
  const [isHandling, setIsHandling] = React.useState(false)

  const fileInputRef = React.useRef<HTMLInputElement>(null)

  const [uploading, setUploading] = React.useState(false)

  const handleFileChange = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const files = event.target.files
    if (!files || files.length === 0) return
    let checkSize = true;
    Array.from(files).forEach(file => {
      if (file) {
        if (file.size >= MAX_SIZE) {
          checkSize = false
        }
      }
    })
    if (!checkSize) {
      toast.error(
        'This image is too big. Please use images which are smaller than 4MB.'
      )
      return
    }    

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

      const textPrompt = `I upload images with these urls: ${JSON.stringify(data.urls)}, at this time: ${new Date().getTime()}`
      const userContent: UserContent = [
        {
          type: 'text',
          text: textPrompt
        },
        ...imgMessages
      ]

      await onSendMessage(textPrompt, userContent)
      toast.success('Images uploaded successfully!')
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

        setIsHandling(true);
        await onSendMessage(value);
        console.log('handleing false')
        setIsHandling(false);
      }}
    >
      <div className="relative flex max-h-60 w-full grow flex-col overflow-hidden bg-background px-8 sm:rounded-md sm:border sm:px-12">
        <input
          ref={fileInputRef}
          style={{ display: 'none' }}
          type="file"
          multiple
          accept="image/png, image/jpeg"
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
          disabled={uploading || isHandling}
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
              <Button type="submit" size="icon" disabled={isDisabled || uploading || isHandling}>
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
