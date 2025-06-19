// This is the completely clean and fixed  version of UserMessageSubmitter.tsx with the updated showAdBudgetUI tool
import {ImagePart, TextPart} from "ai";
import dynamic from 'next/dynamic';
import AdCreativesComparison from '@/components/stocks/campaignresults-creatives';
import { SidebarContentWrapper } from '@/components/sidebar-content-wrapper';
import { checkUsageLimit, incrementUsageCounter } from '@/app/actions';

import {getChatIdFromUrl} from "@/lib/api/fasty-bot/helpers/chat-id-from-url-helper";

import {getCampaignIdFromUrl} from "@/lib/api/fasty-bot/helpers/campaign-id-from-url-helper";

import {

    fetchChatFbAdsetId,

    fetchFbCampaignExtraDetailsForChat,

    fetchUserDefaultAndAdminExtraDetails,

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

import supportModule from "@/lib/ui-magic/modules/supportModule";
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

import AdCreativesSwitcher from "@/components/ad-creatives-switcher/index";

import {AI} from "@/lib/chat/AIManager";

import {AdTextSelectionSkeleton} from '@/components/stocks/ad-text-selection-skeleton'

import {createCampaign} from '@/lib/api/fasty-bot/create-campaign'

import {EventsSkeleton} from "@/components/stocks";

import {getDefaultChatPrompt} from "@/lib/chat/actions/Providers/FbMarketingDefaultPromptProvider";

import {createStreamableValue, getMutableAIState, streamUI} from "ai/rsc";

import { useEffect } from "react";

import LeadsCountUI from "@/components/campaign-leads-count";

import showAiVideoGenerator from "@/components/stocks/ai-video-generator/server"
import leadNotificationsModule from "@/lib/ui-magic/modules/leadNotificationsModule"
import campaignOptimizationModule from "@/lib/ui-magic/modules/campaignOptimizationModule"
// Browser research component will be imported dynamically in the tool handler

interface ExtractedMessage {

    id?: string;

    role: 'user' | 'system' | 'assistant' | 'tool';

    content: string | { [key: string]: any };  // content can be string or object

    timestamp?: string;

}



export async function submitUserMessage(content: string, contentImages?: Array<TextPart | ImagePart>, isSilent?: boolean) {

    'use server'

    // Check usage limit before processing the message
    const usageLimitCheck = await checkUsageLimit('messages');
    if (usageLimitCheck.success && usageLimitCheck.limitReached) {
        throw new Error("Free plan message limit reached. Please upgrade your subscription to continue.");
    }

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

            const defaultExtraDetailsResult = await fetchUserDefaultAndAdminExtraDetails();



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
        // Keep track of whether messages were submitted in silent mode
        const enhancedMessages = messages.map(message => ({
            ...message,
            hidden: isSilent ? true : message.hidden // Preserve existing hidden flag or set based on isSilent
        }));

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
                    timestamp: message.timestamp,
                    hidden: message.hidden // Preserve hidden flag when mapping messages
                })),
                ...enhancedMessages
            ]
        });

        if (isSilent) {
            console.log('isSilent', isSilent, messageId)
            console.log('messages', aiState.get().messages.map(m => [m.id, m.content, m.hidden]))
        }
    }





    let systemMessage = getDefaultChatPrompt(campaignId, adsetId, extraDetailsFinalText);

    // TODO: Tool builder factory (for each tool we should have a factory),

    // ** Important Note: After adding a new tool entry here make sure to also add an entry to FetchApplicableUI.tsx **

    const result = await streamUI({

        model: openai('gpt-4o') as any,

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

            getCampaignResults: {

                description: getCampaignResultsModule.description,

                parameters: getCampaignResultsModule.parameters,

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

                                    toolName: 'getCampaignResults',

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

                                    toolName: 'getCampaignResults',

                                    toolCallId,

                                    result: {campaignId, guideForUser}

                                }

                            ],

                            timestamp: new Date().toISOString()

                        }

                    ])



                    return await getCampaignResultsModule.component({

                        campaignId,

                        guideForUser

                    })

                }

            },

            getCampaignImages: {

                description: getCampaignImagesModule.description,

                parameters: getCampaignImagesModule.parameters,

                generate: async function* ({}) {

                    yield (

                        <BotCard>

                            <StockSkeleton/>

                        </BotCard>

                    )



                    await sleep(1000)



                    const toolCallId = nanoid()



                    pushMessages([{

                        id: nanoid(),

                        role: 'assistant',

                        content: [

                            {

                                type: 'tool-call',

                                toolName: 'getCampaignImages',

                                toolCallId,

                                args: {}

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

                                    toolName: 'getCampaignImages',

                                    toolCallId,

                                    result: {}

                                }

                            ],

                            timestamp: new Date().toISOString()

                        }]);



                    return await getCampaignImagesModule.component({})

                }

            },

            /* Support UI component */
            showAdBudgetUI: {
                description: adBudgetModule.description,
                parameters: adBudgetModule.parameters,
                generate: async function* ({symbol, price, numberOfShares, guideForUser}) {
                    yield (
                        <BotCard>
                            <StockSkeleton/>
                        </BotCard>
                    )
                    
                    await sleep(1000)
                    
                    const toolCallId = nanoid()
                    const initialBudget = numberOfShares || price;
                    
                    if (initialBudget <= 0 || initialBudget > 1000) {
                        pushMessages([
                            {
                                id: nanoid(),
                                role: 'assistant',
                                content: [
                                    {
                                        type: 'tool-call',
                                        toolName: 'showAdBudgetUI',
                                        toolCallId,
                                        args: {symbol, price, numberOfShares: initialBudget, guideForUser}
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
                                        toolName: 'showAdBudgetUI',
                                        toolCallId,
                                        result: {
                                            symbol,
                                            price,
                                            numberOfShares: initialBudget,
                                            status: 'expired',
                                            guideForUser
                                        }
                                    }
                                ],
                                timestamp: new Date().toISOString()
                            }
                        ]);
                        
                        return (
                            <BotCard>
                                <p>Invalid budget amount. Please specify a budget between €10 and €1000.</p>
                            </BotCard>
                        );
                    }
                    
                    pushMessages([
                        {
                            id: nanoid(),
                            role: 'assistant',
                            content: [
                                {
                                    type: 'tool-call',
                                    toolName: 'showAdBudgetUI',
                                    toolCallId,
                                    args: {symbol, price, numberOfShares: initialBudget, guideForUser}
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
                                    toolName: 'showAdBudgetUI',
                                    toolCallId,
                                    result: {
                                        symbol,
                                        price,
                                        numberOfShares: initialBudget,
                                        guideForUser
                                    }
                                }
                            ],
                            timestamp: new Date().toISOString()
                        }
                    ])
                    
                    // Import and use the server component for Budget Setter
                    const showBudgetSetter = (await import('@/components/stocks/set-budget/server')).default;
                    return showBudgetSetter({
                        symbol,
                        price,
                        numberOfShares,
                        guideForUser
                    });
                }
            },

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

            showCreateCampaignScreen: {

                description: "Show UI for creating a new advertising campaign with options to upload media, set links, budgets, and descriptions.",

                parameters: z.object({}),

                generate: async function* () {

                    yield (

                        <BotCard>

                            <p>Loading campaign creation form...</p>

                        </BotCard>

                    )



                    const toolCallId = nanoid()

                    pushMessages([

                        {

                            id: nanoid(),

                            role: 'assistant',

                            content: [

                                {

                                    type: 'tool-call',

                                    toolName: 'showCreateCampaignScreen',

                                    toolCallId,

                                    args: {}

                                }

                            ],

                            timestamp: new Date().toISOString()

                        },

                        {

                            id: toolCallId,

                            role: 'tool',

                            content: [

                                {

                                    type: 'tool-result',

                                    toolName: 'showCreateCampaignScreen',

                                    toolCallId,

                                    result: {}

                                }

                            ],

                            timestamp: new Date().toISOString()

                        }

                    ])



                    // Import and use the server component

                    const showCreateCampaignScreen = (await import('@/components/stocks/create-campaign-screen/server')).default

                    return showCreateCampaignScreen()

                }

            },

