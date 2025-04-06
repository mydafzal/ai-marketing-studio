import {NextResponse} from 'next/server'
import { getFbMarketingApiKey } from '@/app/actions';

export async function POST(request: Request) {
    try {
        const {campaign_id, status} = await request.json()

        if (!campaign_id || status === undefined) {
            return NextResponse.json({error: 'Campaign ID and status are required'}, {status: 400})
        }

        const fastyEndpoint = process.env.FASTY_API_URL
        const apiUrl = `${fastyEndpoint}/facebook/exec/direct/adjust-campaign/set-status`

        // Get the user's Facebook token
        const token_resp = await getFbMarketingApiKey()
        let token = ""
        
        // If the user has a token, use it
        if(token_resp.success && token_resp.token){
            token = token_resp.token
        }
        
        // Prepare headers - for admin-assigned accounts, don't send any token
        // The Fasty backend will use its system token
        const headers: Record<string, string> = {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${process.env.FASTY_API_TOKEN}`
        };
        
        // Only add the fb-api-key header if we have a token
        if (token) {
            headers['fb-api-key'] = token;
        }
        
        const response = await fetch(apiUrl, {
            method: 'POST',
            headers,
            body: JSON.stringify({
                campaign_id,
                status
            })
        })

        if (!response.ok) {
            const errorBody = await response.text()
            console.error('Error setting status:', {
                status: response.status,
                statusText: response.statusText,
                body: errorBody
            })
            return NextResponse.json({success: false}, {status: response.status})
        }

        return NextResponse.json({success: true})
    } catch (error) {
        console.error('Error setting status:', error)
        return NextResponse.json({success: false}, {status: 500})
    }
}