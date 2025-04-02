import { Session } from '@/lib/types';
import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { getUserDetail } from '@/app/actions';

export async function GET(request: Request) {
    const session = (await auth()) as Session;
    if (!session.user){
        // TODO Show proper user messages
    
        return NextResponse.json({
            message:"Not authenticated"
        })
    
    }

    const resp = await getUserDetail();
    if (resp.success){
        // Parse locations data if it exists
        let locations = null;
        if (resp.user.locations && typeof resp.user.locations === 'string') {
            try {
                locations = JSON.parse(resp.user.locations);
            } catch (e) {
                console.error('Error parsing locations data:', e);
            }
        }
        
        return NextResponse.json({
            success: true,
            token: resp.user.fbMarketingApiKey ? resp.user.fbMarketingApiKey : "",
            account: {
                fbAccountId: resp.user.fbAccountId || "",
                fbPageId: resp.user.fbPageId || "",
                defaultExtraDetails: resp.user.defaultExtraDetails || "",
                privacy_policy_link: resp.user.privacy_policy_link || "",
                email: resp.user.email || "",
                locations: locations
            }
        });
    }
    else{
        return NextResponse.json({
            success: false,
            message: "User details not found"
        })
    }
    
}