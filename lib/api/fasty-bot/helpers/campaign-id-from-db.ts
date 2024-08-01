'use server'

import { getCampaignIdFromChatIdDB } from '@/lib/db/chat-campaign'

export async function getCampaignIdFromDB(chatId: string) {
  return await getCampaignIdFromChatIdDB(chatId)
}
