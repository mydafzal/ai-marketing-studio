import { NextResponse } from 'next/server';
import { fetchOverallStats } from '@/app/actions'; 

export async function GET() {
    try {
        const stats = await fetchOverallStats();

        if ('error' in stats) {
            return NextResponse.json({ error: stats.error }, { status: 400 });
        }

        return NextResponse.json(stats);
    } catch (error) {
        console.error('Error in fetch overall stats route:', error);
        return NextResponse.json({ error: 'An unexpected error occurred' }, { status: 500 });
    }
}
