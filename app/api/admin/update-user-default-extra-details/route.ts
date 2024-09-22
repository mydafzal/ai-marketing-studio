import {NextRequest, NextResponse} from 'next/server'
import {updateUserDefaultExtraDetailsForAdmin} from "@/app/actions";

export async function POST(req: NextRequest) {
    try {
        const {email, defaultExtraDetails} = await req.json()

        if (!email || !defaultExtraDetails) {
            return NextResponse.json({
                success: false,
                error: 'Email and Default User Prompt are required'
            }, {status: 400})
        }

        const result = await updateUserDefaultExtraDetailsForAdmin(email, defaultExtraDetails)

        if (!result.success) {
            return NextResponse.json({success: false, error: result.error}, {status: 400})
        }

        return NextResponse.json({success: true, message: result.message})
    } catch (error: unknown) {
        console.error('Error in update-user-default-extra-details route:', error)

        let errorMessage = 'An unexpected error occurred'
        if (error instanceof Error) {
            errorMessage = error.message
        } else if (typeof error === 'string') {
            errorMessage = error
        }

        return NextResponse.json({success: false, error: errorMessage}, {status: 500})
    }
}