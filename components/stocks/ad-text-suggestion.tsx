'use client'

import { CampaignContext } from '@/components/contexts/campaign-context'
import { Separator } from '@/components/ui/separator'
import { Fragment, useContext, useState } from 'react'
import { toast } from 'sonner'
import { IconSpinner } from '@/components/ui/icons'
import { useActions, useAIState, useUIState } from 'ai/rsc'
import { sleep, cn } from '@/lib/utils'
import type { AI } from '@/lib/chat/actions'
import { AdText } from '@/lib/types'
import { generateAdTemplate, generateAdsetTemplate } from '@/lib/data'
import { updateAdText, updateAdTextWithFbId } from '@/app/actions'
import { useParams } from 'next/navigation'
import { readStreamableValue } from 'ai/rsc'
import { Card, CardContent } from '@/components/ui/card'
import { Pencil, Check, X, AlertCircle } from 'lucide-react'
import Image from 'next/image'

interface SuggestedText extends Omit<AdText, 'headline'> {
  headline?: string;
}

export interface ImageSuggestionProps {
  suggestedTexts: SuggestedText[];
}

export function AdTextItem({
  index,
  adText,
  acceptText,
  updateText
}: {
  index: number
  adText: AdText
  acceptText?: (idx: number, adText: AdText) => Promise<void>
  updateText?: (idx: number, adText: AdText, newAdText: AdText) => void
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
    toast.success('Ad text added to your campaign successfully!')
  }

  const handleSave = async () => {
    setIsUpdating(true)
    await sleep(1000)
    if (updateText) {
      updateText(index, adText, { ...adText, text: textEdit, headline: headlineEdit })
    }
    setIsEditing(false)
    setIsUpdating(false)
    toast.success('Ad text added to your campaign successfully!')
  }

  return (
    <Card className="bg-zinc-900 border-zinc-800 overflow-hidden">
      <CardContent className="p-0">
        <div className="flex flex-col md:flex-row">
          <div className="w-full md:w-72 relative aspect-video md:aspect-square">
            <Image
              src={adText.image as string}
              alt="Ad preview"
              className="object-cover"
              fill
              sizes="(max-width: 768px) 100vw, 288px"
              priority
            />
          </div>
          
          <div className="flex-1 p-6">
            {hasFbAd && (
              <div className="flex items-center gap-2 mb-4 p-3 bg-blue-900/20 text-blue-200 rounded-lg border border-blue-800">
                <AlertCircle className="size-5 shrink-0" />
                <span className="text-sm">
                  Ad already created with ID: {adText.fbAdId}
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
                placeholder="Enter headline"
              />
            ) : (
              <h3 className="text-xl font-semibold text-zinc-200 mb-4 text-center">
                {adText.headline || `Suggested Ad Text ${index + 1}`}
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
                placeholder="Enter ad text"
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

export function AdTextSuggestion({ props }: { props: ImageSuggestionProps[] }) {
  const { id: chatSlug } = useParams()
  const { campaign } = useContext(CampaignContext)
  const { submitUserMessage } = useActions()

  const [adTexts, setAdTexts] = useState<AdText[]>(
    props.reduce((result, items) => [...result,  ...items.suggestedTexts], [] as SuggestedText[])
      .reduce((result, adText) => {
        if (adText.text?.includes('Version')) {
          const segments = adText.text?.split('"')
          const adText1Headline = segments[0]?.split(':')?.[1]?.trim()
          const adText1Content = segments[1]
          return [...result, {
            ...adText,
            headline: adText1Headline ?? 'Headline',
            text: adText1Content
          }]
        }
        return [...result, {
          ...adText,
          headline: adText.headline ?? 'Headline',
        }]
      }, [] as AdText[])
  )
  const { confirmCreateAd } = useActions()
  const [, setMessages] = useUIState<typeof AI>()

  const acceptText = async (idx: number, adText: AdText) => {
    const response = await confirmCreateAd(
      campaign,
      generateAdTemplate(
        adText.headline,
        adText.text,
        adText.image
      ),
      generateAdsetTemplate()
    )
    setMessages(currentMessages => [...currentMessages, response.newMessage])

    for await (const fbAdId of readStreamableValue(response.fbAdIdStream)) {
      await updateAdTextWithFbId(chatSlug as string, idx, adText.id, fbAdId as string)
      setAdTexts(
        adTexts.map((adText: AdText, index: number) => {
          if (index === idx) return {
            ...adText,
            fbAdId: fbAdId as string
          }
          return adText
        })
      )
      
      // After successful ad creation, trigger AI message
      const aiMessage = await submitUserMessage(
        "Great! Now that your ad creative is set up, let's create a lead form to collect information from potential customers. Would you like me to guide you through setting up the form? 📝",
        [],
        true
      )
      setMessages(currentMessages => [...currentMessages, aiMessage])
    }
  }

  const updateText = async (idx: number, adText: AdText, newAdText: AdText) => {
    setAdTexts(
      adTexts.map((adText: AdText, index: number) => {
        if (index === idx) return newAdText
        return adText
      })
    )
    await updateAdText(chatSlug as string, idx, adText.id, newAdText)
  }

  return (
    <div className="space-y-6 py-4">
      {adTexts.map((adText, index) => (
        <AdTextItem
          key={`${adText.date}${index}`}
          index={index}
          adText={adText}
          acceptText={acceptText}
          updateText={updateText}
        />
      ))}
    </div>
  )
}

export default AdTextSuggestion