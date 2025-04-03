import { useActions } from 'ai/rsc'
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { KvContext }  from '@/components/contexts/kv-context';
import { CampaignSummary, getCampaignSummary } from '@/lib/api/fasty-bot/get-campaign-summary'
import { getCampaigns } from '@/lib/api/fasty-bot/get-campaigns'
import { Adset, FbCampaign } from '@/lib/types'

// todo: rename CampaignContext to FacebookContext
interface ICampaignContext {
    id: string | null;
    campaigns: FbCampaign[];
    campaign: FbCampaign | null;
    getCampaignList: () => Promise<void>;
    setId: (id: string) => void;
    summary: CampaignSummary | null;
    fetchSummary: (id: string) => Promise<void>;
    adsets: Adset[];
    adset?: Adset;
    setAdset: (adset: Adset) => void;
    fetchAdsets: () => Promise<void>;
    setAdsetId:(adsetId:string)=>void;
}

export const CampaignContext = createContext<ICampaignContext>({
    id: null,
    campaigns: [],
    campaign: null,
    getCampaignList: async () => {},
    setId: () => {},
    summary: null,
    fetchSummary: async () => {},
    adsets: [],
    setAdset: () => {},
    fetchAdsets: async () => {},
    setAdsetId:async()=>{}
});

const oneHour = 60 * 60 * 1000
const fiveMins = 5 * 60 * 1000

export const CampaignContextProvider = ({ children }: { children: React.ReactNode }) => {
    const { updateCampaignInfo: updateCampaignInfoBE } = useActions()
    const [id, setId] = useState<string | null>(null)
    const [summary, setSummary] = useState<CampaignSummary | null>(null)
    const [campaigns, setCampaigns] = useState<FbCampaign[]>([])
    const { chat } = useContext(KvContext);
    const [adsets, setAdsets] = useState<Adset[]>([]);
    const [adset, setAdset] = useState<Adset>();
    const [adsetId, setAdsetId] = useState<string>();
    const getCampaignList = useCallback(async () => {
        const data = await getCampaigns()
        setCampaigns(data || [])
    }, [])

    const campaign = useMemo(() =>
       campaigns.find(campaign => campaign.id === id) ?? null, [campaigns, id]
    )

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
    const fetchAdsets = useCallback(async () => {
        if (id) {
            const url = `/api/fasty-bot/proxy-get-adsets?campaign_id=${id}`
            const responseStream = await fetch(url)
            const response = await responseStream.json()
            if (response) {
                // .data is due to pagination
                setAdsets(response)
                if (chat?.fbAdsetId) {
                    setAdset(
                        response.find(
                            (a: Adset) => a.id === chat?.fbAdsetId
                        )
                    )
                }
                
            }
        }
    }, [id])

    useEffect(()=>{
        console.log("change detected in adset",new Date().getTime(), adset)
    },[adset])

    useEffect(() => {
        void fetchAdsets()
    }, [id, fetchAdsets])

    useEffect(()=>{
        if(adsets && adsetId){
            const found_adset = adsets.find(
                (a: Adset) => a.id === adsetId
            )
            console.log("Found adset", found_adset)
            if(found_adset){
                setAdset(
                    found_adset
                )
            }
        }

    },[adsetId, adsets])
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
        campaign,
        campaigns,
        getCampaignList,
        setId,
        summary,
        fetchSummary,
        adsets,
        adset,
        setAdset,
        fetchAdsets,
        setAdsetId
    }), [id, setId, campaign, campaigns, summary, adsets, adset, setAdset, fetchAdsets, setAdsetId])

    return (
        <CampaignContext.Provider value={value}>
            {children}
        </CampaignContext.Provider>
    )
}