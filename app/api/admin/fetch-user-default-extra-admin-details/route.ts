import { NextRequest, NextResponse } from 'next/server';
// Assuming a new action function exists for fetching admin-specific details
import { fetchUserDefaultExtraAdminDetailsForAdmin } from '@/app/actions';

export async function GET(request: NextRequest) {
    const email = request.nextUrl.searchParams.get('email');

    if (!email) {
        return NextResponse.json({ success: false, error: 'Missing email parameter' }, { status: 400 });
    }

    try {
        // Call the new action function for admin details
        const result = await fetchUserDefaultExtraAdminDetailsForAdmin(email);

        // Check if result is null or undefined, indicating not found or no details set
        if (result === null || result === undefined) {
             // Return success false or a specific message if preferred when no details are found
            return NextResponse.json({ success: true, defaultExtraAdminDetails: '' }); // Return empty string if no details set
        }

        // Return the result within an object, assuming the action returns the details string
        return NextResponse.json({ success: true, defaultExtraAdminDetails: result });
    } catch (error) {
        console.error('Error in fetch default extra admin details route:', error);
        // Ensure consistent error response structure
        return NextResponse.json({ success: false, error: 'An unexpected error occurred' }, { status: 500 });
    }
}
