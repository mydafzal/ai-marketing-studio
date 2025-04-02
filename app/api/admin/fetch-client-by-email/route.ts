import {NextRequest, NextResponse} from 'next/server'
import {searchUser} from '@/app/actions'  // Adjust the import path as needed

export async function GET(req: NextRequest) {
    const {searchParams} = new URL(req.url)
    const email = searchParams.get('email') || ''

    const result = await searchUser(email)

    if (!result.success) {
        return NextResponse.json({error: result.error}, {status: 400})
    }

    return NextResponse.json(result)
}