'use client'

import { useContext, useEffect } from 'react'
import { CampaignContext } from '@/components/contexts/campaign-context'

export const InjectCampaign = ({ campaignId }: { campaignId: string}) => {
    console.log('InjectCampaign')
    const { fetchSummary } = useContext(CampaignContext)

    useEffect(() => {
        console.log('useEffect', campaignId)
        if (campaignId) {
            void fetchSummary(campaignId)
        }
    }, [campaignId])

    return <></>
}