import { NextResponse } from 'next/server';
import { fetchUserStatistics } from '@/app/actions';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('id');

    if (!userId) {
        return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    try {
        const stats = await fetchUserStatistics(userId);

        if ('error' in stats) {
            return NextResponse.json({ error: stats.error }, { status: 400 });
        }

        return NextResponse.json(stats);
    } catch (error) {
        console.error('Error in fetch user stats route:', error);
        return NextResponse.json({ error: 'An unexpected error occurred' }, { status: 500 });
    }
}
