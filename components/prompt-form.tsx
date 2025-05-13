'use client'

import * as React from 'react'

import Textarea from 'react-textarea-autosize'
import { ImagePart, TextPart, FilePart, UserContent } from 'ai'
import chatToCampaignMapping from '@/lib/api/fasty-bot/helpers/campaign-id-list'
import { Button } from '@/components/ui/button'
import { IconArrowElbow, IconPlus, IconSpinner, IconChevronUpDown } from '@/components/ui/icons'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger
} from '@/components/ui/tooltip'
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { ProgressBar } from '@/components/ui/progress-bar'
import { toast } from 'sonner'
import { useEnterSubmit } from '@/lib/hooks/use-enter-submit'
import { useParams } from 'next/navigation'
import { useAIState } from 'ai/rsc'
import { Message } from '@/lib/types'
import { getMimeType } from '@/lib/utils'
import { 
  Dialog, 
  DialogTrigger, 
  DialogContent, 
  DialogHeader, 
  DialogTitle
} from '@/components/ui/dialog'
import { Zap, BarChart, PieChart, Download, DollarSign, Power, LifeBuoy, Plus, ChevronDown, ChevronRight } from 'lucide-react'
import { useUsageStore } from '@/app/store/useUsageStore'
import { UpgradeModal } from '@/components/upgrade-modal'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"

export interface PromtFormProps {
  onSendMessage: (message: string, userContent?: (TextPart | ImagePart | FilePart)[]) => Promise<void>
}
const MAX_IMAGE_SIZE = 4 * 1024 * 1024;
const MAX_VIDEO_SIZE = 1 * 1024 * 1024 * 1024;
const CHUNK_VIDEO_SIZE = 4 * 1024 * 1024;

interface QuickActionProps {
  icon: React.ReactNode;
  label: string;
  message: string;
  onAction: (message: string) => Promise<void>;
}

function QuickAction({ icon, label, message, onAction }: QuickActionProps) {
  return (
    <button 
      className="flex items-center gap-3 w-full p-3 text-left rounded-lg hover:bg-[#1E2336] transition-colors bg-[#151925] border border-[#2A2E3A]"
      onClick={() => onAction(message)}
    >
      <div className="flex-shrink-0 w-9 h-9 rounded-full bg-[#0A0C14] flex items-center justify-center">
        {icon}
      </div>
      <span className="text-white font-medium">{label}</span>
    </button>
  );
}

