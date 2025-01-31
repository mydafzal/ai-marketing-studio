import 'server-only'

import {createAI, createStreamableUI, createStreamableValue, getAIState, getMutableAIState} from 'ai/rsc'
import {SystemErrorMessage, SystemMessage} from '@/components/stocks'
import {fetchChatCampaignBudget, fetchChatFbAdsetId, saveChat, updateLeadFormInAdset} from '@/app/actions'
import {TextPart} from 'ai'

import {nanoid, runAsyncFnWithoutBlocking, sleep} from '@/lib/utils'
import {Adset, Chat, LeadgenFrom, Message} from '@/lib/types';
import {auth} from '@/auth'
import {createCampaignAd} from '@/lib/api/fasty-bot/create-ad';
import {CampaignSummary} from '@/lib/api/fasty-bot/get-campaign-summary'
import {createLeadgenForm} from '@/lib/api/fasty-bot/create-leadgen-form';
import {updateAdset} from '@/lib/api/fasty-bot/update-adset';
import {getCampaignIdFromUrl} from "@/lib/api/fasty-bot/helpers/campaign-id-from-url-helper";
import {getChatIdFromUrl} from "@/lib/api/fasty-bot/helpers/chat-id-from-url-helper";
import {
    confirmCampaignBudgetAction
} from "@/lib/chat/actions/Services/CampaignBudgetProcessor/confirmCampaignBudgetAction";
import {
    confirmCampaignStatusChange
} from "@/lib/chat/actions/Services/CampaignStatusUpdateProcessor/CampaignStatusUpdateProcessor";
import {submitUserMessage} from "@/lib/chat/actions/Services/UserMessageSubmitter/UserMesssageSubmitter";
import {getUIStateFromAIState} from "@/lib/chat/actions/Services/FetchApplicableUI/FetchApplicableUI";

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