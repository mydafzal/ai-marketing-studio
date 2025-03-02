import {NextRequest, NextResponse} from 'next/server'
import {updateFbAccountId} from "@/app/actions";

export async function POST(req: NextRequest) {
    try {
        const {email, accountId: fbAccountId} = await req.json()

        if (!email || !fbAccountId) {
            return NextResponse.json({success: false, error: 'Email and Account ID are required'}, {status: 400})
        }

        const result = await updateFbAccountId(email, fbAccountId)

        if (!result.success) {
            return NextResponse.json({success: false, error: result.error}, {status: 400})
        }

        return NextResponse.json({success: true, message: result.message})
    } catch (error: unknown) {
        console.error('Error in update-fb-account-id route:', error)

        let errorMessage = 'An unexpected error occurred'
        if (error instanceof Error) {
            errorMessage = error.message
        } else if (typeof error === 'string') {
            errorMessage = error
        }

        return NextResponse.json({success: false, error: errorMessage}, {status: 500})
    }
}