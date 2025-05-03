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
    checkAndRefreshAccountData: () => Promise<void>;
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
    checkAndRefreshAccountData: async () => {},
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
    const [currentFbAccountId, setCurrentFbAccountId] = useState<string>();
    const [isRefreshing, setIsRefreshing] = useState(false);
    const lastRefreshTimeRef = useRef<number>(0);
    
    // Get latest FB account ID and check if it has changed
    const checkFbAccountIdChange = useCallback(async () => {
        try {
            const response = await getUserFbAccountId();
            const fbAccountId = response.success ? response.fbAccountId : null;
            
            if (fbAccountId !== currentFbAccountId) {
                setCurrentFbAccountId(fbAccountId);
                return true; // Account has changed
            }
            return false; // No change in account
        } catch (error) {
            console.error("Error checking FB account ID:", error);
            return false;
        }
    }, [currentFbAccountId]);

    const getCampaignList = useCallback(async (forceRefresh = false) => {
        const now = Date.now();
        const timeSinceLastRefresh = now - lastRefreshTimeRef.current;
        const minRefreshInterval = 30000; // 30 seconds minimum between refreshes
        
        // Skip if we're already refreshing
        if (isRefreshing) return;
        
        // Skip refresh if not forced and it's been less than 30 seconds since last refresh
        if (!forceRefresh && timeSinceLastRefresh < minRefreshInterval) {
            console.log("Skipping refresh - too soon since last refresh");
            return;
        }
        
        try {
            setIsRefreshing(true);
            const data = await getCampaigns();
            setCampaigns(data || []);
            lastRefreshTimeRef.current = Date.now();
        } catch (error) {
            console.error("Error fetching campaigns:", error);
        } finally {
            setIsRefreshing(false);
        }
    }, [isRefreshing])

    const campaign = useMemo(() =>
       campaigns.find(campaign => campaign.id === id) ?? null, [campaigns, id]
    )

    // Initial load only - no automatic checks
    useEffect(() => {
        // Initial load of campaigns
        getCampaignList(true);
        
        // Initial account ID check to establish baseline
        checkFbAccountIdChange();
    }, [getCampaignList, checkFbAccountIdChange]);

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

    useEffect(() => {
        console.log("change detected in adset", new Date().getTime(), adset)
    }, [adset])

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

    // Function to check if account changed and refresh data
    const checkAndRefreshAccountData = useCallback(async () => {
        const hasChanged = await checkFbAccountIdChange();
        if (hasChanged) {
            console.log("FB Account ID changed, refreshing campaigns");
            await getCampaignList(true);
            return true;
        }
        return false;
    }, [checkFbAccountIdChange, getCampaignList]);
    
    // Listen for the save event from navbar
    useEffect(() => {
        const handleSaveEvent = () => {
            console.log("Received save event, checking for account changes");
            checkAndRefreshAccountData();
        };
        
        document.addEventListener('fb-account-changes-saved', handleSaveEvent);
        
        return () => {
            document.removeEventListener('fb-account-changes-saved', handleSaveEvent);
        };
    }, [checkAndRefreshAccountData]);

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