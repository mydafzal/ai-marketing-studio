import {NextRequest, NextResponse} from 'next/server'
import {fetchChatFbCampaignId} from "@/app/actions";

export async function GET(req: NextRequest) {
    try {
        const {searchParams} = new URL(req.url)
        const chatSlug = searchParams.get('chatSlug')

        if (!chatSlug) {
            return NextResponse.json({error: 'Chat slug is required'}, {status: 400})
        }

        const result = await fetchChatFbCampaignId(chatSlug)

        if (result.error) {
            return NextResponse.json({error: result.error}, {status: 400})
        }

        return NextResponse.json({
            success: true,
            fbCampaignId: result.fbCampaignId
        })
    } catch (error: unknown) {
        console.error('Error in fetch-chat-fb-campaign-id route:', error)

        let errorMessage = 'An unexpected error occurred'
        if (error instanceof Error) {
            errorMessage = error.message
        } else if (typeof error === 'string') {
            errorMessage = error
        }

        return NextResponse.json({error: errorMessage}, {status: 500})
    }
}