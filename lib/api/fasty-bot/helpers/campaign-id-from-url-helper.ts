import chatToCampaignMapping from "@/lib/api/fasty-bot/helpers/campaign-id-list";

/**
 * Fetches the campaign ID based on the chat ID in the current URL.
 *
 * @returns {string|null} The campaign ID if found, or null if not found.
 */
export function getCampaignIdFromUrl(): string | null {
    if (typeof window === 'undefined') {
        console.warn('This function is intended to run in a browser environment.');
        return null;
    }

    // First, get the chat ID from the URL
    const chatId = getChatIdFromUrl();

    if (!chatId) {
        console.warn('No chat ID found in the URL');
        return null;
    }

    // Then, use the chat ID to get the campaign ID
    const campaignId = chatToCampaignMapping[chatId];

    if (!campaignId) {
        console.warn(`No campaign ID found for chat ID: ${chatId}`);
        return null;
    }

    return campaignId;
}

/**
 * Extracts the chat ID from the current URL.
 * Expects a URL pattern like: http://localhost:3000/chat/CUkwQxT
 *
 * @returns {string|null} The chat ID if found, or null if not found.
 */
function getChatIdFromUrl(): string | null {
    const path = window.location.pathname;
    const pathParts = path.split('/');

    // The chat ID should be the last part of the path
    const chatId = pathParts[pathParts.length - 1];

    if (chatId && chatId.length > 0) {
        return chatId;
    } else {
        console.warn('No chat ID found in the URL');
        return null;
    }
}