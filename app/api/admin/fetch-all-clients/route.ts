import {NextRequest, NextResponse} from 'next/server'
import {fetchAllUsers} from '@/app/actions'  // Adjust this import path if necessary

export async function GET(req: NextRequest) {
    console.log('Fetch all clients API route called');
    try {
        const result = await fetchAllUsers()
        console.log('fetchAllUsers result:', result);
        return NextResponse.json(result)
    } catch (error) {
        console.error('Detailed error in fetch all clients API route:', error);
        return NextResponse.json({
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error occurred'
        }, {status: 500})
    }
}