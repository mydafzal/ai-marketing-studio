import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { getFbMarketingApiKey } from '@/app/actions';

export async function POST(req: NextRequest) {
  console.log('📥 Received request to proxy-finalize-campaign endpoint');
  try {
    // Check authentication
    console.log('🔐 Authenticating user session');
    const session = await auth()
    if (!session?.user) {
      console.error('❌ Authentication failed - no valid user session');
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }
    console.log('✅ Authentication successful, user:', session.user.name || session.user.email);

    // Get request body
    const body = await req.json()
    console.log('📋 Request body received with keys:', Object.keys(body));
    
    // Validate required fields
    const {
      fb_account_id,
      campaign_flow_session_id,
      page_id
    } = body

    console.log('📊 Request validation data:', {
      'Has FB Account ID': !!fb_account_id,
      'Has Campaign Session ID': !!campaign_flow_session_id,
      'Has Page ID': !!page_id
    });

    // Make sure required fields are present
    if (!fb_account_id || !campaign_flow_session_id) {
      console.error('❌ Missing required fields:', {
        'FB Account ID present': !!fb_account_id,
        'Campaign Session ID present': !!campaign_flow_session_id
      });
      return NextResponse.json(
        { error: 'Missing required fields: fb_account_id and campaign_flow_session_id are required' },
        { status: 400 }
      )
    }

    // Get FB API key
    console.log('🔑 Retrieving Facebook API token');
    const token_resp = await getFbMarketingApiKey()
    let token = ""
    if (token_resp.success && token_resp.token) {
      console.log('✅ Successfully retrieved FB API token');
      token = token_resp.token
    } else {
      console.warn('⚠️ No user FB API token available - will use system token');
    }

    // Make the request to the backend API
    const fastyEndpoint = process.env.FASTY_API_URL || 'http://localhost:8000';
    const apiUrl = `${fastyEndpoint}/facebook/campaign-creation-flow/finalize-campaign`
    
    console.log('🔗 Finalizing campaign with backend API URL:', apiUrl);
    console.log('📊 Finalization parameters:', {
      'FB Account ID': fb_account_id,
      'Campaign Flow Session ID': campaign_flow_session_id,
      'Page ID': page_id || 'Not provided'
    });
    
    // Prepare the request payload
    const requestPayload = {
      fb_account_id,
      campaign_flow_session_id,
      page_id
    };
    
    // Prepare headers - for admin-assigned accounts, don't send any token
    // The Fasty backend will use its system token
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.FASTY_API_TOKEN || ''}`
    };
    
    // Only add the fb-api-key header if we have a token
    if (token) {
      headers['fb-api-key'] = token;
      console.log('📤 Using user Facebook token');
    } else {
      console.log('📤 No token provided - backend will use system token');
    }
    
    console.log('📤 Sending request to backend');
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify(requestPayload),
    })

    console.log('📡 Backend API response status:', response.status);

    if (!response.ok) {
      console.error('❌ Backend API returned error status:', response.status);
      
      let errorData;
      try {
        errorData = await response.json();
        console.error('❌ Error data:', JSON.stringify(errorData, null, 2));
      } catch (parseError) {
        console.error('❌ Failed to parse error response:', parseError);
        errorData = { error: 'Failed to parse error response' };
      }
      
      return NextResponse.json(
        { error: errorData.error || 'Failed to finalize campaign' },
        { status: response.status }
      )
    }

    // Return successful response
    console.log('✅ Successfully received response from backend');
    const data = await response.json();
    console.log('📊 Response data:', JSON.stringify(data, null, 2));
    
    return NextResponse.json(data)
  } catch (error) {
    console.error('❌ Exception in campaign finalization:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}