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
    video_id: string; // Ensure this is expected in the response
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
  // Add state for tracking if an upload is in progress and cooldown
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [cooldownActive, setCooldownActive] = useState<boolean>(false);
  const [cooldownTimeRemaining, setCooldownTimeRemaining] = useState<number>(0);

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
            console.warn("⚠️ No Facebook account ID found in response");
            console.error("❌ Facebook account ID is required for video uploads");
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

    // Check if an upload is already in progress
    if (isUploading) {
      console.warn('⚠️ Upload already in progress. Please wait for it to complete.');
      // Clear the file input so they can try again later
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      return;
    }

    // Check if cooldown is active
    if (cooldownActive) {
      console.warn(`⚠️ Cooldown active. Please wait ${cooldownTimeRemaining} seconds before uploading again.`);
      // Clear the file input so they can try again later
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      return;
    }

    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      console.log('📄 File selected:', file.name, 'Type:', file.type, 'Size:', file.size);

      // Set uploading state to true
      setIsUploading(true);

      // Create a new media ID for tracking this upload
      const newMediaId = Math.random().toString(36).substring(7);
      console.log('🆔 Generated media ID:', newMediaId);

      try {
        // Handle different file types
        if (file.type.includes('image')) {
          console.log('🖼️ Handling as image upload');
          await handleImageUpload(file, newMediaId);
        } else if (file.type.includes('video')) {
          console.log('🎬 Handling as video upload');
          await handleVideoUpload(file, newMediaId);
        } else {
          console.error('❌ Unsupported file type:', file.type);
          throw new Error('Unsupported file type');
        }

        // Check if we need to start cooldown (more than 2 media items)
        const completedUploads = mediaItems.filter(item => item.progress === 100).length + 1; // +1 for current
        if (completedUploads > 2) {
          startCooldown();
        }
      } catch (error) {
        console.error('❌ Error during file upload:', error);
      } finally {
        // Reset upload state
        setIsUploading(false);
        
        // Clear the file input for next upload
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
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
      formData.append('width', dimensions.width.toString()); // Fixed typo: widht -> width
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
          // Update ref immediately for use in future operations
          campaignSessionIdRef.current = result.campaign_session_id;
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
      initFormData.append('width', dimensions.width.toString()); // Fixed typo: widht -> width
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

      const initResult = await initResponse.json();
      console.log('📊 Video init API response:', JSON.stringify(initResult, null, 2));

      // Simplify the response extraction - focus on getting two critical IDs:
      // 1. upload_session_id - for tracking the upload
      // 2. video_id - for identifying the video

      let uploadSessionId = '';
      let videoId = '';

      // Handle common response formats
      if (initResult.data && initResult.data.upload_session_id) {
        uploadSessionId = initResult.data.upload_session_id;
        console.log('✅ Found upload_session_id in data:', uploadSessionId);
      } else if (initResult.upload_session_id) {
        uploadSessionId = initResult.upload_session_id;
        console.log('✅ Found upload_session_id directly:', uploadSessionId);
      } else {
        console.error('❌ Could not find upload_session_id in response');
        throw new Error('Failed to initialize video upload: No upload session ID found');
      }

      // Extract the video_id similarly
      if (initResult.data && initResult.data.video_id) {
        videoId = initResult.data.video_id;
        console.log('✅ Found video_id in data:', videoId);
      } else if (initResult.video_id) {
        videoId = initResult.video_id;
        console.log('✅ Found video_id directly:', videoId);
      } else {
        console.error('❌ Could not find video_id in response');
        throw new Error('Failed to initialize video upload: No video ID found');
      }

      // Clean the video_id if it has a "video_" prefix
      if (typeof videoId === 'string' && videoId.startsWith('video_')) {
        videoId = videoId.substring(6);
        console.log('✅ Removed "video_" prefix from video_id:', videoId);
      }

      // Step 2: Upload video in chunks
      console.log('✅ Using upload session ID:', uploadSessionId);
      console.log('✅ Using video ID:', videoId);

      let startOffset = 0;
      const chunkSize = 4 * 1024 * 1024; // 4MB chunks. Vercel maximum is 4.5 MB
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

        // CRITICAL: Add required parameters for chunk upload
        chunkFormData.append('video_id', videoId); // Use the video_id from initialization
        chunkFormData.append('start_offset', startOffset.toString());
        chunkFormData.append('finish', isLastChunk ? '1' : '0'); // Properly mark the last chunk
        chunkFormData.append('upload_session_id', uploadSessionId);
        chunkFormData.append('width', dimensions.width.toString()); // Fixed typo: widht -> width
        chunkFormData.append('height', dimensions.height.toString());
        chunkFormData.append('fb_account_id', fbAccountId);

        // Add campaign_session_id if we have one
        const currentSessionId = campaignSessionIdRef.current || campaignSessionId;
        if (currentSessionId) {
          console.log(`🔗 Adding campaign_session_id to chunk ${chunkCount + 1}:`, currentSessionId);
          chunkFormData.append('campaign_session_id', currentSessionId);
        }

        // Special logging for the last chunk to ensure finish=1 is properly set
        if (isLastChunk) {
          console.log('🔍 LAST CHUNK DETAILS:', {
            'video_id': videoId,
            'upload_session_id': uploadSessionId,
            'start_offset': startOffset,
            'finish': '1',
            'chunk_size': endOffset - startOffset,
            'is_last': true
          });
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

        const chunkResult = await chunkResponse.json();
        console.log(`📊 Chunk ${chunkCount + 1}/${totalChunks} upload API response:`, JSON.stringify(chunkResult, null, 2));

        // Handle response from last chunk specially
        if (isLastChunk) {
          console.log('✅ Processing final chunk response');

          // Extract final video_id - critical for subsequent operations
          let finalVideoId = '';

          // Check common locations for video_id in the response
          if (chunkResult.data && chunkResult.data.video_id) {
            finalVideoId = chunkResult.data.video_id;
            console.log('✅ Found final video_id in data:', finalVideoId);
          } else if (chunkResult.video_id) {
            finalVideoId = chunkResult.video_id;
            console.log('✅ Found final video_id directly:', finalVideoId);
          } else {
            console.error('❌ Could not find final video_id in last chunk response');
            // We'll continue anyway and use the original video_id
            finalVideoId = videoId;
            console.log('⚠️ Using initial video_id as fallback:', finalVideoId);
          }

          // Final validation and cleanup of video ID
          if (typeof finalVideoId === 'string' && finalVideoId.startsWith('video_')) {
            finalVideoId = finalVideoId.substring(6);
            console.log('✅ Removed "video_" prefix from final video_id:', finalVideoId);
          }

          // Store the final video ID
          videoId = finalVideoId;
        }

        // Extract and store campaign_session_id if present
        if (chunkResult.data && chunkResult.data.campaign_session_id) {
          const newSessionId = chunkResult.data.campaign_session_id;
          console.log(`✅ Received campaign session ID from chunk ${chunkCount + 1}:`, newSessionId);
          setCampaignSessionId(newSessionId);
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

        // Move to next chunk
        startOffset = endOffset;
      }

      // Final steps after all chunks have been uploaded
      console.log('✅ All chunks uploaded successfully');
      console.log('✅ Final video ID:', videoId);

      // Verify that we have a clean numeric ID
      const isNumeric = /^\d+$/.test(String(videoId));
      console.log('🔍 Final video ID format check: Is numeric=' + isNumeric);

      // Update UI with final status
      console.log('🔄 Updating progress to 100%');
      setMediaItems(prev =>
          prev.map(item =>
              item.id === newMediaId ? {
                ...item,
                progress: 100,
                hash: videoId // Store the final video ID
              } : item
          )
      );

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

  // Function to start the cooldown timer
  const startCooldown = () => {
    console.log('⏱️ Starting 15 second cooldown timer');
    setCooldownActive(true);
    setCooldownTimeRemaining(15);
    
    // Start the countdown
    const intervalId = setInterval(() => {
      setCooldownTimeRemaining(prev => {
        const newTime = prev - 1;
        if (newTime <= 0) {
          clearInterval(intervalId);
          setCooldownActive(false);
          return 0;
        }
        return newTime;
      });
    }, 1000);
  };

  // Effect to check if any uploads are in progress
  useEffect(() => {
    // Check if any media items have a progress between 0 and 100 (in progress)
    const hasInProgressUploads = mediaItems.some(item => item.progress > 0 && item.progress < 100);
    
    if (hasInProgressUploads !== isUploading) {
      setIsUploading(hasInProgressUploads);
    }
  }, [mediaItems, isUploading]);

  return {
    mediaItems,
    setMediaItems,
    fileInputRef,
    handleFileUpload,
    removeMediaItem,
    campaignSessionId,
    fbAccountId,
    fbPageId,
    isUploading,
    cooldownActive,
    cooldownTimeRemaining
  };
}