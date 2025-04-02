import { NextResponse } from 'next/server'
import { getFbMarketingApiKey } from '@/app/actions';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url)
    const campaign_id = searchParams.get('campaign_id')
    const timeline = searchParams.get('timeline')

    if (!campaign_id || !timeline) {
        return NextResponse.json({ error: 'Campaign ID and timeline are required' }, { status: 400 })
    }

    const fastyEndpoint = process.env.FASTY_API_URL
    const apiUrl = `${fastyEndpoint}/facebook/read/insights/get-campaign-historical-leads-results?campaign_id=${campaign_id}&timeline=${timeline}`


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
            return NextResponse.json({
                campaign_id,
                timeline,
                lead_results: []
            }, { status: response.status });
        }

        const data = await response.json()
        return NextResponse.json(data)
    } catch (error) {
        console.error('Error fetching historical leads data:', error)
        return NextResponse.json({
            campaign_id,
            timeline,
            lead_results: []
        }, { status: 500 })
    }
}