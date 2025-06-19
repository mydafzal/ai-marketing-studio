import { NextResponse } from 'next/server';
import { getUserDetail, getFbMarketingApiKey } from '@/app/actions';
import { getCampaignIdFromUrl } from '@/lib/api/fasty-bot/helpers/campaign-id-from-url-helper';

export async function POST(request: Request) {
  try {
    // Get user details
    const userDetail = await getUserDetail();
    if (!userDetail.success || !userDetail.user) {
      return NextResponse.json({ 
        success: false, 
        error: 'User not authenticated or not found' 
      }, { status: 401 });
    }

    // Get FB account ID
    const fbAccountId = userDetail.user.fbAccountId;
    if (!fbAccountId) {
      return NextResponse.json({ 
        success: false, 
        error: 'Facebook account ID not found' 
      }, { status: 400 });
    }

    // Get FB API key
    const tokenResp = await getFbMarketingApiKey();
    if (!tokenResp.success || !tokenResp.token) {
      return NextResponse.json({ 
        success: false, 
        error: 'Failed to retrieve Facebook API key' 
      }, { status: 400 });
    }

    // Parse request body
    const data = await request.json();
    const { imageUrl } = data;

    if (!imageUrl) {
      return NextResponse.json({ 
        success: false, 
        error: 'Image URL is required' 
      }, { status: 400 });
    }

    // Get campaign ID from URL or request
    const campaignId = data.campaignId || await getCampaignIdFromUrl();
    if (!campaignId) {
      return NextResponse.json({ 
        success: false, 
        error: 'Campaign ID not found' 
      }, { status: 400 });
    }

    // Prepare request to Fasty Bot endpoint
    const fastyBotEndpoint = process.env.FASTY_API_URL;
    if (!fastyBotEndpoint) {
      return NextResponse.json({ 
        success: false, 
        error: 'Fasty Bot API URL not configured' 
      }, { status: 500 });
    }

    // Construct payload for Fasty Bot
    const payload = {
      fb_account_id: fbAccountId,
      campaign_id: campaignId,
      modifications_request: {
        ad_creative_image_url: imageUrl
      }
    };

    // Make request to Fasty Bot
    const response = await fetch(`${fastyBotEndpoint}/facebook/dashboard/edit-campaign`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'fb-api-key': tokenResp.token,
        'Authorization': `Bearer ${process.env.FASTY_API_TOKEN}`
      },
      body: JSON.stringify(payload)
    });

    // Parse response
    const responseData = await response.json();

    // Check if the request was successful
    if (!response.ok) {
      return NextResponse.json({ 
        success: false, 
        error: 'Failed to update campaign with new image',
        details: responseData
      }, { status: response.status });
    }

    // Return success response
    return NextResponse.json({ 
      success: true, 
      data: responseData 
    });

  } catch (error) {
    console.error('Error updating campaign with new image:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Internal server error'
    }, { status: 500 });
  }
}