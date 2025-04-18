import { NextRequest, NextResponse } from 'next/server'
import { updateInstagramAccountId } from "@/app/actions";

export async function POST(req: NextRequest) {
    try {
        const { email, instagramAccountId, fbPageId } = await req.json()

        if (!email || !instagramAccountId || !fbPageId) {
            return NextResponse.json({ success: false, error: 'Email, Instagram Account ID, and Facebook Page ID are required' }, { status: 400 })
        }

        const result = await updateInstagramAccountId(email, instagramAccountId, fbPageId)

        if (!result.success) {
            return NextResponse.json({ success: false, error: result.error }, { status: 400 })
        }

        return NextResponse.json({ success: true, message: result.message })
    } catch (error: unknown) {
        console.error('Error in update-instagram-account-id route:', error)

        let errorMessage = 'An unexpected error occurred'
        if (error instanceof Error) {
            errorMessage = error.message
        } else if (typeof error === 'string') {
            errorMessage = error
        }

        return NextResponse.json({ success: false, error: errorMessage }, { status: 500 })
    }
}