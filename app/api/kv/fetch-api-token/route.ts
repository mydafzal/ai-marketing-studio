import { Session } from '@/lib/types';
import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { getUserDetail } from '@/app/actions';
import {validateAndExtractInstagramAccountId} from "@/lib/helpers/kv/validate-and-extract-instagram-account-id";


// todo rename this file to what it actually is doing!
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
        else if (resp.user.locations && typeof resp.user.locations === 'object'){
            locations = resp.user.locations;
        }

        let instagramAccountId = resp.user.instagramFbPagePairing ?? ''

        return NextResponse.json({
            success: true,
            token: resp.user.fbMarketingApiKey ? resp.user.fbMarketingApiKey : "",
            account: {
                fbAccountId: resp.user.fbAccountId || "",
                fbPageId: resp.user.fbPageId || "",
                defaultExtraDetails: resp.user.defaultExtraDetails || "",
                privacy_policy_link: resp.user.privacy_policy_link || "",
                email: resp.user.email || "",
                companyName: resp.user.company_name||"",
                preferred_language: resp.user.preferred_language,
                locations: locations,
                // instagramAccountId: validateAndExtractInstagramAccountId(resp.user),
                instagramAccountId: instagramAccountId.split('.')[0],
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