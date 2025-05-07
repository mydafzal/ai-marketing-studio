import { NextResponse } from 'next/server'
import { getFbMarketingApiKey } from '@/app/actions';
import { auth } from '@/auth'
import { trackEvent } from '@/lib/utils';
import { Events } from '@/lib/posthog-events';
import { encryptEmail } from '@/lib/email-encryption';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url)
    const fbAccountId = searchParams.get('fb_account_id')

    if (!fbAccountId) {
        return NextResponse.json({ error: 'fbAccountId is required' }, { status: 400 })
    }

    const fastyEndpoint = process.env.FASTY_API_URL
    const apiUrl = `${fastyEndpoint}/facebook/read/insights/get-campaigns?account_id=${fbAccountId}`

    // Get the user's Facebook token
    const token_resp = await getFbMarketingApiKey()
    let token = ""
    
    // If the user has a token, use it
    if(token_resp.success && token_resp.token){
        token = token_resp.token
    }
    
    // For admin-assigned accounts, don't send any token at all
    // The Fasty backend will use its system token
    const headers: Record<string, string> = {
        'Authorization': `Bearer ${process.env.FASTY_API_TOKEN}`
    };
    
    // Only add the fb-api-key header if we have a token
    if (token) {
        headers['fb-api-key'] = token;
    }

    try {
        const response = await fetch(apiUrl, { headers })

        if (!response.ok) {
            console.error(`HTTP error! status: ${response.status}`);
            return NextResponse.json({ error: 'Failed to fetch campaigns' }, { status: response.status });
        }

        const data = await response.json()
        const session = await auth()
        const encryptedEmail = await encryptEmail(session?.user?.email || '');

        trackEvent(Events.CAMPAIGN_LIST_FETCHED, {
            email: encryptedEmail,
            id: session?.user?.id || ''
          })
        return NextResponse.json(data)
    } catch (error) {
        console.error('Error fetching campaigns:', error)
        return NextResponse.json({ error: 'Failed to fetch campaigns' }, { status: 500 })
    }
}