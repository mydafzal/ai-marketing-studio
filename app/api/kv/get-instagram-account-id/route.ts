import { Session } from '@/lib/types';
import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import {getInstagramAccountId, getUserDetail} from '@/app/actions';

export async function GET(request: Request) {
    const session = (await auth()) as Session;
    if (!session.user) {
        return NextResponse.json({
            message: "Not authenticated"
        })

    }

    // use getInstagramAccountId from actions.ts
}