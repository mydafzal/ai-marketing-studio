import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { getFbMarketingApiKey } from '@/app/actions';

export async function POST(req: NextRequest) {
  console.log('📥 Received request to proxy-submit-message endpoint');
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
    const { message, role } = body;

    if (!message) {
      console.error('❌ Missing required field: message');
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      )
    }
    
    console.log('💬 Message content:', message.substring(0, 50) + (message.length > 50 ? '...' : ''));
    console.log('👤 Message role:', role || 'assistant (default)');

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

    // Make the request to the backend API - using the correct endpoint
    const fastyEndpoint = process.env.FASTY_API_URL || 'http://localhost:8000';
    const apiUrl = `${fastyEndpoint}/ai_helpers/generate-gpt-response`
    
    console.log('🔗 Submitting message to API URL:', apiUrl);
    
    // Prepare request payload with the format expected by the API
    const requestPayload = {
      prompt: message
    };
    
    // Prepare headers for the AI helpers endpoint
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.FASTY_API_TOKEN || ''}`,
      // Include x-api-key if we have an OpenAI key in environment variables
      ...(process.env.OPENAI_API_KEY ? { 'x-api-key': process.env.OPENAI_API_KEY } : {})
    };
    
    console.log('📤 Making request with OpenAI key:', !!process.env.OPENAI_API_KEY);
    
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
        { error: errorData.error || 'Failed to submit message' },
        { status: response.status }
      )
    }

    // Return successful response - format according to the AI helpers endpoint structure
    console.log('✅ Successfully submitted message and received AI response');
    const data = await response.json();
    const aiResponse = data.response || '';
    console.log('📊 AI Response length:', aiResponse.length, 'characters');
    
    return NextResponse.json({ 
      success: true, 
      message: aiResponse,
      data 
    })
  } catch (error) {
    console.error('❌ Exception in message submission:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}