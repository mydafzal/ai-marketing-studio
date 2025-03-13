import {NextRequest, NextResponse} from 'next/server'
import {fetchChatFbCampaignId} from "@/app/actions";

// Mark this route as dynamic since it uses request.url
export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
    try {
        const {searchParams} = new URL(req.url)
        const chatSlug = searchParams.get('chatSlug')

        if (!chatSlug) {
            return NextResponse.json({error: 'Chat slug is required'}, {status: 400})
        }

        const result = await fetchChatFbCampaignId(chatSlug)

        console.log('chatSlug', chatSlug)

        return NextResponse.json(result)
    } catch (error) {
        console.error('Error in fetch-chat-fb-campaign-id route:', error)
        return NextResponse.json({
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error occurred',
        }, {status: 500})
    }
}