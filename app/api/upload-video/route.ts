import { NextResponse } from 'next/server'
import { getUserDetail } from '@/app/actions'
import { getFbMarketingApiKey } from '@/app/actions';
import { trackEvent } from '@/lib/utils';
import { Events } from '@/lib/posthog-events';
import { encryptEmail } from '@/lib/email-encryption';
import { auth } from '@/auth';

export async function POST(request: Request) {
  console.log('📥 Received request to upload-video endpoint');
  try {
    // Get user details and Facebook account ID
    console.log('🔍 Fetching user details');
    const userDetail = await getUserDetail();
    const formData = await request.formData();
    const fbAccountId = userDetail?.user?.fbAccountId || '0';

    console.log('👤 User details:', {
      'Has user data': !!userDetail,
      'Has fbAccountId': !!userDetail?.user?.fbAccountId,
      'FB Account ID': fbAccountId
    });

    if (!fbAccountId) {
      console.error('❌ Facebook account ID not found');
      return NextResponse.json({
        success: false,
        error: 'Facebook account ID not found'
      }, { status: 400 });
    }

    // Log all form data entries for debugging
    console.log('📋 Received form data entries:');
    const formDataEntries = {};
    for (const [key, value] of Array.from(formData.entries())) {
      const valueType = typeof value;
      let valueDisplay = '[Object]';

      if (valueType === 'object') {
        if (value !== null) {
          try {
            // Safely check if it's a file-like object without using instanceof
            if (typeof value === 'object' && value !== null && 'name' in value && 'size' in value) {
              valueDisplay = `File (${String((value as any).name)}, ${String((value as any).size)} bytes)`;
            }
          } catch (e) {
            valueDisplay = '[Object - error accessing properties]';
          }
        } else {
          valueDisplay = '[null]';
        }
      } else {
        valueDisplay = String(value);
      }

      console.log(` - ${key}:`, valueType, valueDisplay);
      (formDataEntries as Record<string, any>)[key] = valueDisplay;
    }
    console.log('📊 Form data summary:', formDataEntries);

    // Extract key parameters from form data
    const file_size = formData.get('file_size');
    const videoFile = formData.get('file');
    const start_offset = formData.get('start_offset');
    const finish = formData.get('finish');
    const upload_session_id = formData.get('upload_session_id');
    // Accept both spellings but prefer the correct one
    const width = formData.get('width') || formData.get('widht');
    const height = formData.get('height');
    const campaign_session_id = formData.get('campaign_session_id');
    const video_id = formData.get('video_id'); // Extract video_id for chunk uploads

    // Determine which endpoint to use
    const isInitializing = !!file_size && !videoFile;
    const endpoint = isInitializing ? 'campaign-creation-flow/video-start' : 'campaign-creation-flow/video';

    console.log('🔍 Request analysis:', {
      'Is initializing': isInitializing,
      'Endpoint': endpoint,
      'Has file_size': !!file_size,
      'Has videoFile': !!videoFile,
      'Has upload_session_id': !!upload_session_id,
      'Has video_id': !!video_id,
      'Finish flag': finish,
      'Has campaign_session_id': !!campaign_session_id
    });

    // Create backend API URL
    const fastyEndpoint = process.env.FASTY_API_URL || 'http://localhost:8000';
    const apiUrl = `${fastyEndpoint}/facebook/${endpoint}`;

    console.log(`🔗 Using API URL: ${apiUrl}`);
    console.log(`🔄 Operation: ${isInitializing ? 'Initializing video upload' : 'Uploading video chunk'}`);

    // Log video_id if available (for chunk uploads)
    if (video_id) {
      console.log('🎬 Received video_id in request:', video_id);
    }

    // Prepare form data for backend
    const fbFormData = new FormData();
    fbFormData.append('fb_account_id', fbAccountId);
    console.log('➕ Added fb_account_id to form data:', fbAccountId);

    // Add parameters based on operation type
    if (isInitializing) {
      // Initialize video upload
      if (!file_size) {
        console.error('❌ Missing required file_size for initialization');
        return NextResponse.json({
          success: false,
          error: 'File size is required'
        }, { status: 400 });
      }

      console.log('📊 File size details - type:', typeof file_size, 'Value:', file_size);
      const fileSizeValue = typeof file_size === 'string' ? file_size : String(file_size);

      // Debug before appending
      console.log('➕ Adding file_size to form data:', fileSizeValue);
      fbFormData.append('file_size', fileSizeValue);

      if (width) {
        console.log('➕ Adding width to form data:', String(width));
        // Use the correct parameter name for the backend
        fbFormData.append('widht', String(width)); // Keep as 'widht' if backend expects it
      }

      if (height) {
        console.log('➕ Adding height to form data:', String(height));
        fbFormData.append('height', String(height));
      }

      if (campaign_session_id) {
        console.log('➕ Adding campaign_session_id to form data:', String(campaign_session_id));
        fbFormData.append('campaign_session_id', String(campaign_session_id));
      }
    } else {
      // Upload video chunk
      if (!videoFile) {
        console.error('❌ Missing file for chunk upload');
        return NextResponse.json({
          success: false,
          error: 'File is required for chunk upload'
        }, { status: 400 });
      }

      if (!upload_session_id) {
        console.error('❌ Missing upload_session_id for chunk upload');
        return NextResponse.json({
          success: false,
          error: 'upload_session_id is required for chunk upload'
        }, { status: 400 });
      }

      // Carefully avoid any reference to the File class
      let fileDescription = 'unknown';
      try {
        if (videoFile && typeof videoFile === 'object') {
          const tempObj = videoFile as any;
          if (tempObj && typeof tempObj === 'object' && tempObj.name && tempObj.size) {
            fileDescription = `Binary data (${String(tempObj.name)}, ${String(tempObj.size)} bytes)`;
          } else {
            fileDescription = 'Binary data without name/size properties';
          }
        } else {
          fileDescription = typeof videoFile;
        }
      } catch (e) {
        fileDescription = 'Error inspecting file: ' + String(e);
      }

      console.log('➕ Adding file to form data:', fileDescription);
      fbFormData.append('file', videoFile);

      console.log('➕ Adding start_offset to form data:', start_offset || '0');
      fbFormData.append('start_offset', start_offset || '0');

      // Ensure the finish flag is properly passed
      const finishValue = finish || '0';
      console.log('➕ Adding finish to form data:', finishValue);
      fbFormData.append('finish', finishValue);

      // Log special message for the last chunk to ensure proper handling
      if (finishValue === '1') {
        console.log('🚩 This is the FINAL CHUNK with finish=1 flag set');
      }

      console.log('➕ Adding upload_session_id to form data:', upload_session_id);
      fbFormData.append('upload_session_id', upload_session_id);

      // Ensure video_id is included for chunk uploads
      if (!video_id) {
        console.error('❌ Missing video_id for chunk upload - this is required');
        return NextResponse.json({
          success: false,
          error: 'video_id is required for chunk uploads but was not provided'
        }, { status: 400 });
      }

      console.log('➕ Adding video_id to form data:', video_id);
      fbFormData.append('video_id', video_id);

      if (width) {
        console.log('➕ Adding width to form data:', String(width));
        // Use the correct parameter name for the backend
        fbFormData.append('widht', String(width)); // Keep as 'widht' if backend expects it
      }

      if (height) {
        console.log('➕ Adding height to form data:', String(height));
        fbFormData.append('height', String(height));
      }

      if (campaign_session_id) {
        console.log('➕ Adding campaign_session_id to form data:', String(campaign_session_id));
        fbFormData.append('campaign_session_id', String(campaign_session_id));
      }
    }

    // We need to send FB Account ID in the form data but NOT pass the FB API key
    console.log('🔑 Using backend internal API key');

    console.log('📤 Making request with headers:', {
      'Authorization': 'Bearer [REDACTED]',
      'fb-api-key': '[NOT INCLUDED]'
    });

    // Double check that FB Account ID is included in the form data
    console.log('🔍 Form data includes FB Account ID:', fbFormData.has('fb_account_id'));
    if (!fbFormData.has('fb_account_id') || !fbAccountId) {
      console.error('❌ Missing FB Account ID in form data');
      return NextResponse.json({
        success: false,
        error: 'FB Account ID is required but missing'
      }, { status: 400 });
    }

    const token_resp = await getFbMarketingApiKey();
    let token = "";
    if (token_resp.success && token_resp.token) {
      token = token_resp.token;
    }

    // Make the request to the backend service without fb-api-key
    console.log('📤 Sending request to backend');
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.FASTY_API_TOKEN || ''}`,
        'fb-api-key': token,
      },
      body: fbFormData
    });

    console.log('📡 Backend API response status:', response.status);

    // Get and log raw response
    const responseText = await response.text();
    console.log('📄 Raw response text:', responseText);

    // Handle error responses
    if (!response.ok) {
      console.error('❌ Video upload error:', {
        status: response.status,
        statusText: response.statusText,
        endpoint,
        isInitializing,
        body: responseText
      });

      return NextResponse.json({
        success: false,
        error: responseText,
        details: {
          status: response.status,
          statusText: response.statusText,
          apiUrl: apiUrl
        }
      }, { status: response.status });
    }

    // Parse the response
    let data;
    try {
      data = JSON.parse(responseText);
      console.log('📊 Parsed response data:', JSON.stringify(data, null, 2));

      // Simplify response handling
      if (isInitializing) {
        console.log('🔍 Processing initialization response');

        // Extract upload_session_id
        let uploadSessionId = null;

        if (data.upload_session_id) {
          uploadSessionId = data.upload_session_id;
          console.log('✅ Found upload_session_id directly:', uploadSessionId);
        } else if (data.data && data.data.upload_session_id) {
          uploadSessionId = data.data.upload_session_id;
          console.log('✅ Found upload_session_id in data:', uploadSessionId);
        } else {
          console.error('❌ Could not find upload_session_id in response');
          return NextResponse.json({
            success: false,
            error: 'No upload_session_id found in response'
          }, { status: 500 });
        }

        // Extract video_id
        let videoId = null;

        if (data.video_id) {
          videoId = data.video_id;
          console.log('✅ Found video_id directly:', videoId);
        } else if (data.data && data.data.video_id) {
          videoId = data.data.video_id;
          console.log('✅ Found video_id in data:', videoId);
        } else if (data.id) {
          videoId = data.id;
          console.log('✅ Using id field as video_id:', videoId);
        } else {
          console.warn('⚠️ No explicit video_id found in response, using upload_session_id as fallback');
          videoId = uploadSessionId;
        }

        // Return a standardized response format
        data = {
          success: true,
          upload_session_id: uploadSessionId,
          video_id: videoId,
          data: {
            upload_session_id: uploadSessionId,
            video_id: videoId,
            start_offset: data.start_offset || 0,
            end_offset: data.end_offset || 0
          }
        };

        console.log('✅ Normalized initialization response:', JSON.stringify(data, null, 2));
      } else if (finish === '1') {
        console.log('🔍 Processing final chunk response');

        // Extract video_id from final chunk response
        let videoId = null;

        if (data.video_id) {
          videoId = data.video_id;
          console.log('✅ Found video_id directly:', videoId);
        } else if (data.data && data.data.video_id) {
          videoId = data.data.video_id;
          console.log('✅ Found video_id in data:', videoId);
        } else if (data.result && data.result.id) {
          videoId = data.result.id;
          console.log('✅ Found video_id in result.id:', videoId);
        } else {
          console.error('❌ Could not find video_id in final chunk response');
          // We'll continue and return the raw response, but log it as an error
          console.error('📊 Final chunk response without video_id:', JSON.stringify(data, null, 2));
        }

        // Extract campaign_session_id
        let campaignSessionId = null;

        if (data.campaign_session_id) {
          campaignSessionId = data.campaign_session_id;
        } else if (data.data && data.data.campaign_session_id) {
          campaignSessionId = data.data.campaign_session_id;
        }

        // Only standardize if we found a video_id
        if (videoId) {
          // Clean the video_id if needed
          if (typeof videoId === 'string' && videoId.startsWith('video_')) {
            const cleanedVideoId = videoId.substring(6);
            console.log('✅ Cleaned video_id by removing "video_" prefix:', cleanedVideoId);
            videoId = cleanedVideoId;
          }

          data = {
            success: true,
            video_id: videoId,
            data: {
              video_id: videoId,
              campaign_session_id: campaignSessionId
            }
          };

          console.log('✅ Normalized final chunk response:', JSON.stringify(data, null, 2));
        }
      }

    } catch (parseError) {
      console.error('❌ Failed to parse JSON response:', parseError);
      console.error('❌ Raw text that failed to parse:', responseText);

      return NextResponse.json({
        success: false,
        error: 'Failed to parse backend response',
        raw_response: responseText
      }, { status: 500 });
    }

    // Return successful response
    console.log('✅ Returning response to client');
    return NextResponse.json(data);
  } catch (error) {
    console.error('❌ Exception in video upload process:', error);
    return NextResponse.json({
      success: false,
      error: String(error)
    }, { status: 500 });
  }
}