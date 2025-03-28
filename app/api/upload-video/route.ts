import { NextResponse } from 'next/server'
import { getUserDetail } from '@/app/actions'
import { getFbMarketingApiKey } from '@/app/actions';

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
      const valueDisplay = valueType === 'object' 
        ? (value instanceof File ? `File (${value.name}, ${value.size} bytes)` : '[Object]') 
        : String(value);
      
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
    const width = formData.get('widht') || formData.get('width');
    const height = formData.get('height');
    const campaign_session_id = formData.get('campaign_session_id');

    // Determine which endpoint to use
    const isInitializing = !!file_size && !videoFile;
    const endpoint = isInitializing ? 'campaign-creation-flow/video-start' : 'campaign-creation-flow/video';
    
    console.log('🔍 Request analysis:', {
      'Is initializing': isInitializing,
      'Endpoint': endpoint,
      'Has file_size': !!file_size,
      'Has videoFile': !!videoFile,
      'Has upload_session_id': !!upload_session_id,
      'Has campaign_session_id': !!campaign_session_id
    });
    
    // Create backend API URL
    const fastyEndpoint = process.env.FASTY_API_URL || 'http://localhost:8000';
    const apiUrl = `${fastyEndpoint}/facebook/${endpoint}`;
    
    console.log(`🔗 Using API URL: ${apiUrl}`);
    console.log(`🔄 Operation: ${isInitializing ? 'Initializing video upload' : 'Uploading video chunk'}`);
    
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
        fbFormData.append('widht', String(width));
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
      if (!videoFile || !upload_session_id) {
        console.error('❌ Missing file or upload_session_id for chunk upload');
        return NextResponse.json({ 
          success: false, 
          error: 'File and upload_session_id are required for chunk upload' 
        }, { status: 400 });
      }
      
      console.log('➕ Adding file to form data:', videoFile instanceof File ? `File (${videoFile.name}, ${videoFile.size} bytes)` : videoFile);
      fbFormData.append('file', videoFile);
      
      console.log('➕ Adding start_offset to form data:', start_offset || '0');
      fbFormData.append('start_offset', start_offset || '0');
      
      console.log('➕ Adding finish to form data:', finish || '0');
      fbFormData.append('finish', finish || '0');
      
      console.log('➕ Adding upload_session_id to form data:', upload_session_id);
      fbFormData.append('upload_session_id', upload_session_id);
      
      if (width) {
        console.log('➕ Adding width to form data:', String(width));
        fbFormData.append('widht', String(width));
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
    
    // We need to send FB Account ID in the form data but not pass the FB API key
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
    
    // Make the request to the backend service without fb-api-key
    console.log('📤 Sending request to backend');
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.FASTY_API_TOKEN || ''}`
        // Removed fb-api-key header to let backend use its internal key
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
    } catch (parseError) {
      console.error('❌ Failed to parse JSON response:', parseError);
      console.error('❌ Raw text that failed to parse:', responseText);
      
      return NextResponse.json({ 
        success: false,
        error: 'Failed to parse backend response',
        raw_response: responseText
      }, { status: 500 });
    }
    
    // Check for specific response structure based on initialization or chunk upload
    if (isInitializing) {
      console.log('🔍 Checking initialization response structure');
      // For initialization, we expect { success: true, data: { upload_session_id: string } }
      if (!data.success) {
        console.error('❌ Initialization response indicates failure:', data);
        return NextResponse.json({ 
          success: false,
          error: 'Backend reported initialization failure',
          backend_response: data
        }, { status: 500 });
      }
      
      if (!data.data || !data.data.upload_session_id) {
        console.error('❌ Missing upload_session_id in successful response:', data);
        return NextResponse.json({ 
          success: false,
          error: 'Backend response missing upload_session_id',
          backend_response: data
        }, { status: 500 });
      }
      
      console.log('✅ Successfully received upload_session_id:', data.data.upload_session_id);
    } else {
      console.log('🔍 Checking chunk upload response structure');
      // For chunk uploads, last chunk should have video_id
      if (finish === '1' && (!data.success || !data.data || !data.data.video_id)) {
        console.error('❌ Final chunk upload missing video_id in response:', data);
        if (!data.success) {
          console.error('❌ Backend reported chunk upload failure');
        } else if (!data.data) {
          console.error('❌ Missing data field in chunk response');
        } else {
          console.error('❌ Missing video_id in final chunk response data');
        }
      }
    }

    // Return successful response
    console.log('✅ Returning success response to client');
    return NextResponse.json({ 
      success: true, 
      data: data 
    });
  } catch (error) {
    console.error('❌ Exception in video upload process:', error);
    return NextResponse.json({ 
      success: false, 
      error: String(error) 
    }, { status: 500 });
  }
}