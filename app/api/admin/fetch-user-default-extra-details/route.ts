import { NextRequest, NextResponse } from 'next/server';
import { fetchFbCampaignExtraDetails } from '@/app/actions';

export async function GET(request: NextRequest) {
    const email = request.nextUrl.searchParams.get('email');

    if (!email) {
        return NextResponse.json({ error: 'Missing email parameter' }, { status: 400 });
    }

    try {
        const result = await fetchFbCampaignExtraDetails(email);

        if (result.error) {
            return NextResponse.json({ error: result.error }, { status: 400 });
        }

        return NextResponse.json(result);
    } catch (error) {
        console.error('Error in fetch fbCampaign extra details route:', error);
        return NextResponse.json({ error: 'An unexpected error occurred' }, { status: 500 });
    }
}
