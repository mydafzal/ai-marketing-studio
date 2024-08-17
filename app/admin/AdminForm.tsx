// app/admin/AdminForm.tsx
'use client'

import React, {useState} from 'react'

export default function AdminForm({ extraDetails = false }) {
    const [campaignId, setCampaignId] = useState('')
    const [chatSlug, setChatSlug] = useState('')
    const [extraDetailsChatSlug, setExtraDetailsChatSlug] = useState('')
    const [extraDetailsContent, setExtraDetailsContent] = useState('')
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [submitResult, setSubmitResult] = useState<{ success?: boolean; error?: string } | null>(null)

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        console.log('Submitted:', { campaignId, chatSlug })
        // Here you would typically handle the submission,
        // but for now we're just logging to the console
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
                setSubmitResult({ error: result.error })
            } else {
                setSubmitResult({ success: true })
                setExtraDetailsChatSlug('')
                setExtraDetailsContent('')
            }
        } catch (error) {
            setSubmitResult({ error: 'An unexpected error occurred' })
        } finally {
            setIsSubmitting(false)
        }
    }


    if (extraDetails) {
        return (
            <form onSubmit={handleExtraDetailsSubmit} className="p-6">
                <div className="space-y-4">
                    <div>
                        <label htmlFor="extraDetailsChatSlug" className="block text-sm font-medium text-gray-700 mb-1">
                            Chat Slug
                        </label>
                        <input
                            type="text"
                            id="extraDetailsChatSlug"
                            value={extraDetailsChatSlug}
                            onChange={(e) => setExtraDetailsChatSlug(e.target.value)}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-teal-300 focus:ring focus:ring-teal-200 focus:ring-opacity-50"
                            placeholder="Enter chat slug"
                        />
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
                        className="w-full px-4 py-2 text-white bg-teal-600 rounded hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-600 focus:ring-opacity-50 transition duration-150 ease-in-out"
                    >
                        Assign Extra Details
                    </button>
                </div>
            </form>
        )
    }

    return (
        <form onSubmit={handleSubmit} className="p-6">
            <div className="space-y-4">
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
                <div>
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
            </div>
            <div className="mt-6">
                <button
                    type="submit"
                    className="w-full px-4 py-2 text-white bg-teal-600 rounded hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-600 focus:ring-opacity-50 transition duration-150 ease-in-out"
                >
                    Map Chat Slug to Campaign
                </button>
            </div>
        </form>
    )
}