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
        if (resp.user.locations) {
            try {
                // If it's stored as a string, parse it
                if (typeof resp.user.locations === 'string') {
                    const parsedLocations = JSON.parse(resp.user.locations);
                    
                    // Validate the parsed structure to ensure it's in the expected format
                    if (Array.isArray(parsedLocations) && parsedLocations.length > 0) {
                        locations = parsedLocations;
                        console.log('Successfully parsed locations from KV storage:', parsedLocations.length);
                    } else {
                        console.warn('Parsed locations not in expected format:', parsedLocations);
                        locations = []; // Reset to empty array if format is wrong
                    }
                } else if (Array.isArray(resp.user.locations)) {
                    locations = resp.user.locations;
                    console.log('Locations already in array format:', resp.user.locations.length);
                } else {
                    console.warn('Locations in unexpected format:', typeof resp.user.locations);
                    locations = []; // Reset to empty array if format is wrong
                }
            } catch (e) {
                console.error('Error parsing locations data:', e);
                locations = []; // Reset to empty array on parse error
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