import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { getUserDetail, getFbMarketingApiKey } from '@/app/actions'

export async function POST(req: NextRequest) {
  console.log('📥 Received request to master-flow-initiate-process endpoint');
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
    console.log('📋 Request body values - important fields:', {
      'daily_budget': body.daily_budget,
      'daily_campaign_budget': body.daily_campaign_budget,
      'company_name': body.company_name
    });
    
    // Get Facebook API key from header or use empty string to use internal API key
    const fbApiKey = req.headers.get('fb_api_key') || ''
    console.log('🔑 FB API key present in header:', !!fbApiKey);

    // Validate required fields
    const {
      fb_account_id,
      campaign_flow_session_id,
      profile_data,
      location_data,
      website_link,
      preferred_language,
      privacy_policy_link,
      page_id,
      image_hashes = [],
      video_ids = [],
      daily_campaign_budget, // Extract daily_campaign_budget as shown in documentation
      company_name  // Make sure we extract company_name
    } = body

    console.log('📊 Request validation data:', {
      'Has FB Account ID': !!fb_account_id,
      'Has Campaign Session ID': !!campaign_flow_session_id,
      'Has Website Link': !!website_link,
      'Image hashes count': image_hashes.length,
      'Video IDs count': video_ids.length,
      'Location data count': location_data?.length || 0
    });

    // Make sure required fields are present
    if (!fb_account_id || !campaign_flow_session_id || !website_link || !daily_campaign_budget || !company_name) {
      console.error('❌ Missing required fields:', {
        'FB Account ID present': !!fb_account_id,
        'Campaign Session ID present': !!campaign_flow_session_id,
        'Website Link present': !!website_link,
        'Daily Campaign Budget present': !!daily_campaign_budget,
        'Company Name present': !!company_name
      });
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }
    
    // Log values for debugging
    console.log('💰 Budget value:', daily_campaign_budget, typeof daily_campaign_budget);
    
    // Log important field values for debugging
    console.log('🔑 Key field values:', {
      'FB Account ID': fb_account_id,
      'Campaign Session ID': campaign_flow_session_id,
    });

    // Backend API endpoint
    const apiUrl = 'http://localhost:8000/facebook/campaign-creation-flow/master-flow-initiate-process';
    console.log('🔗 Forwarding request to backend API:', apiUrl);
    
    // Prepare the request payload based on exact format from documentation example
    const requestPayload = {
      fb_account_id,
      campaign_flow_session_id,
      company_name: company_name || 'Reeply AI', // Add company_name field which is required
      profile_data,
      location_data,
      website_link,
      preferred_language,
      privacy_policy_link,
      page_id,
      image_hashes,
      video_ids,
      daily_campaign_budget // Use daily_campaign_budget exactly as provided from client
    };
    
    console.log('📤 Sending request to backend with params:', {
      'FB Account ID': fb_account_id,
      'Campaign Session ID': campaign_flow_session_id,
      'Company Name': company_name || 'Reeply AI',
      'Page ID': page_id,
      'Images': image_hashes.length,
      'Videos': video_ids.length,
      'Locations': location_data?.length || 0,
      'Daily Campaign Budget': daily_campaign_budget,
      'Website Link': website_link
    });

    // Get FB API key
    const token_resp = await getFbMarketingApiKey()
    let token = ""
    if (token_resp.success && token_resp.token) {
      token = token_resp.token
      console.log('✅ Retrieved Facebook API token for request');
    } else {
      console.warn('⚠️ No Facebook API token available - will use system token');
    }

    // Prepare headers - authorization is always required
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.FASTY_API_TOKEN || process.env.FASTYBOT_API_KEY}`
    };
    
    // Only add the fb-api-key header if a token exists
    // For admin-assigned accounts, the token will be empty and
    // the Fasty backend will use its own system token
    if (token) {
      headers['fb-api-key'] = token;
    }

    // Make the request to the backend API using the specified URL structure
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
        { error: errorData.error || 'Failed to initiate master flow' },
        { status: response.status }
      )
    }

    // Return successful response
    console.log('✅ Successfully received response from backend');
    const data = await response.json();
    console.log('📊 Response data size (bytes):', JSON.stringify(data).length);
    console.log('📊 Response contains:', {
      'Status': data.status,
      'Campaign ID': data.campaign_flow_session_id,
      'Campaign name': data.campaign_name,
      'Audience count': data.audiences?.audiences?.length || 0,
      'Creative count': data.creatives_and_previews?.creatives?.length || 0
    });
    
    return NextResponse.json(data)
  } catch (error) {
    console.error('❌ Exception in master flow process:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}