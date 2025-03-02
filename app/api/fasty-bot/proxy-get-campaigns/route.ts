import { NextResponse } from 'next/server'
import { getFbMarketingApiKey } from '@/app/actions';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url)
    const fbAccountId = searchParams.get('fb_account_id')

    if (!fbAccountId) {
        return NextResponse.json({ error: 'fbAccountId is required' }, { status: 400 })
    }

    const fastyEndpoint = process.env.FASTY_API_URL
    const apiUrl = `${fastyEndpoint}/facebook/read/insights/get-campaigns?account_id=${fbAccountId}`


    const token_resp = await getFbMarketingApiKey()
    let token=""
    if(token_resp.success && token_resp.token){
        token=token_resp.token
    }

    console.log(process.env.FASTY_API_TOKEN)


    try {
        const response = await fetch(apiUrl, {
            headers: {
                'Authorization': `Bearer ${process.env.FASTY_API_TOKEN}`,
                'fb-api-key': token
            }
        })

        if (!response.ok) {
            console.error(`HTTP error! status: ${response.status}`);
            return NextResponse.json({ error: 'Failed to fetch campaigns' }, { status: response.status });
        }

        const data = await response.json()
        return NextResponse.json(data)
    } catch (error) {
        console.error('Error fetching campaigns:', error)
        return NextResponse.json({ error: 'Failed to fetch campaigns' }, { status: 500 })
    }
}