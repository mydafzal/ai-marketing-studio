import chatToCampaignMapping from "@/lib/api/fasty-bot/helpers/campaign-id-list";
import { getBaseUrl } from '@/lib/helpers/vercel/get-base-url';

/**
 * Fetches the campaign ID based on the chat ID in the current URL.
 *
 * @param {string} [path] - Optional path to use instead of the current URL.
 * @returns {string|null} The campaign ID if found, or null if not found.
 */
export function getCampaignIdFromUrl(path?: string): string | null {
    // Get the base URL
    const baseUrl = getBaseUrl();

    // If a path is provided, use it; otherwise, use the current URL path
    const fullUrl = path ? `${baseUrl}${path}` : (typeof window !== 'undefined' ? window.location.href : baseUrl);

    // Extract the chat ID from the URL
    const chatId = getChatIdFromUrl(fullUrl);

    if (!chatId) {
        console.warn('No chat ID found in the URL');
        return null;
    }

    // Use the chat ID to get the campaign ID
    const campaignId = chatToCampaignMapping[chatId];

    if (!campaignId) {
        console.warn(`No campaign ID found for chat ID: ${chatId}`);
        return null;
    }

    return campaignId;
}

/**
 * Extracts the chat ID from the provided URL.
 * Expects a URL pattern like: http://localhost:3000/chat/CUkwQxT
 *
 * @param {string} url - The full URL from which to extract the chat ID.
 * @returns {string|null} The chat ID if found, or null if not found.
 */
function getChatIdFromUrl(url: string): string | null {
    const parsedUrl = new URL(url);
    const pathParts = parsedUrl.pathname.split('/');

    // The chat ID should be the last part of the path
    const chatId = pathParts[pathParts.length - 1];

    if (chatId && chatId.length > 0) {
        return chatId;
    } else {
        console.warn('No chat ID found in the URL');
        return null;
    }
}