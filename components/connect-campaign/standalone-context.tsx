'use client'

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { KvContext }  from '@/components/contexts/kv-context';
import { CampaignSummary, getCampaignSummary } from '@/lib/api/fasty-bot/get-campaign-summary'
import { getCampaigns } from '@/lib/api/fasty-bot/get-campaigns'
import { Adset, FbCampaign } from '@/lib/types'
import { getUserFbAccountId } from '@/app/actions'

// This is a standalone version of the CampaignContext without AI/RSC dependencies
// It's used specifically for the standalone campaign connect page

interface ICampaignContext {
    id: string | null;
    campaigns: FbCampaign[];
    campaign: FbCampaign | null;
    getCampaignList: (forceRefresh?: boolean) => Promise<void>;
    checkAndRefreshAccountData: () => Promise<boolean>; // Changed from Promise<void> to Promise<boolean>
    setId: (id: string) => void;
    summary: CampaignSummary | null;
    fetchSummary: (id: string) => Promise<void>;
    adsets: Adset[];
    adset?: Adset;
    setAdset: (adset: Adset) => void;
    fetchAdsets: () => Promise<void>;
    setAdsetId:(adsetId:string)=>void;
    isRefreshing: boolean;
}

export const StandaloneCampaignContext = createContext<ICampaignContext>({
    id: null,
    campaigns: [],
    campaign: null,
    getCampaignList: async () => {},
    checkAndRefreshAccountData: async () => false, // Changed to return a boolean (false)
    setId: () => {},
    summary: null,
    fetchSummary: async () => {},
    adsets: [],
    setAdset: () => {},
    fetchAdsets: async () => {},
    setAdsetId: async () => {},
    isRefreshing: false
});

const oneHour = 60 * 60 * 1000
const fiveMins = 5 * 60 * 1000

export const StandaloneCampaignContextProvider = ({ children }: { children: React.ReactNode }) => {
    const [id, setId] = useState<string | null>(null)
    const [summary, setSummary] = useState<CampaignSummary | null>(null)
    const [campaigns, setCampaigns] = useState<FbCampaign[]>([])
    const kvContext = useContext(KvContext);
    const chat = kvContext?.chat || null;
    const [adsets, setAdsets] = useState<Adset[]>([]);
    const [adset, setAdset] = useState<Adset>();
    const [adsetId, setAdsetId] = useState<string>();
    const [isRefreshing, setIsRefreshing] = useState(false);
    
    // Simple function to refresh the campaign list
    const refreshCampaignList = useCallback(async () => {
        try {
            // Don't set any loading states, just refresh the data
            console.log("Refreshing campaign list due to account change");
            const data = await getCampaigns();
            setCampaigns(data || []);
            return true;
        } catch (error) {
            console.error("Error refreshing campaign list:", error);
            return false;
        }
    }, []);

    // Simplified campaign list fetcher that just makes one API call
    const getCampaignList = useCallback(async (forceRefresh = false) => {
        // Skip if we're already refreshing
        if (isRefreshing) return;
        
        try {
            setIsRefreshing(true);
            console.log("Fetching campaigns...");
            const data = await getCampaigns();
            console.log("Campaigns fetched:", data?.length || 0);
            setCampaigns(data || []);
        } catch (error) {
            console.error("Error fetching campaigns:", error);
        } finally {
            setIsRefreshing(false);
        }
    }, [isRefreshing])

    const campaign = useMemo(() =>
       campaigns.find(campaign => campaign.id === id) ?? null, [campaigns, id]
    )

    // Initial load only - run once at component mount
    useEffect(() => {
        // Only load campaigns if we don't have any yet
        if (campaigns.length === 0) {
            getCampaignList(true);
        }
    }, [campaigns.length, getCampaignList]);

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
                    const matchingAdset = response.find(
                        (a: Adset) => a.id === chat?.fbAdsetId
                    );
                    if (matchingAdset) {
                        setAdset(matchingAdset);
                    }
                }
            }
        }
    }, [id, chat])

    // Monitor adset changes
    useEffect(() => {
        if (adset) {
            console.log("Adset selected:", adset.id);
        }
    }, [adset?.id])

    useEffect(() => {
        void fetchAdsets()
    }, [id, fetchAdsets])

    useEffect(() => {
        if(adsets && adsetId){
            const found_adset = adsets.find(
                (a: Adset) => a.id === adsetId
            )
            console.log("Found adset", found_adset)
            if(found_adset){
                setAdset(found_adset)
            }
        }
    }, [adsetId, adsets])
    
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

    // Note: No updateCampaignInfoBE since it comes from AI/RSC and isn't needed for standalone use

    // Function to refresh data without any checks
    const checkAndRefreshAccountData = useCallback(async () => {
        return await refreshCampaignList();
    }, [refreshCampaignList]);
    
    // Listen for the save event from navbar
    useEffect(() => {
        const handleSaveEvent = (event: Event) => {
            console.log("Received fb-account-changes-saved event");
            
            // No need to do anything - the page will reload
            // This prevents extra API calls
        };
        
        document.addEventListener('fb-account-changes-saved', handleSaveEvent);
        
        return () => {
            document.removeEventListener('fb-account-changes-saved', handleSaveEvent);
        };
    }, []);

    const value = useMemo(() => ({
        id,
        campaign,
        campaigns,
        getCampaignList: (forceRefresh = false) => getCampaignList(forceRefresh),
        checkAndRefreshAccountData,
        setId,
        summary,
        fetchSummary,
        adsets,
        adset,
        setAdset,
        fetchAdsets,
        setAdsetId,
        isRefreshing
    }), [id, setId, campaign, campaigns, summary, adsets, adset, setAdset, fetchAdsets, setAdsetId, getCampaignList, checkAndRefreshAccountData, isRefreshing])

    return (
        <StandaloneCampaignContext.Provider value={value}>
            {children}
        </StandaloneCampaignContext.Provider>
    )
}