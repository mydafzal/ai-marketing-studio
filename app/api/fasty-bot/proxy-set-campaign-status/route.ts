import {NextResponse} from 'next/server'

export async function POST(request: Request) {
    try {
        const {campaign_id, status} = await request.json()

        if (!campaign_id || status === undefined) {
            return NextResponse.json({error: 'Campaign ID and status are required'}, {status: 400})
        }

        const fastyEndpoint = process.env.FASTY_API_URL
        const apiUrl = `${fastyEndpoint}/facebook/exec/direct/adjust-campaign/set-status`

        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${process.env.FASTY_API_TOKEN}`
            },
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