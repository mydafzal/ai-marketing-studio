import { useState, useRef, useEffect } from 'react';
import { MediaItem } from '../types';
import { calculateAspectRatio, calculateVideoAspectRatio } from '../utils';

// Get FB API key from environment variable
const FB_API_KEY = process.env.NEXT_PUBLIC_FB_API_KEY || "";

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

interface CampaignResponse {
  data: any[];
  paging?: {
    cursors: {
      before: string;
      after: string;
    };
    next?: string;
  };
  success: boolean;
}

export function useMediaUpload() {
  const [mediaItems, setMediaItems] = useState<MediaItem[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [campaignSessionId, setCampaignSessionId] = useState<string | null>(null);
  const [fbAccountId, setFbAccountId] = useState<string>('');

  // Fetch the Facebook account ID when the component mounts
  useEffect(() => {
    fetchFacebookAccountId();
  }, []);

  // Function to fetch the Facebook account ID
  const fetchFacebookAccountId = async () => {
    try {
      // This endpoint was seen in the logs as a successful request
      const response = await fetch('http://localhost:8000/facebook/read/insights/get-campaigns');
      
      if (response.ok) {
        const data: CampaignResponse = await response.json();
        
        // Extract the account ID from the URL or response data
        const url = new URL(response.url);
        const accountId = url.searchParams.get('account_id');
        
        if (accountId) {
          console.log('Retrieved Facebook account ID:', accountId);
          setFbAccountId(accountId);
        } else {
          console.warn('Could not find account_id in response URL, checking response data');
          
          // If account ID is not in URL, try to find it in the response data
          // This depends on the structure of your API response
          if (data && data.data && data.data.length > 0 && data.data[0].account_id) {
            const accountIdFromData = data.data[0].account_id;
            console.log('Retrieved Facebook account ID from data:', accountIdFromData);
            setFbAccountId(accountIdFromData);
          } else {
            console.warn('Could not find account_id in response data, using default account');
            // Use a fallback ID if available
            setFbAccountId('act_1020650316366490'); // Default from logs
          }
        }
      } else {
        console.error('Failed to fetch Facebook account ID, using default');
        setFbAccountId('act_1020650316366490'); // Default from logs
      }
    } catch (error) {
      console.error('Error fetching Facebook account ID:', error);
      // Use default account ID from logs as fallback
      setFbAccountId('act_1020650316366490');
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      
      // Create a new media ID for tracking this upload
      const newMediaId = Math.random().toString(36).substring(7);
      
      // Handle different file types
      if (file.type.includes('image')) {
        await handleImageUpload(file, newMediaId);
      } else if (file.type.includes('video')) {
        await handleVideoUpload(file, newMediaId);
      } else {
        console.error('Unsupported file type');
      }
    }
  };

  // Handle image uploads
  const handleImageUpload = async (file: File, newMediaId: string) => {
    // Calculate the actual aspect ratio
    const detectedRatio = await calculateAspectRatio(file);
    
    // Create a temporary media item with progress indicator
    const newMedia: MediaItem = {
      id: newMediaId,
      type: 'image',
      url: URL.createObjectURL(file),
      aspectRatio: detectedRatio,
      progress: 0
    };

    // Add the item to the list with initial progress
    setMediaItems(prev => [...prev, newMedia]);
    
    // Determine format category based on aspect ratio
    const formatCategory = detectedRatio === '9:16' ? '9:16' : '1:1';
    console.log('Image format category:', formatCategory);
    
    // Set dimensions based on format category
    const dimensions = formatCategory === '9:16' 
      ? { width: 1080, height: 1920 } // 9:16 ratio
      : { width: 1080, height: 1080 }; // 1:1 ratio (default)
    
    try {
      // Update progress to show upload started
      setMediaItems(prev =>
        prev.map(item =>
          item.id === newMediaId ? { ...item, progress: 20 } : item
        )
      );
      
      // Create form data for the upload
      const formData = new FormData();
      formData.append('file', file);
      formData.append('widht', dimensions.width.toString()); // Note: keeping the typo to match backend requirements
      formData.append('height', dimensions.height.toString());
      
      // Add campaign_session_id if we have one from a previous upload
      if (campaignSessionId) {
        formData.append('campaign_session_id', campaignSessionId);
      }
      
      // Upload the image
      setMediaItems(prev =>
        prev.map(item =>
          item.id === newMediaId ? { ...item, progress: 40 } : item
        )
      );
      
      const response = await fetch('/api/upload-image', {
        method: 'POST',
        body: formData
      });
      
      setMediaItems(prev =>
        prev.map(item =>
          item.id === newMediaId ? { ...item, progress: 70 } : item
        )
      );
      
      const result: UploadImageResponse = await response.json();
      
      if (result.success && result.image_hash) {
        // Store the campaign_session_id for subsequent uploads
        if (result.campaign_session_id) {
          setCampaignSessionId(result.campaign_session_id);
        }
        
        // Update the media item with the hash and complete progress
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
        console.error('Failed to upload image:', result.error);
        // Update the media item to show error
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
      console.error('Error uploading image:', error);
      // Update the media item to show error
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
    // Calculate the video aspect ratio
    const detectedRatio = await calculateVideoAspectRatio(file);
    
    // Create a temporary media item with progress indicator
    const newMedia: MediaItem = {
      id: newMediaId,
      type: 'video',
      url: URL.createObjectURL(file),
      aspectRatio: detectedRatio,
      progress: 0
    };

    // Add the item to the list with initial progress
    setMediaItems(prev => [...prev, newMedia]);
    
    // Determine format category based on aspect ratio
    const formatCategory = detectedRatio === '9:16' ? '9:16' : '1:1';
    console.log('Video format category:', formatCategory);
    
    // Set dimensions based on format category
    const dimensions = formatCategory === '9:16' 
      ? { width: 1080, height: 1920 } // 9:16 ratio
      : { width: 1080, height: 1080 }; // 1:1 ratio (default)
    
    try {
      // Update progress to show upload started
      setMediaItems(prev =>
        prev.map(item =>
          item.id === newMediaId ? { ...item, progress: 10 } : item
        )
      );
      
      // If we don't have an account ID yet, try to fetch it again
      if (!fbAccountId) {
        await fetchFacebookAccountId();
      }
      
      // Step 1: Initialize video upload session
      // Prepare file size information
      const videoFileSize = Math.floor(file.size);
      console.log('Video file size (bytes):', videoFileSize);
      
      // Create form data with required parameters for video-start
      const initFormData = new FormData();
      
      // Add required parameters according to documentation
      initFormData.append('file_size', String(videoFileSize));
      initFormData.append('fb_account_id', fbAccountId || 'act_1020650316366490');
      initFormData.append('widht', dimensions.width.toString());
      initFormData.append('height', dimensions.height.toString());
      
      // Add campaign_session_id if we have one from a previous upload
      if (campaignSessionId) {
        initFormData.append('campaign_session_id', campaignSessionId);
      }
      
      // Log the request details
      console.log('Video init request details:', {
        fileSize: String(videoFileSize),
        fbAccountId: fbAccountId || 'act_1020650316366490',
        width: dimensions.width.toString(),
        height: dimensions.height.toString(),
        campaignSessionId: campaignSessionId || 'none'
      });
      
      // Initialize upload session with the API
      const initResponse = await fetch('/api/upload-video', {
        method: 'POST',
        headers: {
          'fb-api-key': FB_API_KEY
        },
        body: initFormData
      });
      
      // Handle response errors
      if (!initResponse.ok) {
        const errorText = await initResponse.text();
        console.error('Video init error response:', errorText);
        throw new Error(`Failed to initialize video upload session: ${errorText}`);
      }
      
      const initResult: VideoStartResponse = await initResponse.json();
      
      if (!initResult.success || !initResult.data || !initResult.data.upload_session_id) {
        throw new Error('Failed to initialize video upload session: No upload session ID returned');
      }
      
      // Step 2: Upload video in chunks
      const uploadSessionId = initResult.data.upload_session_id;
      let startOffset = 0;
      const chunkSize = 1024 * 1024; // 1MB chunks
      
      setMediaItems(prev =>
        prev.map(item =>
          item.id === newMediaId ? { ...item, progress: 20 } : item
        )
      );
      
      // Calculate total number of chunks for progress tracking
      const totalChunks = Math.ceil(file.size / chunkSize);
      let chunkCount = 0;
      let videoId: string | undefined;
      
      // Upload in chunks
      while (startOffset < file.size) {
        const endOffset = Math.min(startOffset + chunkSize, file.size);
        const chunk = file.slice(startOffset, endOffset);
        const isLastChunk = endOffset === file.size;
        
        // Prepare form data for chunk upload
        const chunkFormData = new FormData();
        chunkFormData.append('file', chunk);
        chunkFormData.append('start_offset', startOffset.toString());
        chunkFormData.append('finish', isLastChunk ? '1' : '0');
        chunkFormData.append('upload_session_id', uploadSessionId);
        chunkFormData.append('widht', dimensions.width.toString());
        chunkFormData.append('height', dimensions.height.toString());
        chunkFormData.append('fb_account_id', fbAccountId || 'act_1020650316366490');
        
        // Add campaign_session_id if we have one
        if (campaignSessionId) {
          chunkFormData.append('campaign_session_id', campaignSessionId);
        }
        
        // Upload the chunk
        const chunkResponse = await fetch('/api/upload-video', {
          method: 'POST',
          headers: {
            'fb-api-key': FB_API_KEY
          },
          body: chunkFormData
        });
        
        if (!chunkResponse.ok) {
          const errorText = await chunkResponse.text();
          console.error(`Failed to upload video chunk ${chunkCount + 1}/${totalChunks}:`, errorText);
          throw new Error(`Failed to upload video chunk ${chunkCount + 1}/${totalChunks}: ${errorText}`);
        }
        
        const chunkResult: VideoChunkResponse = await chunkResponse.json();
        
        if (!chunkResult.success) {
          throw new Error(`Failed to upload video chunk ${chunkCount + 1}/${totalChunks}`);
        }
        
        // Increment chunk counter
        chunkCount++;
        
        // Update progress (start at 20%, end at 90%)
        const progressPercentage = 20 + Math.floor((chunkCount / totalChunks) * 70);
        
        setMediaItems(prev =>
          prev.map(item =>
            item.id === newMediaId ? { ...item, progress: progressPercentage } : item
          )
        );
        
        // If this is the last chunk, we should have a video_id
        if (isLastChunk && chunkResult.data && chunkResult.data.video_id) {
          videoId = chunkResult.data.video_id;
          
          // Store campaign_session_id if available
          if (chunkResult.data.campaign_session_id) {
            setCampaignSessionId(chunkResult.data.campaign_session_id);
          }
        }
        
        // Move to next chunk
        startOffset = endOffset;
      }
      
      // Update the media item with the video_id and complete progress
      if (videoId) {
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
        throw new Error('Failed to get video ID from upload');
      }
      
    } catch (error) {
      console.error('Error uploading video:', error);
      // Update the media item to show error
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
    setMediaItems(prev => prev.filter(m => m.id !== id));
  };

  return { 
    mediaItems, 
    setMediaItems, 
    fileInputRef, 
    handleFileUpload, 
    removeMediaItem,
    campaignSessionId
  };
}