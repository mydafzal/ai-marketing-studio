import { NextResponse } from 'next/server';
import { getFbMarketingApiKey } from '@/app/actions';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const creative_id = searchParams.get('creative_id');
    const ad_format = searchParams.get('ad_format');

    if (!creative_id || !ad_format) {
        return NextResponse.json({ error: 'Creative ID and ad format are required' }, { status: 400 });
    }

    const fastyEndpoint = process.env.FASTY_API_URL;
    const apiUrl = `${fastyEndpoint}/facebook/read/creative-preview/get-creative-preview?creative_id=${creative_id}&ad_format=${ad_format}`;

    const token_resp = await getFbMarketingApiKey();
    let token = '';
    if (token_resp.success && token_resp.token) {
        token = token_resp.token;
    }

    try {
        const response = await fetch(apiUrl, {
            headers: {
                'Authorization': `Bearer ${process.env.FASTY_API_TOKEN}`,
                'fb-api-key': token,
            },
        });

        if (!response.ok) {
            console.error(`HTTP error! status: ${response.status}`);
            return NextResponse.json({ error: 'Failed to fetch creative preview' }, { status: response.status });
        }

        const data = await response.json();
        return NextResponse.json(data);
    } catch (error) {
        console.error('Error fetching creative preview:', error);
        return NextResponse.json({ error: 'Failed to fetch creative preview' }, { status: 500 });
    }
}