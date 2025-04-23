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
      company_name,  // Make sure we extract company_name
      instagram_account_id,
      post_assessment_campaign_objective // Extract campaign objective if provided
    } = body

    console.log('📊 Request validation data:', {
      'Has FB Account ID': !!fb_account_id,
      'Has Campaign Session ID': !!campaign_flow_session_id,
      'Has Website Link': !!website_link,
      'Image hashes count': image_hashes.length,
      'Video IDs count': video_ids.length,
      'Location data count': location_data?.length || 0,
      'Campaign Objective': post_assessment_campaign_objective
    });
    
    // Log location data structure to help debug issues
    if (location_data && location_data.length > 0) {
      console.log('📍 Location data structure check:');
      console.log('📍 Total locations in request:', location_data.length);
      
      // Log detailed information about each location
      location_data.forEach((loc: any, index: number) => {
        console.log(`📍 Location ${index + 1}:`, {
          'Has country': !!loc.country,
          'Country name': loc.country?.name,
          'Country code': loc.country?.code,
          'Has regions': !!loc.regions && Array.isArray(loc.regions),
          'Regions count': loc.regions?.length || 0
        });
        
        // Log details about regions within this location
        if (loc.regions && Array.isArray(loc.regions) && loc.regions.length > 0) {
          loc.regions.forEach((region: any, regIdx: number) => {
            console.log(`📍 Location ${index + 1}, Region ${regIdx + 1}:`, {
              'Region name': region.name,
              'Region key': region.key,
              'Has cities': !!region.cities && Array.isArray(region.cities),
              'Cities count': region.cities?.length || 0
            });
            
            // Log cities if present
            if (region.cities && region.cities.length > 0) {
              console.log(`📍 Location ${index + 1}, Region ${regIdx + 1} cities:`, 
                region.cities.map((city: { name: string }) => city.name).join(', '));
            }
          });
        }
      });
    } else {
      console.warn('⚠️ No location data provided in request');
    }

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
    const apiUrl = `${process.env.FASTY_API_URL}/facebook/campaign-creation-flow/master-flow-initiate-process`
    console.log('🔗 Forwarding request to backend API:', apiUrl);
    
    // Ensure video_ids are in the right format for the backend API
    // IMPORTANT: The Fasty backend expects raw numeric video IDs without any "video_" prefix
    // We need to ensure we're sending the video IDs in the correct format
    const processedVideoIds = video_ids.map((videoId: string) => {
      const videoIdStr = String(videoId);
      // If the video ID has a "video_" prefix, we need to remove it
      if (videoIdStr.startsWith('video_')) {
        console.log(`🔄 Removing "video_" prefix from ${videoIdStr} to match backend expectations`);
        return videoIdStr.substring(6); // Remove "video_" prefix
      }
      return videoIdStr;
    });
    
    console.log('🎬 Final video IDs being sent to master flow:', JSON.stringify(processedVideoIds));


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
      video_ids: processedVideoIds, // Use processed video_ids
      daily_campaign_budget, // Use daily_campaign_budget exactly as provided from client
      instagram_account_id,
      post_assessment_campaign_objective
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
      'Website Link': website_link,
      'Campaign Objective': post_assessment_campaign_objective
    });
    
    // Log detailed video_ids for debugging the video upload issues
    if (video_ids && video_ids.length > 0) {
      console.log('🎬 Video IDs being sent to master flow:', JSON.stringify(video_ids));
      
      // Log the transformed video IDs for debugging
      for (let i = 0; i < processedVideoIds.length; i++) {
        const originalId = video_ids[i];
        const processedId = processedVideoIds[i];
        console.log(`🎬 Video ID ${i+1}: Original=${originalId}, Processed=${processedId}`);
        
        // If we had to transform it, log that information
        if (String(originalId) !== processedId) {
          console.log(`ℹ️ Video ID ${i+1} was transformed to match Fasty backend expectations`);
        }
        
        // Detailed debug information about video ID format
        const isNumeric = /^\d+$/.test(processedId);
        console.log(`🔍 Video ID ${i+1} format check: Is numeric=${isNumeric}, Length=${processedId.length}`);
        
        // Add a warning if the video ID is not in the expected format
        if (!isNumeric) {
          console.error(`❌ CRITICAL ERROR: Video ID ${i+1} is not in the expected numeric format!`);
          console.error(`❌ This will likely cause the campaign creation to fail.`);
          console.error(`❌ Make sure the video upload process is correctly returning a numeric video ID.`);
        }
      }
      
      // Add a warning about video processing time
      console.warn('⚠️ Videos detected in campaign request. Note that Facebook may need time to process videos before they can be used in ads.');
      console.warn('⚠️ If campaign creation fails with "Object does not exist" error, it likely means Facebook is still processing the video.');
    } else if (image_hashes && image_hashes.length === 0) {
      console.warn('⚠️ No images or videos included in the campaign');
    }

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
      'Authorization': `Bearer ${process.env.FASTY_API_TOKEN}`
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
      console.error('❌ Request data that caused the error:', JSON.stringify(requestPayload, null, 2));
      
      // Get the raw response text
      const responseText = await response.text();
      console.error('❌ Raw response text:', responseText);
      
      let errorData;
      try {
        // Try to parse the response text as JSON
        errorData = JSON.parse(responseText);
        console.error('❌ Error data:', JSON.stringify(errorData, null, 2));
      } catch (parseError) {
        console.error('❌ Failed to parse error response:', parseError);
        errorData = { 
          error: 'Failed to parse error response',
          raw_response: responseText.substring(0, 1000) // Truncate if too long
        };
      }
      
      // For clarity, include detailed error information including the request data that caused the error
      return NextResponse.json(
        { 
          error: errorData.error || 'Failed to initiate master flow',
          details: {
            status: response.status,
            video_ids: video_ids,
            raw_error: responseText.substring(0, 1000) // Include part of the raw error
          }
        },
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