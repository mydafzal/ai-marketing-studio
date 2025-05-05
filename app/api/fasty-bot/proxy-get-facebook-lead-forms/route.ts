import { NextResponse } from 'next/server';
import {getFbMarketingApiKey, getUserDetail} from "@/app/actions";

export async function GET(request: Request) {
    try {
        const userDetail = await getUserDetail()

        const fbPageId = userDetail?.user?.fbPageId
        if (!fbPageId) {
            return NextResponse.json({
                success: false,
                error: 'Facebook page id not found'
            }, { status: 400 })
        }

        const token_resp = await getFbMarketingApiKey();
        let token = "";
        if (token_resp.success && token_resp.token) {
            token = token_resp.token;
        }

        const url = new URL(`${process.env.FASTY_API_URL}/facebook/campaign-creation-flow/get-leadgen-forms-by-page`);
        url.searchParams.set('page_id', fbPageId);

        const response = await fetch(url.toString(), {
            method: 'GET',
            headers: {
                Authorization: `Bearer ${process.env.FASTY_API_TOKEN}`,
                'fb-api-key': token,
            },
        });
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error('Failed to fetch lead forms:', errorText);
            return NextResponse.json(
                { error: 'Failed to fetch lead forms' },
                { status: response.status }
            );
        }

        const data = await response.json();
        return NextResponse.json(data);
    } catch (error) {
        console.error('Error fetching lead forms:', error);
        return NextResponse.json(
            { error: 'An error occurred while fetching lead forms' },
            { status: 500 }
        );
    }
}
