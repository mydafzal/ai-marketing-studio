import {NextRequest, NextResponse} from 'next/server';
import {fetchChatFbAdsetId, fetchFbCampaignStructure} from '@/app/actions';

export async function GET(request: NextRequest) {
    const fbCampaignId = request.nextUrl.searchParams.get('fbCampaignId');
    const chatSlug = request.nextUrl.searchParams.get('chatSlug');


    if (!fbCampaignId) {

        return NextResponse.json({error: 'Campaign Id is Missing'}, {status: 400});
    }

    if (!chatSlug) {

        return NextResponse.json({error: 'Chat Slug is Missing'}, {status: 400});
    }

    let fbAdsetIdResponse = await fetchChatFbAdsetId(chatSlug);
    if (!fbAdsetIdResponse.success) {
        return NextResponse.json({error: 'Adset Id not found'}, {status: 400});
    }

    const fbAdsetId = fbAdsetIdResponse.fbAdsetId as string;

    const resp = await fetchFbCampaignStructure(fbCampaignId, fbAdsetId);
    if (resp.success) {
        return NextResponse.json(resp.data);
    } else {
        return NextResponse.json({error: 'Campaign structure fetch failed.'}, {status: 400});
    }

}