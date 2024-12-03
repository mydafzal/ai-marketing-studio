import {NextRequest, NextResponse} from 'next/server'
import {updateFbPageId} from "@/app/actions";

export async function POST(req: NextRequest) {
    try {
        const {email, pageId: fbPageId} = await req.json()

        if (!email || !fbPageId) {
            return NextResponse.json({success: false, error: 'Email and Page ID are required'}, {status: 400})
        }

        const result = await updateFbPageId(email, fbPageId)

        if (!result.success) {
            return NextResponse.json({success: false, error: result.error}, {status: 400})
        }

        return NextResponse.json({success: true, message: result.message})
    } catch (error: unknown) {
        console.error('Error in update-fb-page-id route:', error)

        let errorMessage = 'An unexpected error occurred'
        if (error instanceof Error) {
            errorMessage = error.message
        } else if (typeof error === 'string') {
            errorMessage = error
        }

        return NextResponse.json({success: false, error: errorMessage}, {status: 500})
    }
}