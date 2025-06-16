import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { getFbMarketingApiKey } from '@/app/actions';

export async function POST(req: NextRequest) {
  console.log('📥 Received request to proxy-adjust-demographics endpoint');
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
    
    // Extract values from body
    let {
      campaign_creation_flow_session_id,
      min_age,
      max_age,
      include_male,
      include_female
    } = body

    console.log('📊 Request validation data:', {
      'Has Campaign Session ID': !!campaign_creation_flow_session_id,
      'Has Min Age': min_age !== undefined,
      'Has Max Age': max_age !== undefined,
      'Has Include Male': include_male !== undefined,
      'Has Include Female': include_female !== undefined
    });

    // Make sure required fields are present
    if (!campaign_creation_flow_session_id || min_age === undefined || max_age === undefined || 
        include_male === undefined || include_female === undefined) {
      console.error('❌ Missing required fields:', {
        'Campaign Flow Session ID present': !!campaign_creation_flow_session_id,
        'Min Age present': min_age !== undefined,
        'Max Age present': max_age !== undefined,
        'Include Male present': include_male !== undefined,
        'Include Female present': include_female !== undefined
      });
      return NextResponse.json(
        { error: 'Missing required fields: campaign_creation_flow_session_id, min_age, max_age, include_male, and include_female are all required' },
        { status: 400 }
      )
    }

    // Validate age range
    if (min_age < 18 || min_age > 65 || max_age < 18 || max_age > 65 || min_age > max_age) {
      console.error('❌ Invalid age range:', { min_age, max_age });
      return NextResponse.json(
        { error: 'Invalid age range: min_age and max_age must be between 18 and 65, and min_age must be less than or equal to max_age' },
        { status: 400 }
      )
    }

    // Ensure at least one gender is selected
    if (!include_male && !include_female) {
      console.error('❌ No gender selected');
      return NextResponse.json(
        { error: 'At least one gender must be selected' },
        { status: 400 }
      )
    }

    // Make the request to the backend API
    const fastyEndpoint = process.env.FASTY_API_URL || 'http://localhost:8000';
    const apiUrl = `${fastyEndpoint}/facebook/campaign-creation-flow/age-and-gender-adjustment`
    
    console.log('🔗 Adjusting demographics with backend API URL:', apiUrl);
    console.log('📊 Adjustment parameters:', {
      'Campaign Flow Session ID': campaign_creation_flow_session_id,
      'Min Age': min_age,
      'Max Age': max_age,
      'Include Male': include_male,
      'Include Female': include_female
    });
    
    const requestPayload = {
      campaign_creation_flow_session_id,
      min_age,
      max_age,
      include_male,
      include_female
    };
    
    // Prepare headers
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.FASTY_API_TOKEN || ''}`
    };
    
    console.log('📤 Sending request to backend');
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify(requestPayload),
    })

    console.log('📡 Backend API response status:', response.status);

    if (!response.ok) {
      console.error('❌ Backend API returned error status:', response.status);
      
      // Try to get the full error details for debugging
      let errorData;
      let errorText = '';
      
      try {
        // First get raw text response for better debugging
        errorText = await response.text();
        console.error('❌ Raw error response:', errorText);
        
        try {
          // Then try to parse as JSON if possible
          errorData = JSON.parse(errorText);
          console.error('❌ Error data:', JSON.stringify(errorData, null, 2));
        } catch (jsonError) {
          console.error('❌ Response was not valid JSON:', jsonError);
          // Use the raw text as error message if not valid JSON
          errorData = { error: errorText || 'Failed to adjust demographics' };
        }
      } catch (textError) {
        console.error('❌ Failed to read error response:', textError);
        errorData = { error: 'Failed to read error response' };
      }
      
      // Return a detailed error response for debugging
      return NextResponse.json(
        { 
          error: (errorData && errorData.error) || 'Failed to adjust demographics',
          details: errorData,
          requestPayload,
          rawText: errorText
        },
        { status: response.status }
      )
    }

    // Return successful response
    console.log('✅ Successfully received response from backend');
    const data = await response.json();
    console.log('📊 Response data:', JSON.stringify(data, null, 2));
    
    return NextResponse.json(data)
  } catch (error) {
    console.error('❌ Exception in demographics adjustment:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}