// Action List component that can be used both in the empty screen and in the collapsible
function ActionsList({ onSendMessage }: { onSendMessage: (message: string) => Promise<void> }) {
  const { 
    isMessageLimitReached, 
    messageCount,
    incrementMessageCount
  } = useUsageStore();
  
  const [showUpgradeModal, setShowUpgradeModal] = React.useState(false);
  
  const handleAction = async (message: string) => {
    // Check if message limit has been reached before sending
    if (isMessageLimitReached) {
      setShowUpgradeModal(true);
      return;
    }
    
    await onSendMessage(message);
    await incrementMessageCount();
  };
  
  const actions = [
    {
      title: 'Create a Campaign',
      description: 'I can help you set up a new advertising campaign.',
      icon: <Plus className="h-6 w-6 text-primary-green" />,
      prompt: 'I want to create a campaign'
    },
    {
      title: 'View Campaign Results',
      description: 'I can show you the performance metrics of your campaign.',
      icon: <BarChart className="h-6 w-6 text-primary-green" />,
      prompt: 'What are the results of my campaign for today?'
    },
    {
      title: 'Analyse Campaign Results',
      description: 'I can provide an analysis of your campaign\'s performance.',
      icon: <PieChart className="h-6 w-6 text-primary-green" />,
      prompt: 'Analyze my campaign performance'
    },
    {
      title: 'Download Leads',
      description: 'I can help you download leads from your campaign.',
      icon: <Download className="h-6 w-6 text-primary-green" />,
      prompt: 'I want to download leads from my campaign'
    },
    {
      title: 'Change Campaign Budget',
      description: 'I can assist in adjusting your campaign\'s budget.',
      icon: <DollarSign className="h-6 w-6 text-primary-green" />,
      prompt: 'I would like to change my campaign budget'
    },
    {
      title: 'Turn Campaigns On/Off',
      description: 'I can help you manage the status of your campaigns.',
      icon: <Power className="h-6 w-6 text-primary-green" />,
      prompt: 'I want to turn my campaign on/off'
    }
  ];
  
  return (
    <>
      <UpgradeModal 
        isOpen={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
        usageType="messages"
        currentCount={messageCount}
      />
      
      <div className="grid grid-cols-1 xs:grid-cols-2 md:grid-cols-3 gap-3">
        {actions.map((action, index) => (
          <div
            key={index}
            onClick={() => handleAction(action.prompt)}
            className="flex flex-col p-3 rounded-lg bg-[#1E2433] border border-[#2D3343] hover:border-primary-green active:bg-[#2D3343] active:border-primary-green transition-all cursor-pointer group"
          >
            <div className="flex items-center mb-2">
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-[#192133] flex items-center justify-center mr-2 text-primary-green group-hover:bg-primary-green/10">
                {action.icon}
              </div>
              <h3 className="font-medium text-white text-sm leading-tight">{action.title}</h3>
            </div>
            <p className="text-xs text-gray-400 mb-2">{action.description}</p>
            <div className="mt-auto text-primary-green text-xs font-medium flex items-center opacity-0 group-hover:opacity-100 group-active:opacity-100 transition-opacity">
              <span className="hidden sm:inline">Try this</span>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}

function QuickActionsDialog({ onSendMessage }: { onSendMessage: (message: string) => Promise<void> }) {
  const [open, setOpen] = React.useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = React.useState(false);
  
  // Get message limit status from usage store
  const { 
    isMessageLimitReached, 
    messageCount,
    incrementMessageCount
  } = useUsageStore();
  
  const handleAction = async (message: string) => {
    // Check if message limit has been reached before sending
    if (isMessageLimitReached) {
      setShowUpgradeModal(true);
      setOpen(false);
      return;
    }
    
    await onSendMessage(message);
    await incrementMessageCount();
    setOpen(false);
  };
  
  // Function to handle dialog open - show upgrade modal instead if at limit
  const handleDialogOpenChange = (newOpenState: boolean) => {
    if (newOpenState && isMessageLimitReached) {
      // If trying to open dialog but at message limit, show upgrade modal instead
      setShowUpgradeModal(true);
    } else {
      // Otherwise just toggle dialog state
      setOpen(newOpenState);
    }
  };
  
  return (
    <>
      {/* Upgrade Modal */}
      <UpgradeModal 
        isOpen={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
        usageType="messages"
        currentCount={messageCount}
      />
      
      <Dialog open={open} onOpenChange={handleDialogOpenChange}>
        <DialogTrigger asChild>
          <Button
            variant="outline"
            size="icon"
            className="absolute left-0 top-[14px] size-8 rounded-full bg-light-container border-border-dark p-0 sm:left-4 hover:bg-light-container/80 hover:border-border-dark/80 transition-colors"
          >
            <Zap className="size-4 text-primary-green" />
            <span className="sr-only">Quick Actions</span>
          </Button>
        </DialogTrigger>
        
        <DialogContent className="bg-[#1A1D29] border-[#2A2E3A] text-white">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold text-white">Quick Actions</DialogTitle>
          </DialogHeader>
          
          <div className="mt-4 grid gap-3">
            <QuickAction 
              icon={<Plus className="size-5 text-primary-green" />}
              label="Create a campaign" 
              message="I want to create a campaign" 
              onAction={handleAction}
            />
            <QuickAction 
              icon={<BarChart className="size-5 text-primary-green" />}
              label="View Campaign Results" 
              message="What are the results of my campaign?" 
              onAction={handleAction}
            />
            <QuickAction 
              icon={<PieChart className="size-5 text-primary-green" />}
              label="Analyse Campaign Results" 
              message="Analyse my campaign results in detail" 
              onAction={handleAction}
            />
            <QuickAction 
              icon={<Download className="size-5 text-primary-green" />}
              label="Download Leads of my Campaign" 
              message="I want to download leads from my campaign" 
              onAction={handleAction}
            />
            <QuickAction 
              icon={<DollarSign className="size-5 text-primary-green" />}
              label="Change my Campaign Budget" 
              message="I would like to change my campaign budget" 
              onAction={handleAction}
            />
            <QuickAction 
              icon={<Power className="size-5 text-primary-green" />}
              label="Turn my Campaign On/Off" 
              message="I want to turn my campaign on/off" 
              onAction={handleAction}
            />
            {/* Support action removed - now using Crisp chat in the navbar */}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

 interface ChunkUploadProps {
  file_size?: number;
  start_offset?: string;
  end_offset?: string;
  video_id?: string;
  upload_session_id?: string;
  success?: boolean;
}
interface ProgressBarProps {
  isShow: boolean;
  value: number;
}
export function PromptForm({
  onSendMessage
}: PromtFormProps) {
  const { id } = useParams()
  const { formRef, onKeyDown } = useEnterSubmit()
  const inputRef = React.useRef<HTMLTextAreaElement>(null)
  const [aiState] = useAIState()
  const [isDisabled, setIsDisabled] = React.useState(true)
  const [isHandling, setIsHandling] = React.useState(false)
  const [openUploadMenu, setOpenUploadMenu] = React.useState(false);
  const [videoUploadDataInfo, setVideoUploadDataInfo] = React.useState<ChunkUploadProps>({});
  const [isActionsOpen, setIsActionsOpen] = React.useState(false);

  // Usage limits state
  const { 
    fetchUsageData, 
    incrementMessageCount, 
    incrementImageCount, 
    incrementVideoCount,
    isMessageLimitReached,
    isImageLimitReached,
    isVideoLimitReached,
    messageCount
  } = useUsageStore()
  
  // Modal for upgrade prompt
  const [showUpgradeModal, setShowUpgradeModal] = React.useState(false)
  const [limitType, setLimitType] = React.useState<'messages' | 'images' | 'videos' | 'inpainting'>('messages')

  const [progressBar, setProgressBar] = React.useState<ProgressBarProps>({
    isShow: false,
    value: 0,
  })

  const imageInputRef = React.useRef<HTMLInputElement>(null)
  const videoInputRef = React.useRef<HTMLInputElement>(null)

  const [uploading, setUploading] = React.useState(false)
  
  // Fetch usage data on component mount
  React.useEffect(() => {
    fetchUsageData()
  }, [])

  const handleImageFileChange = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const files = event.target.files
    if (!files || files.length === 0) return
    if (files.length > 1) {
      toast.error(
        'You can select only 1 image a t time. Please select 1 image.'
      )
      return
    }
    
    // Check if image limit has been reached
    if (isImageLimitReached) {
      setLimitType('images')
      setShowUpgradeModal(true)
      return
    }
    
    let checkSize = true;
    Array.from(files).forEach(file => {
      if (file) {
        if (file.size >= MAX_IMAGE_SIZE) {
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
    formData.append('type', "image")

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
      const imgMessages = data.urls.map((url: string, idx: number) => {
        let objUrl = {
          type: 'image',
          image: url,
          uploaded_date: uploadedTime,
          idx,
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
        ...imgMessages,
      ];

      let count = 0;
      while (count < 3) {
        console.log('try', count + 1)
        try {
          await onSendMessage(textPrompt, userContent);
          break;
        } catch(e) {
          count++;
        }
        await new Promise(resolve => setTimeout(resolve, 2000));
      }

      console.log('userContent', userContent);
      // await onSendMessage(textPrompt, userContent);
      await incrementImageCount()
      toast.success('Images uploaded successfully!')
    } catch (error) {
      toast.error('Failed to upload the image. Please try again.')
    }

    setUploading(false)
  }
  const chunkUpload = async (formData: FormData) => {
    try {
      const response = await fetch('/api/upload-video', {
        method: 'POST',
        body: formData
      })
      if (!response.ok) {
        return false
      }
      const data = await response.json()
      return data
    } catch (error) {
      console.log('chunkUpload ~ error:', error)
      return false
    }
  }
  const handleVideoFileChange = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const files = event.target.files
    if (!files || files.length !== 1) return
    let file = files[0]
    
    // Check if video limit has been reached
    if (isVideoLimitReached) {
      setLimitType('videos')
      setShowUpgradeModal(true)
      return
    }

    if (file.size >= MAX_VIDEO_SIZE) {
      toast.error(
          'This video is too big. Please use videos which are smaller than 1GB.'
      )
      return
    }
    setProgressBar({
      isShow: true,
      value: 0
    })
    setVideoUploadDataInfo({});
    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      toast.info('Uploading your videos, please wait...')
      const totalChunks = Math.ceil(file.size / CHUNK_VIDEO_SIZE)
      const formDataStart = new FormData()
      formDataStart.append('file_size', file.size.toString())
      const uploadState = await chunkUpload(formDataStart)
      if (uploadState?.success) {
        let newUploadState: ChunkUploadProps = {
          ...uploadState.data,
          file_size: file.size.toString()
        }
        setVideoUploadDataInfo(newUploadState);
        for (let i = 0; i < totalChunks; i++) {
          const chunk = file.slice(
            i * CHUNK_VIDEO_SIZE,
            (i + 1) * CHUNK_VIDEO_SIZE
          )
          const formDataUpload = new FormData()
          formDataUpload.append('file', chunk)
          formDataUpload.append(
            'start_offset',
            newUploadState.start_offset || '0'
          )
          formDataUpload.append('finish', i === totalChunks - 1 ? '1' : '0')
          formDataUpload.append(
            'upload_session_id',
            newUploadState.upload_session_id || ''
          )
          const uploadState = await chunkUpload(formDataUpload)
          if (uploadState){
            newUploadState = { ...newUploadState, ...uploadState.data }
            setVideoUploadDataInfo(newUploadState);
          }
        }
        if (newUploadState?.success) {
          const uploadedTime = new Date().getTime()
          console.log('uploaded image ', newUploadState, uploadedTime)
          const textPrompt = `I upload video with these data: ${JSON.stringify({ video_id: newUploadState?.video_id, video: '', thumbnail: '' })}, at this time: ${new Date().getTime()}`
          const userContent: UserContent = [
            {
              type: 'text',
              text: textPrompt
            }
          ]

          await onSendMessage(textPrompt, userContent)
          await incrementVideoCount()
          toast.success('Videos uploaded successfully!')
        } else {
          toast.error('Failed to upload the video. Please try again.')
        }
      }else{
        toast.error('Failed to upload the video. Please try again.')
      }
    } catch (error) {
      toast.error('Failed to upload the video. Please try again.')
    }
    setProgressBar({
      isShow: false,
      value: 0
    })
    setUploading(false)
  }
  const handleImageButtonClick = () => {
    imageInputRef.current?.click()
    setOpenUploadMenu(!openUploadMenu)
  }
  const handleVideoButtonClick = () => {
    videoInputRef.current?.click()
    setOpenUploadMenu(!openUploadMenu)
  }
  //
  React.useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus()
    }
  }, []);
  
  // Add visual viewport height adjustment for mobile keyboards
  React.useEffect(() => {
    // Only needed for mobile devices
    if (typeof window === 'undefined' || window.innerWidth >= 768) return;
    
    // Function to adjust the view when the keyboard appears
    const handleVisualViewportResize = () => {
      const visualViewport = window.visualViewport;
      if (!visualViewport) return;
      
      // Get the form element
      const form = formRef.current;
      if (!form) return;
      
      // When keyboard is open, viewport height is reduced
      // Adjust the position of the form to be visible above the keyboard
      if (visualViewport.height < window.innerHeight * 0.8) {
        // Keyboard is open
        form.style.position = 'fixed';
        form.style.bottom = `${window.innerHeight - visualViewport.height - visualViewport.offsetTop}px`;
        
        // Create space for the last message by adding padding to ensure visibility
        const messagesContainer = document.getElementById('chat-messages-container');
        if (messagesContainer) {
          // Add padding to ensure content is pushed up enough to be visible above keyboard
          messagesContainer.setAttribute('style', 'padding-bottom: 180px');
          messagesContainer.classList.add('keyboard-open');
        }
        
        // Find the last AI message - use a more precise selector based on chat message structure
        const lastAIMessage = document.querySelector('.group.relative.mb-6.flex:last-child');
        if (lastAIMessage) {
          // Scroll the last message into view with some space above it
          setTimeout(() => {
            lastAIMessage.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }, 150);
        }
      } else {
        // Reset when keyboard is closed
        form.style.position = '';
        form.style.bottom = '';
        
        // Remove the extra padding when keyboard is closed
        const messagesContainer = document.getElementById('chat-messages-container');
        if (messagesContainer) {
          messagesContainer.removeAttribute('style');
          messagesContainer.classList.remove('keyboard-open');
        }
      }
    };

    // Add listener for viewport changes (keyboard opening/closing)
    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', handleVisualViewportResize);
      window.visualViewport.addEventListener('scroll', handleVisualViewportResize);
    }
    
    return () => {
      if (window.visualViewport) {
        window.visualViewport.removeEventListener('resize', handleVisualViewportResize);
        window.visualViewport.removeEventListener('scroll', handleVisualViewportResize);
      }
    };
  }, []);
  React.useEffect(() => {
    console.log("progressBar", progressBar);
  }, [progressBar]);
  React.useEffect(() => {
    console.log("videoUploadDataInfo", videoUploadDataInfo);
    if(videoUploadDataInfo){
      if(videoUploadDataInfo?.file_size && videoUploadDataInfo?.start_offset){
       const file_size = Number(videoUploadDataInfo?.file_size)
       const start_offset = Number(videoUploadDataInfo?.start_offset)
       const percent = Math.round(((start_offset / file_size) * 100));
       setProgressBar({
         isShow: videoUploadDataInfo?.success ? false : true,
         value: percent
       })
      }
    }
  }, [videoUploadDataInfo])
  

  const isTextareaDisabled = uploading || isHandling;
  React.useEffect(() => {
    if (inputRef.current && !isTextareaDisabled) {
      inputRef.current.focus()
    }
  }, [isTextareaDisabled]);

  return (
    <>
      {/* Upgrade Modal for main form */}
      <UpgradeModal 
        isOpen={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
        usageType={limitType}
        currentCount={limitType === 'messages' ? messageCount : 0}
      />
      
      {/* Actions Collapsible */}
      <Collapsible
        open={isActionsOpen}
        onOpenChange={setIsActionsOpen}
        className="w-full mb-2"
      >
        <div className="flex justify-between items-center mb-1">
          <CollapsibleTrigger asChild>
            <Button 
              variant="ghost" 
              size="sm" 
              className="p-1 h-8 flex items-center justify-center gap-1 text-primary-green hover:bg-[#1E2336]/20 hover:text-primary-green"
            >
              {isActionsOpen ? 
                <ChevronDown className="h-5 w-5" /> : 
                <ChevronRight className="h-5 w-5" />
              }
              <span className="text-sm font-medium">View list of supported actions</span>
            </Button>
          </CollapsibleTrigger>
        </div>
        
        <CollapsibleContent className="overflow-hidden transition-all data-[state=closed]:animate-collapsible-up data-[state=open]:animate-collapsible-down">
          <div className="rounded-lg p-3 sm:p-4 bg-[#0D1117] border border-[#1E2433] mb-2">
            <ActionsList onSendMessage={onSendMessage} />
          </div>
        </CollapsibleContent>
      </Collapsible>
      
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
        
        // Check if message limit reached
        if (isMessageLimitReached) {
          setLimitType('messages')
          setShowUpgradeModal(true)
          return
        }

        setIsHandling(true)
        await onSendMessage(value)
        await incrementMessageCount()
        setIsHandling(false)
      }}
    >
      {progressBar.isShow && <ProgressBar value={progressBar.value} max={100} width="w-full" height="h-[2px]" color="bg-gray-500"/>}
      <div className="relative flex max-h-60 w-full grow flex-col overflow-hidden bg-container-bg border border-border-dark px-2 sm:rounded-xl sm:px-4 shadow-sm">
        <input
          ref={imageInputRef}
          style={{ display: 'none' }}
          type="file"
          accept="image/png, image/jpeg"
          onChange={handleImageFileChange}
        />
        <input
          ref={videoInputRef}
          style={{ display: 'none' }}
          type="file"
          multiple
          accept="video/*"
          onChange={handleVideoFileChange}
        />
        {/* Hidden Upload Button */}
        <Popover open={openUploadMenu} onOpenChange={setOpenUploadMenu}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              size="icon"
              className="absolute left-0 top-[14px] size-8 rounded-full bg-light-container border-border-dark p-0 sm:left-4 hover:bg-light-container/80 hover:border-border-dark/80 transition-colors hidden"
              disabled={uploading}
              onClick={() => setOpenUploadMenu(!openUploadMenu)}
            >
              {uploading ? <IconSpinner className="text-primary-green" /> : <IconPlus className="text-primary-green" />}
              <span className="sr-only">Upload</span>
            </Button>
          </PopoverTrigger>
          <PopoverContent side="top" className="bg-container-bg border border-border-dark shadow-lg">
            <div className="w-full my-2">
              <Button
                variant="outline"
                size="icon"
                className="w-full border-0 px-4 shadow-none text-text-white hover:bg-light-container transition-colors"
                onClick={handleImageButtonClick}
                disabled={uploading}
              >
                Images
              </Button>
            </div>
            <div className="w-full my-2">
              <Button
                onClick={handleVideoButtonClick}
                variant="outline"
                size="icon"
                className="w-full border-0 px-4 shadow-none text-text-white hover:bg-light-container transition-colors"
              >
                Videos
              </Button>
            </div>
          </PopoverContent>
        </Popover>
        
        {/* Quick Actions Button - Hidden */}
        <Textarea
          ref={inputRef}
          disabled={isTextareaDisabled}
          tabIndex={0}
          onKeyDown={onKeyDown}
          placeholder="Send a message."
          className="min-h-[60px] w-full resize-none bg-transparent pl-0 pr-12 py-[1.3rem] focus-within:outline-none sm:text-sm text-text-white placeholder:text-text-light-gray"
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
              <Button
                type="submit"
                size="icon"
                className="bg-primary-green hover:bg-primary-green/90 text-deep-black transition-colors"
                disabled={isDisabled || uploading || isHandling}
              >
                <IconArrowElbow className="text-deep-black" />
                <span className="sr-only">Send message</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent className="bg-container-bg border border-border-dark text-text-white">Send message</TooltipContent>
          </Tooltip>
        </div>
      </div>
    </form>
    </>
  )
}