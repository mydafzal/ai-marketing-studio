import {CampaignSummary} from "@/lib/api/fasty-bot/get-campaign-summary";
import {Message} from "@/lib/types";
import {AI} from "@/lib/chat/AIManager";
import {getMutableAIState} from "ai/rsc";


export async function updateCampaignInfo(campaignSummary: CampaignSummary) {
    'use server'

    const aiState = getMutableAIState<typeof AI>();

    // Campaign Summary refers to campaign analytics data that was at one point fetched from backend
    aiState.done({
        ...aiState.get(),
        messages: [
            {
                id: 'campaign-info-data',
                role: 'system',
                content: `Campaign is connected, the knowledge base about current campaign information: ${JSON.stringify(campaignSummary)}`,
                timestamp: new Date().toISOString()
            },
            // Update the AI state with the latest campaign information and filter out old campaign info messages
            ...aiState.get().messages.filter((message: Message) => message.id !== 'campaign-info-data' || message.role !== 'system'),
        ]
    });
}