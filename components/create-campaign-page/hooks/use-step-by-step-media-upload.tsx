import { useState, useRef, useEffect } from 'react';
import { StepByStepMediaItem } from '../types';

// Helper function to calculate aspect ratio from image file
const calculateAspectRatio = (file: File): Promise<'1:1' | '16:9' | '9:16' | '4:3' | '3:4' | '2:3' | '3:2'> => {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const { width, height } = img;
      const ratio = width / height;
      
      // Define ratio ranges with tolerance
      if (Math.abs(ratio - 1) < 0.1) resolve('1:1');
      else if (Math.abs(ratio - (16/9)) < 0.1) resolve('16:9');
      else if (Math.abs(ratio - (9/16)) < 0.1) resolve('9:16');
      else if (Math.abs(ratio - (4/3)) < 0.1) resolve('4:3');
      else if (Math.abs(ratio - (3/4)) < 0.1) resolve('3:4');
      else if (Math.abs(ratio - (2/3)) < 0.1) resolve('2:3');
      else if (Math.abs(ratio - (3/2)) < 0.1) resolve('3:2');
      else resolve('1:1'); // Default fallback
    };
    img.src = URL.createObjectURL(file);
  });
};

// Helper function to calculate video aspect ratio
const calculateVideoAspectRatio = (file: File): Promise<'1:1' | '16:9' | '9:16' | '4:3' | '3:4' | '2:3' | '3:2'> => {
  return new Promise((resolve) => {
    const video = document.createElement('video');
    video.onloadedmetadata = () => {
      const { videoWidth, videoHeight } = video;
      const ratio = videoWidth / videoHeight;
      
      // Define ratio ranges with tolerance
      if (Math.abs(ratio - 1) < 0.1) resolve('1:1');
      else if (Math.abs(ratio - (16/9)) < 0.1) resolve('16:9');
      else if (Math.abs(ratio - (9/16)) < 0.1) resolve('9:16');
      else if (Math.abs(ratio - (4/3)) < 0.1) resolve('4:3');
      else if (Math.abs(ratio - (3/4)) < 0.1) resolve('3:4');
      else if (Math.abs(ratio - (2/3)) < 0.1) resolve('2:3');
      else if (Math.abs(ratio - (3/2)) < 0.1) resolve('3:2');
      else resolve('16:9'); // Default fallback for videos
    };
    video.src = URL.createObjectURL(file);
  });
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
    video_id: string;
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

export function useStepByCampaignMediaUpload() {
  const [mediaItems, setMediaItems] = useState<StepByStepMediaItem[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [campaignSessionId, setCampaignSessionId] = useState<string | null>(null);
  const campaignSessionIdRef = useRef<string | null>(null);
  const [fbAccountId, setFbAccountId] = useState<string>('');
  const [fbPageId, setFbPageId] = useState<string>('');
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [cooldownActive, setCooldownActive] = useState<boolean>(false);
  const [cooldownTimeRemaining, setCooldownTimeRemaining] = useState<number>(0);

  // Update the ref when the state changes
  useEffect(() => {
    campaignSessionIdRef.current = campaignSessionId;
  }, [campaignSessionId]);

  // Fetch user details when component mounts
  useEffect(() => {
    fetchUserDetails();
  }, []);

  const fetchUserDetails = async () => {
    try {
      const response = await fetch('/api/kv/fetch-api-token');
      
      if (response.ok) {
        const data: UserDetailResponse = await response.json();
        
        if (data.success && data.account) {
          if (data.account.fbAccountId) {
            setFbAccountId(data.account.fbAccountId);
          }
          if (data.account.fbPageId) {
            setFbPageId(data.account.fbPageId);
          }
        }
      }
    } catch (error) {
      console.error('Error fetching user details:', error);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (isUploading || cooldownActive) {
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      return;
    }

    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      
      // File size validation
      const fileSizeInMB = file.size / (1024 * 1024);
      if (file.type.includes('image') && fileSizeInMB > 4) {
        alert('This image should be less than 4MB in size. Please compress and try again.');
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
        return;
      }
      
      if (file.type.includes('video') && fileSizeInMB > 300) {
        alert('The video should be less than 300MB in size. Please compress and try again.');
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
        return;
      }

      setIsUploading(true);
      const newMediaId = Math.random().toString(36).substring(7);
      
      try {
        if (file.type.includes('image')) {
          await handleImageUpload(file, newMediaId);
        } else if (file.type.includes('video')) {
          await handleVideoUpload(file, newMediaId);
        } else {
          throw new Error('Unsupported file type');
        }
      } catch (error) {
        console.error('Error during file upload:', error);
      } finally {
        setIsUploading(false);
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      }
    }
  };

  const handleImageUpload = async (file: File, newMediaId: string) => {
    const detectedRatio = await calculateAspectRatio(file);
    
    const newMedia: StepByStepMediaItem = {
      id: newMediaId,
      type: 'image',
      url: URL.createObjectURL(file),
      aspectRatio: detectedRatio,
      progress: 0
    };

    setMediaItems(prev => [...prev, newMedia]);

    const formatCategory = detectedRatio === '9:16' ? '9:16' : '1:1';
    const dimensions = formatCategory === '9:16'
      ? { width: 1080, height: 1920 }
      : { width: 1080, height: 1080 };

    try {
      setMediaItems(prev =>
        prev.map(item =>
          item.id === newMediaId ? { ...item, progress: 20 } : item
        )
      );

      if (!fbAccountId) {
        await fetchUserDetails();
        if (!fbAccountId) {
          throw new Error("Facebook account ID is required for image uploads");
        }
      }

      const formData = new FormData();
      formData.append('file', file);
      formData.append('width', dimensions.width.toString());
      formData.append('height', dimensions.height.toString());
      formData.append('fb_account_id', fbAccountId);

      const currentSessionId = campaignSessionIdRef.current || campaignSessionId;
      if (currentSessionId) {
        formData.append('campaign_session_id', currentSessionId);
      }

      setMediaItems(prev =>
        prev.map(item =>
          item.id === newMediaId ? { ...item, progress: 40 } : item
        )
      );

      const response = await fetch('/api/upload-image', {
        method: 'POST',
        body: formData,
        headers: {
          'fb_api_key': ''
        }
      });

      setMediaItems(prev =>
        prev.map(item =>
          item.id === newMediaId ? { ...item, progress: 70 } : item
        )
      );

      if (!response.ok) {
        throw new Error(`Server error: ${response.status}`);
      }

      const result: UploadImageResponse = await response.json();

      if (result.success && result.image_hash) {
        if (result.campaign_session_id) {
          setCampaignSessionId(result.campaign_session_id);
          campaignSessionIdRef.current = result.campaign_session_id;
        }

        setMediaItems(prev =>
          prev.map(item =>
            item.id === newMediaId ? {
              ...item,
              progress: 100,
              hash: result.image_hash
            } : item
          )
        );
        
        startCooldown();
      } else {
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
    } catch (error) {
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

  const handleVideoUpload = async (file: File, newMediaId: string) => {
    const detectedRatio = await calculateVideoAspectRatio(file);
    
    const newMedia: StepByStepMediaItem = {
      id: newMediaId,
      type: 'video',
      url: URL.createObjectURL(file),
      aspectRatio: detectedRatio,
      progress: 0
    };

    setMediaItems(prev => [...prev, newMedia]);

    try {
      // Simplified video upload - in a real implementation, you'd want the full chunked upload logic
      setMediaItems(prev =>
        prev.map(item =>
          item.id === newMediaId ? { ...item, progress: 50 } : item
        )
      );

      // For now, just simulate a successful upload
      setTimeout(() => {
        setMediaItems(prev =>
          prev.map(item =>
            item.id === newMediaId ? {
              ...item,
              progress: 100,
              hash: `video_${newMediaId}`
            } : item
          )
        );
        startCooldown();
      }, 2000);

    } catch (error) {
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

  const removeMediaItem = (id: string) => {
    setMediaItems(prev => prev.filter(item => item.id !== id));
  };

  const startCooldown = () => {
    setCooldownActive(true);
    setCooldownTimeRemaining(5);
    
    const cooldownInterval = setInterval(() => {
      setCooldownTimeRemaining(prev => {
        if (prev <= 1) {
          setCooldownActive(false);
          clearInterval(cooldownInterval);
          return 0;
        }
        return prev - 1;
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
    isUploading,
    cooldownActive,
    cooldownTimeRemaining
  };
} 