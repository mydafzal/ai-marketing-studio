'use client'

import { useEffect } from 'react'

export const RefreshChatTitle = ({ campaignId, campaignName }: { campaignId: string, campaignName: string }) => {
    useEffect(() => {
        window.dispatchEvent(
            new CustomEvent(
                "update-chat-title", {
                    detail: {
                        campaignId,
                        campaignName
                    }
                }
            )
        )
    }, [])

    return <></>
}