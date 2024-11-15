import {NextResponse} from 'next/server';
import {encryptToken} from '@/app/cryptoUtils';
import {createUserWithoutPassword, getUserByEmail, updateFbAccessToken} from '@/app/actions';
import {auth, signIn} from '@/auth';
import {Session} from '@/lib/types';

const FACEBOOK_TOKEN_URL = 'https://graph.facebook.com/v19.0/oauth/access_token';
const FACEBOOK_CLIENT_ID = process.env.FACEBOOK_CLIENT_ID;
const FACEBOOK_CLIENT_SECRET = process.env.FACEBOOK_CLIENT_SECRET;
const FACEBOOK_REDIRECT_URI = process.env.FACEBOOK_REDIRECT_URI;
// Updated to use FACEBOOK_CLIENT_ID instead of FACEBOOK_APP_ID
const FACEBOOK_TESTER_URL = `https://graph.facebook.com/v19.0/${FACEBOOK_CLIENT_ID}/roles`;

function getProductionURL() {
    if (process.env.VERCEL_PROJECT_PRODUCTION_URL?.includes('localhost')) {
        return 'http://' + process.env.VERCEL_PROJECT_PRODUCTION_URL;
    }
    return 'https://' + process.env.VERCEL_PROJECT_PRODUCTION_URL;
}

// Helper: Add user as a tester with improved error handling
async function addTester(userId: string) {
    if (!FACEBOOK_CLIENT_ID || !FACEBOOK_CLIENT_SECRET) {
        throw new Error('Facebook client credentials are not configured');
    }

    const appAccessToken = `${FACEBOOK_CLIENT_ID}|${FACEBOOK_CLIENT_SECRET}`;

    console.log('Adding tester:', {
        url: FACEBOOK_TESTER_URL,
        userId,
        appAccessToken: '***' // masked for security
    });

    const response = await fetch(FACEBOOK_TESTER_URL, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({
            user: userId,
            role: 'tester',
            access_token: appAccessToken,
        }),
    });

    const result = await response.json();

    if (!response.ok) {
        console.error('Failed to add tester:', result);
        throw new Error(result.error?.message || 'Failed to add tester');
    }

    return result;
}

// Handle Facebook OAuth callback and get access token
export async function GET(request: Request) {
    let session = (await auth()) as Session;

    const {searchParams} = new URL(request.url);
    const code = searchParams.get('code');

    if (!code) {
        return NextResponse.redirect(getProductionURL());
    }

    // Exchange the code for an access token
    const tokenRes = await fetch(
        `${FACEBOOK_TOKEN_URL}?client_id=${FACEBOOK_CLIENT_ID}&client_secret=${FACEBOOK_CLIENT_SECRET}&redirect_uri=${FACEBOOK_REDIRECT_URI}&code=${code}`,
        {method: 'GET'}
    );
    const tokenData = await tokenRes.json();

    if (tokenData.error) {
        return NextResponse.json({error: tokenData.error.message}, {status: 400});
    }

    const accessToken = tokenData.access_token;

    // Fetch user information
    const userRes = await fetch(
        `https://graph.facebook.com/me?fields=id,name,email&access_token=${accessToken}`,
        {method: 'GET'}
    );
    const userData = await userRes.json();

    if (userData.error) {
        return NextResponse.json({error: userData.error.message}, {status: 400});
    }

    const {id: facebookUserId, email} = userData;

    // Add the user as a tester
    try {
        await addTester(facebookUserId);
    } catch (error: any) {
        return NextResponse.json({error: error.message}, {status: 400});
    }

    // Handle existing or new user creation
    let user;
    const existingUser = await getUserByEmail(email);

    if (existingUser.error) {
        const userCreateResp = await createUserWithoutPassword(email);
        if (userCreateResp.error) {
            return NextResponse.json({error: userCreateResp.error}, {status: 400});
        }
        user = userCreateResp.user;
    } else {
        user = existingUser.user;
    }

    // Exchange the short-lived token for a long-lived token
    const longLivedTokenRes = await fetch(
        `${FACEBOOK_TOKEN_URL}?grant_type=fb_exchange_token&client_id=${FACEBOOK_CLIENT_ID}&client_secret=${FACEBOOK_CLIENT_SECRET}&fb_exchange_token=${accessToken}`,
        {method: 'GET'}
    );
    const longLivedTokenData = await longLivedTokenRes.json();

    if (longLivedTokenData.error) {
        return NextResponse.json({error: longLivedTokenData.error.message}, {status: 400});
    }

    const longLivedAccessToken = longLivedTokenData.access_token;

    // Encrypt and save the token
    const encryptedToken = await encryptToken(longLivedAccessToken);
    await updateFbAccessToken(email, encryptedToken);

    // Sign in the user
    const password = 'Just dummy password'; // Placeholder password
    await signIn('credentials', {
        email,
        password,
        login_type: 'facebook',
        redirect: false,
    });

    return NextResponse.redirect(getProductionURL());
}
