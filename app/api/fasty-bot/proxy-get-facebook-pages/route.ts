import { NextResponse } from 'next/server';

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

        const response = await fetch(`${process.env.FASTY_API_URL}/facebook/account-connection/list-owned-pages-via-business-account-id`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
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
