// campaign-overview-basic-ui.tsx
'use client'

import React from 'react';
import {Card, CardContent, CardFooter, CardHeader} from '@/components/ui/card';
import {Button} from '@/components/ui/button';
import {MessageSquare, RefreshCw} from 'lucide-react';

interface CampaignOverviewProps {
    campaignName?: string;
    adsetData: {
        name: string;
    } | null;
    adsetId: string | null;
    isLoading: boolean;
    onRefresh: () => void;
}

const CampaignOverview: React.FC<CampaignOverviewProps> = ({
                                                               campaignName = "",
                                                               adsetData,
                                                               adsetId,
                                                               isLoading,
                                                               onRefresh
                                                           }) => {
    const isEmpty = !campaignName.trim();

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
                            onClick={onRefresh}
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

                {/*<Button variant="ghost" className="w-full justify-start text-sm">*/}
                {/*    View Ad Creatives*/}
                {/*</Button>*/}
            </CardContent>

            <CardFooter className="flex items-center gap-2 text-sm"/>
        </Card>
    );
};

export default CampaignOverview;