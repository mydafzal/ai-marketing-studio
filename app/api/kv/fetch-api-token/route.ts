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
        return NextResponse.json({
            token:resp.user.fbMarketingApiKey?resp.user.fbMarketingApiKey:""
        });
    }
    else{
        return NextResponse.json({
            message:"Not found"
        })
    }
    
}