import { NextResponse } from 'next/server';
import { getFbMarketingApiKey } from '@/app/actions';

// Mark this route as dynamic since it uses request.headers
export const dynamic = 'force-dynamic';

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
      } else {
        return NextResponse.json({ success: false, error: 'Failed to get FB API key' }, { status: 401 });
      }
    }

    if (!ad_creative_id) {
      return NextResponse.json({ success: false, error: 'Missing ad_creative_id' }, { status: 400 });
    }

    // Get current status
    const statusResponse = await fetch(`https://graph.facebook.com/v18.0/${ad_creative_id}?fields=status&access_token=${fbApiKey}`, {
      method: 'GET',
    });

    const statusData = await statusResponse.json();
    
    if (!statusResponse.ok) {
      return NextResponse.json({ success: false, error: statusData.error || 'Failed to get ad creative status' }, { status: statusResponse.status });
    }

    const currentStatus = statusData.status;
    console.log(`Current status of ad creative ${ad_creative_id}: ${currentStatus}`);

    // Toggle status (ACTIVE -> PAUSED, PAUSED -> ACTIVE)
    const newStatus = currentStatus === 'ACTIVE' ? 'PAUSED' : 'ACTIVE';

    // Update the status
    const toggleResponse = await fetch(`https://graph.facebook.com/v18.0/${ad_creative_id}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        status: newStatus,
        access_token: fbApiKey,
      }),
    });

    const toggleData = await toggleResponse.json();
    
    if (!toggleResponse.ok) {
      return NextResponse.json({ success: false, error: toggleData.error || 'Failed to toggle ad creative status' }, { status: toggleResponse.status });
    }

    return NextResponse.json({ 
      success: true, 
      data: {
        ad_creative_id,
        previous_status: currentStatus,
        new_status: newStatus
      } 
    });
  } catch (error) {
    console.error('Error toggling ad creative status:', error);
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error occurred' 
    }, { status: 500 });
  }
}