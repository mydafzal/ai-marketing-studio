import { NextResponse } from 'next/server';
import {encryptToken} from '@/app/cryptoUtils';
import {updateFbAccessToken} from '@/app/actions';
import { auth } from '@/auth';
import { Session } from '@/lib/types';
import {signIn} from "@/auth"
import {getUserByEmail,createUserWithoutPassword} from "@/app/actions"

const FACEBOOK_TOKEN_URL = 'https://graph.facebook.com/v19.0/oauth/access_token';
const FACEBOOK_CLIENT_ID = process.env.FACEBOOK_CLIENT_ID;
const FACEBOOK_CLIENT_SECRET = process.env.FACEBOOK_CLIENT_SECRET;
const FACEBOOK_REDIRECT_URI = process.env.FACEBOOK_REDIRECT_URI;

function getProductionURL(){
    if(process.env.VERCEL_PROJECT_PRODUCTION_URL?.includes("localhost")){
        return "http://"+process.env.VERCEL_PROJECT_PRODUCTION_URL;

    }
    return "https://"+process.env.VERCEL_PROJECT_PRODUCTION_URL;
}

// Handle Facebook OAuth callback and get access token
export async function GET(request: Request) {
    let session = (await auth()) as Session;

    // if (!session.user){
    //   // TODO Show proper user messages

    //   return NextResponse.redirect(getProductionURL());

    // }

    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');

    if (!code) {
        // TODO Show proper user messages
        return NextResponse.redirect(getProductionURL());

        // return NextResponse.json({ error: 'Authorization code missing' }, { status: 400 });
    }

    // Exchange the code for an access token
    const tokenRes = await fetch(`${FACEBOOK_TOKEN_URL}?client_id=${FACEBOOK_CLIENT_ID}&client_secret=${FACEBOOK_CLIENT_SECRET}&redirect_uri=${FACEBOOK_REDIRECT_URI}&code=${code}`, {
        method: 'GET',
    });
    const tokenData = await tokenRes.json();

    if (tokenData.error) {
        return NextResponse.json({ error: tokenData.error.message }, { status: 400 });
    }

    const accessToken = tokenData.access_token;

    if(!session){
        // Fetch user information with long-lived access token
        const userRes = await fetch(
            `https://graph.facebook.com/me?fields=id,name,email&access_token=${accessToken}`,
            {
                method: 'GET',
            }
        );
        const userData = await userRes.json();

        if (userData.error) {
            return NextResponse.json({ error: userData.error.message }, { status: 400 });
        }

        // Extract user information
        const { id, name, email } = userData;

        const existing_user = await getUserByEmail(email);

        let user;

        if(existing_user.error){
            const user_create_resp = await createUserWithoutPassword(email);

            if  (user_create_resp.error) {
                return NextResponse.json({ error: user_create_resp.error }, { status: 400 });
            }

            user = user_create_resp.user;
            // Exchange the short-lived token for a long-lived token
            const longLivedTokenRes = await fetch(`${FACEBOOK_TOKEN_URL}?grant_type=fb_exchange_token&client_id=${FACEBOOK_CLIENT_ID}&client_secret=${FACEBOOK_CLIENT_SECRET}&fb_exchange_token=${accessToken}`, {
                method: 'GET',
            });
            const longLivedTokenData = await longLivedTokenRes.json();

            if (longLivedTokenData.error) {
                return NextResponse.json({ error: longLivedTokenData.error.message }, { status: 400 });
            }

            const longLivedAccessToken = longLivedTokenData.access_token;
            // return  NextResponse.json({ longLivedAccessToken });

            const encryptedToken = await encryptToken(longLivedAccessToken);
            const token_save_resp = await updateFbAccessToken(email,encryptedToken) // TODO fail error handling

        }
        else{
            user = existing_user.user;
        }

        const password="Just dummy password" // Not in use.  This is just for demo purposes.

        await signIn('credentials', {
            email,
            password,
            login_type:"facebook",
            redirect: false
        })


        return NextResponse.redirect(getProductionURL());
    }

    // Exchange the short-lived token for a long-lived token
    const longLivedTokenRes = await fetch(`${FACEBOOK_TOKEN_URL}?grant_type=fb_exchange_token&client_id=${FACEBOOK_CLIENT_ID}&client_secret=${FACEBOOK_CLIENT_SECRET}&fb_exchange_token=${accessToken}`, {
        method: 'GET',
    });
    const longLivedTokenData = await longLivedTokenRes.json();

    if (longLivedTokenData.error) {
        return NextResponse.json({ error: longLivedTokenData.error.message }, { status: 400 });
    }

    const longLivedAccessToken = longLivedTokenData.access_token;
    // return  NextResponse.json({ longLivedAccessToken });

    const encryptedToken = await encryptToken(longLivedAccessToken);
    const token_save_resp = await updateFbAccessToken(session.user.email,encryptedToken) // TODO fail error handling

    return NextResponse.redirect(getProductionURL());
}