// Updated tool definition in your actions.ts file

            showAiVideoGenerator: {

                description: "Show the UI for generating an AI video.",

                parameters: z.object({}),

                generate: async function* () {

                    yield (

                        <BotCard>

                            <p>Loading AI Video Generator...</p>

                        </BotCard>

                    )



                    // Return the component from the server file

                    return showAiVideoGenerator()

                }

            },
            
            showBrowserResearch: {

                description: "Show the UI for performing AI browser research. The AI will browse the web to find information and return results to the chat.",

                parameters: z.object({
                    researchQuery: z.string().optional().describe("The query or topic to research. This will be used as the initial prompt for the browser agent.")
                }),

                generate: async function* ({ researchQuery }) {

                    yield (

                        <BotCard>

                            <p>Loading AI Browser Research...</p>

                        </BotCard>

                    )
                    
                    const timestamp: string = new Date().toISOString();
                    const toolCallId = nanoid();
                    
                    pushMessages([
                        {
                            id: nanoid(),
                            role: 'assistant',
                            content: [
                                {
                                    type: 'tool-call',
                                    toolName: 'showBrowserResearch',
                                    toolCallId,
                                    args: { researchQuery }
                                }
                            ],
                            timestamp
                        },
                        {
                            id: toolCallId,
                            role: 'tool',
                            content: [
                                {
                                    type: 'tool-result',
                                    toolName: 'showBrowserResearch',
                                    toolCallId,
                                    result: { researchQuery }
                                }
                            ],
                            timestamp
                        }
                    ]);

                    // Import and return the browser research component
                    const showBrowserUse = (await import('@/components/stocks/browser-use/server')).default;
                    return showBrowserUse({ researchQuery });
                }

            },
            
            browserResearch: {

                description: "Show the UI for performing AI browser research. The AI will browse the web to find information and return results to the chat.",

                parameters: z.object({
                    researchQuery: z.string().optional().describe("The query or topic to research. This will be used as the initial prompt for the browser agent.")
                }),

                generate: async function* ({ researchQuery }) {

                    yield (

                        <BotCard>

                            <p>Loading AI Browser Research...</p>

                        </BotCard>

                    )
                    
                    const timestamp: string = new Date().toISOString();
                    const toolCallId = nanoid();
                    
                    pushMessages([
                        {
                            id: nanoid(),
                            role: 'assistant',
                            content: [
                                {
                                    type: 'tool-call',
                                    toolName: 'showBrowserResearch',
                                    toolCallId,
                                    args: { researchQuery }
                                }
                            ],
                            timestamp
                        },
                        {
                            id: toolCallId,
                            role: 'tool',
                            content: [
                                {
                                    type: 'tool-result',
                                    toolName: 'showBrowserResearch',
                                    toolCallId,
                                    result: { researchQuery }
                                }
                            ],
                            timestamp
                        }
                    ]);

                    // Import and return the browser research component
                    const showBrowserUse = (await import('@/components/stocks/browser-use/server')).default;
                    return showBrowserUse({ researchQuery });
                }

            },



            showFormBuilder: {

                description: formBuilderModule.description,

                parameters: formBuilderModule.parameters,

                generate: async function* () {

                    const toolCallId = nanoid()

                    pushMessages([

                        {

                            id: nanoid(),

                            role: 'assistant',

                            content: [

                                {

                                    type: 'tool-call',

                                    toolName: 'showFormBuilder',

                                    toolCallId,

                                    args: {}

                                }

                            ],

                            timestamp: new Date().toISOString()

                        },

                        {

                            id: toolCallId,

                            role: 'tool',

                            content: [

                                {

                                    type: 'tool-result',

                                    toolName: 'showFormBuilder',

                                    toolCallId,

                                    result: {}

                                }

                            ],

                            timestamp: new Date().toISOString()

                        },

                    ])



                    return await formBuilderModule.component({toolCallId});

                }

            },

            getEvents: {

                description: getEventsModule.description,

                parameters: getEventsModule.parameters,

                generate: async function* ({events}) {

                    yield (

                        <BotCard>

                            <EventsSkeleton/>

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

                                    toolName: 'getEvents',

                                    toolCallId,

                                    args: {events}

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

                                    toolName: 'getEvents',

                                    toolCallId,

                                    result: events

                                }

                            ],

                            timestamp: new Date().toISOString()

                        }

                    ])



                    return await getEventsModule.component({events});

                }

            },

            showSuggestionAdText: {

                description: showSuggestionAdTextModule.description,

                parameters: showSuggestionAdTextModule.parameters,

                generate: async function* ({campaignName, images = [], guideForUser}) {

                    yield (

                        <BotCard>

                            <AdTextSelectionSkeleton/>

                        </BotCard>

                    );



                    await sleep(1000);

                    const toolCallId = nanoid();

                    pushMessages([

                        {

                            id: nanoid(),

                            role: 'assistant',

                            content: [

                                {

                                    type: 'tool-call',

                                    toolName: 'showSuggestionAdText',

                                    toolCallId,

                                    args: {campaignName, images, guideForUser}

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

                                    toolName: 'showSuggestionAdText',

                                    toolCallId,

                                    result: {campaignName, images, guideForUser}

                                }

                            ],

                            timestamp: new Date().toISOString()

                        }

                    ])



                    return await showSuggestionAdTextModule.component({images, guideForUser})

                }

            },

            showSuggestionVideoAdText: {

                description: showSuggestionVideoAdTextModule.description,

                parameters: showSuggestionVideoAdTextModule.parameters,

                generate: async function* ({campaignName, videos = [], guideForUser}) {

                    yield (

                        <BotCard>

                            <AdTextSelectionSkeleton/>

                        </BotCard>

                    );



                    await sleep(1000);

                    const toolCallId = nanoid();

                    pushMessages([

                        {

                            id: nanoid(),

                            role: 'assistant',

                            content: [

                                {

                                    type: 'tool-call',

                                    toolName: 'showVideoAdTextSuggestion',

                                    toolCallId,

                                    args: {campaignName, videos, guideForUser}

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

                                    toolName: 'showVideoAdTextSuggestion',

                                    toolCallId,

                                    result: {campaignName, videos, guideForUser}

                                }

                            ],

                            timestamp: new Date().toISOString()

                        }

                    ])



                    return await showSuggestionVideoAdTextModule.component({videos, guideForUser})

                }

            },

            showUpdateStatusCampaign: {

                description: showUpdateStatusCampaignModule.description,

                parameters: showUpdateStatusCampaignModule.parameters,

                generate: async function* ({campaignName, status}) {

                    yield (

                        <BotCard>

                            <AdTextSelectionSkeleton/>

                        </BotCard>

                    );



                    await sleep(1000);

                    const toolCallId = nanoid();

                    pushMessages([

                        {

                            id: nanoid(),

                            role: 'assistant',

                            content: [

                                {

                                    type: 'tool-call',

                                    toolName: 'showUpdateStatusCampaign',

                                    toolCallId,

                                    args: {campaignName, status}

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

                                    toolName: 'showUpdateStatusCampaign',

                                    toolCallId,

                                    result: {campaignName, status}

                                }

                            ],

                            timestamp: new Date().toISOString()

                        }

                    ])



                    return await showUpdateStatusCampaignModule.component({toolCallId, campaignName, status})

                }

            },

            showCampaignNameUpdateUI: {

                description: showCampaignNameUpdateUIModule.description,

                parameters: showCampaignNameUpdateUIModule.parameters,

                generate: async function* ({campaignName, questionForBudget}) {

                    let campaignId = await getCampaignIdFromUrl() || '0'; // for now just say you are updating even if no campaign id in place

                    if (process.env.NEXT_PUBLIC_HARDCODED_MODE === '1') {

                        campaignId = process.env.NEXT_PUBLIC_HARDCODED_CAMPAIGN_ID || '0'

                    }

                    console.log('why is campaign name changed?', campaignName)

                    await updateCampaign(campaignId, {name: campaignName})

                    await updateChatTitle(aiState.get().chatId, campaignName)

                    const timestamp: string = new Date().toISOString();

                    const toolCallId = nanoid();

                    pushMessages([

                        {

                            id: nanoid(),

                            role: 'assistant',

                            content: [

                                {

                                    type: 'tool-call',

                                    toolName: 'showCampaignNameUpdateUI',

                                    toolCallId,

                                    args: {campaignName, campaignId, questionForBudget}

                                }

                            ],

                            timestamp

                        },

                        {

                            id: toolCallId,

                            role: 'tool',

                            content: [

                                {

                                    type: 'tool-result',

                                    toolName: 'showCampaignNameUpdateUI',

                                    toolCallId,

                                    result: {campaignName, campaignId, questionForBudget}

                                }

                            ],

                            timestamp

                        }

                    ])



                    return await showCampaignNameUpdateUIModule.component({

                        campaignId,

                        campaignName,

                        questionForBudget

                    });

                }

            },

            createCampaign: {

                description: createCampaignModule.description,

                parameters: createCampaignModule.parameters,

                generate: async function* ({campaignName, questionForBudget}) {

                    const response = await createBaseLeadOrRecruitmentCampaign({

                        campaign_name: campaignName,

                    })



                    let success = !!response.ok

                    let adsetId;

                    let leadFormId;

                    if (success) {

                        const {campaign, adset, lead_form} = await response.json()

                        const id = campaign.id;

                        adsetId = adset.id;

                        leadFormId = lead_form?.id; // in case of conversion campaign it will be null.

                        const result = await updateChat(aiState.get().chatId, {

                            title: campaignName,

                            fbCampaignId: id,

                            fbAdsetId: adsetId,

                            ...(leadFormId && {fbLeadFormId: leadFormId})

                        })

                        await saveFbCampaignStructure({campaign, adset, lead_form})



                        success = success && !!result.success

                        campaignId = id

                    } else {

                        console.error('Error create campaign:', {

                            status: response.status,

                            statusText: response.statusText

                        })

                    }

                    const timestamp: string = new Date().toISOString();

                    const toolCallId = nanoid();

                    pushMessages([

                        {

                            id: nanoid(),

                            role: 'assistant',

                            content: [

                                {

                                    type: 'tool-call',

                                    toolName: 'createCampaign',

                                    toolCallId,

                                    args: {success, campaignName, campaignId, questionForBudget}

                                }

                            ],

                            timestamp

                        },

                        {

                            id: toolCallId,

                            role: 'tool',

                            content: [

                                {

                                    type: 'tool-result',

                                    toolName: 'createCampaign',

                                    toolCallId,

                                    result: {success, campaignName, campaignId, questionForBudget}

                                }

                            ],

                            timestamp

                        }

                    ])



                    return await createCampaignModule.component({

                        success,

                        campaignName,

                        campaignId,

                        adsetId,

                        questionForBudget

                    })

                }

            },

            showCampaignConnectionUI: {

                description: showCampaignConnectionUIModule.description,

                parameters: showCampaignConnectionUIModule.parameters,

                generate: async function* ({connectingUiProps}) {

                    console.log('tool call showCampaignConnectionUI')

                    yield (
                        <BotCard>
                            <p>Loading campaign connection interface...</p>
                        </BotCard>
                    )

                    const timestamp: string = new Date().toISOString();

                    const toolCallId = nanoid();

                    pushMessages([

                        {

                            id: nanoid(),

                            role: 'assistant',

                            content: [

                                {

                                    type: 'tool-call',

                                    toolName: 'showCampaignConnectionUI',

                                    toolCallId,

                                    args: {connectingUiProps}

                                }

                            ],

                            timestamp

                        },

                        {

                            id: toolCallId,

                            role: 'tool',

                            content: [

                                {

                                    type: 'tool-result',

                                    toolName: 'showCampaignConnectionUI',

                                    toolCallId,

                                    result: {connectingUiProps}

                                }

                            ],

                            timestamp

                        }

                    ])

                    // Import and use the server component for Campaign Connection
                    const showCampaignConnection = (await import('@/components/connect-campaign/server')).default;
                    return showCampaignConnection({connectingUiProps});

                }

            },

            showPlacementTargetingUI: {

                description: showPlacementTargetingUIModule.description,

                parameters: showPlacementTargetingUIModule.parameters,

                generate: async function* ({}) {

                    console.log('tool call showPlacementTargetingUI')

                    const timestamp: string = new Date().toISOString();

                    const toolCallId = nanoid();

                    pushMessages([

                        {

                            id: nanoid(),

                            role: 'assistant',

                            content: [

                                {

                                    type: 'tool-call',

                                    toolName: 'showPlacementTargetingUI',

                                    toolCallId,

                                    args: {}

                                }

                            ],

                            timestamp

                        },

                        {

                            id: toolCallId,

                            role: 'tool',

                            content: [

                                {

                                    type: 'tool-result',

                                    toolName: 'showPlacementTargetingUI',

                                    toolCallId,

                                    result: {}

                                }

                            ],

                            timestamp

                        }

                    ])



                    return await showPlacementTargetingUIModule.component({toolCallId})

                }

            },

            showGeographicalLocationUI: {

                description: showGeographicalLocationUIModule.description,

                parameters: showGeographicalLocationUIModule.parameters,

                generate: async function* ({}) {

                    const timestamp: string = new Date().toISOString();

                    const toolCallId = nanoid();

                    pushMessages([

                        {

                            id: nanoid(),

                            role: 'assistant',

                            content: [

                                {

                                    type: 'tool-call',

                                    toolName: 'showGeographicalLocationUI',

                                    toolCallId,

                                    args: {}

                                }

                            ],

                            timestamp

                        },

                        {

                            id: toolCallId,

                            role: 'tool',

                            content: [

                                {

                                    type: 'tool-result',

                                    toolName: 'showGeographicalLocationUI',

                                    toolCallId,

                                    result: {}

                                }

                            ],

                            timestamp

                        }

                    ])



                    return await showGeographicalLocationUIModule.component({toolCallId})

                }

            },

            showSuggestedFilters: {

                description: showSuggestedFiltersUIModule.description,

                parameters: showSuggestedFiltersUIModule.parameters,

                generate: async function* ({suggestedFitlers}) {

                    console.log('suggestedFitlers', suggestedFitlers)

                    const timestamp: string = new Date().toISOString()

                    const toolCallId = nanoid()

                    pushMessages([

                        {

                            id: nanoid(),

                            role: 'assistant',

                            content: [

                                {

                                    type: 'tool-call',

                                    toolName: 'showSuggestedFilters',

                                    toolCallId,

                                    args: {

                                        suggestedFitlers,

                                    }

                                }

                            ],

                            timestamp

                        },

                        {

                            id: toolCallId,

                            role: 'tool',

                            content: [

                                {

                                    type: 'tool-result',

                                    toolName: 'showSuggestedFilters',

                                    toolCallId,

                                    result: {

                                        suggestedFitlers

                                    }

                                }

                            ],

                            timestamp

                        }

                    ])



                    return showSuggestedFiltersUIModule.component({

                        suggestedFitlers,

                        toolCallId

                    })

                }

            },

            showSupervisedTaskUI: {

                description: showSupervisedTaskUIModule.description,

                parameters: showSupervisedTaskUIModule.parameters,

                generate: async function* ({task_name}) {

                    console.log('tool call showSupervisedTaskUI')

                    const timestamp: string = new Date().toISOString();

                    const toolCallId = nanoid();

                    const allMessages = aiState.get().messages as ExtractedMessage[];

                    const lastTwelveMessages = allMessages.slice(-12);

                    const extractedMessages = lastTwelveMessages.map((msg: ExtractedMessage) => {

                        const prefix = {

                            'user': 'User: ',

                            'system': 'System: ',

                            'assistant': 'Assistant: ',

                            'tool': 'Tool/UI Result: '

                        }[msg.role] || '';



                        // Handle content that might be an object

                        const messageContent = typeof msg.content === 'object'

                            ? JSON.stringify(msg.content)

                            : msg.content;



                        return {

                            ...msg,

                            content: `${prefix}${messageContent}`

                        };

                    });




                    yield(

                        <BotCard>

                            {/* <PlacementTargeting toolCallId={toolCallId}/> */}

                            <p className='mb-2'>Please wait we are processing your query.</p>

                        </BotCard>

                    )

                    const messages = extractedMessages.map(msg => (msg.content)) as string[];

                    await sendSupervisedTaskMail(

                        task_name,

                        messages,

                        session?.user.email,

                        getBaseUrl() + "/supervised/chat/" + chatId + "/task/" + toolCallId + "?user_email=" + session?.user.email  // TODO: Need to find better way to change this URL at one place if we change route of this task.

                    )



                    aiState.done({

                        ...aiState.get(),

                        messages: [

                            ...aiState.get().messages,

                            {

                                id: nanoid(),

                                role: 'assistant',

                                content: [

                                    {

                                        type: 'tool-call',

                                        toolName: 'showSupervisedTaskUI',

                                        toolCallId,

                                        args: {task_name}

                                    }

                                ],

                                timestamp

                            },

                            {

                                id: toolCallId,

                                role: 'tool',

                                content: [

                                    {

                                        type: 'tool-result',

                                        toolName: 'showSupervisedTaskUI',

                                        toolCallId,

                                        result: {

                                            task_name: task_name,

                                            content: "",

                                            status: "pending"

                                        }

                                    }

                                ],

                                timestamp

                            }

                        ]

                    })

                    return await showSupervisedTaskUIModule.component({})

                }

            },



            getAICampaignAnalysis: {

                description: getAICampaignAnalysisModule.description,

                parameters: getAICampaignAnalysisModule.parameters,

                generate: async function* ({campaignId, guideForUser}: { campaignId: string; guideForUser?: string }) {

                    yield (

                        <BotCard>

                            <StockSkeleton/>

                        </BotCard>

                    )



                    await sleep(1000)



                    const toolCallId = nanoid()



                    aiState.done({

                        ...aiState.get(),

                        messages: [

                            ...aiState.get().messages,

                            {

                                id: nanoid(),

                                role: 'assistant',

                                content: [

                                    {

                                        type: 'tool-call',

                                        toolName: 'getAICampaignAnalysis',

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

                                        toolName: 'getAICampaignAnalysis',

                                        toolCallId,

                                        result: {campaignId, guideForUser}

                                    }

                                ],

                                timestamp: new Date().toISOString()

                            }

                        ]

                    });



                    return await getAICampaignAnalysisModule.component({

                        campaignId,

                        guideForUser

                    })

                }

            },




            showAdsetConnectionUI: {

                description: showAdsetConnectionUIModule.description,

                parameters: showAdsetConnectionUIModule.parameters,

                generate: async function* ({}) {

                    console.log('tool call showAdsetConnectionUI')

                    const timestamp: string = new Date().toISOString();

                    const toolCallId = nanoid();

                    aiState.done({

                        ...aiState.get(),

                        messages: [

                            ...aiState.get().messages,

                            {

                                id: nanoid(),

                                role: 'assistant',

                                content: [

                                    {

                                        type: 'tool-call',

                                        toolName: 'showAdsetConnectionUI',

                                        toolCallId,

                                        args: {}

                                    }

                                ],

                                timestamp

                            },

                            {

                                id: toolCallId,

                                role: 'tool',

                                content: [

                                    {

                                        type: 'tool-result',

                                        toolName: 'showAdsetConnectionUI',

                                        toolCallId,

                                        result: {toolCallId}

                                    }

                                ],

                                timestamp

                            }

                        ]

                    })

                    return await showAdsetConnectionUIModule.component({

                        toolCallId

                    })

                }

            },

            showAdCreativesSwitcher: {

                description: 'Show a UI to manage ad creatives of the campaign',

                parameters: z.object({}),

                generate: async function* ({}) {

                    console.log('tool call showAdCreativesSwitcher')

                    const timestamp: string = new Date().toISOString();

                    const toolCallId = nanoid();

                    aiState.done({

                        ...aiState.get(),

                        messages: [

                            ...aiState.get().messages,

                            {

                                id: nanoid(),

                                role: 'assistant',

                                content: [

                                    {

                                        type: 'tool-call',

                                        toolName: 'showAdCreativesSwitcher',

                                        toolCallId,

                                        args: {}

                                    }

                                ],

                                timestamp

                            },

                            {

                                id: toolCallId,

                                role: 'tool',

                                content: [

                                    {

                                        type: 'tool-result',

                                        toolName: 'showAdCreativesSwitcher',

                                        toolCallId,

                                        result: {toolCallId}

                                    }

                                ],

                                timestamp

                            }

                        ]

                    })
                    
                    // Show directly in chat instead of sidebar
                    return (
                        <BotCard>
                            <div className="w-full max-h-[80vh] overflow-auto rounded-lg border border-gray-200 dark:border-gray-800 shadow-md">
                                <AdCreativesSwitcher />
                            </div>
                        </BotCard>
                    )

                }

            },

            showLeadsCountUI: {

                description: DownloadLeadsModule.description,

                parameters: DownloadLeadsModule.parameters,

                generate: async function* ({}) {

                    console.log('tool call showLeadsCountUI')

                    const timestamp: string = new Date().toISOString();

                    const toolCallId = nanoid();

                    aiState.done({

                        ...aiState.get(),

                        messages: [

                            ...aiState.get().messages,

                            {

                                id: nanoid(),

                                role: 'assistant',

                                content: [

                                    {

                                        type: 'tool-call',

                                        toolName: 'showLeadsCountUI',

                                        toolCallId,

                                        args: {}

                                    }

                                ],

                                timestamp

                            },

                            {

                                id: toolCallId,

                                role: 'tool',

                                content: [

                                    {

                                        type: 'tool-result',

                                        toolName: 'showLeadsCountUI',

                                        toolCallId,

                                        result: {toolCallId}

                                    }

                                ],

                                timestamp

                            }

                        ]

                    })

                    return await DownloadLeadsModule.component({

                        toolCallId

                    })

                }

            },

            showSupportUI: {
                description: supportModule.description,
                parameters: supportModule.parameters,
                generate: async function* ({title}) {
                    console.log("tool call showSupportUI")
                    
                    yield (
                        <BotCard>
                            <SpinnerMessage />
                        </BotCard>
                    )
                    
                    await sleep(1000)
                    
                    const toolCallId = nanoid()
                    const timestamp: string = new Date().toISOString()
                    
                    aiState.done({
                        ...aiState.get(),
                        messages: [
                            ...aiState.get().messages,
                            {
                                id: nanoid(),
                                role: "assistant",
                                content: [
                                    {
                                        type: "tool-call",
                                        toolName: "showSupportUI",
                                        toolCallId,
                                        args: {title}
                                    }
                                ],
                                timestamp
                            },
                            {
                                id: toolCallId,
                                role: "tool",
                                content: [
                                    {
                                        type: "tool-result",
                                        toolName: "showSupportUI",
                                        toolCallId,
                                        result: {title}
                                    }
                                ],
                                timestamp
                            }
                        ]
                    })
                    
                    const showSupportComponent = (await import("@/components/stocks/support/server")).default;
                    return showSupportComponent({
                        title
                    });
                }
            },
            
            showLeadNotifications: {
                description: leadNotificationsModule.description,
                parameters: leadNotificationsModule.parameters,
                generate: async function* ({toolCallId}) {
                    console.log("tool call showLeadNotifications")
                    
                    yield (
                        <BotCard>
                            <SpinnerMessage />
                        </BotCard>
                    )
                    
                    await sleep(1000)
                    
                    const generatedToolCallId = toolCallId || nanoid()
                    const timestamp: string = new Date().toISOString()
                    
                    pushMessages([
                        {
                            id: nanoid(),
                            role: "assistant",
                            content: [
                                {
                                    type: "tool-call",
                                    toolName: "showLeadNotifications",
                                    toolCallId: generatedToolCallId,
                                    args: { toolCallId: generatedToolCallId }
                                }
                            ],
                            timestamp
                        },
                        {
                            id: nanoid(),
                            role: "tool",
                            content: [
                                {
                                    type: "tool-result",
                                    toolName: "showLeadNotifications",
                                    toolCallId: generatedToolCallId,
                                    result: { toolCallId: generatedToolCallId }
                                }
                            ],
                            timestamp
                        }
                    ])
                    
                    // Create dynamic import for the sidebar component
                    const LeadNotificationsComponent = dynamic(() => 
                        import('@/lib/ui-magic/modules/showLeadNotificationsModule'), 
                        { ssr: false }
                    );
                    
                    // Return the sidebar component and a simple message in chat
                    return (
                        <>
                            <LeadNotificationsComponent />
                            <BotCard>
                                <p>Lead notification preferences are now available in the sidebar. You can select which campaigns you want to receive notifications for.</p>
                            </BotCard>
                        </>
                    )
                }
            },
            
            showCampaignOptimization: {
                description: campaignOptimizationModule.description,
                parameters: campaignOptimizationModule.parameters,
                generate: async function* ({toolCallId}) {
                    console.log("tool call showCampaignOptimization")
                    
                    yield (
                        <BotCard>
                            <SpinnerMessage />
                        </BotCard>
                    )
                    
                    await sleep(1000)
                    
                    const generatedToolCallId = toolCallId || nanoid()
                    const timestamp: string = new Date().toISOString()
                    
                    pushMessages([
                        {
                            id: nanoid(),
                            role: "assistant",
                            content: [
                                {
                                    type: "tool-call",
                                    toolName: "showCampaignOptimization",
                                    toolCallId: generatedToolCallId,
                                    args: { toolCallId: generatedToolCallId }
                                }
                            ],
                            timestamp
                        },
                        {
                            id: nanoid(),
                            role: "tool",
                            content: [
                                {
                                    type: "tool-result",
                                    toolName: "showCampaignOptimization",
                                    toolCallId: generatedToolCallId,
                                    result: { toolCallId: generatedToolCallId }
                                }
                            ],
                            timestamp
                        }
                    ])
                    
                    // Create dynamic import for the sidebar component
                    const CampaignOptimizationComponent = dynamic(() => 
                        import('@/lib/ui-magic/modules/showCampaignOptimizationModule'), 
                        { ssr: false }
                    );
                    
                    // Return the sidebar component and a simple message in chat
                    return (
                        <>
                            <CampaignOptimizationComponent />
                            <BotCard>
                                <p>Campaign optimization settings are now available in the sidebar. You can select which campaigns you want to enable automatic optimization for.</p>
                            </BotCard>
                        </>
                    )
                }
            }

        },



    });



    // Increment the message counter after successful processing
    await incrementUsageCounter('messages');

    return {
        id: nanoid(),
        display: result.value
    }

}