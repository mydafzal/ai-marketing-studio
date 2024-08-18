import {NextRequest, NextResponse} from 'next/server'
import {updateChatFbCampaignId} from "@/app/actions";

export async function POST(req: NextRequest) {
    try {
        const {chatSlug, fbCampaignId} = await req.json()

        if (!chatSlug || !fbCampaignId) {
            return NextResponse.json({error: 'Chat slug and Facebook Campaign ID are required'}, {status: 400})
        }

        const result = await updateChatFbCampaignId(chatSlug, fbCampaignId)

        if (result.error) {
            return NextResponse.json({error: result.error}, {status: 400})
        }

        return NextResponse.json({success: true, message: 'Facebook Campaign ID updated successfully'})
    } catch (error: unknown) {
        console.error('Error in update-chat-fb-campaign-id route:', error)

        let errorMessage = 'An unexpected error occurred'
        if (error instanceof Error) {
            errorMessage = error.message
        } else if (typeof error === 'string') {
            errorMessage = error
        }

        return NextResponse.json({error: errorMessage}, {status: 500})
    }
}