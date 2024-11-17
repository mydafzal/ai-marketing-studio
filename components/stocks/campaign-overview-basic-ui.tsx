'use client'

import React from 'react';
import { Card, CardHeader, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MessageSquare, Info } from 'lucide-react';

interface CampaignOverviewProps {
    campaignName?: string;
    adsetName?: string;
}

const CampaignOverview: React.FC<CampaignOverviewProps> = ({
                                                               campaignName = "Campaign Name",
                                                               adsetName = "Adset Name"
                                                           }) => {
    return (
        <Card className="w-full max-w-md p-6 bg-zinc-950 text-zinc-300 overflow-hidden">
            <CardHeader className="space-y-2">
                <h3 className="text-sm font-normal">Your selected campaign is</h3>
                <h1 className="text-xl font-semibold break-words">{campaignName}</h1>
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
                    <p className="text-sm">Selected ad set is</p>
                    <h2 className="text-lg font-medium break-words">{adsetName}</h2>
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
                <Info className="w-4 h-4" />
                <span>How to use Reeply?</span>
            </CardFooter>
        </Card>
    );
};

export default CampaignOverview;