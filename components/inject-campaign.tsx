'use client'

import { type AI } from '@/lib/chat/actions'
import { useActions, useUIState } from 'ai/rsc'

import { useContext, useEffect } from 'react'
import { CampaignContext } from '@/components/contexts/campaign-context'

export const InjectCampaign = ({ campaignId, adsetId }: { campaignId: string,adsetId?:string}) => {
    const { fetchSummary, setId, getCampaignList, setAdsetId } = useContext(CampaignContext)
    const { submitUserMessage } = useActions()
    const [_, setMessages] = useUIState<typeof AI>()

    async function fetchCampaigns_n_setId(){
        await getCampaignList()
        setId(campaignId)

        const campaignResponseMessage = await submitUserMessage(
            'Okay, I connected a campaign',
            [],
            true
          )
        const adsetResponseMessage = await submitUserMessage(
            'Okay, I connected an adset',
            [],
            true
          )
        setMessages(currentMessages => [...currentMessages, campaignResponseMessage, adsetResponseMessage])
        if(adsetId){
            setAdsetId(adsetId)
        }
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