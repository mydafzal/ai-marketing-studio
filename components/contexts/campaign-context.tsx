import { useAIState } from 'ai/rsc'
import { createContext, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { CampaignSummary, getCampaignSummary } from '@/lib/api/fasty-bot/get-campaign-summary'
import { getCampaigns } from '@/lib/api/fasty-bot/get-campaigns'
import { FbCampaign, Message } from '@/lib/types'

interface ICampaignContext {
    id: string | null;
    campaigns: FbCampaign[];
    getCampaignList: () => Promise<void>;
    setId: (id: string) => void;
    summary: CampaignSummary | null;
    fetchSummary: (id: string) => Promise<void>;
}

export const CampaignContext = createContext<ICampaignContext>({
    id: null,
    campaigns: [],
    getCampaignList: async () => {},
    setId: () => {},
    summary: null,
    fetchSummary: async () => {}
});

const oneHour = 60 * 60 * 1000
const fiveMins = 5 * 60 * 1000

export const CampaignContextProvider = ({ children }: { children: React.ReactNode }) => {
    const [_, setAIState] = useAIState()

    const [id, setId] = useState<string | null>(null)
    const [summary, setSummary] = useState<CampaignSummary | null>(null)
    const [campaigns, setCampaigns] = useState<FbCampaign[]>([])

    const getCampaignList = useCallback(async () => {
        const data = await getCampaigns()
        setCampaigns(data || [])
    }, [])

    useEffect(() => {
        void getCampaignList()
    }, [getCampaignList])

    const lastUpdatedRef = useRef<Date | null>(null)

    const fetchSummary = useCallback(async (campaignId: string) => {
        console.log('fetchSummary with campaignId', campaignId)
        try {
          const result = await getCampaignSummary(campaignId)
          console.log('campaign summary', result)
          setSummary(result)
        } catch (error) {
          console.error('Error fetching campaign data:', error)
        }
    }, [])

    useEffect(() => {
        if (id) {
            fetchSummary(id)
        }
        const interval = setInterval(() => {
          console.log('interval', id)
          if (
            id &&
            lastUpdatedRef.current &&
            new Date().getTime() - lastUpdatedRef.current.getTime() > oneHour
          ) {
            fetchSummary(id)
          }
        }, fiveMins)
    
        return () => clearInterval(interval)
    }, [id, fetchSummary])

    useEffect(() => {
        if (summary && summary.campaign_id !== '0') {
            const currentTimestamp = new Date().toISOString()
            setAIState((aiState: any) => ({
            ...aiState,
            messages: [
                ...aiState.messages.filter((message: Message) => message.id !== 'campaign-info-data' || message.role !== 'system'),
                {
                id: 'campaign-info-data',
                role: 'system',
                content: `Knowledge Base about current campaign information: ${JSON.stringify(summary)}`,
                timestamp: currentTimestamp 
                }
            ]
            }))
            lastUpdatedRef.current = new Date()
        }
    }, [summary])

    const value = useMemo(() => ({
        id,
        campaigns,
        getCampaignList,
        setId,
        summary,
        fetchSummary
    }), [id, setId, campaigns, summary, fetchSummary])

    return (
        <CampaignContext.Provider value={value}>
            {children}
        </CampaignContext.Provider>
    )
}