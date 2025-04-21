import { NextRequest, NextResponse } from 'next/server';
// Assuming a new action function exists for updating admin-specific details
import { updateUserDefaultExtraAdminDetailsForAdmin } from "@/app/actions";

export async function POST(req: NextRequest) {
    try {
        // Expect 'defaultExtraAdminDetails' in the body for the admin prompt
        const { email, defaultExtraAdminDetails } = await req.json();

        // Validate email and the admin prompt details
        if (!email || defaultExtraAdminDetails === undefined || defaultExtraAdminDetails === null) { // Allow empty string
            return NextResponse.json({
                success: false,
                error: 'Email and Default Admin Prompt are required'
            }, { status: 400 });
        }

        // Call the new action function for updating admin details
        const result = await updateUserDefaultExtraAdminDetailsForAdmin(email, defaultExtraAdminDetails);

        if (!result.success) {
            // Use the error message from the action function result
            return NextResponse.json({ success: false, error: result.error || 'Failed to update admin prompt' }, { status: 400 });
        }

        // Return success message from the action function result
        return NextResponse.json({ success: true, message: result.message || 'Admin prompt updated successfully' });

    } catch (error: unknown) {
        console.error('Error in update-user-default-extra-admin-details route:', error);

        let errorMessage = 'An unexpected error occurred';
        if (error instanceof Error) {
            errorMessage = error.message;
        } else if (typeof error === 'string') {
            errorMessage = error;
        }

        return NextResponse.json({ success: false, error: errorMessage }, { status: 500 });
    }
}
