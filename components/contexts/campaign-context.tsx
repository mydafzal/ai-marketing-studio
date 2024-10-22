import { useActions, useAIState } from 'ai/rsc'
import { createContext, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { CampaignSummary, getCampaignSummary } from '@/lib/api/fasty-bot/get-campaign-summary'
import { createAdset } from '@/lib/api/fasty-bot/create-adset'
import { getCampaigns } from '@/lib/api/fasty-bot/get-campaigns'
import { getAdset } from '@/lib/api/fasty-bot/get-adset'
import { getAdsets } from '@/lib/api/fasty-bot/get-adsets'
import { Adset, FbCampaign, Message } from '@/lib/types'
import { generateAdsetTemplate } from '@/lib/data'
import { fetchChatCampaignBudget } from '@/app/actions'

interface ICampaignContext {
    id: string | null;
    campaigns: FbCampaign[];
    getCampaignList: () => Promise<void>;
    setId: (id: string) => void;
    summary: CampaignSummary | null;
    fetchSummary: (id: string) => Promise<void>;
    adsets: Adset[];
    adset?: Adset;
    setAdset: (adset: Adset) => void;
}

export const CampaignContext = createContext<ICampaignContext>({
    id: null,
    campaigns: [],
    getCampaignList: async () => {},
    setId: () => {},
    summary: null,
    fetchSummary: async () => {},
    adsets: [],
    setAdset: () => {},
});

const oneHour = 60 * 60 * 1000
const fiveMins = 5 * 60 * 1000

export const CampaignContextProvider = ({ children }: { children: React.ReactNode }) => {
    const [aiState] = useAIState()
    const {updateCampaignInfo: updateCampaignInfoBE} = useActions()

    const [id, setId] = useState<string | null>(null)
    const [summary, setSummary] = useState<CampaignSummary | null>(null)
    const [campaigns, setCampaigns] = useState<FbCampaign[]>([])
    const [adsets, setAdsets] = useState<Adset[]>([]);
    const [adset, setAdset] = useState<Adset>();
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
        const fetchAdsetIds = async (id: string) => {
            const result = await getAdsets(id)
            setAdsets(result)
        }
    
        if (id) {
            fetchAdsetIds(id)
        }
    }, [id])

    useEffect(() => {
        if (id && adsets) {
            const fetchOrCreateAdset = async (adsets: Adset[]) => {
                if (adsets.length > 0) {
                    const res = await getAdset(adsets[0].id)
                    if (res) {
                        setAdset(res)
                    }
                } else {
                    const budget = await fetchChatCampaignBudget(aiState.chatId)
                    let adsetUpdate = {
                        ...generateAdsetTemplate(),
                        campaign_id: id
                    } as any
                    if (budget.error) {
                        adsetUpdate = { ...adsetUpdate, daily_budget: 100 }
                    }
                    const res = await createAdset(id, adsetUpdate)
                    if (res) {
                        setAdset(res)
                    }
                }
            }
            void fetchOrCreateAdset(adsets)
        }
    }, [id, adsets])

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
            const updateCampaignInfo = async () => {
                console.log('updateCampaignInfo', summary)
                await updateCampaignInfoBE(summary)
                lastUpdatedRef.current = new Date()
            }
            void updateCampaignInfo()
        }
    }, [summary])

    const value = useMemo(() => ({
        id,
        campaigns,
        getCampaignList,
        setId,
        summary,
        fetchSummary,
        adsets,
        adset,
        setAdset
    }), [id, setId, campaigns, summary, adsets, adset, setAdset])

    return (
        <CampaignContext.Provider value={value}>
            {children}
        </CampaignContext.Provider>
    )
}