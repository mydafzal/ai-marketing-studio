import 'server-only'

import {createAI, createStreamableUI, createStreamableValue, getAIState, getMutableAIState} from 'ai/rsc'
import {BotCard, BotMessage, Purchase, SystemErrorMessage, SystemMessage} from '@/components/stocks'
import {Events} from '@/components/stocks/events'
import {AdTextSuggestion} from '@/components/stocks/ad-text-suggestion'
import {VideoAdTextSuggestion} from '@/components/stocks/video-ad-text-suggestion'
import {CampaignStatus} from '@/components/stocks/campaign-status'
import {fetchChatCampaignBudget, fetchChatFbAdsetId, saveChat, updateLeadFormInAdset} from '@/app/actions'
import {ChatImage} from '@/components/chat-images'
import {TextPart} from 'ai'
import {Stock} from '@/components/stocks/campaignresultsnew'

import {nanoid, runAsyncFnWithoutBlocking, sleep} from '@/lib/utils'
import {UserMessage} from '@/components/stocks/message'
import {Adset, Chat, LeadgenFrom, Message} from '@/lib/types';
import {auth} from '@/auth'
import {createCampaignAd} from '@/lib/api/fasty-bot/create-ad';
import {createCampaign} from '@/lib/api/fasty-bot/create-campaign'
import {CampaignSummary} from '@/lib/api/fasty-bot/get-campaign-summary'
import {createLeadgenForm} from '@/lib/api/fasty-bot/create-leadgen-form';
import {updateAdset} from '@/lib/api/fasty-bot/update-adset';
import {getCampaignIdFromUrl} from "@/lib/api/fasty-bot/helpers/campaign-id-from-url-helper";
import {getChatIdFromUrl} from "@/lib/api/fasty-bot/helpers/chat-id-from-url-helper";
import {ConnectCampaign} from '@/components/connect-campaign'
import {PlacementTargeting} from '@/components/placement-targeting';
import {ConnectAdset} from '@/components/connect-adset'
import FormBuilder from '@/components/form-builder';
import {GeographicalLocation} from '@/components/geographical-location';
import AdCreativesSwitcher from '@/components/ad-creatives-switcher'
import {SuggestedFilters} from '@/components/suggested-filters';
import SupervisedTaskMessage from '@/components/supervised-task-message'
import {
    confirmCampaignBudgetAction
} from "@/lib/chat/actions/Services/CampaignBudgetProcessor/confirmCampaignBudgetAction";
import {
    confirmCampaignStatusChange
} from "@/lib/chat/actions/Services/CampaignStatusUpdateProcessor/CampaignStatusUpdateProcessor";
import {submitUserMessage} from "@/lib/chat/actions/Services/UserMessageSubmitter/UserMesssageSubmitter";

interface ToolResult {
    toolName: string;
    toolCallId: string;
    result: any; // You might want to make this more specific based on your data
}

async function confirmCreateAd(campaign: any, data: any, adset: any) {
    'use server'
    const aiState = getMutableAIState<typeof AI>();
    let campaignId = await getCampaignIdFromUrl() || '0'; // for now just say you are updating even if no campaign id in place
    if (process.env.NEXT_PUBLIC_HARDCODED_MODE === '1') {
        campaignId = process.env.NEXT_PUBLIC_HARDCODED_CAMPAIGN_ID || '0'
    }
    let adsetUpdate = {
        ...adset
    }
    if (!campaign.daily_budget) {
        const chatId = getChatIdFromUrl()?.toString() || '';
        const budget = await fetchChatCampaignBudget(chatId) //TODO: remove hardcoded fallback budget setting as it will fail
        if (budget.error) {
            adsetUpdate = {...adsetUpdate, daily_budget: 100}
        }
    }

    const systemMessage = createStreamableUI(null)
    const fbAdIdStream: undefined | ReturnType<typeof createStreamableValue<string>> = createStreamableValue()

    runAsyncFnWithoutBlocking(async () => {
        await sleep(1000);

        const response = await createCampaignAd(
            campaignId,
            data,
            adsetUpdate
        );

        if (response) {
            const id = response?.params?.id
            fbAdIdStream?.done(`${id}`)

            systemMessage.done(
                <SystemMessage>
                    You have successfully created a campaign ad with ID: {response?.params?.id}
                </SystemMessage>
            );
            

        } else {
            systemMessage.done(
                <SystemMessage>
                    Error: Failed to create campaign ad. Please try again later.
                </SystemMessage>
            );
        }

        aiState.done({
            ...aiState.get(),
        });
    });

    return {
        newMessage: {
            id: nanoid(),
            display: systemMessage.value
        },
        fbAdIdStream: fbAdIdStream.value
    }
}

