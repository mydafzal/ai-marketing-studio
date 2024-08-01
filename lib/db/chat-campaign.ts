import {queryDB, queryDBResult} from './connection-handler';

export function saveChatToDB(chatId: string, userId: string, email: string) {
  queryDB(
    'INSERT INTO chat_campaign (chat_id, user_id, email, created_at, updated_at) VALUES ($1, $2, $3, $4, $5) ON CONFLICT (chat_id) DO NOTHING;',
    [chatId, userId, email, new Date(), new Date()]
  );
};

export function deleteChatToDB(chatId: string) {
  queryDB(
    'UPDATE chat_campaign set updated_at = $1, is_deleted = $2 WHERE chat_id = $3;',
    [new Date(), true, chatId]
  );
};

export async function getCampaignIdFromChatIdDB(
  chatId: string
): Promise<string | null> {
  const result = await queryDBResult(
    'SELECT * FROM chat_campaign WHERE chat_id = $1;',
    [chatId]
  );
  if (result?.rows && result?.rows?.length > 0) {
    return result.rows[0].campaign_id?.toString();
  }
  return null;
};
