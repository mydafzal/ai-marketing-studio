import "server-only"

import { createAI, getAIState } from "ai/rsc"
import { saveChat } from "@/app/actions"

import { nanoid } from "@/lib/utils"
import { Chat, Message } from "@/lib/types"
import { auth } from "@/auth"

// Existing imports for your server actions
import { confirmCampaignBudgetAction } from "@/lib/chat/actions/Services/CampaignBudgetProcessor/confirmCampaignBudgetAction"
import { confirmCampaignStatusChange } from "@/lib/chat/actions/Services/CampaignStatusUpdateProcessor/CampaignStatusUpdateProcessor"
import { submitUserMessage } from "@/lib/chat/actions/Services/UserMessageSubmitter/UserMesssageSubmitter"
import { getUIStateFromAIState } from "@/lib/chat/actions/Services/FetchApplicableUI/FetchApplicableUI"
import { confirmUpdateAdset } from "@/lib/chat/actions/Services/AdSetUpdateProcessor/AdSetUpdateProcessor"
import { confirmCreateAd } from "@/lib/chat/actions/Services/AdCreator/AdCreator"
import { confirmCreateLeadgenForm } from "@/lib/chat/actions/Services/LeadGenFormProcessor/LeadGenFormProcessor"
import { syncMessages } from "@/lib/chat/actions/Services/AIDoneStateMessageSyncer/AIDoneStateMessageSyncer"
import { updateCampaignInfo } from "@/lib/chat/actions/Services/AIDoneStateCampaignStatsEnricher/AIDoneStateCampaignStatsEnricher"
import { buildChatObject } from "@/lib/chat/actions/Services/ChatObjectBuilder/ChatObjectBuilder"

// Existing UI tool
import showAdCreativesSwitcher from "@/components/ad-creatives-switcher"

// NEW: import our tools
import showAiVideoGenerator from "@/components/stocks/ai-video-generator/server"
import showCreateCampaignScreen from "@/components/stocks/create-campaign-screen/server"

export type AIState = {
  chatId: string
  title: string
  messages: Message[]
}

export type UIState = {
  id: string
  display: React.ReactNode
}[]

/**
 * Creates and returns the initial AI state for a new chat session.
 */
function createInitialChatState(): AIState {
  return {
    chatId: nanoid(),
    title: "",
    messages: []
  }
}

/**
 * Creates and returns the initial UI state.
 */
function createInitialUIState(): UIState {
  return []
}

/**
 * Aggregates and returns all available server actions for the AI flow.
 * Each action is responsible for a distinct part of the chat workflow.
 */
function defineChatActions() {
  return {
    submitUserMessage,
    confirmCampaignBudgetAction,
    confirmCampaignStatusChange,
    confirmCreateAd,
    updateCampaignInfo,
    syncMessages,
    confirmUpdateAdset,
    confirmCreateLeadgenForm,

    // Existing example
    showAdCreativesSwitcher,

    // AI Video Generator
    showAiVideoGenerator: async () => {
      return showAiVideoGenerator()
    },

    // NEW: Campaign Creation Tool
    showCreateCampaignScreen: async () => {
      return showCreateCampaignScreen()
    }
  }
}

/**
 * Retrieves the current UI state based on the existing AI state.
 * This operation is performed on the server and requires an authenticated user.
 */
async function retrieveChatUIState() {
  "use server"

  const session = await auth()
  if (session && session.user) {
    const aiState = getAIState() as Chat
    if (aiState) {
      return getUIStateFromAIState(aiState)
    }
  }
  // Return undefined if no valid session or no AI state
  return undefined
}

/**
 * Persists the updated AI state by saving the chat data.
 * This operation is performed on the server and requires an authenticated user.
 */
async function persistChatState({ state }: { state: AIState }) {
  "use server"

  const session = await auth()
  if (session?.user) {
    const chat = buildChatObject(session.user.id as string, state)
    await saveChat(chat)
  }
}

export const AI = createAI<AIState, UIState>({
  actions: defineChatActions(),
  initialUIState: createInitialUIState(),
  initialAIState: createInitialChatState(),
  onGetUIState: retrieveChatUIState,
  onSetAIState: persistChatState
})