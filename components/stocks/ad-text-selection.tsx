'use client'

import { useState } from 'react'
import { nanoid } from 'nanoid'
import { toast } from 'sonner'
import { IconSpinner } from '@/components/ui/icons'
import { AdTextSelectionSkeleton } from '@/components/stocks/ad-text-selection-skeleton'
import { useAIState } from 'ai/rsc'
import { sleep } from '@/lib/utils'

export interface AdText {
  date: string
  text: string
  headline?: string // Make headline optional
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
  const [isEditing, setIsEditing] = useState(false)
  const [isUpdating, setIsUpdating] = useState(false)

  const [textEdit, setTextEdit] = useState(adText.text)
  const handleSave = async () => {
    setIsUpdating(true)
    await sleep(1000)
    updateText(index, adText, { ...adText, text: textEdit })
    setIsEditing(false)
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
  return (
    <>
      {!isEditing && (
        <>
          <div className="text-xs text-zinc-400">{adText.date}</div>
          <div className="flex items-center justify-between">
            <div className="text-lg font-bold text-zinc-200">
              {adText.headline || `Suggested Ad Text ${index + 1}`}
            </div>
          </div>
          <div className="text-zinc-400">{adText.text}</div>
          <div className="text-left mt-3">
            <button
              onClick={() => setIsEditing(true)}
              className="px-3 mr-5 py-2 text-xs font-medium text-center text-white bg-gray-700 rounded-lg hover:bg-gray-800 focus:ring-4 focus:outline-none focus:ring-gray-300 dark:bg-gray-600 dark:hover:bg-gray-700 dark:focus:ring-gray-800"
            >
              Adjust
            </button>
            <button
              onClick={handleAccept}
              className="px-3 py-2 text-xs inline-block align-middle font-medium text-center text-white bg-gray-700 rounded-lg hover:bg-gray-800 focus:ring-4 focus:outline-none focus:ring-gray-300 dark:bg-gray-600 dark:hover:bg-gray-700 dark:focus:ring-gray-800"
            >
               {isUpdating && <IconSpinner />}
               {!isUpdating && "Accept"}
              
            </button>
          </div>
        </>
      )}
      {isEditing && (
        <div className="p-0">
          <div className="text-xs text-zinc-400">{adText.date}</div>
          <div className="flex pb-2 items-center justify-between">
            <div className="text-lg font-bold text-zinc-200">
              {adText.headline || `Suggested Ad Text ${index + 1}`}
            </div>
          </div>
          <textarea
            className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            rows={4}
            value={textEdit}
            onChange={e => setTextEdit(e.target.value)}
          />
          <div className="text-left mt-3">
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
              {!isUpdating && "Save & Accept"}
            </button>
          </div>
        </div>
      )}
    </>
  )
}

export function AdTextSelection({ props }: { props: AdText[] }) {
  const [loading, setLoading] = useState(false)
  const [adTexts, setAdTexts] = useState<AdText[]>(props)

  const [aiState, setAIState] = useAIState()

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
          className={`flex shrink-0 flex-col gap-2 rounded-lg p-4 bg-zinc-800`}
        >
          <AdTextItem
            index={index}
            adText={adText}
            acceptText={acceptText}
            updateText={updateText}
          />
        </div>
      ))}
    </div>
  )
}

export default AdTextSelection
