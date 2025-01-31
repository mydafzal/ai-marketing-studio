import 'server-only'

import {createAI, createStreamableUI, createStreamableValue, getAIState, getMutableAIState} from 'ai/rsc'
import {SystemErrorMessage, SystemMessage} from '@/components/stocks'
import {fetchChatFbAdsetId, saveChat, updateLeadFormInAdset} from '@/app/actions'
import {TextPart} from 'ai'

import {nanoid, runAsyncFnWithoutBlocking, sleep} from '@/lib/utils'
import {Chat, LeadgenFrom, Message} from '@/lib/types';
import {auth} from '@/auth'
import {CampaignSummary} from '@/lib/api/fasty-bot/get-campaign-summary'
import {createLeadgenForm} from '@/lib/api/fasty-bot/create-leadgen-form';
import {getChatIdFromUrl} from "@/lib/api/fasty-bot/helpers/chat-id-from-url-helper";
import {
    confirmCampaignBudgetAction
} from "@/lib/chat/actions/Services/CampaignBudgetProcessor/confirmCampaignBudgetAction";
import {
    confirmCampaignStatusChange
} from "@/lib/chat/actions/Services/CampaignStatusUpdateProcessor/CampaignStatusUpdateProcessor";
import {submitUserMessage} from "@/lib/chat/actions/Services/UserMessageSubmitter/UserMesssageSubmitter";
import {getUIStateFromAIState} from "@/lib/chat/actions/Services/FetchApplicableUI/FetchApplicableUI";
import {confirmUpdateAdset} from "@/lib/chat/actions/Services/AdPlacementProcessor/AdPlacementProcessor";
import {confirmCreateAd} from "@/lib/chat/actions/Services/AdCreator/AdCreator";

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