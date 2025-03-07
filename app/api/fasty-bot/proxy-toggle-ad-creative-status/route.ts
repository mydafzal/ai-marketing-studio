import { NextResponse } from 'next/server';
import { getFbMarketingApiKey } from '@/app/actions';

export async function POST(request: Request) {
  try {
    // Parse the incoming request body
    const requestData = await request.json();
    const { ad_creative_id } = requestData;

    // Get FB API key from the request headers or fetch it if not provided
    let fbApiKey = request.headers.get('fb-api-key') || '';
    if (!fbApiKey) {
      const tokenResponse = await getFbMarketingApiKey();
      if (tokenResponse?.success && tokenResponse?.token) {
        fbApiKey = tokenResponse.token;
      }
    }

    // Basic validation
    if (!ad_creative_id) {
      return NextResponse.json(
        { error: 'Missing required parameter: ad_creative_id' },
        { status: 400 }
      );
    }

    console.log('Attempting to toggle status for ad creative:', ad_creative_id);

    // Construct the FastAPI URL with the ad_creative_id as a query parameter
    const fastyApiUrl = process.env.FASTY_API_URL || 'http://localhost:8000';
    const endpointUrl = `${fastyApiUrl}/facebook/exec/direct/ads/switch-ad-creative-status?ad_creative_id=${ad_creative_id}`;    
    console.log('Calling FastAPI endpoint:', endpointUrl);
    
    // Call the FastAPI endpoint with no body, since we're passing the parameter in the URL
    const response = await fetch(endpointUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.FASTY_API_TOKEN ?? ''}`,
        'fb-api-key': fbApiKey,
      },
      // No body because we're using query parameters
    });
    
    console.log('FastAPI response status:', response.status);
    
    // Get response text for debugging
    const responseText = await response.text();
    console.log('Response text:', responseText);
    
    // Check for errors
    if (!response.ok) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Failed to toggle ad creative status', 
          details: responseText
        },
        { status: response.status }
      );
    }
    
    // Parse and return the response
    let responseData;
    try {
      responseData = JSON.parse(responseText);
      console.log('Parsed response data:', responseData);
    } catch (e) {
      console.log('Failed to parse response as JSON');
      responseData = { message: responseText };
    }
    
    // Return success response
    return NextResponse.json({
      success: true,
      previous_status: responseData.previous_status,
      new_status: responseData.new_status,
      result: responseData.result
    });

  } catch (err) {
    console.error('Error in Next.js route:', err);
    return NextResponse.json(
      { 
        success: false,
        error: 'An unexpected error occurred', 
        details: String(err) 
      },
      { status: 500 }
    );
  }
}