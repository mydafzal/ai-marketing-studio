import { NextRequest, NextResponse } from 'next/server';
import { fetchUserDefaultExtraDetailsForAdmin } from '@/app/actions';

export async function GET(request: NextRequest) {
    const email = request.nextUrl.searchParams.get('email');

    if (!email) {
        return NextResponse.json({ error: 'Missing email parameter' }, { status: 400 });
    }

    try {
        const result = await fetchUserDefaultExtraDetailsForAdmin(email);

        if (result === '') {
            return NextResponse.json({ error: 'No results found' }, { status: 400 });
        }

        // Return the result within an object
        return NextResponse.json({ defaultExtraDetails: result });
    } catch (error) {
        console.error('Error in fetch default extra details route:', error);
        return NextResponse.json({ error: 'An unexpected error occurred' }, { status: 500 });
    }
}
