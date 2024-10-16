import { NextResponse } from 'next/server'

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url)
    const fbBusinessAccId = searchParams.get('fb_business_acc_id')

    const fastyEndpoint = process.env.FASTY_API_URL
    const apiUrl = `${fastyEndpoint}/facebook/read/page/get-list?fb_business_acc_id=${fbBusinessAccId}`
    try {
        const response = await fetch(apiUrl, {
            headers: {
                'Authorization': `Bearer ${process.env.FASTY_API_TOKEN}`
            }
        })
        if (!response.ok) {
            console.error(`HTTP error! status: ${response.status}`);
            return NextResponse.json({ error: 'Failed to fetch accounts' }, { status: response.status });
        }

        const data = await response.json()
        return NextResponse.json(data)
    } catch (error) {
        console.error('Error fetching page accounts:', error)
        return NextResponse.json({ error: 'Failed to fetch page accounts' }, { status: 500 })
    }
}