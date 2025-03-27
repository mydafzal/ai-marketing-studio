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
    // Use the correct path from the swagger UI.
    const apiUrl = `${fastyEndpoint}/facebook/campaign-creation-flow/get-creative-preview?creative_id=${creative_id}&ad_format=${ad_format}`;

    const token_resp = await getFbMarketingApiKey();
    let token = '';
    if (token_resp.success && token_resp.token) {
        token = token_resp.token;
    }

    try {
        console.log(`Fetching creative preview from: ${apiUrl}`);
        
        const response = await fetch(apiUrl, {
            headers: {
                'Authorization': `Bearer ${process.env.FASTY_API_TOKEN}`,
                'fb-api-key': token,
            },
        });

        if (!response.ok) {
            console.error(`HTTP error! status: ${response.status}`);
            const errorText = await response.text();
            console.error(`Error response: ${errorText}`);
            return NextResponse.json({ 
                success: false, 
                error: 'Failed to fetch creative preview',
                details: errorText 
            }, { status: response.status });
        }

        const data = await response.json();
        return NextResponse.json({ 
            success: true,
            ...data
        });
    } catch (error) {
        console.error('Error fetching creative preview:', error);
        return NextResponse.json({ 
            success: false, 
            error: 'Failed to fetch creative preview',
            details: error instanceof Error ? error.message : String(error)
        }, { status: 500 });
    }
}