async function updateCampaignInfo(campaignSummary: CampaignSummary) {
    'use server'

    const aiState = getMutableAIState<typeof AI>();

    aiState.done({
        ...aiState.get(),
        messages: [
            {
                id: 'campaign-info-data',
                role: 'system',
                content: `Campaign is connected, the knowledge base about current campaign information: ${JSON.stringify(campaignSummary)}`,
                timestamp: new Date().toISOString()
            },
            ...aiState.get().messages.filter((message: Message) => message.id !== 'campaign-info-data' || message.role !== 'system'), //TODO: only pass last 50 messages or so. (enforce a limit)
        ]
    });
}

async function syncMessages() {
    'use server'

    const aiState = getMutableAIState<typeof AI>();
    console.log('syncMessages', aiState.get().messages[0])
    aiState.done({
        ...aiState.get(),
    });
}

async function confirmUpdateAdset(toolCallId: string, adsetId: string, adset: any) {
    'use server'
    const aiState = getMutableAIState<typeof AI>();
    const chatId = getChatIdFromUrl()?.toString() || ''

    const budget = await fetchChatCampaignBudget(chatId)
    let adsetUpdate = {...adset}
    if (budget.error) {
        adsetUpdate = {...adsetUpdate}
    }

    const systemMessage = createStreamableUI(null);
    const responseStream = createStreamableValue<Adset | boolean>(false);

    runAsyncFnWithoutBlocking(async () => {
        await sleep(1000);

        const response = await updateAdset(adsetId, adsetUpdate);
        if (response.success) {
            const messages = aiState.get().messages;
            const lastMessage = messages.slice(-1)[0];
            if (lastMessage && lastMessage.id === toolCallId && lastMessage.role === 'tool') {
                const content = lastMessage.content[0];
                if (
                    content.type === 'tool-result' &&
                    content.toolName === 'showPlacementTargetingUI'
                ) {
                    content.result = {
                        ...(content.result as Object),
                        targetingUiProps: (
                            content.result as {
                                targetingUiProps: object
                            }
                        ).targetingUiProps ?? {
                            success: true,
                            targeting: response?.data.targeting
                        }
                    }
                }
            }
            responseStream.done(response.data);
            aiState.done({
                ...aiState.get(),
                messages: [
                    ...messages.slice(0, -1),
                    lastMessage!
                ]
            })
            systemMessage.done(
                <SystemMessage>
                    You have successfully updated your targeting
                </SystemMessage>
            );
        } else {
            responseStream.done(false);
            systemMessage.done(
                <SystemErrorMessage>
                    Error: {response.data?.detail?.error?.error_user_msg || "Failed to updated placement targeting. Please try again later."}
                </SystemErrorMessage>
            );
        }
    })

    return {
        newMessage: {
            id: nanoid(),
            display: systemMessage.value
        },
        response: responseStream.value
    }
}

async function confirmCreateLeadgenForm(toolCallId: string, data: any) {
    'use server'
    const aiState = getMutableAIState<typeof AI>();
    const systemMessage = createStreamableUI(null);
    const responseStream = createStreamableValue<LeadgenFrom | boolean>(false);

    runAsyncFnWithoutBlocking(async () => {
        await sleep(1000);

        const response = await createLeadgenForm(data);
        let chatSlug = getChatIdFromUrl();
        if(chatSlug){
            let fbAdsetIdResponse = await fetchChatFbAdsetId(chatSlug);
            if(fbAdsetIdResponse.success){
                const adSetId = fbAdsetIdResponse.fbAdsetId as string;
                updateLeadFormInAdset(adSetId, response.id)
            }
        }
        if (response) {
            const messages = aiState.get().messages;
            const lastMessage = messages.slice(-1)[0];
            if (lastMessage && lastMessage.id === toolCallId && lastMessage.role === 'tool') {
                const content = lastMessage.content[0];
                if (
                    content.type === 'tool-result' &&
                    content.toolName === 'showFormBuilder'
                ) {
                    content.result = {
                        ...(content.result as Object),
                        formBuilderUiProps: (
                            content.result as {
                                formBuilderUiProps: object
                            }
                        ).formBuilderUiProps ?? {
                            success: true,
                            formBuilder: {...data, ...response}
                        }
                    }
                }
            }
            responseStream.done(response);
            aiState.done({
                ...aiState.get(),
                messages: [
                    ...messages.slice(0, -1),
                    lastMessage!
                ]
            })
            systemMessage.done(
                <SystemMessage>
                    You have successfully create leadgen form
                </SystemMessage>
            );
        } else {
            responseStream.done(false);
            systemMessage.done(
                <SystemErrorMessage>
                    Error: {response?.detail?.error?.error_user_msg || "Failed to create leadgen form. Please try again later."}
                </SystemErrorMessage>
            );
        }
    })

    return {
        newMessage: {
            id: nanoid(),
            display: systemMessage.value
        },
        response: responseStream.value
    }
}

