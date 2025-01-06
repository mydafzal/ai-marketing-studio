'use client'

import { CampaignContext } from '@/components/contexts/campaign-context'
import { useContext, useState, useEffect } from 'react'
import { TextPart } from 'ai'
import { toast } from 'sonner'
import { IconSpinner } from '@/components/ui/icons'
import { useActions, useAIState, useUIState } from 'ai/rsc'
import { sleep, cn } from '@/lib/utils'
import type { AI } from '@/lib/chat/actions'
import { VideoAdText, Message } from '@/lib/types'
import { generateVideoAdTemplate, generateAdsetTemplate } from '@/lib/data'
import { updateAdText, updateAdTextWithFbId } from '@/app/actions'
import { useParams } from 'next/navigation'
import { readStreamableValue } from 'ai/rsc'
import { VideoPlayer } from './video-player'
import { getVideoDetail } from '@/lib/api/fasty-bot/get-video-detail'
import { Card, CardContent } from '@/components/ui/card'
import { Pencil, Check, X, AlertCircle, Video } from 'lucide-react'

export interface VideoSuggestionProps {
  videos: {
    suggestedTexts: VideoAdText[]
  }[]
}

export function VideoAdTextItem({
  index,
  adText,
  acceptText,
  updateText
}: {
  index: number
  adText: VideoAdText
  acceptText?: (idx: number, adText: VideoAdText) => Promise<void>
  updateText?: (idx: number, adText: VideoAdText, newAdText: VideoAdText) => void
}) {
  const [isUpdating, setIsUpdating] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [textEdit, setTextEdit] = useState(adText.text)
  const [headlineEdit, setHeadlineEdit] = useState(adText.headline)
  const hasFbAd = !!adText.fbAdId

  const handleAccept = async () => {
    setIsUpdating(true)
    await sleep(1000)
    if (acceptText) {
      await acceptText(index, adText)
    }
    setIsUpdating(false)
    toast.success('Video ad text added to your campaign successfully!')
  }

  const handleSave = async () => {
    setIsUpdating(true)
    await sleep(1000)
    if (updateText) {
      updateText(index, adText, {
        ...adText,
        text: textEdit,
        headline: headlineEdit
      })
    }
    setIsEditing(false)
    setIsUpdating(false)
    toast.success('Video ad text updated successfully!')
  }

  return (
    <Card className="bg-zinc-900 border-zinc-800 overflow-hidden">
      <CardContent className="p-0">
        <div className="flex flex-col md:flex-row">
          <div className="w-full md:w-80 relative aspect-video">
            {adText.video ? (
              <VideoPlayer src={adText.video} />
            ) : (
              <div className="size-full flex items-center justify-center bg-zinc-800">
                <div className="text-center">
                  <Video className="size-8 text-zinc-400 mx-auto mb-2" />
                  <span className="text-sm text-zinc-500">Processing video...</span>
                </div>
              </div>
            )}
          </div>
          
          <div className="flex-1 p-6">
            {hasFbAd && (
              <div className="flex items-center gap-2 mb-4 p-3 bg-blue-900/20 text-blue-200 rounded-lg border border-blue-800">
                <AlertCircle className="size-5 shrink-0" />
                <span className="text-sm">
                  Video ad already created with ID: {adText.fbAdId}
                </span>
              </div>
            )}

            {!hasFbAd && isEditing ? (
              <input
                value={headlineEdit}
                onChange={e => setHeadlineEdit(e.target.value)}
                className={cn(
                  "w-full text-center font-semibold mb-4 p-2",
                  "bg-zinc-800 border border-zinc-700 rounded-lg",
                  "text-zinc-200 placeholder:text-zinc-400",
                  "focus:outline-none focus:ring-2 focus:ring-blue-500"
                )}
                placeholder="Enter video headline"
              />
            ) : (
              <h3 className="text-xl font-semibold text-zinc-200 mb-4 text-center">
                {adText.headline || `Suggested Video Ad ${index + 1}`}
              </h3>
            )}

            {!hasFbAd && isEditing ? (
              <textarea
                className={cn(
                  "w-full min-h-[120px] p-3",
                  "bg-zinc-800 border border-zinc-700 rounded-lg",
                  "text-zinc-200 placeholder:text-zinc-400 text-sm",
                  "focus:outline-none focus:ring-2 focus:ring-blue-500"
                )}
                value={textEdit}
                onChange={e => setTextEdit(e.target.value)}
                placeholder="Enter video ad text"
              />
            ) : (
              <p className="text-zinc-300 text-sm leading-relaxed">
                {adText.text}
              </p>
            )}

            {!hasFbAd && (
              <div className="flex justify-end gap-3 mt-6">
                {isEditing ? (
                  <>
                    <button
                      onClick={() => {
                        setIsEditing(false)
                        setTextEdit(adText.text)
                        setHeadlineEdit(adText.headline)
                      }}
                      className={cn(
                        "flex items-center gap-2 px-4 h-10",
                        "text-zinc-200 text-sm font-medium rounded-lg",
                        "bg-zinc-800 hover:bg-zinc-700 border border-zinc-700",
                        "transition-colors duration-200"
                      )}
                    >
                      <X className="size-4" />
                      Cancel
                    </button>
                    <button
                      onClick={handleSave}
                      disabled={isUpdating}
                      className={cn(
                        "flex items-center gap-2 px-4 h-10",
                        "text-white text-sm font-medium rounded-lg",
                        "bg-blue-600 hover:bg-blue-700",
                        "transition-colors duration-200",
                        "disabled:opacity-50 disabled:cursor-not-allowed"
                      )}
                    >
                      {isUpdating ? (
                        <IconSpinner className="size-4" />
                      ) : (
                        <Check className="size-4" />
                      )}
                      Save Changes
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={() => setIsEditing(true)}
                      className={cn(
                        "flex items-center gap-2 px-4 h-10",
                        "text-zinc-200 text-sm font-medium rounded-lg",
                        "bg-zinc-800 hover:bg-zinc-700 border border-zinc-700",
                        "transition-colors duration-200"
                      )}
                    >
                      <Pencil className="size-4" />
                      Edit
                    </button>
                    <button
                      onClick={handleAccept}
                      disabled={isUpdating || !adText?.video}
                      className={cn(
                        "flex items-center gap-2 px-4 h-10",
                        "text-white text-sm font-medium rounded-lg",
                        "bg-blue-600 hover:bg-blue-700",
                        "transition-colors duration-200",
                        "disabled:opacity-50 disabled:cursor-not-allowed"
                      )}
                    >
                      {isUpdating ? (
                        <IconSpinner className="size-4" />
                      ) : (
                        <Check className="size-4" />
                      )}
                      Accept
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export function VideoAdTextSuggestion({ videos }: VideoSuggestionProps) {
  const { campaign } = useContext(CampaignContext)
  const { syncMessages } = useActions()
  const [aiState, setAIState] = useAIState()
  const { id: chatSlug } = useParams()
  const [isProcessing, setIsProcessing] = useState<boolean>(true)
  const { confirmCreateAd } = useActions()
  const [, setMessages] = useUIState<typeof AI>()

  const [adTexts, setAdTexts] = useState<VideoAdText[]>(
    videos
      .reduce(
        (result, item) => [...result, ...item.suggestedTexts],
        [] as VideoAdText[]
      )
      .reduce((result, adText) => {
        if (adText.text?.includes('Version 1:')) {
          const segments = adText.text?.split('"')
          const adText1Headline = segments[0]?.split(':')?.[1]?.trim()
          const adText1Content = segments[1]
          return [
            ...result,
            {
              ...adText,
              headline: adText1Headline,
              text: adText1Content
            }
          ]
        }
        return [...result, adText]
      }, [] as VideoAdText[])
  )

  const checkVideoStatus = async (video_id: string) => {
    const response = await getVideoDetail(video_id);
    if (response && response?.source) {
      setAIState({
        ...aiState,
        messages: [
          ...aiState.messages.map((message: Message) => {
            if (message.role === 'tool') {
              const content = message.content[0]
              if (
                content.type === 'tool-result' &&
                content.toolName === 'showVideoAdTextSuggestion'
              ) {
                let result = content.result as { videos: any[] }
                content.result = {
                  ...(content.result as Object),
                  videos: [
                    ...result.videos.map(video => {
                      return {
                        ...video,
                        suggestedTexts: [
                          ...video.suggestedTexts.map((suggestedText: any) => {
                            return { ...suggestedText, video: response?.source, thumbnail: response.thumbnails?.data[0].uri as string }
                          })
                        ]
                      }
                    })
                  ]
                }
              }
            }
            if(message.role === 'user'){
              let content = message.content[0] as TextPart
              if(typeof content === 'object' && content.type==="text" && content.text.includes('I upload video with these data:')){
                let video_data = JSON.parse(`{${(content).text?.split('{')[1]?.split('}')[0]}}`);
                video_data = {
                  ...video_data,
                  video: response?.source,
                  thumbnail: response.thumbnails?.data[0].uri as string
                };
                content.text = `${content.text?.split('{')[0]}${JSON.stringify(video_data)}${content.text?.split('}')[1]}`;
              }
            }
            return message
          })
        ]
      })
      
      setAdTexts((adTexts: VideoAdText[]) => {
        return adTexts.map(adText => ({
          ...adText,
          video: response.source as string,
          thumbnail: response.thumbnails?.data[0].uri as string
        }))
      })
      
      await syncMessages()
      setIsProcessing(false)
    }
  }

  useEffect(() => {
    let interval: NodeJS.Timeout | undefined
    if (!videos[0].suggestedTexts[0].video && isProcessing) {
      interval = setInterval(() => {
        checkVideoStatus(videos[0].suggestedTexts[0].video_id)
      }, 15000)
    }

    return () => interval && clearInterval(interval)
  }, [videos, isProcessing])

  const acceptText = async (idx: number, adText: VideoAdText) => {
    const response = await confirmCreateAd(
      campaign,
      generateVideoAdTemplate(adText.headline, adText.text, adText),
      generateAdsetTemplate()
    )
    setMessages(currentMessages => [...currentMessages, response.newMessage])

    for await (const fbAdId of readStreamableValue(response.fbAdIdStream)) {
      await updateAdTextWithFbId(
        chatSlug as string,
        idx,
        adText.id,
        fbAdId as string,
        'showVideoAdTextSuggestion'
      )
      setAdTexts(
        adTexts.map((adText: VideoAdText, index: number) => {
          if (index === idx)
            return {
              ...adText,
              fbAdId: fbAdId as string
            }
          return adText
        })
      )
    }
  }

  const updateText = async (
    idx: number,
    adText: VideoAdText,
    newAdText: VideoAdText
  ) => {
    setAdTexts(
      adTexts.map((adText: VideoAdText, index: number) => {
        if (index === idx) return newAdText
        return adText
      })
    )
    await updateAdText(
      chatSlug as string,
      idx,
      adText.id,
      newAdText,
      'showVideoAdTextSuggestion'
    )
  }

  return (
    <div className="space-y-6 py-4">
      {adTexts.map((adText, index) => (
        <VideoAdTextItem
          key={`${adText.date}${index}${adText.video}`}
          index={index}
          adText={adText}
          acceptText={acceptText}
          updateText={updateText}
        />
      ))}
    </div>
  )
}

export default VideoAdTextSuggestion