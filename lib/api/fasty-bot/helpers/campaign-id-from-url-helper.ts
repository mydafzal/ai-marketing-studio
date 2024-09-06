import type {NEXT_DATA} from 'next/dist/shared/lib/utils';

interface CampaignIdResult {
    success?: boolean;
    fbCampaignId?: string | {};
    error?: string;
}

async function fetchCampaignId(chatId: string, isServer: boolean): Promise<string | undefined> {
    if (isServer) {
        // Server-side fetch
        const {fetchChatFbCampaignId} = await import('@/app/actions');
        try {
            const result: CampaignIdResult = await fetchChatFbCampaignId(chatId);
            console.log('chatId', chatId)
            console.log('result', result)
            if (result.success && typeof result.fbCampaignId === 'string') {
                return result.fbCampaignId;
            } else {
                console.warn(`No valid campaign ID found for chat ID: ${chatId}`);
                return undefined;
            }
        } catch (error) {
            console.error(`Server-side error fetching campaign ID for chat ID ${chatId}:`, error);
            return undefined;
        }
    } else {
        // Client-side fetch
        try {
            const response = await fetch(`/api/admin/fetch-chat-fb-campaign-id?chatSlug=${chatId}`);
            const result: CampaignIdResult = await response.json();
            console.log('chatId', chatId)
            console.log('result', result)
            if (result.success && typeof result.fbCampaignId === 'string') {
                return result.fbCampaignId;
            } else {
                console.warn(`No valid campaign ID found for chat ID: ${chatId}`);
                return undefined;
            }
        } catch (error) {
            console.error(`Client-side error fetching campaign ID for chat ID ${chatId}:`, error);
            return undefined;
        }
    }
}

export async function getCampaignIdFromUrl(): Promise<string | undefined> {
    let chatId: string | null = null;
    const isServer = typeof window === 'undefined';

    // Try to get chatId in different environments
    if (!isServer) {
        // Client-side
        const match = window.location.pathname.match(/\/chat\/([^\/]+)/);
        chatId = match ? match[1] : null;
    } else {
        // Server-side
        try {
            // For Next.js App Router
            const {headers} = require('next/headers');
            const headersList = headers();
            const referer = headersList.get('referer') || headersList.get('x-invoke-path') || '';
            const url = new URL(referer, 'http://dummy.com'); // Using a dummy base URL
            const match = url.pathname.match(/\/chat\/([^\/]+)/);
            chatId = match ? match[1] : null;
        } catch (error) {
            // For Next.js Pages Router or if headers() fails
            if (typeof globalThis !== 'undefined' && 'window' in globalThis) {
                const nextData = (globalThis as any).__NEXT_DATA__ as NEXT_DATA | undefined;
                const req = nextData?.props?.pageProps?.['__N_REDIRECT'] as string | undefined;
                if (req) {
                    const match = req.match(/\/chat\/([^\/]+)/);
                    chatId = match ? match[1] : null;
                }
            }
        }
    }

    if (!chatId) {
        console.warn('No chat ID found in the URL');
        return undefined;
    }

    return fetchCampaignId(chatId, isServer);
}