'use client'

import {CampaignContext} from '@/components/contexts/campaign-context'
import {Fragment, useContext, useState} from 'react'
import {toast} from 'sonner'
import {IconSpinner} from '@/components/ui/icons'
import {readStreamableValue, useActions, useUIState} from 'ai/rsc'
import {cn, sleep} from '@/lib/utils'
import type {AI} from '@/lib/chat/AIManager'
import {AdText} from '@/lib/types'
import {generateAdsetTemplate, generateAdTemplate} from '@/lib/data'
import {getUserDetail, updateAdText, updateAdTextWithFbId} from '@/app/actions'
import {useParams} from 'next/navigation'
import {Card, CardContent} from '@/components/ui/card'
import {AlertCircle, Check, Facebook, Instagram, Pencil, X} from 'lucide-react'
import Image from 'next/image'
import {getChatIdFromUrl} from "@/lib/api/fasty-bot/helpers/chat-id-from-url-helper";

interface SuggestedText extends Omit<AdText, 'headline'> {
    headline?: string;
}

export interface ImageSuggestionProps {
    suggestedTexts: SuggestedText[];
}

const SocialPreview = ({
                           platform,
                           image,
                           headline,
                           text,
                       }: {
    platform: 'instagram' | 'facebook'
    image: string
    headline: string
    text: string
}) => {
    return (
        <div className={cn(
            "w-full rounded-lg overflow-hidden",
            "bg-white dark:bg-zinc-800",
            platform === 'instagram' ? "instagram-preview" : "facebook-preview"
        )}>
            <div className="p-3 flex items-center gap-2 border-b border-zinc-200 dark:border-zinc-700">
                {platform === 'instagram' ? (
                    <Instagram className="size-5 text-pink-600"/>
                ) : (
                    <Facebook className="size-5 text-blue-600"/>
                )}
                <span className="font-medium text-sm">
          {platform === 'instagram' ? 'Instagram' : 'Facebook'} Ad Preview
        </span>
            </div>

            <div className="relative aspect-square">
                <Image
                    src={image}
                    alt="Ad preview"
                    className="object-cover"
                    fill
                    sizes="(max-width: 768px) 100vw, 448px"
                    priority
                />
            </div>

            <div className="p-4">
                <h4 className="font-semibold mb-2">{headline}</h4>
                <p className="text-sm text-zinc-600 dark:text-zinc-300">{text}</p>

                <button className={cn(
                    "w-full mt-4 py-2 rounded-lg text-center text-sm font-medium",
                    platform === 'instagram'
                        ? "bg-gradient-to-r from-pink-500 to-purple-500 text-white"
                        : "bg-blue-600 text-white"
                )}>
                    Learn More
                </button>
            </div>
        </div>
    )
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
            updateText(index, adText, {...adText, text: textEdit, headline: headlineEdit})
        }
        setIsEditing(false)
        setIsUpdating(false)
        toast.success('Ad text updated successfully!')
    }

    return (
        <Card className="bg-zinc-900 border-zinc-800 overflow-hidden">
            <CardContent className="p-6">
                {hasFbAd && (
                    <div
                        className="flex items-center gap-2 mb-6 p-3 bg-blue-900/20 text-blue-200 rounded-lg border border-blue-800">
                        <AlertCircle className="size-5 shrink-0"/>
                        <span className="text-sm">
              Ad already created with ID: {adText.fbAdId}
            </span>
                    </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <SocialPreview
                        platform="instagram"
                        image={adText.image as string}
                        headline={isEditing ? headlineEdit : adText.headline}
                        text={isEditing ? textEdit : adText.text}
                    />
                    <SocialPreview
                        platform="facebook"
                        image={adText.image as string}
                        headline={isEditing ? headlineEdit : adText.headline}
                        text={isEditing ? textEdit : adText.text}
                    />
                </div>

                {!hasFbAd && isEditing && (
                    <div className="mt-6 space-y-4">
                        <input
                            value={headlineEdit}
                            onChange={e => setHeadlineEdit(e.target.value)}
                            className={cn(
                                "w-full text-center font-semibold p-2",
                                "bg-zinc-800 border border-zinc-700 rounded-lg",
                                "text-zinc-200 placeholder:text-zinc-400",
                                "focus:outline-none focus:ring-2 focus:ring-blue-500"
                            )}
                            placeholder="Enter headline"
                        />

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
                    </div>
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
                                    <X className="size-4"/>
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
                                        <IconSpinner className="size-4"/>
                                    ) : (
                                        <Check className="size-4"/>
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
                                    <Pencil className="size-4"/>
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
                                        <IconSpinner className="size-4"/>
                                    ) : (
                                        <Check className="size-4"/>
                                    )}
                                    Accept
                                </button>
                            </>
                        )}
                    </div>
                )}
            </CardContent>
        </Card>
    )
}

export function AdTextSuggestion({props}: { props: ImageSuggestionProps[] }) {
    const {id: chatSlug} = useParams()
    const {campaign} = useContext(CampaignContext)
    const {submitUserMessage} = useActions()

    const [adTexts, setAdTexts] = useState<AdText[]>(
        props.reduce((result, items) => [...result, ...items.suggestedTexts], [] as SuggestedText[])
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
    const {confirmCreateAd} = useActions()
    const [, setMessages] = useUIState<typeof AI>()

    const acceptText = async (idx: number, adText: AdText) => {
        const userDetail = await getUserDetail();
        let pageId = null;

        if (userDetail?.user?.fbPageId) {
            pageId = parseInt(userDetail?.user?.fbPageId)
        }

        let leadGenFormId = null;

        let fbCampaignId = campaign?.id;
        let chatSlug = getChatIdFromUrl();
        let campaignStructureResponse = await fetch(`/api/kv/fetch-campaign-structure/?fbCampaignId=${fbCampaignId}&chatSlug=${chatSlug}`, {
            method: 'GET',
        });

        if (campaignStructureResponse.status === 200) {
            let campaignStructureData = await campaignStructureResponse.json();
            leadGenFormId = campaignStructureData?.leadformId;
        }

        const response = await confirmCreateAd(
            campaign,
            generateAdTemplate(
                adText.headline,
                adText.text,
                adText.image,
                pageId,
                leadGenFormId, // TODO: VERIFY
                userDetail?.user?.website_link
            ),
            generateAdsetTemplate(pageId)
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