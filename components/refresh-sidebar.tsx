'use client'

import { useContext, useEffect } from 'react'
import { CampaignContext } from '@/components/contexts/campaign-context'

export const RefreshSideBar = () => {
    const { id: campaignId, fetchSummary } = useContext(CampaignContext)

    useEffect(() => {
        if (campaignId) {
            void fetchSummary(campaignId)
        }
    }, [fetchSummary, campaignId])

    return <></>
}