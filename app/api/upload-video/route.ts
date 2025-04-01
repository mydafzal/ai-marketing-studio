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
      
      console.log('➕ Adding finish to form data:', finish || '0');
      fbFormData.append('finish', finish || '0');
      
      console.log('➕ Adding upload_session_id to form data:', upload_session_id);
      fbFormData.append('upload_session_id', upload_session_id);
      
      // Add video_id which is required for chunk uploads
      // video_id and upload_session_id are two distinct entities and should not be treated as interchangeable
      if (video_id) {
        console.log('➕ Adding video_id to form data:', video_id);
        fbFormData.append('video_id', video_id);
      } else {
        console.error('❌ Missing video_id for chunk upload - this is required');
        return NextResponse.json({ 
          success: false, 
          error: 'video_id is required for chunk uploads but was not provided' 
        }, { status: 400 });
      }
      
      // Always include the upload_session_id separately
      console.log('➕ Adding upload_session_id to form data:', upload_session_id);
      
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
      // Use type assertion to make TypeScript happy - we're checking if the property exists
      const hasUploadSessionId = data && typeof data === 'object' && 'upload_session_id' in data;
      
      if (isInitializing && hasUploadSessionId) {
        // For initialization, if we have an upload_session_id, it's a success
        const uploadSessionId = (data as any).upload_session_id;
        const startOffset = (data as any).start_offset || 0;
        const endOffset = (data as any).end_offset || 0;
        
        console.log('✅ Successfully detected upload_session_id in raw response:', uploadSessionId);
        
        // According to the API guidelines, both upload_session_id and video_id should be 
        // returned from the initialization response
        // These are two separate entities:
        // 1. upload_session_id - tracks the upload session
        // 2. video_id - the actual ID of the video that will be used in campaigns
        
        // Make sure to extract the actual video_id from the response if present
        let video_id;
        
        // Function to recursively search for video_id in the initialization response
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
        
        // Search for video_id in the response
        video_id = findVideoId(data);
        
        // If not found, use the ID field which may contain the video_id
        if (!video_id && data.id) {
          video_id = data.id;
          console.log('✅ Using id field as video_id:', video_id);
        }
        
        // If still not found, use uploadSessionId as a fallback but log a warning
        if (!video_id) {
          video_id = uploadSessionId;
          console.warn('⚠️ No proper video_id found in response, using upload_session_id as fallback:', video_id);
          console.warn('⚠️ This may cause issues with video processing in campaigns!');
        } else {
          console.log('✅ Found actual video_id in initialization response:', video_id);
        }
        
        data = {
          success: true,
          video_id: video_id, // Include at top level for Python compatibility
          data: {
            upload_session_id: uploadSessionId,
            video_id: video_id, // Also include in data object for JS client
            start_offset: startOffset,
            end_offset: endOffset
          }
        };
      } else if (!isInitializing && data && typeof data === 'object' && 'video_id' in data) {
        // For chunk upload, if we have a video_id in the final chunk, it's a success
        // This is critical - we need to extract the video_id ONLY from the final chunk response
        const videoId = (data as any).video_id;
        const campaignSessionId = (data as any).campaign_session_id;
        
        if (videoId) {
          console.log('✅ Successfully detected video_id in final chunk response:', videoId);
          data = {
            success: true,
            data: {
              video_id: videoId,
              campaign_session_id: campaignSessionId
            }
          };
        } else {
          console.error('❗ No video_id found in final chunk response');
          // Try to find video_id in other response formats
          let foundVideoId = null;
          
          // Check in data.result.id
          if (data && typeof data === 'object' && data.result && data.result.id) {
            foundVideoId = data.result.id;
            console.log('✅ Found video_id in data.result.id:', foundVideoId);
          }
          // Check in data.data.id
          else if (data && typeof data === 'object' && data.data && data.data.id) {
            foundVideoId = data.data.id;
            console.log('✅ Found video_id in data.data.id:', foundVideoId);
          }
          
          if (foundVideoId) {
            data = {
              success: true,
              data: {
                video_id: foundVideoId,
                campaign_session_id: campaignSessionId
              }
            };
          } else {
            // If we still can't find the video_id, log the complete response for debugging
            console.error('❌ Failed to find video_id in any response format');
            console.error('📊 Complete response:', JSON.stringify(data, null, 2));
            
            // The frontend will handle this as an error case
            data = {
              success: false,
              error: 'No video_id found in final chunk response',
              data: {
                campaign_session_id: campaignSessionId
              }
            };
          }
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
      
      // For final chunk, check for video_id - this is CRITICAL
      // According to the API guidelines, the definitive video_id is returned in the final chunk response
      // This is the video_id that must be used for all subsequent operations, NOT the upload_session_id
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
          
          // Check result property (some API responses put it there)
          if (obj.result) {
            if (obj.result.video_id) return obj.result.video_id;
            if (obj.result.id) return obj.result.id;
            const resultSearch = findVideoId(obj.result);
            if (resultSearch) return resultSearch;
          }
          
          return undefined;
        };
        
        const videoId = findVideoId(data);
        
        if (videoId) {
          console.log('✅ Successfully found video_id in final chunk response:', videoId);
          
          // Make sure the video_id is directly accessible in the response
          // Ensure it's a clean numeric ID without any prefixes
          let cleanedVideoId = videoId;
          if (typeof videoId === 'string' && videoId.startsWith('video_')) {
            cleanedVideoId = videoId.substring(6); // Remove "video_" prefix
            console.log('✅ Cleaned videoId by removing "video_" prefix:', cleanedVideoId);
          }
          
          if (!data.success) data.success = true;
          if (!data.data) data.data = {};
          data.data.video_id = cleanedVideoId;
          
          // Log the final video ID format
          console.log('✅ Final video_id format check for campaign usage: Is numeric=' + /^\d+$/.test(String(cleanedVideoId)));
          
          console.log('✅ Normalized data structure with video_id:', JSON.stringify(data, null, 2));
        } else {
          console.error('❌ Could not find video_id in final chunk response - this is a critical error');
          console.error('🔍 Raw response data:', JSON.stringify(data, null, 2));
          
          // For final chunk with no video_id, this is an error condition that should be reported
          // We'll mark it as a failure so the frontend can handle it appropriately
          data = {
            success: false,
            error: 'No video_id found in final chunk response',
            original_data: data
          };
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