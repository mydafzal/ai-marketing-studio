import { NextRequest, NextResponse } from 'next/server'
import { fetchAllUsers } from '@/app/actions'

// Mark this route as dynamic to prevent static optimization
export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
    console.log('Fetch all clients API route called');
    try {
        const result = await fetchAllUsers()

        if (result && typeof result === 'object' && 'success' in result && 'data' in result) {
            return NextResponse.json(result);
        } else {
            throw new Error('Unexpected result format from fetchAllUsers');
        }
    } catch (error) {
        return NextResponse.json({
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error occurred'
        }, { status: 500 });
    }
}