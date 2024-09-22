import {NextRequest, NextResponse} from 'next/server'
import {updateFbCampaignExtraDetails} from "@/app/actions";

export async function POST(request: NextRequest) {
    try {
        const body = await request.json()

        const {chatId, extraDetails} = body

        if (!chatId || !extraDetails) {
            return NextResponse.json({error: 'Missing required fields'}, {status: 400})
        }

        const result = await updateFbCampaignExtraDetails(chatId, extraDetails)


        if (result.error) {
            return NextResponse.json({error: result.error}, {status: 400})
        }

        return NextResponse.json({success: true})
    } catch (error) {
        return NextResponse.json({error: 'An unexpected error occurred'}, {status: 500})
    }
}