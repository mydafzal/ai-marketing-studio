import { NextResponse } from 'next/server';
import {getFbMarketingApiKey} from "@/app/actions";

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { businessAccountId } = body;
        
        if (!businessAccountId) {
            return NextResponse.json(
                { error: 'Business account ID is required' },
                { status: 400 }
            );
        }

        const token_resp = await getFbMarketingApiKey()
        let token=""
        if(token_resp.success && token_resp.token){
            token=token_resp.token
        }

        const response = await fetch(`${process.env.FASTY_API_URL}/facebook/account-connection/list-owned-pages-via-business-account-id`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${process.env.FASTY_API_TOKEN}`,
                'fb-api-key': token,
            },
            body: JSON.stringify({
                fb_business_account_id: businessAccountId
            })
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('Failed to fetch Facebook pages:', errorText);
            return NextResponse.json(
                { error: 'Failed to fetch Facebook pages' },
                { status: response.status }
            );
        }

        const data = await response.json();
        return NextResponse.json(data);
    } catch (error) {
        console.error('Error fetching Facebook pages:', error);
        return NextResponse.json(
            { error: 'An error occurred while fetching Facebook pages' },
            { status: 500 }
        );
    }
}
