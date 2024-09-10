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

const containsTitleAndDescription = (text: string): boolean => {
  const hasTitle = text.toLowerCase().includes('title:')
  const hasDescription = text.toLowerCase().includes('description:')
  return hasTitle && hasDescription
}

export function PromptForm() {
  const { id } = useParams()
  const { formRef, onKeyDown } = useEnterSubmit()
  const inputRef = React.useRef<HTMLTextAreaElement>(null)
  const { submitUserMessage } = useActions()
  const [_, setMessages] = useUIState<typeof AI>()
  const [aiState, setAIState] = useAIState()
  const [isDisabled, setIsDisabled] = React.useState(true)
  const fileInputRef = React.useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = React.useState(false)
  const [urls, setUrls] = React.useState<string[]>([])

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
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
    let imageIdx = -1
    const images: ImagePart[] = []
    imageMes.forEach((msg: Message) => {
      if (Array.isArray(msg.content)) {
        msg.content.forEach(item => {
          if (item.type === 'image') {
            images.push(item);
            imageIdx++;
          }
        });
      }
    });

    toast.info('Uploading your images, please wait...')
    try {
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      })

      const data = await response.json()
      if (response.ok) {
        toast.success('Images uploaded successfully!');
        setUrls(data.urls)
        const textPrompt = ''
        const uploadedDate = new Date().getTime(); 
        const imgMessages = data.urls.map((url: string) => {
          imageIdx++;
          return {
            type: 'image',
            image: url,
            uploaded_date: uploadedDate,
            idx: imageIdx,
            mimeType: getMimeType(url)
          }
        })

        const messageContent: UserContent = [
          {
            type: 'text',
            text: textPrompt
          },
          ...imgMessages
        ]

        setMessages(currentMessages => [
          ...currentMessages,
          {
            id: nanoid(),
            display: <UserMessage userContent={messageContent}>{textPrompt}</UserMessage>,
            timestamp: new Date().toISOString() 
          }
        ])

        const responseMessage = await submitUserMessage(textPrompt, messageContent);
        
        const completeResponseMessage = {
          ...responseMessage,
          timestamp: new Date().toISOString() 
        };

        const imagesLinks = {
          id: nanoid(),
          role: 'system',
          content: `Knowledge Base: urls of the uploaded images: ${JSON.stringify(imgMessages.map((img: { image: any; }) => img.image))}, uploaded time is ${new Date().toISOString()}`,
          timestamp: new Date().toISOString() 
        };

        setMessages(currentMessages => [
          ...currentMessages,
          completeResponseMessage, 
          imagesLinks 
        ]);
      } else {
        toast.error('Failed to upload the image. Please try again.');
      }
    } catch (error) {
      toast.error('Failed to upload the image. Please try again.');
    }

    setUploading(false);
  };

  const handleButtonClick = () => {
    fileInputRef.current?.click();
  };

  React.useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  React.useEffect(() => {
    function eventListener(e: CustomEvent) {
      const adText = e.detail;
      if (inputRef.current) {
        inputRef.current.value = `Title:\n${adText.headline}\n\nDescription:\n${adText.text}`;
      }
      setIsDisabled(false);
    }
    window.addEventListener("adjust-adtext", eventListener as EventListener);

    return () => {
      window.removeEventListener("adjust-adtext", eventListener as EventListener);
    };
  }, []);

  return (
    <form
      ref={formRef}
      onSubmit={async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        if (window.innerWidth < 600) {
          e.currentTarget['message']?.blur();
        }

        const value = inputRef.current?.value.trim();
        if (inputRef.current) {
          inputRef.current.value = '';
          setIsDisabled(true);
        }
        if (!value) return;

        if (containsTitleAndDescription(value)) {
          setAIState({
            ...aiState,
            messages: [
              ...aiState.messages,
              {
                id: nanoid(),
                role: 'system',
                content: `The user has accepted this text as campaign title and campaign description: ${value}`
              }
            ]
          });
        }

        setMessages(currentMessages => [
          ...currentMessages,
          {
            id: nanoid(),
            display: <UserMessage>{value}</UserMessage>,
            timestamp: new Date().toISOString()
          }
        ]);

        const responseMessage = await submitUserMessage(value);

        const completeResponseMessage = {
          ...responseMessage,
          timestamp: new Date().toISOString() 
        };

        setMessages(currentMessages => [
          ...currentMessages,
          completeResponseMessage 
        ]);
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
          onChange={(e) => { setIsDisabled(!e.target.value); }}
        />
        <div className="py-2" />
      </div>
    </form>
  );
}