export type AIState = {
    chatId: string
    title: string
    messages: Message[]
}

export type UIState = {
    id: string
    display: React.ReactNode
}[]

export const AI = createAI<AIState, UIState>({
    actions: {
        submitUserMessage,
        confirmCampaignBudgetAction,
        confirmCampaignStatusChange,
        confirmCreateAd,
        updateCampaignInfo,
        syncMessages,
        confirmUpdateAdset,
        confirmCreateLeadgenForm,
    },
    initialUIState: [],
    initialAIState: {chatId: nanoid(), title: '', messages: []},
    onGetUIState: async () => {
        'use server'

        const session = await auth()

        if (session && session.user) {
            const aiState = getAIState() as Chat

            if (aiState) {
                return getUIStateFromAIState(aiState)
            }
        } else {
            return
        }
    },
    onSetAIState: async ({state}) => {
        'use server'

        const session = await auth()

        if (session && session.user) {
            const {chatId, title, messages} = state

            const createdAt = new Date()
            const userId = session.user.id as string
            const path = `/chat/${chatId}`

            const firstMessageContent = (Array.isArray(messages[0].content) ? (messages[0].content[0] as TextPart).text : messages[0].content) as string

            const defaultTitle = firstMessageContent.substring(0, 100)

            const chat: Chat = {
                id: chatId,
                title: title || defaultTitle,
                userId,
                createdAt,
                messages,
                path
            }

            await saveChat(chat)
        } else {
            return
        }
    }
})

function isToolResultArray(content: string | ToolResult[]): content is ToolResult[] {
    return Array.isArray(content);
}

