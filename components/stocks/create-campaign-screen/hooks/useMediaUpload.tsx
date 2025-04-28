import { useState, useRef, useEffect } from 'react';
import { MediaItem } from '../types';
import { calculateAspectRatio, calculateVideoAspectRatio } from '../utils';

// Define retry status type
type RetryStatus = {
  isRetrying: boolean;
  timeRemaining: number;
  mediaId: string;
  file: File;
  retryAttempt: number;
};

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
  // Add state for retry mechanism
  const [retryStatus, setRetryStatus] = useState<RetryStatus | null>(null);

  // Log any changes to important state variables
  useEffect(() => {
    console.log("🔄 State Update - Campaign Session ID:", campaignSessionId);
    // Update the ref when the state changes
    campaignSessionIdRef.current = campaignSessionId;
  }, [campaignSessionId]);
  
  // Track retry status changes to properly manage the global uploading state
  useEffect(() => {
    console.log("🔄 State Update - Retry Status:", retryStatus ? "Active" : "Inactive");
    // If retry is active, make sure uploading state is true
    if (retryStatus && retryStatus.isRetrying) {
      setIsUploading(true);
    }
  }, [retryStatus]);

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

  // Detect if we are in a retry cycle
  const isInRetryState = () => {
    return retryStatus !== null && retryStatus.isRetrying;
  };
  
  // Normal file upload handler - only used for initial uploads, not retries
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    console.log('📤 File upload triggered');

    // Check if an upload is already in progress or in retry state
    if (isUploading || isInRetryState()) {
      console.warn('⚠️ Upload or retry already in progress. Please wait for it to complete.');
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
          await handleImageUpload(file, newMediaId, false);
        } else if (file.type.includes('video')) {
          console.log('🎬 Handling as video upload');
          await handleVideoUpload(file, newMediaId, false);
        } else {
          console.error('❌ Unsupported file type:', file.type);
          throw new Error('Unsupported file type');
        }

        // Don't start cooldown here - we'll start it in the specific upload handlers
        // when we know the upload was actually successful
      } catch (error) {
        console.error('❌ Error during file upload:', error);
      } finally {
        // Only reset upload state if not in retry cycle
        if (!isInRetryState()) {
          setIsUploading(false);
        }
        
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
  const handleImageUpload = async (file: File, newMediaId: string, isRetry = false, retryAttempt = 1) => {
    console.log(`📸 ${isRetry ? `Retry attempt ${retryAttempt}` : 'Starting'} image upload process for ID:`, newMediaId);

    // Calculate the actual aspect ratio
    const detectedRatio = await calculateAspectRatio(file);
    console.log('📏 Detected image aspect ratio:', detectedRatio);

    // Check if we're in a retry - if so, we don't create a new media item again
    // because it already exists in the list
    if (!isRetry) {
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
    } else {
      console.log('🔄 Retry in progress - using existing media item with ID:', newMediaId);
      // Just update the progress of the existing item
      setMediaItems(prev =>
        prev.map(item =>
          item.id === newMediaId ? { ...item, progress: 0 } : item
        )
      );
    }

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

      // Set up a progress animation to simulate incremental progress during upload wait
      // This helps prevent the appearance of a frozen upload
      const progressInterval = setInterval(() => {
        setMediaItems(prev => {
          return prev.map(item => {
            if (item.id === newMediaId && item.progress && item.progress >= 40 && item.progress < 70) {
              // Increment progress by a small amount until we reach 70%
              return { ...item, progress: Math.min(item.progress + 1, 69) };
            }
            return item;
          });
        });
      }, 500); // Update every half second

      console.log('📤 Sending image upload request to /api/upload-image');
      let response;
      try {
        // Create an AbortController for the fetch request to handle timeouts
        const abortController = new AbortController();
        const timeoutId = setTimeout(() => abortController.abort(), 60000); // 60 second timeout
        
        response = await fetch('/api/upload-image', {
          method: 'POST',
          body: formData,
          headers: {
            'fb_api_key': '' // Empty string will make the backend use its internal API key
          },
          signal: abortController.signal
        });
        
        // Clear the timeout if the response arrived
        clearTimeout(timeoutId);
      } catch (error) {
        console.error('❌ Network error during image upload:', error);
        // Clear the progress animation
        clearInterval(progressInterval);
        
        // Check if this is already a retry attempt
        if (isRetry) {
          console.error('❌ Retry also failed for image upload');
          // Mark as failed after retry
          setMediaItems(prev =>
              prev.map(item =>
                  item.id === newMediaId ? { ...item, progress: -1, error: 'Failed after retry' } : item
              )
          );
        } else {
          // Start retry process
          console.log('🔄 Starting retry process for failed image upload');
          startRetry(newMediaId, file);
        }
        
        throw error;
      }

      // Clear the progress animation
      clearInterval(progressInterval);

      console.log('📡 Image upload response status:', response.status);
      if (!response.ok) {
        console.error('❌ Server error during image upload:', response.status, response.statusText);
        
        // Check if this is already a retry attempt
        if (isRetry && retryAttempt >= 2) {
          console.error('❌ Both retry attempts failed for image upload');
          // Mark as failed after both retries
          setMediaItems(prev =>
              prev.map(item =>
                  item.id === newMediaId ? { 
                    ...item, 
                    progress: -1, 
                    error: `Failed after multiple retries (${response.status})` 
                  } : item
              )
          );
        } else if (isRetry && retryAttempt === 1) {
          // Start second retry attempt
          console.log('🔄 Starting second retry attempt for image upload');
          startRetry(newMediaId, file, 2);
        } else {
          // Start first retry process
          console.log('🔄 Starting first retry process for failed image upload');
          startRetry(newMediaId, file, 1);
        }
        
        throw new Error(`Server error: ${response.status}`);
      }

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
        
        // Start cooldown after successful upload
        console.log('🔄 Starting cooldown after successful image upload');
        startCooldown();
      } else {
        console.error('❌ Failed to upload image:', result.error);
        
        // Check if this is already a retry attempt
        if (isRetry && retryAttempt >= 2) {
          console.error('❌ Both retry attempts failed for image upload');
          // Update the media item to show error
          console.log('🔄 Setting error state for media item after multiple retries');
          setMediaItems(prev =>
              prev.map(item =>
                  item.id === newMediaId ? {
                    ...item,
                    progress: -1, // Use negative number to indicate error
                    error: 'Failed after multiple retries'
                  } : item
              )
          );
        } else if (isRetry && retryAttempt === 1) {
          // Start second retry attempt
          console.log('🔄 Starting second retry attempt for image upload');
          startRetry(newMediaId, file, 2);
        } else {
          // Start first retry process
          console.log('🔄 Starting retry process for failed image upload');
          startRetry(newMediaId, file, 1);
        }
      }
    } catch (error) {
      console.error('❌ Exception during image upload:', error);
      
      // Only handle errors that weren't already handled by the other catch blocks
      // This is to avoid double-handling errors
      if (!isRetry) {
        // Check if retry is already initiated by the other catch blocks
        // We can check this by looking at the current progress of the media item
        const mediaItem = mediaItems.find(item => item.id === newMediaId);
        if (mediaItem && mediaItem.progress !== -2) { // -2 is our retry status code
          // Start first retry process
          console.log('🔄 Starting first retry process for failed image upload (from main catch block)');
          startRetry(newMediaId, file, 1);
        }
      } else if (isRetry && retryAttempt === 1) {
        // Check if second retry is already initiated
        const mediaItem = mediaItems.find(item => item.id === newMediaId);
        if (mediaItem && mediaItem.progress !== -2) { // -2 is our retry status code
          // Start second retry process
          console.log('🔄 Starting second retry process for failed image upload (from main catch block)');
          startRetry(newMediaId, file, 2);
        }
      } else {
        // Update the media item to show error after both retries
        console.log('🔄 Setting error state for media item after multiple retries failed');
        setMediaItems(prev =>
            prev.map(item =>
                item.id === newMediaId ? {
                  ...item,
                  progress: -1,
                  error: 'Failed after multiple retries'
                } : item
            )
        );
      }
    }
  };

  // Handle video uploads using the chunked approach
  const handleVideoUpload = async (file: File, newMediaId: string, isRetry = false, retryAttempt = 1) => {
    console.log(`🎥 ${isRetry ? `Retry attempt ${retryAttempt}` : 'Starting'} video upload process for ID:`, newMediaId);

    // Calculate the video aspect ratio
    const detectedRatio = await calculateVideoAspectRatio(file);
    console.log('📏 Detected video aspect ratio:', detectedRatio);

    // Check if we're in a retry - if so, we don't create a new media item again
    if (!isRetry) {
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
    } else {
      console.log('🔄 Retry in progress - using existing video media item with ID:', newMediaId);
      // Just update the progress of the existing item
      setMediaItems(prev =>
        prev.map(item =>
          item.id === newMediaId ? { ...item, progress: 0 } : item
        )
      );
    }

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

      // Set up a progress animation to simulate incremental progress during upload wait
      // This helps prevent the appearance of a frozen upload
      const progressAnimationInterval = setInterval(() => {
        setMediaItems(prev => {
          return prev.map(item => {
            if (item.id === newMediaId && item.progress && item.progress >= 10 && item.progress < 20) {
              // Increment progress by a small amount 
              return { ...item, progress: Math.min(item.progress + 0.5, 19) };
            }
            return item;
          });
        });
      }, 500); // Update every half second

      // Initialize upload session with the API
      console.log('📤 Sending video initialization request to /api/upload-video');
      let initResponse;
      try {
        // Create an AbortController for the fetch request to handle timeouts
        const abortController = new AbortController();
        const timeoutId = setTimeout(() => abortController.abort(), 60000); // 60 second timeout
        
        initResponse = await fetch('/api/upload-video', {
          method: 'POST',
          body: initFormData,
          signal: abortController.signal
        });
        
        // Clear the timeout if the response arrived
        clearTimeout(timeoutId);
      } catch (error) {
        console.error('❌ Network error during video initialization:', error);
        // Clear the progress animation
        clearInterval(progressAnimationInterval);
        
        // Check if this is already a retry attempt
        if (isRetry && retryAttempt >= 2) {
          console.error('❌ Both retry attempts failed for video initialization');
          // Mark as failed after both retries
          setMediaItems(prev =>
              prev.map(item =>
                  item.id === newMediaId ? { ...item, progress: -1, error: 'Failed after multiple retries' } : item
              )
          );
        } else if (isRetry && retryAttempt === 1) {
          // Start second retry attempt
          console.log('🔄 Starting second retry attempt for video initialization');
          startRetry(newMediaId, file, 2);
        } else {
          // Start first retry process
          console.log('🔄 Starting first retry process for failed video initialization');
          startRetry(newMediaId, file, 1);
        }
        
        throw error;
      }

      // Clear the initialization progress animation
      clearInterval(progressAnimationInterval);

      // Handle response errors
      console.log('📡 Video init response status:', initResponse.status);
      if (!initResponse.ok) {
        const errorText = await initResponse.text();
        console.error('❌ Video init error response:', errorText);
        
        // Check if this is already a retry attempt
        if (isRetry && retryAttempt >= 2) {
          console.error('❌ Both retry attempts failed for video initialization');
          setMediaItems(prev =>
              prev.map(item =>
                  item.id === newMediaId ? { ...item, progress: -1, error: 'Failed after multiple retries' } : item
              )
          );
        } else if (isRetry && retryAttempt === 1) {
          // Start second retry attempt
          console.log('🔄 Starting second retry attempt for video initialization');
          startRetry(newMediaId, file, 2);
        } else {
          // Start first retry process
          console.log('🔄 Starting first retry process for failed video initialization');
          startRetry(newMediaId, file, 1);
        }
        
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

        // Create an interval for this chunk's progress updates
        const chunkProgressInterval = setInterval(() => {
          // Calculate progress for this specific chunk
          // Start from current progress, aim for the next percentage milestone
          const progressStart = 20 + Math.floor((chunkCount / totalChunks) * 70);
          const progressEnd = 20 + Math.floor(((chunkCount + 1) / totalChunks) * 70);
          const progressRange = progressEnd - progressStart;
          
          setMediaItems(prev => {
            return prev.map(item => {
              if (item.id === newMediaId) {
                const currentProgress = item.progress || 0;
                // Only update if current progress is less than the target for this chunk
                if (currentProgress >= progressStart && currentProgress < progressEnd - 1) {
                  return { ...item, progress: currentProgress + 0.5 };
                }
              }
              return item;
            });
          });
        }, 300); // Update more frequently for chunks

        // Upload the chunk
        console.log('📤 Sending chunk to /api/upload-video');
        let chunkResponse;
        try {
          // Create an AbortController for the fetch request to handle timeouts
          const abortController = new AbortController();
          const timeoutId = setTimeout(() => abortController.abort(), 60000); // 60 second timeout
          
          chunkResponse = await fetch('/api/upload-video', {
            method: 'POST',
            body: chunkFormData,
            signal: abortController.signal
          });
          
          // Clear the timeout if the response arrived
          clearTimeout(timeoutId);
          
          // Clear the progress interval for this chunk
          clearInterval(chunkProgressInterval);
          
          console.log('📡 Chunk upload response status:', chunkResponse.status);
          if (!chunkResponse.ok) {
            const errorText = await chunkResponse.text();
            console.error(`❌ Failed to upload video chunk ${chunkCount + 1}/${totalChunks}:`, errorText);
            
            setMediaItems(prev =>
                prev.map(item =>
                    item.id === newMediaId ? { ...item, progress: -1, error: `Failed at chunk ${chunkCount + 1}` } : item
                )
            );
            
            throw new Error(`Failed to upload video chunk ${chunkCount + 1}/${totalChunks}: ${errorText}`);
          }
        } catch (error) {
          // Clear the progress interval for this chunk
          clearInterval(chunkProgressInterval);
          
          console.error(`❌ Network error uploading chunk ${chunkCount + 1}/${totalChunks}:`, error);
          
          setMediaItems(prev =>
              prev.map(item =>
                  item.id === newMediaId ? { ...item, progress: -1, error: 'Network error during upload' } : item
              )
          );
          
          throw error;
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
      
      // Start cooldown after successful upload
      console.log('🔄 Starting cooldown after successful video upload');
      startCooldown();

    } catch (error) {
      console.error('❌ Exception during video upload:', error);
      
      // Only handle errors that weren't already handled by the other catch blocks
      if (!isRetry) {
        // Check if retry is already initiated by the other catch blocks
        const mediaItem = mediaItems.find(item => item.id === newMediaId);
        if (mediaItem && mediaItem.progress !== -2) { // -2 is our retry status code
          // Start first retry process
          console.log('🔄 Starting first retry process for failed video upload (from main catch block)');
          startRetry(newMediaId, file, 1);
        }
      } else if (isRetry && retryAttempt === 1) {
        // Check if second retry is already initiated
        const mediaItem = mediaItems.find(item => item.id === newMediaId);
        if (mediaItem && mediaItem.progress !== -2) { // -2 is our retry status code
          // Start second retry process
          console.log('🔄 Starting second retry process for failed video upload (from main catch block)');
          startRetry(newMediaId, file, 2);
        }
      } else {
        // Update the media item to show error after both retries
        console.log('🔄 Setting error state for media item after multiple retries failed');
        setMediaItems(prev =>
            prev.map(item =>
                item.id === newMediaId ? {
                  ...item,
                  progress: -1,
                  error: 'Failed after multiple retries'
                } : item
            )
        );
      }
    }
  };

  const removeMediaItem = (id: string) => {
    console.log('🗑️ Removing media item with ID:', id);
    setMediaItems(prev => prev.filter(m => m.id !== id));
  };

  // Function to start the cooldown timer with fixed 3 second duration
  const startCooldown = () => {
    // Always use a fixed 3 second cooldown regardless of upload count
    const cooldownTime = 3;
    
    console.log(`⏱️ Starting ${cooldownTime} second cooldown timer after successful upload`);
    setCooldownActive(true);
    setCooldownTimeRemaining(cooldownTime);
    
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

  // Effect to check if any uploads are in progress or retrying
  useEffect(() => {
    // Check if any media items have a progress between 0 and 100 (in progress)
    // or progress === -2 (retrying)
    const hasInProgressUploads = mediaItems.some(
      item => (item.progress !== undefined && ((item.progress > 0 && item.progress < 100) || item.progress === -2))
    );
    
    if (hasInProgressUploads !== isUploading) {
      setIsUploading(hasInProgressUploads);
    }
  }, [mediaItems, isUploading]);

  // Function to start the retry countdown and handle retry
  const startRetry = (mediaId: string, file: File, retryAttempt = 1) => {
    console.log(`🔄 Starting retry process for media ID: ${mediaId}, attempt: ${retryAttempt}`);
    
    // Set countdown time based on retry attempt
    const countdownTime = retryAttempt === 1 ? 10 : 5;
    const retryMessage = retryAttempt === 1 
      ? `Retrying in ${countdownTime}s` 
      : `Failed once. Final retry in ${countdownTime}s`;
    
    // Set retry status
    setRetryStatus({
      isRetrying: true,
      timeRemaining: countdownTime,
      mediaId,
      file,
      retryAttempt
    });
    
    // Update media item to show retrying status
    setMediaItems(prev =>
        prev.map(item =>
            item.id === mediaId ? {
              ...item,
              progress: -2, // Special status code for retrying
              error: retryMessage
            } : item
        )
    );
    
    // Start the countdown timer
    const intervalId = setInterval(() => {
      setRetryStatus(prev => {
        if (!prev) return null;
        
        const newTime = prev.timeRemaining - 1;
        if (newTime <= 0) {
          clearInterval(intervalId);
          
          // Update UI to show retry in progress
          setMediaItems(prevItems =>
              prevItems.map(item =>
                  item.id === mediaId ? {
                    ...item,
                    progress: 0,
                    error: retryAttempt === 1 ? 'First retry in progress' : 'Final retry in progress'
                  } : item
              )
          );
          
          // Execute the retry - IMPORTANT: Still use the same mediaId to avoid duplicates
          if (file.type.includes('image')) {
            handleImageUpload(file, mediaId, true, retryAttempt);
          } else if (file.type.includes('video')) {
            handleVideoUpload(file, mediaId, true, retryAttempt);
          }
          
          return null; // Clear retry status once retry starts
        }
        
        // Update media item with new countdown
        const countdownMessage = retryAttempt === 1 
          ? `Retrying in ${newTime}s` 
          : `Failed once. Final retry in ${newTime}s`;
        
        setMediaItems(prevItems =>
            prevItems.map(item =>
                item.id === mediaId ? {
                  ...item,
                  error: countdownMessage
                } : item
            )
        );
        
        return {
          ...prev,
          timeRemaining: newTime
        };
      });
    }, 1000);
  };
  
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
    cooldownTimeRemaining,
    retryStatus
  };
}