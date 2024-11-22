'use client';

import React, {useState} from 'react';
import * as Collapsible from '@radix-ui/react-collapsible'; // Correct Radix UI import
import {Card, CardContent, CardFooter, CardHeader} from '@/components/ui/card';
import {Button} from '@/components/ui/button';
import {Maximize2, Minus, RefreshCw} from 'lucide-react';
import {paletteActions} from '@/data/palette-actions-list';

interface CampaignOverviewProps {
    campaignName?: string;
    campaignId: string | null;
    adsetData: {
        name: string;
    } | null;
    adsetId: string | null;
    isLoading: boolean;
    onRefresh: () => void;
    onShowMe: (message: string) => void;
    campaignBudget?: number | null;
}

const CampaignOverview: React.FC<CampaignOverviewProps> = ({
                                                               campaignName = '',
                                                               campaignId,
                                                               adsetData,
                                                               adsetId,
                                                               isLoading,
                                                               onRefresh,
                                                               onShowMe,
                                                               campaignBudget,
                                                           }) => {
    const [isOpen, setIsOpen] = useState(true); // Collapsible state

    const isEmpty = !campaignName.trim();

    // Simplified handleActionClick that just finds the message and sends it
    const handleActionClick = (actionType: string) => {
        let action;
        switch (actionType) {
            case 'switch':
                action = paletteActions.find((a) => a.action === 'Connect to an existing campaign');
                break;
            case 'create':
                action = paletteActions.find((a) => a.action === 'Create a Facebook campaign');
                break;
            case 'switch_adset':
                action = paletteActions.find((a) => a.action === 'Switch Adset');
                break;
        }

        if (action?.exampleMessage) {
            onShowMe(action.exampleMessage);
        }
    };

    return (
        <Collapsible.Root open={isOpen} onOpenChange={setIsOpen} className="relative w-[350px]">
            {/* Trigger for Collapsible */}
            <Collapsible.Trigger
                asChild
                className="absolute top-2 right-2 z-50"
                title={isOpen ? 'Minimize' : 'Maximize'}
            >
                <button className="bg-[#1C2330] hover:bg-gray-600 text-gray-200 rounded-full p-2 shadow-sm">
                    {isOpen ? <Minus className="w-4 h-4"/> : <Maximize2 className="w-4 h-4"/>}
                </button>
            </Collapsible.Trigger>

            {/* Content */}
            <Collapsible.Content
                className={`overflow-hidden transition-all duration-300 ${
                    isOpen ? 'h-auto' : 'h-[50px]'
                }`}
            >
                <Card className="w-full p-6 bg-zinc-950 text-zinc-300 rounded-lg border border-zinc-700 shadow-lg">
                    <CardHeader className="space-y-2">
                        {isEmpty ? (
                            <>
                                <h3 className="text-xl font-normal text-zinc-400">Status</h3>
                                <h1 className="text-2xl font-semibold text-zinc-300">
                                    Chat is not connected to a campaign.
                                </h1>
                            </>
                        ) : (
                            <>
                                <h3 className="text-xl font-normal">Your selected campaign is</h3>
                                <h1 className="text-2xl font-semibold break-words">{campaignName}</h1>
                                {campaignId && (
                                    <p className="text-sm text-zinc-500">ID: {campaignId}</p>
                                )}
                                <h4 className="text-xl font-normal">
                                    Campaign Budget:{' '}
                                    {campaignBudget ? '€' + campaignBudget / 100 + '/day' : 'Not Set'}
                                </h4>
                            </>
                        )}
                    </CardHeader>

                    <CardContent className="space-y-6">
                        <div className="flex gap-2 flex-wrap">
                            <Button
                                variant="outline"
                                className="flex items-center gap-2 text-xl"
                                onClick={() => handleActionClick('switch')}
                            >
                                Switch Campaign
                            </Button>
                            <Button
                                variant="outline"
                                className="flex items-center gap-2 text-xl"
                                onClick={() => handleActionClick('create')}
                            >
                                Create New Campaign
                            </Button>
                        </div>

                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <p className="text-xl">Selected ad set is</p>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={onRefresh}
                                    className="h-8 w-8 p-0"
                                    disabled={isLoading}
                                    title="Refresh ad set data"
                                >
                                    <span className={isLoading ? 'animate-spin' : ''}>
                                        <RefreshCw className="w-5 h-5"/>
                                    </span>
                                </Button>
                            </div>
                            <div className="space-y-1">
                                <h2 className="text-xl font-medium break-words">
                                    {adsetData ? adsetData.name : 'Not connected'}
                                </h2>
                                {adsetId && (
                                    <p className="text-sm text-zinc-500">ID: {adsetId}</p>
                                )}
                            </div>
                            <Button
                                variant="outline"
                                className="flex items-center gap-2 text-xl"
                                onClick={() => handleActionClick('switch_adset')}
                            >
                                Switch Ad Set
                            </Button>
                        </div>
                    </CardContent>

                    <CardFooter className="flex items-center gap-2 text-sm"/>
                </Card>
            </Collapsible.Content>
        </Collapsible.Root>
    );
};

export default CampaignOverview;
