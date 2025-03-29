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
      
      // Add video_id which is required for chunk uploads
      // If it's not provided, use upload_session_id as fallback since they're the same for Facebook
      if (video_id) {
        console.log('➕ Adding video_id to form data:', video_id);
        fbFormData.append('video_id', video_id);
      } else if (upload_session_id) {
        console.log('➕ Using upload_session_id as video_id:', upload_session_id);
        fbFormData.append('video_id', upload_session_id);
      }
      
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
    
    // Make the request to the backend service without fb-api-key
    console.log('📤 Sending request to backend');
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.FASTY_API_TOKEN || ''}`
        // Do not include fb-api-key header to let backend use its internal key
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
      
      // Check if we have a video_id and upload_session_id in the response
      // This indicates a successful response even if it doesn't match our expected format
      if (isInitializing && data.upload_session_id) {
        // For initialization, if we have an upload_session_id, it's a success
        console.log('✅ Successfully detected upload_session_id in raw response:', data.upload_session_id);
        data = {
          success: true,
          data: {
            upload_session_id: data.upload_session_id,
            start_offset: data.start_offset || 0,
            end_offset: data.end_offset || 0
          }
        };
      } else if (!isInitializing && data.video_id) {
        // For chunk upload, if we have a video_id in the final chunk, it's a success
        console.log('✅ Successfully detected video_id in raw response:', data.video_id);
        data = {
          success: true,
          data: {
            video_id: data.video_id,
            campaign_session_id: data.campaign_session_id
          }
        };
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
    
    // Check for specific response structure based on initialization or chunk upload
    // This is less strict now, as we'll have the frontend handle various response formats
    if (isInitializing) {
      console.log('🔍 Checking initialization response structure');
      
      // Function to recursively search for upload_session_id
      const findUploadSessionId = (obj: any): string | undefined => {
        if (!obj || typeof obj !== 'object') return undefined;
        
        // Direct property
        if (obj.upload_session_id) return obj.upload_session_id;
        
        // Check data property
        if (obj.data) {
          if (obj.data.upload_session_id) return obj.data.upload_session_id;
          if (obj.data.data && obj.data.data.upload_session_id) return obj.data.data.upload_session_id;
          const dataResult = findUploadSessionId(obj.data);
          if (dataResult) return dataResult;
        }
        
        return undefined;
      };
      
      const uploadSessionId = findUploadSessionId(data);
      
      if (uploadSessionId) {
        console.log('✅ Successfully found upload_session_id:', uploadSessionId);
      } else {
        console.log('⚠️ Could not find upload_session_id in response, but will pass along raw response');
        console.log('🔍 Raw response data:', JSON.stringify(data, null, 2));
      }
    } else {
      console.log('🔍 Checking chunk upload response structure');
      
      // For final chunk, check for video_id
      if (finish === '1') {
        // Function to recursively search for video_id
        const findVideoId = (obj: any): string | undefined => {
          if (!obj || typeof obj !== 'object') return undefined;
          
          // Direct property
          if (obj.video_id) return obj.video_id;
          
          // Check data property
          if (obj.data) {
            if (obj.data.video_id) return obj.data.video_id;
            if (obj.data.data && obj.data.data.video_id) return obj.data.data.video_id;
            const dataResult = findVideoId(obj.data);
            if (dataResult) return dataResult;
          }
          
          return undefined;
        };
        
        const videoId = findVideoId(data);
        
        if (videoId) {
          console.log('✅ Successfully found video_id in final chunk response:', videoId);
        } else {
          console.log('⚠️ Could not find video_id in final chunk response, but will pass along raw response');
          console.log('🔍 Raw response data:', JSON.stringify(data, null, 2));
        }
      }
    }

    // Return successful response with normalized structure
    console.log('✅ Returning success response to client');
    
    // Normalize the response to ensure consistent structure
    const normalizedData = {
      success: true,
      data: data
    };
    
    // For debug purposes, log the full normalized response
    console.log('📊 Normalized response being sent to client:', JSON.stringify(normalizedData, null, 2));
    
    return NextResponse.json(normalizedData);
  } catch (error) {
    console.error('❌ Exception in video upload process:', error);
    return NextResponse.json({ 
      success: false, 
      error: String(error) 
    }, { status: 500 });
  }
}