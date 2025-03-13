import {NextRequest, NextResponse} from 'next/server'
import {searchUser} from '@/app/actions'  // Adjust the import path as needed

// Mark this route as dynamic since it uses request.url
export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
    const {searchParams} = new URL(req.url)
    const email = searchParams.get('email') || ''

    const result = await searchUser(email)

    if (!result.success) {
        return NextResponse.json({error: result.error}, {status: 400})
    }

    return NextResponse.json(result)
}