import { useState, useRef } from 'react';
import { MediaItem } from '../types';
import { calculateAspectRatio } from '../utils';

interface UploadImageResponse {
  success: boolean;
  image_hash?: string;
  campaign_session_id?: string;
  error?: string;
}

export function useMediaUpload() {
  const [mediaItems, setMediaItems] = useState<MediaItem[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [campaignSessionId, setCampaignSessionId] = useState<string | null>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      
      // Only process images (we'll handle videos separately in the future)
      if (!file.type.includes('image')) {
        console.error('Only image files are currently supported');
        return;
      }
      
      // Calculate the actual aspect ratio
      const detectedRatio = await calculateAspectRatio(file);
      
      // Create a temporary media item with progress indicator
      const newMediaId = Math.random().toString(36).substring(7);
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
      // If it's 9:16, use that format, otherwise use 1:1
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