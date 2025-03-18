import {ImagePart, TextPart} from "ai";
import AdCreativesComparison from '@/components/stocks/campaignresults-creatives';
import {getChatIdFromUrl} from "@/lib/api/fasty-bot/helpers/chat-id-from-url-helper";
import {getCampaignIdFromUrl} from "@/lib/api/fasty-bot/helpers/campaign-id-from-url-helper";
import {
    fetchChatFbAdsetId,
    fetchFbCampaignExtraDetailsForChat,
    fetchUserDefaultExtraDetails,
    saveFbCampaignStructure,
    updateChat,
    updateChatTitle
} from "@/app/actions";
import {auth} from "@/auth";
import {Message, Session} from "@/lib/types";
import MessageActivityValidator from "@/lib/chat/actions/Services/MessageActivityValidator/MessageActivityValidator";
import {nanoid, sleep} from "@/lib/utils";
import {openai} from "@ai-sdk/openai";
import {BotCard, BotMessage, SpinnerMessage} from "@/components/stocks/message";
import getCampaignResultsModule from "@/lib/ui-magic/modules/getCampaignResultsModule";
import {StockSkeleton} from "@/components/stocks/stock-skeleton";
import getCampaignImagesModule from "@/lib/ui-magic/modules/getCampaignImagesModule";
import adBudgetModule from "@/lib/ui-magic/modules/adBudgetModule";
import formBuilderModule from "@/lib/ui-magic/modules/formBuilderModule";
import getEventsModule from "@/lib/ui-magic/modules/getEventsModule";
import showSuggestionAdTextModule from "@/lib/ui-magic/modules/showSuggestionAdTextModule";
import showSuggestionVideoAdTextModule from "@/lib/ui-magic/modules/showSuggestionVideoAdTextModule";
import showUpdateStatusCampaignModule from "@/lib/ui-magic/modules/showUpdateStatusCampaignModule";
import showCampaignNameUpdateUIModule from "@/lib/ui-magic/modules/showCampaignNameUpdateUIModule";
import {updateCampaign} from "@/lib/api/fasty-bot/update-campaign";
import createCampaignModule from "@/lib/ui-magic/modules/createCampaignModule";
import {createBaseLeadOrRecruitmentCampaign} from "@/lib/api/fasty-bot/create-base-lead-or-recruitment-campaign";
import showCampaignConnectionUIModule from "@/lib/ui-magic/modules/showCampaignConnectionUIModule";
import showPlacementTargetingUIModule from "@/lib/ui-magic/modules/showPlacementTargetingUIModule";
import showGeographicalLocationUIModule from "@/lib/ui-magic/modules/showGeographicalLocationUIModule";
import showSuggestedFiltersUIModule from "@/lib/ui-magic/modules/showSuggestedFiltersUIModule";
import showSupervisedTaskUIModule from "@/lib/ui-magic/modules/showSupervisedTaskUIModule";
import {sendSupervisedTaskMail} from "@/lib/api/fasty-bot/send-supervised-task-mail";
import {getBaseUrl} from "@/lib/helpers/vercel/get-base-url";
import getAICampaignAnalysisModule from "@/lib/ui-magic/modules/getAICampaignAnalysisModule";
import showAdsetConnectionUIModule from "@/lib/ui-magic/modules/showAdsetConnectionUIModule";
import DownloadLeadsModule from "@/lib/ui-magic/modules/downloadLeadsModule";
import {z} from "zod";
import AdCreativesSwitcher from "@/components/ad-creatives-switcher";
import {AI} from "@/lib/chat/AIManager";
import {AdTextSelectionSkeleton} from '@/components/stocks/ad-text-selection-skeleton'
import {createCampaign} from '@/lib/api/fasty-bot/create-campaign'
import {EventsSkeleton} from "@/components/stocks";
import {getDefaultChatPrompt} from "@/lib/chat/actions/Providers/FbMarketingDefaultPromptProvider";
import {createStreamableValue, getMutableAIState, streamUI} from "ai/rsc";
import { useEffect } from "react";
import LeadsCountUI from "@/components/campaign-leads-count";
import showAiVideoGenerator from "@/components/stocks/ai-video-generator/server"


interface ExtractedMessage {
    id?: string;
    role: 'user' | 'system' | 'assistant' | 'tool';
    content: string | { [key: string]: any };  // content can be string or object
    timestamp?: string;
}


