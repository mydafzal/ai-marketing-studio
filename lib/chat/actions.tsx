import 'server-only'

import {createAI, getAIState, getMutableAIState} from 'ai/rsc'
import {saveChat} from '@/app/actions'
import {TextPart} from 'ai'

import {nanoid} from '@/lib/utils'
import {Chat, Message} from '@/lib/types';
import {auth} from '@/auth'
import {CampaignSummary} from '@/lib/api/fasty-bot/get-campaign-summary'
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
import {confirmCreateLeadgenForm} from "@/lib/chat/actions/Services/LeadGenFormProcessor/LeadGenFormProcessor";
import {syncMessages} from "@/lib/chat/actions/Services/AIDoneStateMessageSyncer/AIDoneStateMessageSyncer";
import {updateCampaignInfo} from "@/lib/chat/actions/Services/AIDoneStateCampaignStatsEnricher/AIDoneStateCampaignStatsEnricher";

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