import { NextResponse } from 'next/server'
import { getFbMarketingApiKey } from '@/app/actions';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url)
    const campaign_id = searchParams.get('campaign_id')

    if (!campaign_id) {
        return NextResponse.json({ error: 'Campaign ID is required' }, { status: 400 })
    }

    const fastyEndpoint = process.env.FASTY_API_URL
    const apiUrl = `${fastyEndpoint}/facebook/read/insights/get-campaign-total-summary?campaign_id=${campaign_id}`

    const token_resp = await getFbMarketingApiKey()
    let token=""
    if(token_resp.success && token_resp.token){
        token=token_resp.token
    }

    try {
        const response = await fetch(apiUrl, {
            headers: {
                'Authorization': `Bearer ${process.env.FASTY_API_TOKEN}`,
                'fb-api-key': token
            }
        })

        if (!response.ok) {
            console.error(`HTTP error! status: ${response.status}`);
            return NextResponse.json({ error: 'Failed to fetch campaign summary' }, { status: response.status });
        }

        const data = await response.json()
        return NextResponse.json(data)
    } catch (error) {
        console.error('Error fetching campaign summary:', error)
        return NextResponse.json({ error: 'Failed to fetch campaign summary' }, { status: 500 })
    }
}