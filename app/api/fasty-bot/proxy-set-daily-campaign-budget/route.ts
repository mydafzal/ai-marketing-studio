import { NextResponse } from 'next/server'

export async function POST(request: Request) {
    console.log('POST request received for setting daily campaign budget');

    try {
        const { campaign_id, daily_budget } = await request.json()
        console.log('Received data:', { campaign_id, daily_budget });

        if (!campaign_id || daily_budget === undefined) {
            console.log('Invalid input: Campaign ID or daily budget missing');
            return NextResponse.json({ error: 'Campaign ID and daily budget are required' }, { status: 400 })
        }

        const fastyEndpoint = process.env.FASTY_API_URL
        console.log('FASTY_API_URL:', fastyEndpoint);

        if (!fastyEndpoint) {
            console.error('FASTY_API_URL is not set');
            return NextResponse.json({ error: 'Server configuration error' }, { status: 500 })
        }

        const apiUrl = `${fastyEndpoint}/facebook/exec/direct/adjust-campaign/set-daily-budget`
        console.log('Calling API URL:', apiUrl);

        const token = process.env.FASTY_API_TOKEN
        if (!token) {
            console.error('FASTY_API_TOKEN is not set');
            return NextResponse.json({ error: 'Server configuration error' }, { status: 500 })
        }

        console.log('Sending request to external API');
        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                campaign_id,
                daily_budget
            })
        })
        console.log('Received response from external API. Status:', response.status);

        if (!response.ok) {
            const errorBody = await response.text()
            console.error('Error setting daily budget:', {
                status: response.status,
                statusText: response.statusText,
                body: errorBody
            })
            return NextResponse.json({ success: false, error: errorBody }, { status: response.status })
        }

        console.log('Daily campaign budget set successfully');
        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('Error in proxy:', error);
        return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
    }
}