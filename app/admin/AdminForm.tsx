// app/admin/AdminForm.tsx
'use client'

import React, {useState} from 'react'

export async function updateChatFbCampaignId(chatSlug: string, fbCampaignId: string) {
    const response = await fetch('/api/admin/update-chat-fb-campaign-id', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({chatSlug, fbCampaignId}),
    })
    return response.json()
}

export async function fetchChatFbCampaignId(chatSlug: string) {
    const response = await fetch(`/api/admin/fetch-chat-fb-campaign-id?chatSlug=${chatSlug}`)
    return response.json()
}

export default function AdminForm({extraDetails = false}) {
    const [campaignId, setCampaignId] = useState('')
    const [chatSlug, setChatSlug] = useState('')
    const [extraDetailsChatSlug, setExtraDetailsChatSlug] = useState('')
    const [extraDetailsContent, setExtraDetailsContent] = useState('')
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [isFetching, setIsFetching] = useState(false)
    const [submitResult, setSubmitResult] = useState<{
        success?: boolean;
        error?: string;
        message?: string
    } | null>(null)


    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsSubmitting(true)
        setSubmitResult(null)

        try {
            const result = await updateChatFbCampaignId(chatSlug, campaignId)
            if (result.error) {
                setSubmitResult({error: result.error})
            } else {
                setSubmitResult({success: true, message: 'Chat slug mapped to campaign successfully!'})
                setCampaignId('')
                setChatSlug('')
            }
        } catch (error) {
            setSubmitResult({error: 'An unexpected error occurred'})
        } finally {
            setIsSubmitting(false)
        }
    }


    const handleFetchCampaignId = async () => {
        if (!chatSlug) {
            setSubmitResult({error: 'Please enter a chat slug'})
            return
        }

        setIsFetching(true)
        setSubmitResult(null)

        try {
            const result = await fetchChatFbCampaignId(chatSlug)
            if (result.error) {
                setSubmitResult({error: result.error})
            } else {
                setCampaignId(result.fbCampaignId)
                setSubmitResult({success: true, message: 'Campaign ID fetched successfully'})
            }
        } catch (error) {
            setSubmitResult({error: 'An unexpected error occurred while fetching campaign ID'})
        } finally {
            setIsFetching(false)
        }
    }

    const handleExtraDetailsSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsSubmitting(true)
        setSubmitResult(null)

        try {
            const response = await fetch('/api/admin/update-chat-extra-details', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    chatId: extraDetailsChatSlug,
                    extraDetails: extraDetailsContent
                }),
            })

            const result = await response.json()

            if (result.error) {
                setSubmitResult({error: result.error})
            } else {
                setSubmitResult({success: true})
                setExtraDetailsChatSlug('')
                setExtraDetailsContent('')
            }
        } catch (error) {
            setSubmitResult({error: 'An unexpected error occurred'})
        } finally {
            setIsSubmitting(false)
        }
    }

    const fetchExtraDetails = async () => {
        if (!extraDetailsChatSlug) {
            setSubmitResult({error: 'Please enter a chat slug'})
            return
        }

        setIsFetching(true)
        setSubmitResult(null)

        try {
            const response = await fetch(`/api/admin/fetch-chat-extra-details?chatId=${extraDetailsChatSlug}`)
            const result = await response.json()

            if (result.error) {
                setSubmitResult({error: result.error})
            } else {
                setExtraDetailsContent(result.extraDetails)
            }
        } catch (error) {
            setSubmitResult({error: 'An unexpected error occurred while fetching extra details'})
        } finally {
            setIsFetching(false)
        }
    }


    if (extraDetails) {
        return (
            <form onSubmit={handleExtraDetailsSubmit} className="p-6">
                <div className="space-y-4">
                    <div className="flex items-center space-x-2">
                        <div className="flex-grow">
                            <label htmlFor="extraDetailsChatSlug"
                                   className="block text-sm font-medium text-gray-700 mb-1">
                                Campaign Id
                            </label>
                            <input
                                type="text"
                                id="extraDetailsChatSlug"
                                value={extraDetailsChatSlug}
                                onChange={(e) => setExtraDetailsChatSlug(e.target.value)}
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-teal-300 focus:ring focus:ring-teal-200 focus:ring-opacity-50"
                                placeholder="Enter Campaign Id"
                            />
                        </div>
                        <button
                            type="button"
                            onClick={fetchExtraDetails}
                            disabled={isFetching}
                            className="mt-6 px-5 py-2 bg-black text-white text-sm font-medium rounded-md hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-opacity-50 transition duration-150 ease-in-out disabled:bg-gray-400"
                        >
                            {isFetching ? '⏳' : '🔍'} {isFetching ? 'Fetching...' : 'Fetch'}
                        </button>
                    </div>
                    <div>
                        <label htmlFor="extraDetailsContent" className="block text-sm font-medium text-gray-700 mb-1">
                            Extra Details
                        </label>
                        <textarea
                            id="extraDetailsContent"
                            value={extraDetailsContent}
                            onChange={(e) => setExtraDetailsContent(e.target.value)}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-teal-300 focus:ring focus:ring-teal-200 focus:ring-opacity-50"
                            placeholder="Enter extra details"
                            rows={4}
                        />
                    </div>
                </div>
                <div className="mt-6">
                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full px-4 py-2 text-white bg-teal-600 rounded hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-600 focus:ring-opacity-50 transition duration-150 ease-in-out disabled:bg-teal-300"
                    >
                        {isSubmitting ? 'Assigning...' : 'Assign Extra Details'}
                    </button>
                </div>
                {submitResult && (
                    <div
                        className={`mt-4 p-2 rounded ${submitResult.success ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                        {submitResult.success ? 'Extra details updated successfully!' : submitResult.error}
                    </div>
                )}
            </form>
        )
    }

    return (
        <form onSubmit={handleSubmit} className="p-6">
            <div className="space-y-4">
                <div className="flex items-center space-x-2">
                    <div className="flex-grow">
                        <label htmlFor="chatSlug" className="block text-sm font-medium text-gray-700 mb-1">
                            Chat Slug
                        </label>
                        <input
                            type="text"
                            id="chatSlug"
                            value={chatSlug}
                            onChange={(e) => setChatSlug(e.target.value)}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-teal-300 focus:ring focus:ring-teal-200 focus:ring-opacity-50"
                            placeholder="Enter chat slug"
                        />
                    </div>
                    <button
                        type="button"
                        onClick={handleFetchCampaignId}
                        disabled={isFetching}
                        className="mt-6 px-5 py-2 bg-black text-white text-sm font-medium rounded-md hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-opacity-50 transition duration-150 ease-in-out disabled:bg-gray-400"
                    >
                        {isFetching ? '⏳' : '🔍'} {isFetching ? 'Fetching...' : 'Fetch'}
                    </button>
                </div>
                <div>
                    <label htmlFor="campaignId" className="block text-sm font-medium text-gray-700 mb-1">
                        Campaign ID
                    </label>
                    <input
                        type="text"
                        id="campaignId"
                        value={campaignId}
                        onChange={(e) => setCampaignId(e.target.value)}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-teal-300 focus:ring focus:ring-teal-200 focus:ring-opacity-50"
                        placeholder="Enter campaign ID"
                    />
                </div>
            </div>
            <div className="mt-6">
                <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full px-4 py-2 text-white bg-teal-600 rounded hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-600 focus:ring-opacity-50 transition duration-150 ease-in-out disabled:bg-teal-300"
                >
                    {isSubmitting ? 'Mapping...' : 'Map Chat Slug to Campaign'}
                </button>
            </div>
            {submitResult && (
                <div
                    className={`mt-4 p-2 rounded ${submitResult.success ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}
                >
                    {submitResult.success ? submitResult.message : submitResult.error}
                </div>
            )}
        </form>
    )
}