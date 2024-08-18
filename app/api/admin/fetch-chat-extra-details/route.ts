import {NextRequest, NextResponse} from 'next/server'
import {fetchChatExtraDetails} from "@/app/actions";

export async function GET(request: NextRequest) {
    const chatId = request.nextUrl.searchParams.get('chatId')

    if (!chatId) {
        return NextResponse.json({error: 'Missing chatId parameter'}, {status: 400})
    }

    try {
        const result = await fetchChatExtraDetails(chatId)

        if (result.error) {
            return NextResponse.json({error: result.error}, {status: 400})
        }

        return NextResponse.json(result)
    } catch (error) {
        console.error('Error in fetch chat extra details route:', error)
        return NextResponse.json({error: 'An unexpected error occurred'}, {status: 500})
    }
}