import {NextResponse} from 'next/server'
import { getFbMarketingApiKey } from '@/app/actions';
import { auth } from '@/auth';
 import { encryptEmail } from '@/lib/email-encryption';
import { Events } from '@/lib/posthog-events';
import { trackEvent } from '@/lib/utils';

export async function POST(request: Request) {
    try {
        const {campaign_id, daily_budget} = await request.json()

        if (!campaign_id || daily_budget === undefined) {
            return NextResponse.json({error: 'Campaign ID and daily budget are required'}, {status: 400})
        }

        const fastyEndpoint = process.env.FASTY_API_URL
        const apiUrl = `${fastyEndpoint}/facebook/exec/direct/adjust-campaign/set-daily-budget`

        const token_resp = await getFbMarketingApiKey()
        let token=""
        if(token_resp.success && token_resp.token){
            token=token_resp.token
        }



        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${process.env.FASTY_API_TOKEN}`,
                'fb-api-key': token

            },
            body: JSON.stringify({
                campaign_id,
                daily_budget
            })
        })

        if (!response.ok) {
            const errorBody = await response.text()
            console.error('Error setting daily budget:', {
                status: response.status,
                statusText: response.statusText,
                body: errorBody
            })
            return NextResponse.json({success: false}, {status: response.status})
        }

        const session = await auth()
        const encryptedEmail = await encryptEmail(session?.user?.email || '');

        trackEvent(Events.BUDGET_CHANGED, {
            email: encryptedEmail,
            id: session?.user?.id || ''
          })

        return NextResponse.json({success: true})
    } catch (error) {
        console.error('Error setting daily budget:', error)
        return NextResponse.json({success: false}, {status: 500})
    }
}