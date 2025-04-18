import { NextResponse } from 'next/server';

const FACEBOOK_OAUTH_URL = 'https://www.facebook.com/v19.0/dialog/oauth';
const FACEBOOK_CLIENT_ID = process.env.FACEBOOK_CLIENT_ID;
const FACEBOOK_REDIRECT_URI = process.env.FACEBOOK_REDIRECT_URI; // Your callback URL
const FACEBOOK_CLIENT_SECRET = process.env.FACEBOOK_CLIENT_SECRET;

// Step 1: Redirect to Facebook OAuth
export async function GET(request: Request) {
  const redirectUrl = new URL(FACEBOOK_OAUTH_URL);
  redirectUrl.searchParams.append('client_id', FACEBOOK_CLIENT_ID!);
  redirectUrl.searchParams.append('redirect_uri', FACEBOOK_REDIRECT_URI!);
  redirectUrl.searchParams.append('response_type', 'code');
  redirectUrl.searchParams.append('scope', 'ads_read,ads_management,pages_manage_ads,business_management,pages_show_list,leads_retrieval,email,public_profile,instagram_basic,pages_read_engagement'); // Add scopes as per requirement

  // Redirect user to Facebook login
  return NextResponse.redirect(redirectUrl.toString());
}


// TODO: IMPACT(HIGH) : Update scope according to requirements