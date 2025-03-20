import { useState, useRef } from 'react';
import { MediaItem } from '../types';
import { calculateAspectRatio } from '../utils';

export function useMediaUpload() {
  const [mediaItems, setMediaItems] = useState<MediaItem[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      
      // Calculate the actual aspect ratio
      const detectedRatio = await calculateAspectRatio(file);
      
      const newMedia: MediaItem = {
        id: Math.random().toString(36).substring(7),
        type: file.type.includes('video') ? 'video' : 'image',
        url: URL.createObjectURL(file),
        aspectRatio: detectedRatio, // Use the detected ratio
        progress: 30
      };

      setMediaItems(prev => [...prev, newMedia]);

      // Simulate upload progress
      setTimeout(() => {
        setMediaItems(prev =>
          prev.map(item =>
            item.id === newMedia.id ? { ...item, progress: 60 } : item
          )
        );
        setTimeout(() => {
          setMediaItems(prev =>
            prev.map(item =>
              item.id === newMedia.id ? { ...item, progress: 100 } : item
            )
          );
        }, 2000);
      }, 1500);
    }
  };

  const removeMediaItem = (id: string) => {
    setMediaItems(prev => prev.filter(m => m.id !== id));
  };

  return { mediaItems, setMediaItems, fileInputRef, handleFileUpload, removeMediaItem };
}