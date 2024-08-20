'use client'

import { useState, useEffect } from 'react'
import { nanoid } from 'nanoid'
import { toast } from 'sonner'
import Image from 'next/image'
import { IconSpinner } from '@/components/ui/icons'
import { AdTextSelectionSkeleton } from '@/components/stocks/ad-text-selection-skeleton'
import { useAIState } from 'ai/rsc'
import { sleep } from '@/lib/utils'
import { ImagePart } from 'ai'
import { Message } from '@/lib/types'

export interface AdText {
  image?: string
  date: string
  text: string
  headline?: string // Make headline optional
}
export interface ImageSuggestionProps {
  suggestedTexts: AdText[]
}

export function AdTextItem({
  index,
  adText,
  acceptText,
  updateText
}: {
  index: number
  adText: AdText
  acceptText: (adText: AdText) => void
  updateText: (idx: number, adText: AdText, newAdText: AdText) => void
}) {
  // const [isEditing, setIsEditing] = useState(false)
  const [isUpdating, setIsUpdating] = useState(false)

  const [textEdit, setTextEdit] = useState(adText.text)
  const handleSave = async () => {
    setIsUpdating(true)
    await sleep(1000)
    updateText(index, adText, { ...adText, text: textEdit })
    // setIsEditing(false)
    setIsUpdating(false)
    toast.success('Ad text added to your campaign successfully!')
  }
  const handleAccept = async () => {
    setIsUpdating(true)
    await sleep(1000)
    acceptText(adText)
    setIsUpdating(false)
    toast.success('Ad text added to your campaign successfully!')
  }

  const emitAdjustEvent = () => {
    const event = new CustomEvent("adjust-adtext", {
      detail: adText
    })
    window.dispatchEvent(event)
  }

  return (
    <>
      <div className="flex">
        <div className="flex-none w-72 h-[200px] relative">
          <img
            src={adText.image as string}
            alt=""
            className="absolute inset-0 w-full h-full object-cover "
            loading="lazy"
          />
        </div>
        <div className="flex-auto p-6">
          <h6 className="block text-center font-sans text-lg mb-5 antialiased font-semibold leading-relaxed tracking-normal text-blue-gray-900">
            {adText.headline || `Suggested Ad Text ${index + 1}`}
          </h6>
          <p className="block font-sans text-sm antialiased font-normal leading-normal text-gray-700 dark:text-gray-100">
            {adText.text}
          </p>
          <div className="flex mt-4 space-x-4 mb-5">
            <div className="text-center w-full space-x-4 pr-4">
              <button
                onClick={() => emitAdjustEvent()}
                className="px-3 mr-2 py-2 text-xs font-medium text-center text-white bg-gray-700 rounded-lg hover:bg-gray-800 focus:ring-4 focus:outline-none focus:ring-gray-300 dark:bg-gray-600 dark:hover:bg-gray-700 dark:focus:ring-gray-800"
              >
                Adjust
              </button>
              <button
                onClick={handleAccept}
                className="px-3 py-2 text-xs inline-block align-middle font-medium text-center text-white bg-gray-700 rounded-lg hover:bg-gray-800 focus:ring-4 focus:outline-none focus:ring-gray-300 dark:bg-gray-600 dark:hover:bg-gray-700 dark:focus:ring-gray-800"
              >
                {isUpdating && <IconSpinner />}
                {!isUpdating && 'Accept'}
              </button>
            </div>
          </div>
          {/* {isEditing && (
            <>
              <h6 className="block text-center font-sans text-base antialiased font-semibold leading-relaxed tracking-normal text-blue-gray-900">
                {adText.headline || `Suggested Ad Text ${index + 1}`}
              </h6>
              <textarea
                className="block mt-2 w-full p-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={textEdit}
                onChange={e => setTextEdit(e.target.value)}
              />
              <div className="flex mt-4 space-x-4 mb-5">
                <div className="flex-auto flex space-x-4 pr-4">
                  <button
                    onClick={() => {
                      setIsEditing(false)
                      setTextEdit(adText.text)
                    }}
                    className="px-3 mr-5 py-2 text-xs font-medium text-center text-white bg-gray-700 rounded-lg hover:bg-gray-800 focus:ring-4 focus:outline-none focus:ring-gray-300 dark:bg-gray-600 dark:hover:bg-gray-700 dark:focus:ring-gray-800"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSave}
                    aria-disabled={isUpdating}
                    className="px-3 py-2 text-xs inline-block align-middle font-medium text-center text-white bg-gray-700 rounded-lg hover:bg-gray-800 focus:ring-4 focus:outline-none focus:ring-gray-300 dark:bg-gray-600 dark:hover:bg-gray-700 dark:focus:ring-gray-800"
                  >
                    {isUpdating && <IconSpinner />}
                    {!isUpdating && 'Save & Accept'}
                  </button>
                </div>
              </div>
            </>
          )} */}
        </div>
      </div>
    </>
  )
}

export function AdTextSuggestion({ props }: { props: ImageSuggestionProps[] }) {
  const [loading, setLoading] = useState(false)
  const [adTexts, setAdTexts] = useState<AdText[]>(
    props.map(items => {
      return { ...items.suggestedTexts[0] }
    })
  )

  const [aiState, setAIState] = useAIState()

  const imageMes = aiState.messages.filter(
    (msg: Message) =>
      Array.isArray(msg.content) &&
      msg.content.some(item => item.type === 'image')
  )
  type ImagePartNew = Partial<ImagePart> & {
    uploaded_date?: number
  }

  const images: ImagePartNew[] = []
  imageMes.map((msg: Message) => {
    if (Array.isArray(msg.content))
      msg.content.map(item => {
        if (item.type === 'image') images.push(item)
      })
  })

  let items = images
    .filter(a => a.uploaded_date)
    .sort((a, b) => (b.uploaded_date || 0) - (a.uploaded_date || 0))
  const maxUploadedTime = items[0].uploaded_date

  const latestItems = items.filter(
    item => item.uploaded_date === maxUploadedTime
  )

  if (loading) {
    return <AdTextSelectionSkeleton />
  }

  const acceptText = (adText: AdText) => {
    setAIState({
      ...aiState,
      messages: [
        ...aiState.messages,
        {
          id: nanoid(),
          role: 'system',
          content: `The user has accepted this text as campaign content: ${JSON.stringify(adText)}`
        }
      ]
    })
  }
  const updateText = (idx: number, adText: AdText, newAdText: AdText) => {
    setAdTexts(
      adTexts.map((adText: AdText, index: number) => {
        if (index === idx) return newAdText
        return adText
      })
    )
    setAIState({
      ...aiState,
      messages: [
        ...aiState.messages,
        {
          id: nanoid(),
          role: 'system',
          content: `The user updated the ad text suggestion from: ${JSON.stringify(adText)} to : ${JSON.stringify(newAdText)}.`
        },
        {
          id: nanoid(),
          role: 'system',
          content: `The user has accepted this text as campaign content: ${JSON.stringify(newAdText)}`
        }
      ]
    })
  }
  return (
    <div className="-mt-2 flex w-full flex-col gap-4 py-4">
      {adTexts.map((adText, index) => (
        <div
          key={index}
          className={`flex shrink-0 flex-col gap-2 rounded-lg p-4 dark:bg-zinc-800 bg-light-800`}
        >
          <AdTextItem
            index={index}
            adText={{
              ...adText,
              image: (latestItems[index]?.image as string) || ''
            }}
            acceptText={acceptText}
            updateText={updateText}
          />
        </div>
      ))}
    </div>
  )
}

export default AdTextSuggestion