export const getUIStateFromAIState = (aiState: Chat) => {
    return aiState.messages
        .filter((message: Message) => message.role !== 'system')
        .map((message: Message, index: number) => ({
            id: `${aiState.chatId}-${index}`,
            display:
                message.role === 'tool' && isToolResultArray(message.content) ? (
                    message.content.map((tool: ToolResult) => {
                        switch (tool.toolName) {
                            // case 'listAds':
                            //     return (
                            //         <BotCard key={tool.toolCallId}>
                            //             <Stocks props={tool.result}/>
                            //         </BotCard>
                            //     );
                            case 'showStockPrice':
                                case 'getCampaignResults':
                                    return (
                                        <>
                                            <BotCard key={tool.toolCallId}>
                                                <Stock campaignId={tool.result.campaignId} isActive />
                                            </BotCard>
                                            <div className="my-4">
                                                {tool.result.guideForUser ?? ''}
                                            </div>
                                        </>
                                    );
                                
                            case 'showAdBudgetUI':
                                return (
                                    <>
                                        <BotCard key={tool.toolCallId}>
                                            <Purchase props={tool.result}/>
                                        </BotCard>
                                        <div className="my-4">
                                            {tool.result.guideForUser ?? ''}
                                        </div>
                                    </>
                                );
                            case 'getEvents':
                                return (
                                    <BotCard key={tool.toolCallId}>
                                        <Events props={tool.result}/>
                                    </BotCard>
                                );
                            case 'showSuggestionAdText':
                                return (
                                    <>
                                        <BotCard key={tool.toolCallId}>
                                            <AdTextSuggestion props={tool.result.images}/>
                                        </BotCard>
                                        <div className="my-4">
                                            {tool.result.guideForUser ?? ''}
                                        </div>
                                    </>
                                );
                            case 'showVideoAdTextSuggestion':
                                return (
                                    <>
                                        <BotCard key={tool.toolCallId}>
                                            <VideoAdTextSuggestion {...tool.result} />
                                        </BotCard>
                                        <div className="my-4">
                                            {tool.result.guideForUser ?? ''}
                                        </div>
                                    </>
                                )
                            case 'getCampaignImages':
                                return (
                                    <BotCard key={tool.toolCallId}>
                                        <ChatImage/>
                                    </BotCard>
                                );
                            case 'showCampaignNameUpdateUI':
                                return (
                                    <BotCard key={tool.toolCallId}>
                                        <p className="mb-2 last:mb-0">{`Alright, I will update campaign name as "${tool.result.campaignName}".`}</p>
                                        {!!tool.result.questionForBudget &&
                                            <p className="mb-2 last:mb-0">{tool.result.questionForBudget}</p>}
                                    </BotCard>
                                )
                            case 'createCampaign':
                                return tool.result.success ? (
                                    <BotCard key={tool.toolCallId}>
                                        <p className="mb-2 last:mb-0">{`I created a campaign named "${tool.result.campaignName}".`}</p>
                                        {!!tool.result.questionForBudget &&
                                            <p className="mb-2 last:mb-0">{tool.result.questionForBudget}</p>}
                                    </BotCard>
                                ) : (
                                    <BotCard>
                                        <p className="mb-2 last:mb-0">Campaign creation failed, please try again
                                            later.</p>
                                    </BotCard>
                                )
                            case 'showUpdateStatusCampaign':
                                return (
                                    <BotCard key={tool.toolCallId}>
                                        <CampaignStatus
                                            props={{
                                                toolCallId: tool.toolCallId,
                                                campaignName:
                                                tool.result.campaignName,
                                                status: tool.result.status
                                            }}
                                        />
                                    </BotCard>
                                )
                            case 'showCampaignConnectionUI':
                                return (
                                    <BotCard key={tool.toolCallId}>
                                        <ConnectCampaign {...tool.result} />
                                    </BotCard>
                                )
                            case 'showAdsetConnectionUI':
                                return (
                                    <BotCard key={tool.toolCallId}>
                                        <ConnectAdset {...tool.result} toolCallId={tool.toolCallId}/>
                                    </BotCard>
                                )
                            case 'showPlacementTargetingUI':
                                return (
                                    <BotCard key={tool.toolCallId}>
                                        <PlacementTargeting {...tool.result} toolCallId={tool.toolCallId}/>
                                    </BotCard>
                                )
                            case 'showFormBuilder':
                                return (
                                    <BotCard key={tool.toolCallId}>
                                        <FormBuilder {...tool.result} toolCallId={tool.toolCallId} isReadOnly/>
                                    </BotCard>
                                )    
                            case 'showGeographicalLocationUI':
                                return (
                                    <BotCard key={tool.toolCallId}>
                                        <GeographicalLocation
                                          toolCallId={tool.toolCallId}
                                          uiProps={tool.result.uiProps}
                                          isReadOnly={!!tool.result.uiProps}
                                        />
                                    </BotCard>
                                ) 
                            case 'showSuggestedFilters':
                                return (
                                    <BotCard key={tool.toolCallId}>
                                        <SuggestedFilters toolCallId={tool.toolCallId} suggestedFitlers={tool.result.suggestedFitlers} uiProps={tool.result.uiProps} isReadOnly  />
                                    </BotCard>
                                )    
                            case 'showGeographicalLocationUI':
                                return (
                                    <BotCard key={tool.toolCallId}>
                                        <GeographicalLocation
                                          toolCallId={tool.toolCallId}
                                          uiProps={tool.result.uiProps}
                                          isReadOnly={!!tool.result.uiProps}
                                        />
                                    </BotCard>
                                ) 
                            case 'showSuggestedFilters':
                                return (
                                    <BotCard key={tool.toolCallId}>
                                        <SuggestedFilters toolCallId={tool.toolCallId} suggestedFitlers={tool.result.suggestedFitlers} uiProps={tool.result.uiProps} isReadOnly  />
                                    </BotCard>
                                )
                            case 'showSupervisedTaskUI':
                                return (
                                    <>
                                        <BotCard>
                                            <SupervisedTaskMessage result={tool.result}/>
                                        </BotCard>
                                    </>
                                );
                            case 'showAdCreativesSwitcher':
                                return (
                                    <BotCard key={tool.toolCallId}>
                                        <AdCreativesSwitcher {...tool.result} toolCallId={tool.toolCallId} />
                                    </BotCard>
                                )
                            default:
                                return null;
                        }
                    })
                ) : message.role === 'user' ? (
                    <UserMessage
                        userContent={message.content}>{(Array.isArray(message.content) ? (message.content[0] as TextPart).text : message.content) as string}</UserMessage>
                ) : message.role === 'assistant' &&
                typeof message.content === 'string' ? (
                    <BotMessage content={message.content}/>
                ) : null
        }))
        .filter((message: { id: string, display: any }) => Boolean(message.display))
}