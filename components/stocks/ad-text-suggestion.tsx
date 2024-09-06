'use client'

import { Separator } from '@/components/ui/separator'
import { Fragment, useState } from 'react'
import { nanoid } from 'nanoid'
import { toast } from 'sonner'
import { IconSpinner } from '@/components/ui/icons'
import { useActions, useAIState, useUIState } from 'ai/rsc'
import { sleep } from '@/lib/utils'
import type { AI } from '@/lib/chat/actions'
import { AdText } from '@/lib/types'
import { generateAdTemplate, generateAdsetTemplate } from '@/lib/data'
import { updateAdText, updateAdTextWithFbId } from '@/app/actions'
import { useParams } from 'next/navigation'
import { readStreamableValue } from 'ai/rsc'

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

  const showAdjustView = () => {
    setIsEditing(true)
  }

  return (
    <>
    {hasFbAd && <span>You have already created an ad with this suggestion. Ad id is {adText.fbAdId}</span>}
    <div className="flex items-center">
      <div className="flex-none w-72">
        <img
          src={adText.image as string}
          alt=""
          className="inset-0 w-full object-cover "
          loading="lazy"
        />
      </div>
      <div className="flex-1 px-6 py-2">
        {!hasFbAd && isEditing ? (
          <input
            value={headlineEdit}
            onChange={e => setHeadlineEdit(e.target.value)}
            className="w-full text-center font-semibold mb-2 py-1 px-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        ) : (
          <h6 className="block text-center font-sans text-lg mb-5 antialiased font-semibold leading-relaxed tracking-normal text-blue-gray-900">
            {adText.headline || `Suggested Ad Text ${index + 1}`}
          </h6>
        )}
        {!hasFbAd && isEditing ? (
          <textarea
            className="w-full py-1 px-2 text-sm leading-6 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            value={textEdit}
            onChange={e => setTextEdit(e.target.value)}
          />
        ) : (
          <p className="block font-sans mb-7 text-sm antialiased font-normal leading-normal text-gray-700 dark:text-gray-100">
            {adText.text}
          </p>
        )}
        {!hasFbAd && (
          <div className="flex mt-4 space-x-4">
            <div className="text-center w-full space-x-4 pr-4">
              {isEditing ? (
                <>
                  <button
                    onClick={() => {
                      setIsEditing(false)
                      setTextEdit(adText.text)
                      setHeadlineEdit(adText.headline)
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
                    {!isUpdating && 'Save'}
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={showAdjustView}
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
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
    </>
  )
}

export function AdTextSuggestion({ props }: { props: ImageSuggestionProps[] }) {
  console.log('props of AdTextSuggestion', props)
  const { id: chatSlug } = useParams()

  const [adTexts, setAdTexts] = useState<AdText[]>(
    props.reduce((result, items) => [...result,  ...items.suggestedTexts], [] as AdText[])
      .reduce((result, adText) => {
        if (adText.text?.includes('Version 1:')) {
          const segments = adText.text?.split('"')
          const adText1Headline = segments[0]?.split(':')?.[1]?.trim()
          const adText1Content = segments[1]
          // const adText2Headline = segments[2]?.split(':')?.[1]?.trim()
          // const adText2Content = segments[3]
          // const adText3Headline = segments[4]?.split(':')?.[1]?.trim()
          // const adText3Content = segments[5]
          return [...result, {
            ...adText,
            headline: adText1Headline,
            text: adText1Content
          // }, {
          //   ...adText,
          //   headline: adText2Headline,
          //   text: adText2Content
          // }, {
          //   ...adText,
          //   headline: adText3Headline,
          //   text: adText3Content
          }]
        }
        return [...result, adText]
      }, [] as AdText[])
  )
  const { confirmCreateAd } = useActions()

  const [, setMessages] = useUIState<typeof AI>()

  const acceptText = async (idx: number, adText: AdText) => {
    const response = await confirmCreateAd(
      generateAdTemplate(
        adText.headline,
        adText.text,
        adText.image
      ),
      generateAdsetTemplate(),
      adText
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
    <div className="-mt-2 flex w-full flex-col gap-4 py-4">
      {
        adTexts.map((adText, index) => (
          <Fragment key={`${adText.date}${index}`}>
            {index !== 0 && <Separator className="my-4" />}
            <div
              key={index}
              className={`flex shrink-0 flex-col gap-2 rounded-lg p-4 dark:bg-zinc-800 bg-light-800`}
            >
              <AdTextItem
                index={index}
                adText={{
                  ...adText,
                }}
                acceptText={acceptText}
                updateText={updateText}
              />
            </div>
          </Fragment>
        ))
      }
    </div>
  )
}

export default AdTextSuggestion
