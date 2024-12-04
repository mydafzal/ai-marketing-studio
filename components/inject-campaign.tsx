'use client'

import { useContext, useEffect } from 'react'
import { CampaignContext } from '@/components/contexts/campaign-context'

export const InjectCampaign = ({ campaignId }: { campaignId: string}) => {
    console.log('InjectCampaign')
    const { fetchSummary, setId, getCampaignList } = useContext(CampaignContext)

    async function fetchCampaigns_n_setId(){
        await getCampaignList()
        setId(campaignId)
    }
    

    useEffect(() => {
        console.log('useEffect', campaignId)
        if (campaignId) {
            fetchCampaigns_n_setId()
            void fetchSummary(campaignId)
        }
    }, [campaignId])

    return <></>
}