'use client'

import React, { useEffect, useState } from 'react';
import { Card, CardHeader, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MessageSquare, Info, RefreshCw } from 'lucide-react';
import { fetchChatFbAdsetId } from '@/app/actions';
import {getChatIdFromUrl} from "@/lib/api/fasty-bot/helpers/chat-id-from-url-helper";

interface CampaignOverviewProps {
    campaignName?: string;
    adsetName?: string;  // Added this prop to match usage
}

const CampaignOverview: React.FC<CampaignOverviewProps> = ({
                                                               campaignName = ""
                                                           }) => {
    const isEmpty = !campaignName.trim();
    const [adsetId, setAdsetId] = useState<string | null>(null);

    useEffect(() => {
        const fetchAdsetId = async () => {
            const chatId = getChatIdFromUrl();
            if (chatId) {
                const result = await fetchChatFbAdsetId(chatId);
                if (result.success && typeof result.fbAdsetId === 'string') {
                    setAdsetId(result.fbAdsetId);
                }
            }
        };

        fetchAdsetId();
    }, []);

    const handleFetchName = () => {
        // This will be implemented later to fetch the adset name
        console.log('Fetch adset name for ID:', adsetId);
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
                        <MessageSquare className="w-4 h-4" />
                        Switch
                    </Button>
                    <Button variant="outline" className="flex items-center gap-2 text-sm">
                        <MessageSquare className="w-4 h-4" />
                        Create New
                    </Button>
                </div>

                <div className="space-y-3">
                    <div className="flex items-center justify-between">
                        <p className="text-sm">Selected ad set is</p>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={handleFetchName}
                            className="h-8 w-8 p-0"
                            title="Fetch ad set name"
                        >
                            <RefreshCw className="h-4 w-4" />
                        </Button>
                    </div>
                    <h2 className="text-lg font-medium break-words">
                        {adsetId ? `ID: ${adsetId}` : 'Not connected'}
                    </h2>
                    <Button variant="outline" className="flex items-center gap-2 text-sm">
                        <MessageSquare className="w-4 h-4" />
                        Switch Ad Set
                    </Button>
                </div>

                <Button variant="ghost" className="w-full justify-start text-sm">
                    View Ad Creatives
                </Button>
            </CardContent>

            <CardFooter className="flex items-center gap-2 text-sm">
                {/*<Info className="w-4 h-4" />*/}
                {/*<span>How to use Reeply?</span>*/}
            </CardFooter>
        </Card>
    );
};

export default CampaignOverview;