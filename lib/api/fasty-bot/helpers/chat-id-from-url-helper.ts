import type {NEXT_DATA} from 'next/dist/shared/lib/utils';

export function getChatIdFromUrl(): string | undefined {
    let chatId: string | null = null;

    // Try to get chatId in different environments
    if (typeof window !== 'undefined') {
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

    return chatId;
}