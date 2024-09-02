'use client'

import { useState, useEffect } from 'react'
import { nanoid } from 'nanoid'
import { toast } from 'sonner'
import { IconSpinner } from '@/components/ui/icons'
import { useActions, useAIState, useUIState } from 'ai/rsc'
import { sleep } from '@/lib/utils'
import { ImagePart } from 'ai'
import type { AI } from '@/lib/chat/actions'
import { Message } from '@/lib/types'

export interface AdText {
  image?: string
  id?: string
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
  acceptText: (adText: AdText) => Promise<void>
  updateText: (idx: number, adText: AdText, newAdText: AdText) => void
}) {
  const [isUpdating, setIsUpdating] = useState(false)
  const handleAccept = async () => {
    setIsUpdating(true)
    await sleep(1000)
    await acceptText(adText)
    setIsUpdating(false)
    toast.success('Ad text added to your campaign successfully!')
  }

  const emitAdjustEvent = () => {
    const event = new CustomEvent('adjust-adtext', {
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
        </div>
      </div>
    </>
  )
}

export function AdTextSuggestion({ props }: { props: ImageSuggestionProps[] }) {
  console.log('props of AdTextSuggestion', props)

  const [adTexts, setAdTexts] = useState<AdText[]>(
    props.reduce((result, items) => [...result,  ...items.suggestedTexts], [] as AdText[])
      .reduce((result, adText) => {
        if (adText.text?.includes('Version 1:')) {
          const segments = adText.text?.split('"')
          const adText1Headline = segments[0]?.split(':')?.[1]?.trim()
          const adText1Content = segments[1]
          const adText2Headline = segments[2]?.split(':')?.[1]?.trim()
          const adText2Content = segments[3]
          const adText3Headline = segments[4]?.split(':')?.[1]?.trim()
          const adText3Content = segments[5]
          return [...result, {
            ...adText,
            headline: adText1Headline,
            text: adText1Content
          }, {
            ...adText,
            headline: adText2Headline,
            text: adText2Content
          }, {
            ...adText,
            headline: adText3Headline,
            text: adText3Content
          }]
        }
        return [...result, adText]
      }, [] as AdText[])
  )
  console.log('adTexts', adTexts)

  const [createAdUI, setCreateAdUI] = useState<null | React.ReactNode>(null)
  const { confirmCreateAd } = useActions()

  const [aiState, setAIState] = useAIState()
  const [, setMessages] = useUIState<typeof AI>()

  const acceptText = async (adText: AdText) => {

    const createData = {
      name: 'New Link Ad Creative',
      object_story_spec: {
        page_id: 119021011189054,
        link_data: {
          link: 'https://www.example.com',
          name: adText.headline,
          message: adText.text,
          call_to_action: {
            type: 'SIGN_UP',
            value: {
              lead_gen_form_id: 8902951086385726
            }
          },
          image_url: adText.image
        }
      }
    };
    const adsetData = {
      name: 'My Ad Set',
      bid_amount: 2,
      billing_event: 'IMPRESSIONS',
      optimization_goal: 'REACH',
      targeting: {
        age_max: 65,
        age_min: 18,
        flexible_spec: [
          {
            interests: [
              {
                id: '6003214937861',
                name: 'Self-employment'
              },
              {
                id: '6003374632277',
                name: 'Freelancer'
              }
            ]
          }
        ],
        geo_locations: {
          countries: ['NL', 'DE'],
          location_types: ['home', 'recent']
        },
        publisher_platforms: ['facebook', 'instagram'],
        facebook_positions: [
          'feed',
          'facebook_reels',
          'video_feeds',
          'marketplace',
          'story'
        ],
        instagram_positions: [
          'stream',
          'story',
          'explore',
          'reels',
          'explore_home'
        ],
        device_platforms: ['mobile', 'desktop']
      },
      promoted_object: {
        page_id: 119021011189054
      },
      status: 'PAUSED'
    }
    const response = await confirmCreateAd(createData, adsetData)
    setCreateAdUI(response.createAdUI)

    setMessages(currentMessages => [...currentMessages, response.newMessage])
   
    setAIState({
      ...aiState,
      messages: [
        ...aiState.messages,
        {
          id: nanoid(),
          role: 'system',
          content: `The user has created an ad with ID: ${JSON.stringify(adText)}`
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
      {createAdUI ? (
        <div className="mt-4 dark:text-zinc-200">{createAdUI}</div>
      ) : (
        adTexts.map((adText, index) => (
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
        ))
      )}
    </div>
  )
}

export default AdTextSuggestion
