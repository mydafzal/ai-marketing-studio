'use client'

import React, {useEffect, useState} from 'react';
import {Card, CardContent, CardFooter, CardHeader} from '@/components/ui/card';
import {Button} from '@/components/ui/button';
import {MessageSquare, RefreshCw} from 'lucide-react';
import {fetchChatFbAdsetId, getFbFetchedObject} from '@/app/actions';
import {getChatIdFromUrl} from "@/lib/api/fasty-bot/helpers/chat-id-from-url-helper";

interface FbFetchedObject {
    id: string;
    name: string;
    status: string;
    daily_budget: string;
    start_time: string;
    campaign_id: string;
    destination_type: string;
    is_dynamic_creative: boolean;
    targeting: {
        age_max: number;
        age_min: number;
        flexible_spec: Array<{
            interests: Array<{
                id: string;
                name: string;
            }>;
        }>;
        geo_locations: {
            countries: string[];
            location_types: string[];
        };
        publisher_platforms: string[];
        facebook_positions: string[];
        instagram_positions: string[];
        device_platforms: string[];
    };
}

interface CampaignOverviewProps {
    campaignName?: string;
}

const CampaignOverview: React.FC<CampaignOverviewProps> = ({
                                                               campaignName = ""
                                                           }) => {
    const isEmpty = !campaignName.trim();
    const [adsetId, setAdsetId] = useState<string | null>(null);
    const [adsetData, setAdsetData] = useState<FbFetchedObject | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        const initializeAdsetId = async () => {
            const chatId = getChatIdFromUrl();
            if (chatId) {
                const result = await fetchChatFbAdsetId(chatId);
                if (result.success && typeof result.fbAdsetId === 'string') {
                    setAdsetId(result.fbAdsetId);
                }
            }
        };

        initializeAdsetId();
    }, []);

    useEffect(() => {
        if (adsetId) {
            fetchAdsetData(adsetId);
        }
    }, [adsetId]);

    const fetchAdsetData = async (id: string) => {
        setIsLoading(true);
        try {
            const result = await getFbFetchedObject('adset', id);
            if (result.success && result.data && 'content' in result.data) {
                const content = result.data.content as Record<string, unknown>;
                if (content && typeof content === 'object') {
                    setAdsetData(content as unknown as FbFetchedObject);
                }
            }
        } catch (error) {
            console.error('Error fetching adset data:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleRefresh = () => {
        if (adsetId) {
            fetchAdsetData(adsetId);
        }
    };

    return (
        <Card className="w-full max-w-md p-6 bg-zinc-950 text-zinc-300 overflow-hidden">
            <CardHeader className="space-y-2">
                {isEmpty ? (
                    <>
                        <h3 className="text-sm font-normal text-zinc-400">Status</h3>
                        <h1 className="text-xl font-semibold text-zinc-300">Chat is not connected to a campaign.</h1>
                    </>
                ) : (
                    <>
                        <h3 className="text-sm font-normal">Your selected campaign is</h3>
                        <h1 className="text-xl font-semibold break-words">{campaignName}</h1>
                    </>
                )}
            </CardHeader>

            <CardContent className="space-y-6">
                <div className="flex gap-2 flex-wrap">
                    <Button variant="outline" className="flex items-center gap-2 text-sm">
                        <MessageSquare className="w-4 h-4"/>
                        Switch
                    </Button>
                    <Button variant="outline" className="flex items-center gap-2 text-sm">
                        <MessageSquare className="w-4 h-4"/>
                        Create New
                    </Button>
                </div>

                <div className="space-y-3">
                    <div className="flex items-center justify-between">
                        <p className="text-sm">Selected ad set is</p>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={handleRefresh}
                            className="h-8 w-8 p-0"
                            disabled={isLoading}
                            title="Refresh ad set data"
                        >
                            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`}/>
                        </Button>
                    </div>
                    <div className="space-y-1">
                        <h2 className="text-lg font-medium break-words">
                            {adsetData ? adsetData.name : 'Not connected'}
                        </h2>
                        {adsetId && (
                            <p className="text-xs text-zinc-500">ID: {adsetId}</p>
                        )}
                    </div>
                    <Button variant="outline" className="flex items-center gap-2 text-sm">
                        <MessageSquare className="w-4 h-4"/>
                        Switch Ad Set
                    </Button>
                </div>

                <Button variant="ghost" className="w-full justify-start text-sm">
                    View Ad Creatives
                </Button>
            </CardContent>

            <CardFooter className="flex items-center gap-2 text-sm"/>
        </Card>
    );
};

export default CampaignOverview;