import { Session } from '@/lib/types';
import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { getInstagramAccountId, getUserDetail } from '@/app/actions';

export async function GET(request: Request) {
    try {
        const session = (await auth()) as Session;
        if (!session.user) {
            return NextResponse.json({
                success: false,
                error: "Not authenticated"
            }, { status: 401 });
        }

        // Get the user's details to retrieve their email
        const userDetailResponse = await getUserDetail();
        
        if (!userDetailResponse.success || !userDetailResponse.user) {
            return NextResponse.json({
                success: false,
                error: userDetailResponse.error || "User details not found"
            }, { status: 404 });
        }
        
        const email = userDetailResponse.user.email;
        
        // Use getInstagramAccountId to get the Instagram account ID
        const instagramAccountId = await getInstagramAccountId(email);
        
        if (!instagramAccountId) {
            return NextResponse.json({
                success: false,
                error: "Instagram account ID not found or not accessible"
            }, { status: 404 });
        }
        
        return NextResponse.json({
            success: true,
            instagramAccountId
        });
    } catch (error) {
        console.error("Error in get-instagram-account-id route:", error);
        
        let errorMessage = "An unexpected error occurred";
        if (error instanceof Error) {
            errorMessage = error.message;
        } else if (typeof error === 'string') {
            errorMessage = error;
        }
        
        return NextResponse.json({
            success: false,
            error: errorMessage
        }, { status: 500 });
    }
}