export async function submitUserMessage(content: string, contentImages?: Array<TextPart | ImagePart>, isSilent?: boolean) {
    'use server'

    const aiState = getMutableAIState<typeof AI>();
    const chatId = getChatIdFromUrl()?.toString() || '';

    let campaignId = '';
    try {
        campaignId = (await getCampaignIdFromUrl())?.toString() || '';
    } catch (error) {
        // Error handling if necessary
    }

    let adsetId = "";

    if (chatId) {
        const adsetIDResp = await fetchChatFbAdsetId(chatId);
        if (adsetIDResp.success) {
            adsetId = adsetIDResp.fbAdsetId as string;
        }
    }

    console.log("CUrrent selected adset is ", adsetId)

    let extraDetailsFinalText = '';

    try {
        if (chatId) {
            const defaultExtraDetailsResult = await fetchUserDefaultExtraDetails();

            if (defaultExtraDetailsResult) {
                extraDetailsFinalText += `Some important contextual information about this specific user can be seen here: ${defaultExtraDetailsResult}`;
            }
        }

        if (campaignId) {
            const extraDetailsResult = await fetchFbCampaignExtraDetailsForChat(campaignId);

            if (extraDetailsResult.success && extraDetailsResult.extraDetails) {
                if (extraDetailsFinalText) {
                    extraDetailsFinalText += '\n\n';
                }
                extraDetailsFinalText += `Some important contextual information about this specific campaign can be seen here: ${extraDetailsResult.extraDetails}`;
            }
        }
    } catch (error) {
        console.error('Error fetching extra details:', error);
    }
    const session = (await auth()) as Session
    const messageActivityValidator = new MessageActivityValidator();
    await messageActivityValidator.informAdminIfThisIsNewActivity(chatId, aiState.get().messages, session)

    const messageId = nanoid();

    // Todo: Refactor. Make a function out of this: appendUserMessageToConversation()
    aiState.update({
        ...aiState.get(),
        messages: [
            ...aiState.get().messages,
            {
                id: messageId,
                role: 'user',
                content: contentImages?.length ? contentImages : content,
                timestamp: new Date().toISOString()
            }
        ]
    })

    let textStream: undefined | ReturnType<typeof createStreamableValue<string>>
    let textNode: undefined | React.ReactNode

    // Todo: Refactor PushMessages to 2 functions ->
    //  1) removePreviousMessageFromConversationIfApplicableForFollowUp(messageId: string)
    //  2) appendNewMessagesToConversationForForFollowUp(newMessages: Message[])
    const pushMessages = (messages: Message[]) => {
        aiState.done({
            ...aiState.get(),
            messages: [
                ...(!isSilent ? aiState.get().messages : aiState.get().messages.filter(
                    (message: any) => message.id !== messageId
                )).map((message: any) => ({
                    id: message.id,
                    role: message.role,
                    content: message.content,
                    name: message.name,
                    timestamp: message.timestamp
                })),
                ...messages
            ]
        });

        if (isSilent) {
            console.log('isSilent', isSilent, messageId)
            console.log('messages', aiState.get().messages.map(m => [m.id, m.content]))
        }
    }


    let systemMessage = getDefaultChatPrompt(campaignId, adsetId, extraDetailsFinalText);
    // TODO: Tool builder factory (for each tool we should have a factory),
    // ** Important Note: After adding a new tool entry here make sure to also add an entry to FetchApplicableUI.tsx **
    const result = await streamUI({
        model: openai('gpt-4o'),
        initial: <SpinnerMessage/>,
        system: systemMessage,
        messages: [
            ...aiState.get().messages.map((message: any) => ({
                role: message.role,
                content: message.content,
                name: message.name
            }))
        ], // Todo: Create a function to getAllMessagesFromAiState
        text: ({content, done, delta}) => {
            if (!textStream) {
                textStream = createStreamableValue('')
                textNode = <BotMessage content={textStream.value}/>
            }
            if (done) { // Todo: Make this logic into 3 functions: startTextStream(), updateTextStream(), finishTextStream()
                textStream.done();
                aiState.done({
                    ...aiState.get(),
                    messages: [
                        ...aiState.get().messages.map((message: any) => ({
                            id: message.id,
                            role: message.role,
                            content: message.content,
                            name: message.name,
                            timestamp: message.timestamp
                        })),
                        {
                            id: nanoid(),
                            role: 'assistant',
                            content,
                            timestamp: new Date().toISOString()
                        }
                    ]
                });
            } else {
                textStream.update(delta)
            }

            return textNode
        },
        tools: {
            // ... other tools

            getCampaignCreativeResults: {
                description: "Show detailed performance metrics for campaign ad creatives",
                parameters: z.object({
                    campaignId: z.string(),
                    guideForUser: z.string().optional()
                }),
                generate: async function* ({campaignId, guideForUser}) {
                    yield (
                        <BotCard>
                            <StockSkeleton/>
                        </BotCard>
                    )
                    await sleep(1000)
                    const toolCallId = nanoid()
                    pushMessages([
                        {
                            id: nanoid(),
                            role: 'assistant',
                            content: [
                                {
                                    type: 'tool-call',
                                    toolName: 'getCampaignCreativeResults',
                                    toolCallId,
                                    args: {campaignId, guideForUser}
                                }
                            ],
                            timestamp: new Date().toISOString()
                        },
                        {
                            id: nanoid(),
                            role: 'tool',
                            content: [
                                {
                                    type: 'tool-result',
                                    toolName: 'getCampaignCreativeResults',
                                    toolCallId,
                                    result: {campaignId, guideForUser}
                                }
                            ],
                            timestamp: new Date().toISOString()
                        }
                    ])

                    // Import and use the server component
                    const showAdCreativesComparison = (await import('@/components/stocks/campaignresults-creatives/server')).default
                    return showAdCreativesComparison({campaignId})
                }
            },

            // ... other tools
        }
    });

    return {
        id: nanoid(),
        display: result.value
    }
}