import { useState, useRef, useEffect } from 'react';
import { MediaItem } from '../types';
import { calculateAspectRatio, calculateVideoAspectRatio } from '../utils';

// Response interfaces
interface UploadImageResponse {
  success: boolean;
  image_hash?: string;
  campaign_session_id?: string;
  error?: string;
}

interface VideoStartResponse {
  success: boolean;
  data: {
    upload_session_id: string;
    start_offset?: number;
    end_offset?: number;
  };
}

interface VideoChunkResponse {
  success: boolean;
  data: {
    video_id?: string;
    campaign_session_id?: string;
  };
}

interface UserDetailResponse {
  success: boolean;
  account?: {
    fbAccountId?: string;
    fbPageId?: string;
    defaultExtraDetails?: string;
    privacy_policy_link?: string;
  };
  token?: string;
}

export function useMediaUpload() {
  console.log('🔄 Initializing useMediaUpload hook');
  const [mediaItems, setMediaItems] = useState<MediaItem[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [campaignSessionId, setCampaignSessionId] = useState<string | null>(null);
  // Create a ref to access the latest campaign session ID in async callbacks
  const campaignSessionIdRef = useRef<string | null>(null);
  const [fbAccountId, setFbAccountId] = useState<string>('');
  const [fbPageId, setFbPageId] = useState<string>('');
  
  // Log any changes to important state variables
  useEffect(() => {
    console.log("🔄 State Update - Campaign Session ID:", campaignSessionId);
    // Update the ref when the state changes
    campaignSessionIdRef.current = campaignSessionId;
  }, [campaignSessionId]);
  
  useEffect(() => {
    console.log("🔄 State Update - FB Account ID:", fbAccountId);
  }, [fbAccountId]);
  
  useEffect(() => {
    console.log("🔄 State Update - FB Page ID:", fbPageId);
  }, [fbPageId]);

  // Fetch the user details when the component mounts
  useEffect(() => {
    console.log('🔄 Running useEffect to fetch user details');
    fetchUserDetails();
  }, []);

  // Function to fetch user details including Facebook account ID
  const fetchUserDetails = async () => {
    console.log('🔍 Fetching user details...');
    try {
      const response = await fetch('/api/kv/fetch-api-token');
      console.log('📡 User details API response status:', response.status);
      
      if (response.ok) {
        const data: UserDetailResponse = await response.json();
        console.log('📊 User details response received:', 
          data.success ? 'Success' : 'Failed', 
          data.account ? 'Account data found' : 'No account data');
        
        if (data.success && data.account) {
          if (data.account.fbAccountId) {
            console.log('✅ Retrieved Facebook account ID:', data.account.fbAccountId);
            setFbAccountId(data.account.fbAccountId);
          } else {
            console.warn("⚠️ No Facebook account ID found in response"); console.error("❌ Facebook account ID is required for video uploads");
          }
          
          if (data.account.fbPageId) {
            console.log('✅ Retrieved Facebook page ID:', data.account.fbPageId);
            setFbPageId(data.account.fbPageId);
          } else {
            console.warn('⚠️ No Facebook page ID found in response');
          }
        } else {
          console.warn('⚠️ User details response successful but missing account data');
          console.log('📋 Response details:', JSON.stringify(data, null, 2));
        }
      } else {
        console.error('❌ Failed to fetch user details:', response.status, response.statusText);
        const errorText = await response.text();
        console.error('❌ Error response:', errorText);
      }
    } catch (error) {
      console.error('❌ Exception while fetching user details:', error);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    console.log('📤 File upload triggered');
    
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      console.log('📄 File selected:', file.name, 'Type:', file.type, 'Size:', file.size);
      
      // Create a new media ID for tracking this upload
      const newMediaId = Math.random().toString(36).substring(7);
      console.log('🆔 Generated media ID:', newMediaId);
      
      // Handle different file types
      if (file.type.includes('image')) {
        console.log('🖼️ Handling as image upload');
        await handleImageUpload(file, newMediaId);
      } else if (file.type.includes('video')) {
        console.log('🎬 Handling as video upload');
        await handleVideoUpload(file, newMediaId);
      } else {
        console.error('❌ Unsupported file type:', file.type);
      }
    } else {
      console.warn('⚠️ No files selected');
    }
  };

  // Handle image uploads
  const handleImageUpload = async (file: File, newMediaId: string) => {
    console.log('📸 Starting image upload process for ID:', newMediaId);
    
    // Calculate the actual aspect ratio
    const detectedRatio = await calculateAspectRatio(file);
    console.log('📏 Detected image aspect ratio:', detectedRatio);
    
    // Create a temporary media item with progress indicator
    const newMedia: MediaItem = {
      id: newMediaId,
      type: 'image',
      url: URL.createObjectURL(file),
      aspectRatio: detectedRatio,
      progress: 0
    };

    // Add the item to the list with initial progress
    console.log('➕ Adding new image to media items with 0% progress');
    setMediaItems(prev => [...prev, newMedia]);
    
    // Determine format category based on aspect ratio
    const formatCategory = detectedRatio === '9:16' ? '9:16' : '1:1';
    console.log('📏 Image format category:', formatCategory);
    
    // Set dimensions based on format category
    const dimensions = formatCategory === '9:16' 
      ? { width: 1080, height: 1920 } // 9:16 ratio
      : { width: 1080, height: 1080 }; // 1:1 ratio (default)
    console.log('🔣 Using dimensions:', dimensions);
    
    try {
      // Update progress to show upload started
      console.log('🔄 Updating progress to 20%');
      setMediaItems(prev =>
        prev.map(item =>
          item.id === newMediaId ? { ...item, progress: 20 } : item
        )
      );
      
      // If we don't have an account ID yet, try to fetch it again
      if (!fbAccountId) {
        console.log('⚠️ No Facebook account ID available, re-fetching user details');
        await fetchUserDetails();
        
        // Check again after fetching
        if (!fbAccountId) {
          console.error("❌ Facebook account ID is required for image uploads but not available");
          throw new Error("Facebook account ID is required for image uploads");
        }
      }
      
      // Create form data for the upload
      console.log('📋 Preparing form data for image upload');
      const formData = new FormData();
      formData.append('file', file);
      formData.append('widht', dimensions.width.toString());
      formData.append('height', dimensions.height.toString());
      formData.append('fb_account_id', fbAccountId);
      console.log('🆔 Using FB Account ID:', fbAccountId);
      
      // Add campaign_session_id if we have one from a previous upload (check both state and ref)
      const currentSessionId = campaignSessionIdRef.current || campaignSessionId;
      if (currentSessionId) {
        console.log('🔗 Adding existing campaign session ID:', currentSessionId);
        formData.append('campaign_session_id', currentSessionId);
      } else {
        console.log('ℹ️ No campaign session ID available yet');
      }
      
      // Upload the image using the correct endpoint
      console.log('🔄 Updating progress to 40%');
      setMediaItems(prev =>
        prev.map(item =>
          item.id === newMediaId ? { ...item, progress: 40 } : item
        )
      );
      
      console.log('📤 Sending image upload request to /api/upload-image');
      const response = await fetch('/api/upload-image', {
        method: 'POST',
        body: formData,
        headers: {
          'fb_api_key': '' // Empty string will make the backend use its internal API key
        }
      });
      
      console.log('📡 Image upload response status:', response.status);
      console.log('🔄 Updating progress to 70%');
      setMediaItems(prev =>
        prev.map(item =>
          item.id === newMediaId ? { ...item, progress: 70 } : item
        )
      );
      
      const result: UploadImageResponse = await response.json();
      console.log('📊 Image upload API response:', JSON.stringify(result, null, 2));
      
      if (result.success && result.image_hash) {
        // Store the campaign_session_id for subsequent uploads
        if (result.campaign_session_id) {
          console.log('✅ Received campaign session ID:', result.campaign_session_id);
          setCampaignSessionId(result.campaign_session_id);
        }
        
        // Update the media item with the hash and complete progress
        console.log('✅ Image upload successful, image hash:', result.image_hash);
        console.log('🔄 Updating progress to 100%');
        setMediaItems(prev =>
          prev.map(item =>
            item.id === newMediaId ? { 
              ...item, 
              progress: 100,
              hash: result.image_hash // Store the image hash for later use
            } : item
          )
        );
      } else {
        console.error('❌ Failed to upload image:', result.error);
        // Update the media item to show error
        console.log('🔄 Setting error state for media item');
        setMediaItems(prev =>
          prev.map(item =>
            item.id === newMediaId ? { 
              ...item, 
              progress: -1, // Use negative number to indicate error
              error: result.error || 'Upload failed'
            } : item
          )
        );
      }
    } catch (error) {
      console.error('❌ Exception during image upload:', error);
      // Update the media item to show error
      console.log('🔄 Setting error state for media item due to exception');
      setMediaItems(prev =>
        prev.map(item =>
          item.id === newMediaId ? { 
            ...item, 
            progress: -1,
            error: 'Upload failed'
          } : item
        )
      );
    }
  };
  
  // Handle video uploads using the chunked approach
  const handleVideoUpload = async (file: File, newMediaId: string) => {
    console.log('🎥 Starting video upload process for ID:', newMediaId);
    
    // Calculate the video aspect ratio
    const detectedRatio = await calculateVideoAspectRatio(file);
    console.log('📏 Detected video aspect ratio:', detectedRatio);
    
    // Create a temporary media item with progress indicator
    const newMedia: MediaItem = {
      id: newMediaId,
      type: 'video',
      url: URL.createObjectURL(file),
      aspectRatio: detectedRatio,
      progress: 0
    };

    // Add the item to the list with initial progress
    console.log('➕ Adding new video to media items with 0% progress');
    setMediaItems(prev => [...prev, newMedia]);
    
    // Determine format category based on aspect ratio
    const formatCategory = detectedRatio === '9:16' ? '9:16' : '1:1';
    console.log('📏 Video format category:', formatCategory);
    console.log('🔍 DEBUGGING - Current FB Account ID:', fbAccountId);
    
    // Set dimensions based on format category
    const dimensions = formatCategory === '9:16' 
      ? { width: 1080, height: 1920 } // 9:16 ratio
      : { width: 1080, height: 1080 }; // 1:1 ratio (default)
    console.log('🔣 Using dimensions:', dimensions);
    
    try {
      // Update progress to show upload started
      console.log('🔄 Updating progress to 10%');
      setMediaItems(prev =>
        prev.map(item =>
          item.id === newMediaId ? { ...item, progress: 10 } : item
        )
      );
      
      // If we don't have an account ID yet, try to fetch it again
      if (!fbAccountId) {
        console.log('⚠️ No Facebook account ID available, re-fetching user details');
        await fetchUserDetails();
        
        // Check again after fetching
        if (!fbAccountId) {
          console.error("❌ Facebook account ID is required for video uploads but not available");
          throw new Error("Facebook account ID is required for video uploads");
        }
      }
      
      // Step 1: Initialize video upload session
      // Prepare file size information
      const videoFileSize = Math.floor(file.size);
      console.log('📊 Video file size (bytes):', videoFileSize);
      
      // Create form data with required parameters for video-start
      console.log('📋 Preparing form data for video upload initialization');
      const initFormData = new FormData();
      
      // Add required parameters according to documentation
      initFormData.append('file_size', String(videoFileSize));
      initFormData.append('fb_account_id', fbAccountId);
      initFormData.append('widht', dimensions.width.toString());
      initFormData.append('height', dimensions.height.toString());
      console.log('🆔 Using FB Account ID:', fbAccountId);
      
      // Add campaign_session_id if we have one from a previous upload (check both state and ref)
      const currentSessionId = campaignSessionIdRef.current || campaignSessionId;
      if (currentSessionId) {
        console.log('🔗 Adding existing campaign session ID:', currentSessionId);
        initFormData.append('campaign_session_id', currentSessionId);
      } else {
        console.log('ℹ️ No campaign session ID available yet');
      }
      
      // Log the request details
      console.log('📤 Video init request details:', {
        fileSize: String(videoFileSize),
        fbAccountId: fbAccountId,
        width: dimensions.width.toString(),
        height: dimensions.height.toString(),
        campaignSessionId: campaignSessionId || 'none'
      });
      
      // Initialize upload session with the API
      console.log('📤 Sending video initialization request to /api/upload-video');
      const initResponse = await fetch('/api/upload-video', {
        method: 'POST',
        body: initFormData
      });
      
      // Handle response errors
      console.log('📡 Video init response status:', initResponse.status);
      if (!initResponse.ok) {
        const errorText = await initResponse.text();
        console.error('❌ Video init error response:', errorText);
        throw new Error(`Failed to initialize video upload session: ${errorText}`);
      }
      
      const initResult: any = await initResponse.json();
      console.log('📊 Video init API response:', JSON.stringify(initResult, null, 2));
      
      // Handle different response formats including deeply nested structures
      let uploadSessionId: string | undefined;
      
      console.log('🔍 Searching for upload_session_id in response...');
      
      // Function to recursively search for upload_session_id in a nested object
      const findUploadSessionId = (obj: any): string | undefined => {
        if (!obj || typeof obj !== 'object') return undefined;
        
        // Direct property
        if (obj.upload_session_id) {
          console.log('✅ Found upload_session_id directly in object');
          return obj.upload_session_id;
        }
        
        // Check data property
        if (obj.data) {
          // Direct in data
          if (obj.data.upload_session_id) {
            console.log('✅ Found upload_session_id in data property');
            return obj.data.upload_session_id;
          }
          
          // Nested in data.data
          if (obj.data.data && obj.data.data.upload_session_id) {
            console.log('✅ Found upload_session_id in data.data property');
            return obj.data.data.upload_session_id;
          }
          
          // Recursive search in data
          const dataResult = findUploadSessionId(obj.data);
          if (dataResult) return dataResult;
        }
        
        // Check backend_response property
        if (obj.backend_response) {
          if (obj.backend_response.upload_session_id) {
            console.log('✅ Found upload_session_id in backend_response');
            return obj.backend_response.upload_session_id;
          }
          
          // Recursive search in backend_response
          const backendResult = findUploadSessionId(obj.backend_response);
          if (backendResult) return backendResult;
        }
        
        return undefined;
      };
      
      // Search for upload_session_id in the response
      uploadSessionId = findUploadSessionId(initResult);
      
      if (uploadSessionId) {
        console.log('✅ Successfully found upload_session_id:', uploadSessionId);
      } else {
        console.error('❌ Failed to initialize video upload session: No upload session ID found in any format');
        console.error('📊 Response format received:', JSON.stringify(initResult, null, 2));
        throw new Error('Failed to initialize video upload session: No upload session ID returned');
      }
      
      // Step 2: Upload video in chunks
      console.log('✅ Using upload session ID:', uploadSessionId);
      let startOffset = 0;
      const chunkSize = 1024 * 1024; // 1MB chunks
      console.log('📊 Using chunk size (bytes):', chunkSize);
      
      console.log('🔄 Updating progress to 20%');
      setMediaItems(prev =>
        prev.map(item =>
          item.id === newMediaId ? { ...item, progress: 20 } : item
        )
      );
      
      // Calculate total number of chunks for progress tracking
      const totalChunks = Math.ceil(file.size / chunkSize);
      console.log('📊 Total chunks to upload:', totalChunks);
      let chunkCount = 0;
      let videoId: string | undefined;
      
      // Upload in chunks
      console.log('🔄 Starting chunk upload loop');
      while (startOffset < file.size) {
        const endOffset = Math.min(startOffset + chunkSize, file.size);
        const isLastChunk = endOffset === file.size;
        
        console.log('📤 Uploading chunk', chunkCount + 1, 'of', totalChunks, 
          'Offset:', startOffset, 'Size:', endOffset - startOffset, 
          'Last chunk:', isLastChunk ? 'Yes' : 'No');
        
        // Prepare form data for chunk upload
        const chunkFormData = new FormData();
        const chunk = file.slice(startOffset, endOffset);
        
        // Create a proper Blob with file type to ensure correct handling
        const chunkBlob = new Blob([chunk], { type: file.type });
        
        // Add the chunk as a file with a name to ensure proper multipart handling
        chunkFormData.append('file', chunkBlob, `chunk_${chunkCount}.mp4`);
        
        // Extract video_id from uploadSessionId for the video chunk upload
        // According to the Facebook API docs, for the chunk upload we need to provide video_id
        // which is the same as the upload_session_id for the first request
        const video_id = uploadSessionId;
        console.log(`🎬 Using video_id for chunk ${chunkCount + 1}:`, video_id);
        
        // Add required parameters
        chunkFormData.append('video_id', video_id); // Required by backend
        chunkFormData.append('start_offset', startOffset.toString());
        chunkFormData.append('finish', isLastChunk ? '1' : '0');
        chunkFormData.append('upload_session_id', uploadSessionId);
        chunkFormData.append('widht', dimensions.width.toString());
        chunkFormData.append('height', dimensions.height.toString());
        chunkFormData.append('fb_account_id', fbAccountId);
        
        // Add campaign_session_id if we have one (check both state and ref)
        const currentSessionId = campaignSessionIdRef.current || campaignSessionId;
        if (currentSessionId) {
          console.log(`🔗 Adding campaign_session_id to chunk ${chunkCount + 1}:`, currentSessionId);
          chunkFormData.append('campaign_session_id', currentSessionId);
        } else {
          console.log(`ℹ️ No campaign_session_id available for chunk ${chunkCount + 1}`);
        }
        
        // Upload the chunk
        console.log('📤 Sending chunk to /api/upload-video');
        const chunkResponse = await fetch('/api/upload-video', {
          method: 'POST',
          body: chunkFormData
        });
        
        console.log('📡 Chunk upload response status:', chunkResponse.status);
        if (!chunkResponse.ok) {
          const errorText = await chunkResponse.text();
          console.error(`❌ Failed to upload video chunk ${chunkCount + 1}/${totalChunks}:`, errorText);
          throw new Error(`Failed to upload video chunk ${chunkCount + 1}/${totalChunks}: ${errorText}`);
        }
        
        const chunkResult: any = await chunkResponse.json();
        // Log the chunk result in detail for debugging
        console.log(`📊 Chunk ${chunkCount + 1}/${totalChunks} upload API response:`, JSON.stringify(chunkResult, null, 2));
        
        // More extensive validation and error handling with support for different response formats
        if (chunkResult.success === false) {
          // Even if marked as failure, check if we have valid data in the backend_response
          if (isLastChunk && chunkResult.backend_response && chunkResult.backend_response.video_id) {
            console.log('⚠️ Response marked as failure but contains valid video_id, continuing...');
            // Extract the data from backend_response
            if (!chunkResult.data) {
              chunkResult.data = {};
            }
            // Copy video_id
            if (chunkResult.backend_response.video_id) {
              chunkResult.data.video_id = chunkResult.backend_response.video_id;
              console.log('✅ Extracted video_id from backend_response:', chunkResult.data.video_id);
            }
            // Copy campaign_session_id if available
            if (chunkResult.backend_response.campaign_session_id) {
              chunkResult.data.campaign_session_id = chunkResult.backend_response.campaign_session_id;
              console.log('✅ Extracted campaign_session_id from backend_response:', chunkResult.data.campaign_session_id);
            }
          } else {
            console.error(`❌ Chunk upload reported failure for chunk ${chunkCount + 1}/${totalChunks}`);
            // Include any error details in the exception
            const errorMessage = chunkResult.error || `Failed to upload video chunk ${chunkCount + 1}/${totalChunks}`;
            console.error('❌ Error details:', errorMessage);
            throw new Error(errorMessage);
          }
        } 
        
        // If the result has a direct video_id (not in data object), move it to data object
        if (isLastChunk && chunkResult.video_id && (!chunkResult.data || !chunkResult.data.video_id)) {
          if (!chunkResult.data) {
            chunkResult.data = {};
          }
          chunkResult.data.video_id = chunkResult.video_id;
          console.log('✅ Moved video_id to data object:', chunkResult.data.video_id);
          
          // Do the same for campaign_session_id
          if (chunkResult.campaign_session_id) {
            chunkResult.data.campaign_session_id = chunkResult.campaign_session_id;
            console.log('✅ Moved campaign_session_id to data object:', chunkResult.data.campaign_session_id);
          }
        }
        
        // For every chunk, check if we got a campaign_session_id and store it
        // This ensures we always have the latest session ID
        if (chunkResult.data && chunkResult.data.campaign_session_id) {
          const newSessionId = chunkResult.data.campaign_session_id;
          console.log(`✅ Received campaign session ID from chunk ${chunkCount + 1}:`, newSessionId);
          setCampaignSessionId(newSessionId);
          // Update ref immediately for use in future operations
          campaignSessionIdRef.current = newSessionId;
        }
        
        // Increment chunk counter
        chunkCount++;
        
        // Update progress (start at 20%, end at 90%)
        const progressPercentage = 20 + Math.floor((chunkCount / totalChunks) * 70);
        console.log('🔄 Updating progress to', progressPercentage + '%');
        
        setMediaItems(prev =>
          prev.map(item =>
            item.id === newMediaId ? { ...item, progress: progressPercentage } : item
          )
        );
        
        // If this is the last chunk, extract the video_id
        if (isLastChunk) {
          console.log('✅ Final chunk processed');
          console.log('📊 Full response:', JSON.stringify(chunkResult, null, 2));
          
          // Function to recursively search for video_id in a nested object
          const findVideoId = (obj: any): string | undefined => {
            if (!obj || typeof obj !== 'object') return undefined;
            
            // Direct property
            if (obj.video_id) {
              console.log('✅ Found video_id directly in object');
              return obj.video_id;
            }
            
            // Check data property
            if (obj.data) {
              // Direct in data
              if (obj.data.video_id) {
                console.log('✅ Found video_id in data property');
                return obj.data.video_id;
              }
              
              // Nested in data.data
              if (obj.data.data && obj.data.data.video_id) {
                console.log('✅ Found video_id in data.data property');
                return obj.data.data.video_id;
              }
              
              // Recursive search in data
              const dataResult = findVideoId(obj.data);
              if (dataResult) return dataResult;
            }
            
            // Check backend_response property
            if (obj.backend_response) {
              if (obj.backend_response.video_id) {
                console.log('✅ Found video_id in backend_response');
                return obj.backend_response.video_id;
              }
              
              // Recursive search in backend_response
              const backendResult = findVideoId(obj.backend_response);
              if (backendResult) return backendResult;
            }
            
            return undefined;
          };
          
          // Function to recursively search for campaign_session_id
          const findCampaignSessionId = (obj: any): string | undefined => {
            if (!obj || typeof obj !== 'object') return undefined;
            
            // Direct property
            if (obj.campaign_session_id) {
              console.log('✅ Found campaign_session_id directly in object');
              return obj.campaign_session_id;
            }
            
            // Check data property
            if (obj.data) {
              // Direct in data
              if (obj.data.campaign_session_id) {
                console.log('✅ Found campaign_session_id in data property');
                return obj.data.campaign_session_id;
              }
              
              // Nested in data.data
              if (obj.data.data && obj.data.data.campaign_session_id) {
                console.log('✅ Found campaign_session_id in data.data property');
                return obj.data.data.campaign_session_id;
              }
              
              // Recursive search in data
              const dataResult = findCampaignSessionId(obj.data);
              if (dataResult) return dataResult;
            }
            
            // Check backend_response property
            if (obj.backend_response) {
              if (obj.backend_response.campaign_session_id) {
                console.log('✅ Found campaign_session_id in backend_response');
                return obj.backend_response.campaign_session_id;
              }
              
              // Recursive search in backend_response
              const backendResult = findCampaignSessionId(obj.backend_response);
              if (backendResult) return backendResult;
            }
            
            return undefined;
          };
          
          // Extract video_id using recursive search
          const foundVideoId = findVideoId(chunkResult);
          if (foundVideoId) {
            videoId = foundVideoId;
            console.log('✅ Successfully found video ID:', videoId);
          }
          
          // Extract campaign_session_id using recursive search
          const sessionId = findCampaignSessionId(chunkResult);
          if (sessionId) {
            console.log('✅ Found campaign session ID:', sessionId);
            setCampaignSessionId(sessionId);
            campaignSessionIdRef.current = sessionId;
          }
        }
        
        // Move to next chunk
        startOffset = endOffset;
      }
      
      // Update the media item with the video_id and complete progress
      if (videoId) {
        console.log('✅ Video upload completed successfully, video ID:', videoId);
        console.log('🔄 Updating progress to 100%');
        setMediaItems(prev =>
          prev.map(item =>
            item.id === newMediaId ? { 
              ...item, 
              progress: 100,
              hash: videoId // Store the video ID for later use
            } : item
          )
        );
      } else {
        console.error('❌ Failed to get video ID from upload');
        throw new Error('Failed to get video ID from upload');
      }
      
    } catch (error) {
      console.error('❌ Exception during video upload:', error);
      // Update the media item to show error
      console.log('🔄 Setting error state for media item due to exception');
      setMediaItems(prev =>
        prev.map(item =>
          item.id === newMediaId ? { 
            ...item, 
            progress: -1,
            error: 'Video upload failed'
          } : item
        )
      );
    }
  };

  const removeMediaItem = (id: string) => {
    console.log('🗑️ Removing media item with ID:', id);
    setMediaItems(prev => prev.filter(m => m.id !== id));
  };

  return { 
    mediaItems, 
    setMediaItems, 
    fileInputRef, 
    handleFileUpload, 
    removeMediaItem,
    campaignSessionId,
    fbAccountId,
    fbPageId
  };
}