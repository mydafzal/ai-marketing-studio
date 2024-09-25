import {NextResponse} from 'next/server'

export async function POST(request: Request) {
    try {
        const {adset_id, adset} = await request.json()

        if (!adset_id) {
            return NextResponse.json({error: 'Adset ID is required'}, {status: 400})
        }

        const fastyEndpoint = process.env.FASTY_API_URL
        const apiUrl = `${fastyEndpoint}/facebook/exec/direct/ads/update-adset`

        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${process.env.FASTY_API_TOKEN}`
            },
            body: JSON.stringify({
                adset_id,
                adset
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
        const data = await response.json()
        return NextResponse.json(data)
    } catch (error) {
        console.error('Error setting status:', error)
        return NextResponse.json({success: false}, {status: 500})
    }
}